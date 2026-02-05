import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not defined');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * ใช้ Claude Haiku (โมเดลเร็ว) ในการวิเคราะห์ว่าควรส่งงานให้ Agent ตัวไหน
 */
export async function routeToAgent(message: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 50,
    messages: [{
      role: "user",
      content: `Classify this request into ONE category:
      - design: UI/UX, visual design, branding, mockups
      - analyst: data analysis, statistics, reports, sheets
      - coder: programming, debugging, technical tasks
      - marketing: content, SEO, social media

      Message: "${message}"
      Reply with ONLY the category name.`
    }]
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text.trim().toLowerCase();
  }
  return 'analyst'; // Default หากมีข้อผิดพลาด
}
