// API Endpoint to retrieve click tracking data for a specific campaign
// Accessible via GET /.netlify/functions/get-campaign-clicks?campaign_id=...

const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Standard headers for CORS and JSON response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Ensure this is a GET request
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
    };
  }

  // --- Parameter Check ---
  const { campaign_id } = event.queryStringParameters;
  if (!campaign_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'Missing required parameter: campaign_id' })
    };
  }

  try {
    connectLambda(event);
    const store = getStore('click-analytics');

    // List all blobs prefixed with the campaign_id
    const { blobs } = await store.list({ prefix: campaign_id + '/' });

    if (!blobs || blobs.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          campaign_id: campaign_id,
          message: 'No clicks found for this campaign_id.'
        })
      };
    }

    // Retrieve the content of each blob
    const clickDataPromises = blobs.map(blob => store.get(blob.key, { type: 'json' }));
    const clicks = await Promise.all(clickDataPromises);

    // Return the successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        campaign_id: campaign_id,
        clicks: clicks
      })
    };

  } catch (error) {
    console.error(`Error fetching clicks for campaign_id ${campaign_id}:`, error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        error: error.message
      })
    };
  }
};
