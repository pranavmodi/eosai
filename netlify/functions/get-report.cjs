const { getStore, connectLambda } = require('@netlify/blobs'); // Netlify Blobs SDK

// Static reports data - now empty for clean slate
// All reports will be dynamic from Salesbot integration
const staticReportsData = [
  // No static reports - all reports will be dynamic
];

// Function to get a specific report by slug
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed. Use GET.' 
      })
    };
  }

  try {
    // Get slug from query parameters or path
    const slug = event.queryStringParameters?.slug || 
                 event.path?.split('/').pop()?.replace('.json', '');

    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing slug parameter' 
        })
      };
    }

    let report = null;

    // Attempt to fetch from Netlify Blobs (persistent storage)
    try {
      // Connect Lambda for Netlify Blobs compatibility
      connectLambda(event);
      const store = getStore('reports');
      const raw = await store.get(slug);
      if (raw) {
        report = JSON.parse(raw);
      }
    } catch (blobErr) {
      // If blob not found or error, continue to fallback checks
      console.error('Error fetching blob', blobErr);
    }

    // Fallback to static reports if not found in blobs
    if (!report) {
      report = staticReportsData.find(r => r.companySlug === slug);
    }

    if (!report) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Report not found',
          slug: slug
        })
      };
    }

    console.log(`Serving report: ${report.companyName} (${report.isDynamic ? 'dynamic' : 'static'})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(report)
    };

  } catch (error) {
    console.error('Error retrieving report:', error);
    
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