/**
 * Agent Boundary Definition System
 * Defines what each agent can and cannot do, their primary data sources, and authority level
 */

export type AgentType = 'design' | 'analyst' | 'coder' | 'marketing';
export type Authority = 'primary' | 'secondary' | 'reference_only';
export type DataSourceType =
  | 'figma'
  | 'google_sheets'
  | 'github'
  | 'judge0_api'
  | 'local_kb'
  | 'user_input'
  | 'web_api'
  | 'file_upload';

export interface DataSource {
  type: DataSourceType;
  authority: Authority;
  description: string;
}

export interface AgentBoundary {
  agent: AgentType;
  displayName: string;
  role: string;
  description: string;
  primaryResponsibilities: string[];
  restrictions: string[];
  dataSources: DataSource[];
  visionCapabilities: {
    canAnalyzeImages: boolean;
    imageTypes: string[];
    maxImageSize: number;
  };
  toolLimit: number; // max concurrent tool calls
  confidenceThreshold: number; // escalation threshold (0-100)
}

export const AGENT_BOUNDARIES: Record<AgentType, AgentBoundary> = {
  design: {
    agent: 'design',
    displayName: 'Creative Director',
    role: 'UI/UX Expert',
    description: 'Specialized in visual design, user experience, and design systems',
    primaryResponsibilities: [
      'Review and critique design mockups',
      'Provide accessibility recommendations',
      'Suggest design improvements based on best practices',
      'Analyze user interface patterns',
      'Recommend component structure',
      'Evaluate visual hierarchy and consistency',
    ],
    restrictions: [
      'Cannot execute code or run systems',
      'Cannot access sensitive user data directly',
      'Cannot make architectural decisions alone (must consult coder)',
      'Cannot approve final designs without user consent',
    ],
    dataSources: [
      {
        type: 'figma',
        authority: 'primary',
        description: 'Design system and component library',
      },
      {
        type: 'file_upload',
        authority: 'primary',
        description: 'User-uploaded design assets',
      },
      {
        type: 'local_kb',
        authority: 'secondary',
        description: 'Brand guidelines and design patterns',
      },
      {
        type: 'user_input',
        authority: 'primary',
        description: 'Direct user feedback and requirements',
      },
    ],
    visionCapabilities: {
      canAnalyzeImages: true,
      imageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      maxImageSize: 5242880, // 5MB
    },
    toolLimit: 3,
    confidenceThreshold: 75,
  },

  analyst: {
    agent: 'analyst',
    displayName: 'Data Strategist',
    role: 'Data Analyst',
    description: 'Specialized in data analysis, trend identification, and strategic insights',
    primaryResponsibilities: [
      'Analyze data from spreadsheets and databases',
      'Generate insights from data patterns',
      'Calculate ROI and business metrics',
      'Identify trends and anomalies',
      'Create data-driven recommendations',
      'Validate data quality and accuracy',
    ],
    restrictions: [
      'Cannot modify data without explicit user approval',
      'Cannot access sensitive personal information',
      'Cannot make final business decisions (advisory only)',
      'Must cite data sources in all analysis',
    ],
    dataSources: [
      {
        type: 'google_sheets',
        authority: 'primary',
        description: 'Sales, inventory, and financial data',
      },
      {
        type: 'file_upload',
        authority: 'primary',
        description: 'User-uploaded CSV, Excel, or data files',
      },
      {
        type: 'web_api',
        authority: 'secondary',
        description: 'Public APIs for market data',
      },
      {
        type: 'local_kb',
        authority: 'secondary',
        description: 'Historical analysis and benchmarks',
      },
    ],
    visionCapabilities: {
      canAnalyzeImages: true,
      imageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxImageSize: 5242880, // 5MB
    },
    toolLimit: 5,
    confidenceThreshold: 80,
  },

  coder: {
    agent: 'coder',
    displayName: 'Code Specialist',
    role: 'Full-Stack Developer',
    description: 'Specialized in software architecture, code quality, and implementation',
    primaryResponsibilities: [
      'Review code for quality and security',
      'Provide architecture recommendations',
      'Suggest performance optimizations',
      'Execute and debug code',
      'Generate code templates and solutions',
      'Identify technical debt and refactoring opportunities',
    ],
    restrictions: [
      'Cannot deploy code to production without approval',
      'Cannot access external systems without proper credentials',
      'Cannot modify existing code without version control',
      'Cannot make design decisions alone (must consult designer)',
    ],
    dataSources: [
      {
        type: 'github',
        authority: 'primary',
        description: 'Code repositories and version history',
      },
      {
        type: 'judge0_api',
        authority: 'primary',
        description: 'Code execution and testing',
      },
      {
        type: 'file_upload',
        authority: 'primary',
        description: 'User-uploaded code snippets',
      },
      {
        type: 'local_kb',
        authority: 'secondary',
        description: 'Code templates and architecture patterns',
      },
    ],
    visionCapabilities: {
      canAnalyzeImages: true,
      imageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxImageSize: 5242880, // 5MB
    },
    toolLimit: 4,
    confidenceThreshold: 70,
  },

  marketing: {
    agent: 'marketing',
    displayName: 'Growth Hacker',
    role: 'Marketing Lead',
    description: 'Specialized in marketing strategy, copywriting, and customer engagement',
    primaryResponsibilities: [
      'Create compelling marketing copy',
      'Analyze customer behavior and messaging',
      'Recommend campaign strategies',
      'Suggest growth tactics',
      'Evaluate brand consistency',
      'Provide content recommendations',
    ],
    restrictions: [
      'Cannot make financial commitments',
      'Cannot access customer personal data',
      'Cannot send communications without user approval',
      'Must comply with all marketing regulations',
    ],
    dataSources: [
      {
        type: 'local_kb',
        authority: 'primary',
        description: 'Marketing guidelines and brand voice',
      },
      {
        type: 'user_input',
        authority: 'primary',
        description: 'Campaign ideas and target audience',
      },
      {
        type: 'web_api',
        authority: 'secondary',
        description: 'Market trends and industry data',
      },
      {
        type: 'file_upload',
        authority: 'secondary',
        description: 'Marketing assets and competitor analysis',
      },
    ],
    visionCapabilities: {
      canAnalyzeImages: true,
      imageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxImageSize: 5242880, // 5MB
    },
    toolLimit: 3,
    confidenceThreshold: 75,
  },
};

