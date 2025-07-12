// We'll include the static data inline for fallback purposes
const { getStore, connectLambda } = require('@netlify/blobs'); // Netlify Blobs SDK

// Static reports data - now empty for clean slate
// All reports will be dynamic from Salesbot integration
const staticReportsData = [
  // No static reports - all reports will be dynamic
];

// Function to get all reports (dynamic + static)
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
    // Fetch dynamic reports from Netlify Blobs (persistent storage)
    let dynamicReports = [];
    try {
      // Connect Lambda for Netlify Blobs compatibility
      connectLambda(event);
      const store = getStore('reports');
      const listResult = await store.list();
      const blobs = listResult?.blobs || [];

      dynamicReports = await Promise.all(blobs.map(async (blobInfo) => {
        try {
          const raw = await store.get(blobInfo.key);
          return JSON.parse(raw);
        } catch (blobErr) {
          console.error('Error parsing blob', blobInfo.key, blobErr);
          return null;
        }
      }));
      // Filter out nulls
      dynamicReports = dynamicReports.filter(Boolean);
    } catch (blobListErr) {
      console.error('Error listing blobs:', blobListErr);
      dynamicReports = [];
    }
    
    // Combine with static reports (dynamic takes precedence for same slugs)
    const staticReports = staticReportsData || [];
    const allReports = [...dynamicReports];
    
    // Add static reports that don't conflict with dynamic ones
    staticReports.forEach(staticReport => {
      const hasConflict = dynamicReports.some(
        dynamicReport => dynamicReport.companySlug === staticReport.companySlug
      );
      if (!hasConflict) {
        allReports.push(staticReport);
      }
    });

    // Sort by published date (newest first)
    allReports.sort((a, b) => 
      new Date(b.publishedDate) - new Date(a.publishedDate)
    );

    // Return summary info for listing page (without full markdown content)
    const reportsSummary = allReports.map(report => ({
      id: report.id,
      companyName: report.companyName,
      companySlug: report.companySlug,
      title: report.title,
      description: report.description,
      industry: report.industry,
      publishedDate: report.publishedDate,
      author: report.author,
      metrics: report.metrics,
      tags: report.tags,
      readTime: report.readTime,
      isDynamic: report.isDynamic || false
    }));

    console.log(`Serving ${reportsSummary.length} reports (${dynamicReports.length} dynamic, ${staticReports.length - (allReports.length - dynamicReports.length)} static)`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reports: reportsSummary,
        totalCount: reportsSummary.length,
        dynamicCount: dynamicReports.length,
        staticCount: staticReports.length,
        lastUpdated: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error retrieving reports:', error);
    
    // Fallback to static reports only if there's an error
    try {
      const staticReports = staticReportsData || [];
      const reportsSummary = staticReports.map(report => ({
        id: report.id,
        companyName: report.companyName,
        companySlug: report.companySlug,
        title: report.title,
        description: report.description,
        industry: report.industry,
        publishedDate: report.publishedDate,
        author: report.author,
        metrics: report.metrics,
        tags: report.tags,
        readTime: report.readTime,
        isDynamic: report.isDynamic || false
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reports: reportsSummary,
          totalCount: reportsSummary.length,
          dynamicCount: 0,
          staticCount: staticReports.length,
          lastUpdated: new Date().toISOString(),
          fallback: true
        })
      };
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
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
}; 