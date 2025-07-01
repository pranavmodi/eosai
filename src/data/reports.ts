export interface StrategicReport {
  id: string;
  companyName: string;
  companySlug: string;
  title: string;
  subtitle: string;
  description: string;
  industry: string;
  publishedDate: string;
  generatedDate: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  marketAnalysis: string;
  competitivePosition: string;
  riskAssessment: string;
  growthOpportunities: string;
  implementationRoadmap: string;
  metrics: {
    marketSize: string;
    growthRate: string;
    competitiveAdvantage: string;
    riskLevel: string;
  };
  tags: string[];
  readTime: string;
  markdownContent?: string;
  campaignData?: {
    contactId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

// Sample reports data - this will be replaced by dynamic data from Salesbot
export const strategicReports: StrategicReport[] = [
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
      avatar: "/authors/sarah-chen.jpg",
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
    readTime: "12 min"
  }
];

export const reportCategories = [...new Set(strategicReports.map(report => report.industry))];
export const reportTags = [...new Set(strategicReports.flatMap(report => report.tags))]; 