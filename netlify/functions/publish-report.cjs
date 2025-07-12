const crypto = require('crypto');
const { getStore, connectLambda } = require('@netlify/blobs'); // Netlify Blobs SDK for persistent storage

// Environment variables (set these in Netlify dashboard)
const WEBHOOK_SECRET = process.env.SALESBOT_WEBHOOK_SECRET || 'your-webhook-secret-key';
const NETLIFY_BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK; // Add this to your Netlify env vars

// Store reports in global memory for immediate access
global.reportsData = global.reportsData || [];

// Helper function to add/update a report in the store
function addReportToStore(reportData) {
  // Remove existing report with same slug if it exists
  global.reportsData = global.reportsData.filter(
    r => r.companySlug !== reportData.companySlug
  );
  
  // Add new report
  global.reportsData.push(reportData);
  
  // Sort by published date (newest first)
  global.reportsData.sort((a, b) => 
    new Date(b.publishedDate) - new Date(a.publishedDate)
  );
  
  console.log(`Report added. Total reports in store: ${global.reportsData.length}`);
  return reportData;
}

// Function to trigger Netlify rebuild
async function triggerNetlifyRebuild(reportData) {
  if (!NETLIFY_BUILD_HOOK) {
    console.warn('NETLIFY_BUILD_HOOK not configured - skipping rebuild');
    return { triggered: false, reason: 'No build hook configured' };
  }

  try {
    console.log(`Triggering rebuild for new report: ${reportData.companyName}`);
    
    const response = await fetch(NETLIFY_BUILD_HOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger_title: `New Report: ${reportData.companyName}`,
        trigger_metadata: {
          report_id: reportData.id,
          company_name: reportData.companyName,
          company_slug: reportData.companySlug,
          triggered_at: new Date().toISOString()
        }
      })
    });

    // Netlify Build Hooks usually return plain text, not JSON
    const responseBody = await response.text();

    if (response.ok) {
      console.log('Build triggered successfully:', responseBody);
      return { 
        triggered: true, 
        status: response.status,
        body: responseBody.trim(),
        message: 'Rebuild triggered successfully' 
      };
    } else {
      console.error('Failed to trigger build:', response.status, responseBody);
      return { 
        triggered: false, 
        reason: `Build trigger failed: ${response.status}`,
        error: responseBody.trim() 
      };
    }
  } catch (error) {
    console.error('Error triggering build:', error);
    return { 
      triggered: false, 
      reason: 'Build trigger error',
      error: error.message 
    };
  }
}

