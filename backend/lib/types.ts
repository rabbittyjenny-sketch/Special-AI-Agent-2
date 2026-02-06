
export interface Message {
    role: string;
    content: string;
    timestamp: string;
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
