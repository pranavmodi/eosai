// Click Tracking Function for Sales Report Analytics
// Captures clicks on report URLs before serving the report
// Extracts UTM parameters and visitor metadata

const { getStore, connectLambda } = require('@netlify/blobs');

// Environment variables
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;
const WEBHOOK_URL = process.env.ANALYTICS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.ANALYTICS_WEBHOOK_SECRET;
// NEW: Salesbot-specific environment variables
const SALESBOT_URL = process.env.SALESBOT_URL || 'https://your-salesbot-domain.com';
const SALESBOT_API_KEY = process.env.SALESBOT_API_KEY;

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
    
    // Debug: Log all query parameters
    console.log('All query parameters:', queryParams);
    
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
      event_type: 'click',
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
      sendToSalesbot(trackingData), // NEW: Add salesbot tracking
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
    
    // Handle different tracking data formats (engagement vs click tracking)
    if (trackingData.reportId && trackingData.type) {
      // This is engagement tracking from report pages - convert to our format
      trackingData.company_slug = trackingData.reportId; // Use reportId as company_slug
      trackingData.contact_id = trackingData.contactId;
      trackingData.utm_source = trackingData.utmSource;
      trackingData.utm_medium = trackingData.utmMedium;
      trackingData.utm_campaign = trackingData.utmCampaign;
      trackingData.event_type = trackingData.type;
      trackingData.target = trackingData.action;
    }
    
    // Validate required fields (flexible for both click and engagement tracking)
    if (!trackingData.company_slug && !trackingData.reportId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required field: company_slug or reportId' 
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
      sendToSalesbot(trackingData), // NEW: Add salesbot tracking
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
    // Determine event type based on the data we received
    const eventName = trackingData.event_type === 'click' ? 'report_click' : 'report_engagement';
    const clientId = trackingData.contact_id || trackingData.recipient || trackingData.tracking_id || 'anonymous';
    
    const ga4Payload = {
      client_id: clientId,
      events: [{
        name: eventName,
        params: {
          // Core event parameters
          event_category: 'strategic_reports',
          event_label: trackingData.company_slug,
          
          // Campaign parameters (standard GA4 naming)
          campaign_source: trackingData.utm_source || null,
          campaign_medium: trackingData.utm_medium || null,
          campaign_name: trackingData.utm_campaign || null,
          campaign_content: trackingData.utm_content || null,
          campaign_term: trackingData.utm_term || null,
          
          // Custom parameters (prefixed to avoid conflicts)
          custom_campaign_id: trackingData.campaign_id || null,
          custom_company_name: trackingData.company || null,
          custom_recipient_id: trackingData.recipient || trackingData.contact_id || null,
          
          // Additional tracking parameters
          tracking_id: trackingData.tracking_id || null,
          visitor_ip: trackingData.visitor_ip || null,
          referrer: trackingData.referrer || null,
          user_agent: trackingData.user_agent || null,
          
          // Engagement-specific parameters (for report_engagement events)
          engagement_type: trackingData.event_type || null,
          target_element: trackingData.target || null,
          engagement_value: trackingData.value || null,
          
          // Session data
          engagement_time_msec: 100,
          session_id: trackingData.request_id || null,
          
          // Geographic data (if available)
          country: trackingData.session_data?.cloudfront_viewer_country || null,
          region: trackingData.session_data?.cloudfront_viewer_country_region || null,
          city: trackingData.session_data?.cloudfront_viewer_city || null
        }
      }]
    };

    // Remove null values to ensure clean GA4 data
    const cleanParams = {};
    Object.keys(ga4Payload.events[0].params).forEach(key => {
      const value = ga4Payload.events[0].params[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    });
    ga4Payload.events[0].params = cleanParams;

    // Debug logging to troubleshoot empty values
    console.log('Original tracking data:', {
      campaign_id: trackingData.campaign_id,
      company: trackingData.company,
      recipient: trackingData.recipient,
      event_type: trackingData.event_type
    });
    
    console.log('Sending to GA4:', {
      event: eventName,
      custom_campaign_id: cleanParams.custom_campaign_id,
      custom_company_name: cleanParams.custom_company_name,
      custom_recipient_id: cleanParams.custom_recipient_id,
      engagement_type: cleanParams.engagement_type,
      client_id: ga4Payload.client_id
    });

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

// Send tracking data to Salesbot (for real-time notifications)
async function sendToSalesbot(trackingData) {
  if (!SALESBOT_URL || !SALESBOT_API_KEY) {
    console.log('Salesbot not configured, skipping...');
    return;
  }

  try {
    const salesbotPayload = {
      event: 'report_click',
      data: trackingData,
      timestamp: new Date().toISOString()
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': SALESBOT_API_KEY
    };

    const response = await fetch(`${SALESBOT_URL}/api/v1/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(salesbotPayload)
    });

    if (response.ok) {
      console.log('Salesbot notification sent successfully');
    } else {
      console.error('Salesbot notification failed:', response.status, await response.text());
    }

  } catch (error) {
    console.error('Error sending salesbot:', error);
  }
}

// Store click data in Netlify Blobs for analytics
async function storeClickData(trackingData, event) {
  try {
    connectLambda(event);
    const store = getStore('click-analytics');
    
    // Use campaign_id as the prefix for the blob key.
    // Fallback to 'unknown' if campaign_id is not available.
    const campaignId = trackingData.campaign_id || 'unknown';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const blobKey = `${campaignId}/${uniqueId}`;
    
    await store.set(blobKey, JSON.stringify(trackingData), {
      metadata: { 
        contentType: 'application/json',
        company: trackingData.company_slug,
        campaign_id: campaignId, // Add campaign_id to metadata for potential future use
        timestamp: trackingData.click_timestamp
      }
    });

    console.log('Click data stored successfully with key:', blobKey);

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