// Verify webhook signature for security
function verifySignature(body, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

// Generate company slug from company name
function generateSlug(companyName) {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}

// Process the report data from Salesbot
function processReportData(salesbotData) {
  const { 
    company_id,
    company_name, 
    company_website,
    markdown_report,
    generated_date,
    contact_id 
  } = salesbotData;

  // Generate a unique report ID
  const reportId = `${generateSlug(company_name)}-${Date.now()}`;
  const companySlug = generateSlug(company_name);

  // Extract key metrics from the markdown (this would be more sophisticated in practice)
  const extractedMetrics = {
    marketSize: "Market TBD", // These would be extracted from markdown_report
    growthRate: "Growth TBD",
    competitiveAdvantage: "Analysis Pending",
    riskLevel: "Medium"
  };

  // Create the report object structure
  const reportData = {
    id: reportId,
    companyName: company_name,
    companySlug: companySlug,
    title: `Strategic Analysis for ${company_name}`,
    subtitle: "Comprehensive Business Intelligence Report",
    description: `Strategic analysis and recommendations for ${company_name} based on comprehensive market research and competitive analysis.`,
    industry: "Business Services", // This could be extracted/inferred
    publishedDate: new Date().toISOString().split('T')[0],
    generatedDate: generated_date || new Date().toISOString().split('T')[0],
    author: {
      name: "Possible Minds Strategy Team",
      avatar: "/authors/pranav-modi.jpg",
      title: "Principal Strategy Consultant"
    },
    executiveSummary: "Comprehensive strategic analysis reveals significant opportunities for growth and operational optimization.",
    keyFindings: [
      "Strategic opportunity identified in core business segments",
      "Competitive positioning analysis completed",
      "Growth potential assessment finalized",
      "Risk mitigation strategies developed"
    ],
    recommendations: [
      "Implement strategic initiatives in Q1",
      "Optimize operational efficiency metrics",
      "Develop competitive advantage framework",
      "Execute risk management protocols"
    ],
    marketAnalysis: "Market analysis indicates strong potential for strategic positioning and competitive advantage development.",
    competitivePosition: "Current market position offers significant opportunities for strategic advancement.",
    riskAssessment: "Comprehensive risk assessment identifies manageable challenges with clear mitigation strategies.",
    growthOpportunities: "Multiple growth vectors identified with clear implementation pathways.",
    implementationRoadmap: "Strategic implementation plan with defined milestones and success metrics.",
    metrics: extractedMetrics,
    tags: ["Strategic Planning", "Business Analysis", "Market Research"],
    readTime: "12 min",
    markdownContent: markdown_report,
    campaignData: {
      contactId: contact_id
    },
    isDynamic: true, // Flag to identify dynamically added reports
    createdAt: new Date().toISOString()
  };

  return reportData;
}

// Main function handler
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256',
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
    const body = event.body;
    const signature = event.headers['x-hub-signature-256'] || event.headers['X-Hub-Signature-256'];

    // Verify webhook signature (optional, but recommended for security)
    if (signature && !verifySignature(body, signature)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid signature' 
        })
      };
    }

    // Parse the request body
    const salesbotData = JSON.parse(body);
    
    // Validate required fields
    if (!salesbotData.company_name || !salesbotData.markdown_report) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: company_name and markdown_report' 
        })
      };
    }

    console.log('Processing report for:', salesbotData.company_name);

    // Process the report data
    const reportData = processReportData(salesbotData);

    // Store the report in memory immediately (available until next deploy)
    addReportToStore(reportData);

    // Persist report to Netlify Blobs (permanent storage)
    let blobSuccess = false;
    try {
      console.log('Attempting to save to Netlify Blobs...');
      
      // Connect Lambda for Netlify Blobs compatibility
      connectLambda(event);
      console.log('Lambda connected successfully');
      
      const store = getStore('reports');
      console.log('Store obtained successfully');
      
      const result = await store.set(reportData.companySlug, JSON.stringify(reportData), {
        metadata: { contentType: 'application/json' }
      });
      
      console.log(`Report persisted to Netlify Blobs successfully: reports/${reportData.companySlug}.json`, result);
      blobSuccess = true;
    } catch (blobError) {
      console.error('Error saving report to Netlify Blobs:', blobError);
      console.error('Error stack:', blobError.stack);
      console.error('Error details:', JSON.stringify(blobError, Object.getOwnPropertyNames(blobError)));
    }

    // Trigger automatic rebuild
    const buildResult = await triggerNetlifyRebuild(reportData);

    console.log('Report processing completed:', {
      id: reportData.id,
      company: reportData.companyName,
      slug: reportData.companySlug,
      totalReports: global.reportsData.length,
      buildTriggered: buildResult.triggered
    });

    // Calculate estimated availability time
    const estimatedAvailableAt = new Date(Date.now() + (3 * 60 * 1000)); // 3 minutes from now

    // Return success response with build information
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Report published successfully',
        data: {
          reportId: reportData.id,
          companySlug: reportData.companySlug,
          publishUrl: `https://possibleminds.in/reports/${reportData.companySlug}`,
          buildTriggered: buildResult.triggered,
          blobPersisted: blobSuccess,
          estimatedAvailableAt: estimatedAvailableAt.toISOString(),
          estimatedWaitTime: '2-4 minutes'
        },
        buildInfo: buildResult
      })
    };

  } catch (error) {
    console.error('Error processing report:', error);
    
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

// Export helper functions for use by other functions
exports.getAllReports = () => global.reportsData || [];
exports.getReportBySlug = (slug) => global.reportsData.find(r => r.companySlug === slug); 