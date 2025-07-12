// We'll include the static data inline for fallback purposes
const { getStore, connectLambda } = require('@netlify/blobs'); // Netlify Blobs SDK
const staticReportsData = [
  {
    id: "visco-spine-joint-center-1751348740637",
    companyName: "Visco Spine Joint Center",
    companySlug: "visco-spine-joint-center",
    title: "Strategic AI Implementation Framework for Healthcare Excellence",
    subtitle: "Transforming Patient Care Through Intelligent Automation",
    description: "A comprehensive strategic analysis and implementation roadmap for Visco Spine Joint Center to leverage AI technologies for enhanced patient outcomes, operational efficiency, and competitive advantage.",
    industry: "Healthcare",
    publishedDate: "2024-01-15",
    generatedDate: "2024-01-12",
    author: {
      name: "Dr. Emily Chen", 
      avatar: "/authors/emily-chen.jpg",
      title: "Principal AI Strategist"
    },
    executiveSummary: "Visco Spine Joint Center stands at a pivotal moment to transform its operations through strategic AI implementation. Our analysis reveals significant opportunities to enhance patient care quality, reduce operational costs by 25-30%, and establish market leadership in AI-driven healthcare.",
    keyFindings: [
      "Current diagnostic processes can be accelerated by 40% with AI-powered imaging analysis",
      "Predictive analytics can reduce readmission rates by 22%", 
      "Automated administrative tasks could free up 150+ staff hours weekly",
      "Patient satisfaction scores show 35% improvement potential through personalized care pathways"
    ],
    recommendations: [
      "Implement AI-powered diagnostic imaging system within Q2 2024",
      "Deploy predictive analytics platform for patient risk assessment",
      "Automate appointment scheduling and follow-up communications",
      "Establish AI governance framework and training programs"
    ],
    marketAnalysis: "The healthcare AI market is projected to reach $45.2B by 2026, with diagnostic imaging representing the largest segment. Visco Spine Joint Center can capture significant market share by positioning itself as a regional AI healthcare leader.",
    competitivePosition: "Currently positioned in the middle tier of regional healthcare providers. AI implementation would elevate Visco Spine Joint Center to top-tier status within 18 months.",
    riskAssessment: "Primary risks include regulatory compliance (medium), staff adoption resistance (low), and technology integration complexity (medium). Mitigation strategies are outlined in the implementation roadmap.",
    growthOpportunities: "AI implementation opens opportunities for new service lines, research partnerships, and potential acquisition targets. Revenue growth potential of 18-25% within 24 months.",
    implementationRoadmap: "Phase 1 (Q1-Q2): Infrastructure and diagnostic AI. Phase 2 (Q3-Q4): Predictive analytics and automation. Phase 3 (Year 2): Advanced AI applications and expansion.",
    metrics: {
      marketSize: "$2.3B Regional Market",
      growthRate: "18% Annual Growth", 
      competitiveAdvantage: "First-mover in Regional AI",
      riskLevel: "Medium"
    },
    tags: ["Healthcare", "AI Implementation", "Digital Transformation", "Strategic Planning"],
    readTime: "12 min",
    isDynamic: false
  },
  {
    id: "west-point-medical-001",
    companyName: "West Point Medical Center",
    companySlug: "west-point-medical-center",
    title: "Strategic AI Implementation Framework for Healthcare Excellence",
    subtitle: "Transforming Patient Care Through Intelligent Automation",
    description: "A comprehensive strategic analysis and implementation roadmap for West Point Medical Center to leverage AI technologies for enhanced patient outcomes, operational efficiency, and competitive advantage.",
    industry: "Healthcare",
    publishedDate: "2024-01-15",
    generatedDate: "2024-01-12",
    author: {
      name: "Dr. Sarah Chen",
      avatar: "/authors/emily-chen.jpg",
      title: "Principal AI Strategist"
    },
    executiveSummary: "West Point Medical Center stands at a pivotal moment to transform its operations through strategic AI implementation. Our analysis reveals significant opportunities to enhance patient care quality, reduce operational costs by 25-30%, and establish market leadership in AI-driven healthcare.",
    keyFindings: [
      "Current diagnostic processes can be accelerated by 40% with AI-powered imaging analysis",
      "Predictive analytics can reduce readmission rates by 22%",
      "Automated administrative tasks could free up 150+ staff hours weekly",
      "Patient satisfaction scores show 35% improvement potential through personalized care pathways"
    ],
    recommendations: [
      "Implement AI-powered diagnostic imaging system within Q2 2024",
      "Deploy predictive analytics platform for patient risk assessment",
      "Automate appointment scheduling and follow-up communications",
      "Establish AI governance framework and training programs"
    ],
    marketAnalysis: "The healthcare AI market is projected to reach $45.2B by 2026, with diagnostic imaging representing the largest segment. West Point Medical Center can capture significant market share by positioning itself as a regional AI healthcare leader.",
    competitivePosition: "Currently positioned in the middle tier of regional healthcare providers. AI implementation would elevate West Point Medical Center to top-tier status within 18 months.",
    riskAssessment: "Primary risks include regulatory compliance (medium), staff adoption resistance (low), and technology integration complexity (medium). Mitigation strategies are outlined in the implementation roadmap.",
    growthOpportunities: "AI implementation opens opportunities for new service lines, research partnerships, and potential acquisition targets. Revenue growth potential of 18-25% within 24 months.",
    implementationRoadmap: "Phase 1 (Q1-Q2): Infrastructure and diagnostic AI. Phase 2 (Q3-Q4): Predictive analytics and automation. Phase 3 (Year 2): Advanced AI applications and expansion.",
    metrics: {
      marketSize: "$2.3B Regional Market",
      growthRate: "18% Annual Growth",
      competitiveAdvantage: "First-mover in Regional AI",
      riskLevel: "Medium"
    },
    tags: ["Healthcare", "AI Implementation", "Digital Transformation", "Strategic Planning"],
    readTime: "12 min",
    isDynamic: false
  }
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
      const reportsSummary = staticReportsData.map(report => ({
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
        isDynamic: false
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reports: reportsSummary,
          totalCount: reportsSummary.length,
          dynamicCount: 0,
          staticCount: staticReportsData.length,
          lastUpdated: new Date().toISOString(),
          fallbackMode: true
        })
      };
    } catch (fallbackError) {
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