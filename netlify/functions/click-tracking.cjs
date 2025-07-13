// Click Tracking Function for Sales Report Analytics
// Captures clicks on report URLs before serving the report
// Extracts UTM parameters and visitor metadata

const { getStore, connectLambda } = require('@netlify/blobs');

// Environment variables
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;
const WEBHOOK_URL = process.env.ANALYTICS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.ANALYTICS_WEBHOOK_SECRET;

// Main function handler
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Handle GET requests for click tracking
  if (event.httpMethod === 'GET') {
    return await handleClickTracking(event, context, headers);
  }

  // Handle POST requests for direct tracking
  if (event.httpMethod === 'POST') {
    return await handleDirectTracking(event, context, headers);
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ 
      error: 'Method not allowed. Use GET or POST.' 
    })
  };
};

// Handle click tracking and redirect
async function handleClickTracking(event, context, headers) {
  try {
    const queryParams = event.queryStringParameters || {};
    const companySlug = queryParams.slug || queryParams.company_id;
    
    if (!companySlug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameter: slug or company_id' 
        })
      };
    }

    // Extract UTM parameters and tracking data
    const trackingData = {
      company_slug: companySlug,
      utm_source: queryParams.utm_source,
      utm_medium: queryParams.utm_medium,
      utm_campaign: queryParams.utm_campaign,
      utm_content: queryParams.utm_content,
      utm_term: queryParams.utm_term,
      company: queryParams.company,
      recipient: queryParams.recipient,
      campaign_id: queryParams.campaign_id,
      tracking_id: queryParams.tracking_id,
      timestamp: queryParams.timestamp || new Date().toISOString(),
      click_timestamp: new Date().toISOString(),
      visitor_ip: event.headers['client-ip'] || 
                  event.headers['x-forwarded-for'] || 
                  event.headers['x-real-ip'] ||
                  'unknown',
      user_agent: event.headers['user-agent'] || 'unknown',
      referrer: event.headers.referer || event.headers.Referer || 'direct',
      request_id: context.awsRequestId,
      session_data: {
        cloudfront_viewer_country: event.headers['cloudfront-viewer-country'],
        cloudfront_viewer_country_region: event.headers['cloudfront-viewer-country-region'],
        cloudfront_viewer_city: event.headers['cloudfront-viewer-city']
      }
    };

    // Log click data
    console.log('Click tracked:', {
      company: companySlug,
      utm_source: trackingData.utm_source,
      utm_campaign: trackingData.utm_campaign,
      recipient: trackingData.recipient,
      ip: trackingData.visitor_ip,
      timestamp: trackingData.click_timestamp
    });

    // Send tracking data to analytics services
    await Promise.all([
      sendToGA4(trackingData),
      sendToWebhook(trackingData),
      storeClickData(trackingData, event)
    ]);

    // Build redirect URL with preserved parameters
    const redirectUrl = buildRedirectUrl(companySlug, queryParams);
    
    // Redirect to the actual report
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': redirectUrl,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };

  } catch (error) {
    console.error('Error in click tracking:', error);
    
    // On error, still redirect to report to maintain user experience
    const companySlug = event.queryStringParameters?.slug || event.queryStringParameters?.company_id;
    const redirectUrl = companySlug ? `/reports/${companySlug}` : '/reports';
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': redirectUrl,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  }
}

// Handle direct tracking calls (for API usage)
async function handleDirectTracking(event, context, headers) {
  try {
    const trackingData = JSON.parse(event.body);
    
    // Validate required fields
    if (!trackingData.company_slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required field: company_slug' 
        })
      };
    }

    // Add server-side metadata
    trackingData.click_timestamp = new Date().toISOString();
    trackingData.visitor_ip = event.headers['client-ip'] || 
                             event.headers['x-forwarded-for'] || 
                             event.headers['x-real-ip'] ||
                             'unknown';
    trackingData.user_agent = event.headers['user-agent'] || 'unknown';
    trackingData.referrer = event.headers.referer || event.headers.Referer || 'direct';
    trackingData.request_id = context.awsRequestId;

    // Send tracking data to analytics services
    await Promise.all([
      sendToGA4(trackingData),
      sendToWebhook(trackingData),
      storeClickData(trackingData, event)
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Click tracking recorded successfully',
        timestamp: trackingData.click_timestamp
      })
    };

  } catch (error) {
    console.error('Error in direct tracking:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}

// Send tracking data to Google Analytics 4
async function sendToGA4(trackingData) {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    console.log('GA4 not configured, skipping...');
    return;
  }

  try {
    const ga4Payload = {
      client_id: trackingData.recipient || trackingData.tracking_id || 'anonymous',
      events: [{
        name: 'report_click',
        params: {
          event_category: 'strategic_reports',
          event_label: trackingData.company_slug,
          campaign_source: trackingData.utm_source,
          campaign_medium: trackingData.utm_medium,
          campaign_name: trackingData.utm_campaign,
          campaign_content: trackingData.utm_content,
          campaign_term: trackingData.utm_term,
          company_name: trackingData.company,
          recipient_id: trackingData.recipient,
          campaign_id: trackingData.campaign_id,
          tracking_id: trackingData.tracking_id,
          custom_parameter_1: trackingData.visitor_ip,
          custom_parameter_2: trackingData.referrer,
          engagement_time_msec: 100,
          session_id: trackingData.request_id
        }
      }]
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ga4Payload)
      }
    );

    if (response.ok) {
      console.log('GA4 tracking successful');
    } else {
      console.error('GA4 tracking failed:', response.status, await response.text());
    }

  } catch (error) {
    console.error('Error sending to GA4:', error);
  }
}

// Send tracking data to webhook (for real-time notifications)
async function sendToWebhook(trackingData) {
  if (!WEBHOOK_URL) {
    console.log('Webhook not configured, skipping...');
    return;
  }

  try {
    const webhookPayload = {
      event: 'report_click',
      data: trackingData,
      timestamp: new Date().toISOString()
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'PossibleMinds-Analytics/1.0'
    };

    // Add webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');
      headers['X-Hub-Signature-256'] = `sha256=${signature}`;
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      console.log('Webhook notification sent successfully');
    } else {
      console.error('Webhook notification failed:', response.status, await response.text());
    }

  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

// Store click data in Netlify Blobs for analytics
async function storeClickData(trackingData, event) {
  try {
    connectLambda(event);
    const store = getStore('click-analytics');
    const clickId = `${trackingData.company_slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await store.set(clickId, JSON.stringify(trackingData), {
      metadata: { 
        contentType: 'application/json',
        company: trackingData.company_slug,
        timestamp: trackingData.click_timestamp
      }
    });

    console.log('Click data stored successfully:', clickId);

  } catch (error) {
    console.error('Error storing click data:', error);
  }
}

// Build redirect URL with preserved parameters
function buildRedirectUrl(companySlug, queryParams) {
  const baseUrl = `/reports/${companySlug}`;
  const preservedParams = new URLSearchParams();

  // Preserve UTM parameters for report display
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  utmParams.forEach(param => {
    if (queryParams[param]) {
      preservedParams.set(param, queryParams[param]);
    }
  });

  // Preserve tracking parameters
  const trackingParams = ['company', 'recipient', 'campaign_id', 'tracking_id'];
  trackingParams.forEach(param => {
    if (queryParams[param]) {
      preservedParams.set(param, queryParams[param]);
    }
  });

  const queryString = preservedParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
} 