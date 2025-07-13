// Environment variables (set these in Netlify dashboard)
const SALESBOT_API_URL = process.env.SALESBOT_API_URL || 'http://localhost:5000/api/engagement';
const SALESBOT_API_KEY = process.env.SALESBOT_API_KEY || 'your-api-key';

// Main function handler
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed. Use POST.' 
      })
    };
  }

  try {
    // Parse the request body
    const engagementData = JSON.parse(event.body);
    
    // Validate required fields
    if (!engagementData.type || !engagementData.reportId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: type and reportId' 
        })
      };
    }

    // Extract relevant engagement data
    const {
      type,
      reportId,
      contactId,
      target,
      value,
      utmSource,
      utmMedium,
      utmCampaign,
      timestamp,
      userAgent
    } = engagementData;

    // Prepare data to send to Salesbot
    const trackingData = {
      event_type: type,
      report_id: reportId,
      contact_id: contactId,
      target: target,
      value: value,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      timestamp: timestamp || new Date().toISOString(),
      user_agent: userAgent,
      referrer: event.headers.referer || event.headers.Referer,
      ip_address: event.headers['client-ip'] || 
                  event.headers['x-forwarded-for'] || 
                  event.headers['x-real-ip'] ||
                  'unknown',
      session_data: {
        page_url: event.headers.referer,
        request_id: context.awsRequestId
      }
    };

    console.log('Tracking engagement:', {
      type,
      reportId,
      contactId: contactId || 'anonymous',
      timestamp
    });

    // Send data to Salesbot (if configured)
    if (SALESBOT_API_URL && SALESBOT_API_URL !== 'http://localhost:5000/api/engagement') {
      try {
        const response = await fetch(SALESBOT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SALESBOT_API_KEY}`,
            'User-Agent': 'Netlify-Function/1.0'
          },
          body: JSON.stringify(trackingData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Engagement data sent to Salesbot successfully:', result);
        } else {
          console.error('Failed to send engagement data to Salesbot:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error sending engagement data to Salesbot:', error);
        // Don't fail the request if analytics fails
      }
    }

    // Store engagement data locally (optional - for your own analytics)
    // This could be sent to Google Analytics, Mixpanel, etc.
    await trackEngagementLocally(trackingData);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Engagement tracked successfully',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error tracking engagement:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

// Helper function to track engagement locally
async function trackEngagementLocally(trackingData) {
  try {
    // Log to console for debugging
    console.log('Local engagement tracking:', {
      event: trackingData.event_type,
      report: trackingData.report_id,
      contact: trackingData.contact_id || 'anonymous',
      timestamp: trackingData.timestamp
    });

    // Send to analytics services
    await Promise.all([
      sendToGA4(trackingData),
      sendToMixpanel(trackingData),
      saveToDatabase(trackingData),
      sendToCustomAnalytics(trackingData)
    ]);

  } catch (error) {
    console.error('Error in local engagement tracking:', error);
    // Don't throw - analytics failures shouldn't break the main flow
  }
}

// Google Analytics 4 integration (enhanced)
async function sendToGA4(trackingData) {
  const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
  const GA4_API_SECRET = process.env.GA4_API_SECRET;
  
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    console.log('GA4 not configured, skipping...');
    return; // Skip if not configured
  }

  try {
    const ga4Data = {
      client_id: trackingData.contact_id || 'anonymous',
      events: [{
        name: 'report_engagement',
        params: {
          event_category: 'strategic_reports',
          event_label: trackingData.report_id,
          engagement_type: trackingData.event_type,
          campaign_source: trackingData.utm_source,
          campaign_medium: trackingData.utm_medium,
          campaign_name: trackingData.utm_campaign,
          campaign_content: trackingData.utm_content,
          campaign_term: trackingData.utm_term,
          target_element: trackingData.target,
          engagement_value: trackingData.value,
          user_ip: trackingData.ip_address,
          page_referrer: trackingData.referrer,
          engagement_time_msec: 100,
          session_id: trackingData.session_data?.request_id
        }
      }]
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ga4Data)
      }
    );

    if (response.ok) {
      console.log('Data sent to GA4 successfully');
    } else {
      console.error('Failed to send data to GA4:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error sending to GA4:', error);
  }
}

// Mixpanel integration (optional)
async function sendToMixpanel(trackingData) {
  const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;
  
  if (!MIXPANEL_TOKEN) {
    return; // Skip if not configured
  }

  try {
    const mixpanelData = {
      event: 'Report Engagement',
      properties: {
        distinct_id: trackingData.contact_id || 'anonymous',
        report_id: trackingData.report_id,
        engagement_type: trackingData.event_type,
        utm_source: trackingData.utm_source,
        utm_medium: trackingData.utm_medium,
        utm_campaign: trackingData.utm_campaign,
        target: trackingData.target,
        value: trackingData.value,
        ip: trackingData.ip_address,
        referrer: trackingData.referrer,
        user_agent: trackingData.user_agent,
        timestamp: trackingData.timestamp,
        token: MIXPANEL_TOKEN
      }
    };

    const response = await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mixpanelData)
    });

    if (response.ok) {
      console.log('Data sent to Mixpanel successfully');
    } else {
      console.error('Failed to send data to Mixpanel:', response.status);
    }
  } catch (error) {
    console.error('Error sending to Mixpanel:', error);
  }
}

// Database storage (optional)
async function saveToDatabase(trackingData) {
  // This would integrate with your database of choice
  // Examples: Supabase, Airtable, MongoDB, etc.
  try {
    // Placeholder for database integration
    console.log('Database storage not configured, skipping...');
  } catch (error) {
    console.error('Error saving to database:', error);
  }
}

// Custom analytics service (optional)
async function sendToCustomAnalytics(trackingData) {
  const CUSTOM_ANALYTICS_URL = process.env.CUSTOM_ANALYTICS_URL;
  
  if (!CUSTOM_ANALYTICS_URL) {
    return; // Skip if not configured
  }

  try {
    const response = await fetch(CUSTOM_ANALYTICS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CUSTOM_ANALYTICS_TOKEN || ''}`
      },
      body: JSON.stringify(trackingData)
    });

    if (response.ok) {
      console.log('Data sent to custom analytics successfully');
    } else {
      console.error('Failed to send data to custom analytics:', response.status);
    }
  } catch (error) {
    console.error('Error sending to custom analytics:', error);
  }
} 