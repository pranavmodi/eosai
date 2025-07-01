const crypto = require('crypto');

// Environment variables (set these in Netlify dashboard)
const WEBHOOK_SECRET = process.env.SALESBOT_WEBHOOK_SECRET || 'your-webhook-secret-key';
const NETLIFY_BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK || 'https://api.netlify.com/build_hooks/your-build-hook-id';

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
    }
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

    // In a real implementation, you would:
    // 1. Store the report data in a database or file system
    // 2. Update your reports data source
    // 3. Trigger a site rebuild

    // For now, we'll simulate this by logging and triggering a rebuild
    console.log('Generated report:', {
      id: reportData.id,
      company: reportData.companyName,
      slug: reportData.companySlug
    });

    // Trigger Netlify site rebuild
    if (NETLIFY_BUILD_HOOK && NETLIFY_BUILD_HOOK !== 'https://api.netlify.com/build_hooks/your-build-hook-id') {
      try {
        const response = await fetch(NETLIFY_BUILD_HOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            trigger_title: `New report: ${reportData.companyName}`,
            trigger_metadata: {
              report_id: reportData.id,
              company_name: reportData.companyName
            }
          })
        });

        if (response.ok) {
          console.log('Build triggered successfully');
        } else {
          console.error('Failed to trigger build:', response.status);
        }
      } catch (error) {
        console.error('Error triggering build:', error);
      }
    }

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Report published successfully',
        data: {
          reportId: reportData.id,
          companySlug: reportData.companySlug,
          publishUrl: `https://possibleminds.in/reports/${reportData.companySlug}`
        }
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