/**
 * Check if agent has authority over a data source
 */
export function hasAuthority(
  agent: AgentType,
  dataSource: DataSourceType,
  requiredLevel: Authority = 'secondary'
): boolean {
  const boundary = AGENT_BOUNDARIES[agent];
  const source = boundary.dataSources.find(s => s.type === dataSource);

  if (!source) return false;

  const authorityLevels = { primary: 3, secondary: 2, reference_only: 1 };
  const required = authorityLevels[requiredLevel];
  const actual = authorityLevels[source.authority];

  return actual >= required;
}

/**
 * Get all agents that can access a specific data source
 */
export function getAgentsForDataSource(dataSource: DataSourceType): AgentType[] {
  return (Object.keys(AGENT_BOUNDARIES) as AgentType[]).filter(agent =>
    AGENT_BOUNDARIES[agent].dataSources.some(s => s.type === dataSource)
  );
}

/**
 * Check if agent can analyze images
 */
export function canAnalyzeImages(agent: AgentType): boolean {
  return AGENT_BOUNDARIES[agent].visionCapabilities.canAnalyzeImages;
}

/**
 * Validate image for agent analysis
 */
export function validateImageForAgent(
  agent: AgentType,
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  const boundary = AGENT_BOUNDARIES[agent];

  if (!boundary.visionCapabilities.canAnalyzeImages) {
    return { valid: false, error: `${boundary.displayName} cannot analyze images` };
  }

  if (!boundary.visionCapabilities.imageTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `${boundary.displayName} does not support ${mimeType}`,
    };
  }

  if (size > boundary.visionCapabilities.maxImageSize) {
    return {
      valid: false,
      error: `Image exceeds size limit for ${boundary.displayName}`,
    };
  }

  return { valid: true };
}

/**
 * Knowledge Base Authority Mapping
 * Defines what KB categories and sources each agent can access
 */
export interface KBAuthority {
  primary: (DataSourceType | string)[];
  secondary: (DataSourceType | string)[];
  categories: string[];
}

export const AGENT_KB_AUTHORITIES: Record<AgentType, KBAuthority> = {
  design: {
    primary: ['figma', 'file_upload', 'local_kb'],
    secondary: ['manual'],
    categories: [
      'color_theory',
      'typography',
      'accessibility',
      'design_patterns',
      'ui_components',
      'brand_guidelines',
      'design_principles',
    ],
  },

  analyst: {
    primary: ['google_sheets', 'file_upload', 'local_kb'],
    secondary: ['api', 'manual'],
    categories: [
      'statistical_methods',
      'data_analysis',
      'metrics',
      'roi_calculation',
      'trend_analysis',
      'benchmarks',
      'data_interpretation',
    ],
  },

  coder: {
    primary: ['github', 'file_upload', 'local_kb'],
    secondary: ['api', 'manual'],
    categories: [
      'code_templates',
      'best_practices',
      'error_handling',
      'frameworks',
      'security_patterns',
      'performance_optimization',
      'architecture_patterns',
    ],
  },

  marketing: {
    primary: ['local_kb', 'manual'],
    secondary: ['file_upload', 'api'],
    categories: [
      'content_templates',
      'audience_insights',
      'campaign_strategies',
      'copywriting_formulas',
      'seo_practices',
      'social_media_tactics',
      'customer_behavior',
    ],
  },
};

/**
 * Check if agent has KB authority for a category
 */
export function hasKBCategoryAccess(
  agent: AgentType,
  category: string
): boolean {
  const authority = AGENT_KB_AUTHORITIES[agent];
  return authority.categories.includes(category);
}

/**
 * Get KB sources agent can access at specified level
 */
export function getAgentKBSources(
  agent: AgentType,
  level: 'primary' | 'secondary' | 'all' = 'all'
): (DataSourceType | string)[] {
  const authority = AGENT_KB_AUTHORITIES[agent];

  if (level === 'primary') return authority.primary;
  if (level === 'secondary') return authority.secondary;

  return [...authority.primary, ...authority.secondary];
}
