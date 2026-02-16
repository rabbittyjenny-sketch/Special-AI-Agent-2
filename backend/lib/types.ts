/**
 * Phase 2: Enhanced attachment with cloud storage & vision analysis
 * Stores both metadata and vision analysis results
 * 
 * Note: This is flexible to accommodate both database and in-memory representations
 */
export type Attachment = Record<string, any>;

/**
 * Phase 2: Vision analysis results stored separately
 * One-to-many relationship with attachments
 */
export interface ImageAnalysis {
    id: string;
    attachmentId: string; // Foreign key to attachment
    agentType: 'design' | 'analyst' | 'coder' | 'marketing';
    analysis: string; // Full analysis text
    summary?: string; // Short summary
    detectedType: 'design' | 'data' | 'code' | 'other';
    confidence: number; // 0-100
    keyPoints: string[];
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface Message {
    role: string;
    content: string;
    timestamp: string;
    attachments?: Attachment[];
    metadata?: Record<string, any>;
}

export interface ConversationState {
    conversationId: string;
    userId: string;
    agentType: 'design' | 'analyst' | 'coder' | 'marketing';
    messages: Message[];
    context: {
        currentTask?: string;
        preferences?: Record<string, any>; // จำ preferences จาก memory
        workingData?: any; // ข้อมูลที่กำลังทำงาน
    };
    lastUpdated: string;
}

export interface AgentMemory {
    userId: string;
    agentType: string;
    preferences: {
        outputStyle?: string; // "concise" | "detailed"
        tone?: string; // "professional" | "casual"
        format?: string; // "bullet points" | "prose"
        codeStyle?: Record<string, any>; // สำหรับ coder agent
        designPreferences?: Record<string, any>; // สำหรับ design agent
    };
    patterns: Array<{
        pattern: string; // "User likes short captions"
        examples: string[]; // ตัวอย่างที่ถูกต้อง
        confidence: number; // 0-1
    }>;
    lessonsLearned: Array<{
        date: string;
        lesson: string;
        applied: boolean;
    }>;
    verificationRules: string[]; // Custom rules ต่อ user
    interactionCount?: number; // Total number of interactions with this agent
}

export interface VerificationResult {
    passed: boolean;
    confidence: number; // 0-100
    issues: string[];
    warnings: string[];
    shouldEscalate: boolean;
}
