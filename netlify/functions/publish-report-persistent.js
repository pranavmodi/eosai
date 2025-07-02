const crypto = require('crypto');

// Environment variables
const WEBHOOK_SECRET = process.env.SALESBOT_WEBHOOK_SECRET || 'your-webhook-secret-key';

// Option 1: Simple File-based Persistence (using Netlify Large Media or external storage)
// For production, replace this with a database solution

// Fallback to in-memory if no persistent storage is configured
global.reportsData = global.reportsData || [];

// Database configuration - set these environment variables for persistence
const DATABASE_TYPE = process.env.DATABASE_TYPE; // 'supabase', 'fauna', 'airtable', etc.
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_KEY = process.env.DATABASE_KEY;

// Supabase integration example
async function saveReportToSupabase(reportData) {
  if (DATABASE_TYPE !== 'supabase' || !DATABASE_URL || !DATABASE_KEY) {
    throw new Error('Supabase not configured');
  }
  
  try {
    const response = await fetch(`${DATABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DATABASE_KEY}`,
        'apikey': DATABASE_KEY,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: reportData.id,
        company_slug: reportData.companySlug,
        data: reportData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Supabase save error:', error);
    throw error;
  }
}

// Airtable integration example
async function saveReportToAirtable(reportData) {
  if (DATABASE_TYPE !== 'airtable' || !DATABASE_URL || !DATABASE_KEY) {
    throw new Error('Airtable not configured');
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${DATABASE_URL}/Reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DATABASE_KEY}`
      },
      body: JSON.stringify({
        records: [{
          fields: {
            'ID': reportData.id,
            'Company Slug': reportData.companySlug,
            'Company Name': reportData.companyName,
            'Title': reportData.title,
            'Published Date': reportData.publishedDate,
            'Data': JSON.stringify(reportData),
            'Created': new Date().toISOString()
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Airtable save error:', error);
    throw error;
  }
}

// FaunaDB integration example
async function saveReportToFauna(reportData) {
  if (DATABASE_TYPE !== 'fauna' || !DATABASE_KEY) {
    throw new Error('FaunaDB not configured');
  }

  try {
    const response = await fetch('https://db.fauna.com/query/1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DATABASE_KEY}`
      },
      body: JSON.stringify({
        query: {
          create: {
            collection: 'reports',
            data: {
              id: reportData.id,
              companySlug: reportData.companySlug,
              data: reportData,
              createdAt: new Date().toISOString()
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`FaunaDB error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('FaunaDB save error:', error);
    throw error;
  }
}

// Generic save function that routes to the configured database
async function saveReportPersistent(reportData) {
  try {
    switch (DATABASE_TYPE) {
      case 'supabase':
        return await saveReportToSupabase(reportData);
      case 'airtable':
        return await saveReportToAirtable(reportData);
      case 'fauna':
        return await saveReportToFauna(reportData);
      default:
        console.warn('No persistent database configured, falling back to memory');
        return addReportToMemory(reportData);
    }
  } catch (error) {
    console.error('Persistent storage failed, falling back to memory:', error);
    return addReportToMemory(reportData);
  }
}

// Fallback to memory storage
function addReportToMemory(reportData) {
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
  
  console.log(`Report added to memory. Total reports: ${global.reportsData.length}`);
  return reportData;
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    console.log('Storage type:', DATABASE_TYPE || 'memory (fallback)');

    // Process the report data
    const reportData = processReportData(salesbotData);

    // Save the report with persistence
    await saveReportPersistent(reportData);

    console.log('Report saved successfully:', {
      id: reportData.id,
      company: reportData.companyName,
      slug: reportData.companySlug,
      storageType: DATABASE_TYPE || 'memory'
    });

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
          publishUrl: `https://possibleminds.in/reports/${reportData.companySlug}`,
          storageType: DATABASE_TYPE || 'memory'
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