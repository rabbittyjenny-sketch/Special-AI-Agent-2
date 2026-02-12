
/**
 * Phase 2: Enhanced attachment with cloud storage & vision analysis
 * Stores both metadata and vision analysis results
 */
export interface Attachment {
    id: string;
    filename: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/svg+xml';
    size: number;
    url: string; // Fallback URL or CDN URL
    uploadedBy: string;
    uploadedAt: string;

    // Phase 2: Cloud storage (Cloudflare R2)
    storageKey?: string; // R2 storage path (e.g., "design/1707729600000-abc-mockup.png")
    publicUrl?: string; // CDN public URL for displaying image

    // Phase 2: Vision analysis results
    visionAnalysis?: {
        analysis: string; // Full analysis text
        summary: string; // Short summary
        detectedType: 'design' | 'data' | 'code' | 'other'; // Detected content type
        confidence: number; // 0-100 confidence score
        keyPoints: string[]; // Array of key insights
        metadata?: Record<string, any>; // Additional metadata
    };
    analyzedAt?: string; // When vision analysis was completed

    // Enhanced metadata
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        format?: string;
        base64?: string; // Phase 2: Base64 encoded image data (for vision API)
        storageKey?: string; // Also store here for reference
    };
}

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
}

export interface VerificationResult {
    passed: boolean;
    confidence: number; // 0-100
    issues: string[];
    warnings: string[];
    shouldEscalate: boolean;
}
