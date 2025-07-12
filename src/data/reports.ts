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

// Static reports data - now empty for clean slate
// Reports will be populated dynamically via Salesbot integration
export const strategicReports: StrategicReport[] = [
  // No static reports - all reports will be dynamic
];

export const reportCategories = [...new Set(strategicReports.map(report => report.industry))];
export const reportTags = [...new Set(strategicReports.flatMap(report => report.tags))]; 