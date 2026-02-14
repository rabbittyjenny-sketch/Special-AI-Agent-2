# 🎨 AI Image Generation - Prompt Engineering Guide
## คู่มือสร้างรูปด้วย AI + Prompt Techniques เฉพาะทาง

**Version:** 1.0
**Last Updated:** 2026-02-14
**For:** Special AI Agent - Creative Director

---

## 🎯 Overview

ระบบสามารถสร้างรูปภาพด้วย AI ผ่าน SkillBoss API:
- **Models:** Gemini, Flux, DALL-E
- **Types:** Logos, UI mockups, illustrations, banners, icons
- **Integration:** Creative Director Agent

---

## 📋 Image Generation Models

| Model | Best For | Speed | Quality | Cost |
|-------|----------|-------|---------|------|
| `vertex/gemini-2.5-flash-image-preview` | General use, fast | ⚡⚡⚡ | ⭐⭐⭐ | 💰 |
| `vertex/gemini-3-pro-image-preview` | High quality | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 |
| `replicate/black-forest-labs/flux-schnell` | Artistic, creative | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 |

**Default:** `vertex/gemini-2.5-flash-image-preview` (fast + good quality)

---

## 🔧 Prompt Structure Framework

### **Basic Template:**
```
[style] [subject] [details], [composition], [lighting], [colors], [mood], [technical specs]
```

### **Advanced Template:**
```
[art style] [subject/main element] doing [action],
[environment/setting], [composition rules],
[lighting type], [color palette],
[camera angle], [mood/atmosphere],
[technical specifications], [quality boosters]
```

---

## 🎨 1. Logo Design Prompts

### **Minimal Logo:**
```
minimalist [industry] logo, [symbol/icon], [colors],
clean lines, negative space, modern, professional,
vector style, flat design, white background,
simple geometric shapes, scalable
```

**Examples:**
```
✅ "minimalist coffee shop logo, steam forming letter C,
warm brown and cream, clean lines, negative space,
modern professional, vector style, white background"

✅ "minimalist tech startup logo, abstract circuit pattern,
blue gradient, geometric shapes, clean modern design,
flat vector style, white background"
```

### **Mascot Logo:**
```
friendly [animal/character] mascot logo, [personality traits],
[brand colors], cartoon style, expressive face,
simple shapes, bold outlines, white background,
suitable for digital and print
```

**Examples:**
```
✅ "friendly owl mascot logo, wise and approachable,
orange and teal colors, cartoon style, big expressive eyes,
simple shapes, bold outlines, white background"

✅ "playful dog mascot logo, energetic and happy,
red and yellow, cartoon style, wagging tail,
simple vector design, white background"
```

### **Lettermark Logo:**
```
modern lettermark logo [letters], [style adjectives],
[typography style], [colors], [effects],
professional brand identity, vector design,
white background, scalable, clean
```

**Examples:**
```
✅ "modern lettermark logo 'AI', futuristic tech style,
sans-serif bold typography, electric blue gradient,
geometric elements, professional brand identity,
white background, clean vector design"
```

---

## 🖼️ 2. UI/UX Design Mockups

### **Landing Page:**
```
modern [industry] landing page design, [layout type],
[color scheme], clean UI, [design system],
[key sections], professional web design,
high contrast, user-friendly, desktop view
```

**Examples:**
```
✅ "modern SaaS landing page design, hero section with CTA,
blue and white gradient, clean minimalist UI,
Material Design 3, feature cards, testimonials,
professional web design, high contrast, desktop view"

✅ "modern e-commerce landing page, product showcase grid,
warm earth tones, clean UI, product categories,
shopping cart, professional retail design, desktop view"
```

### **Mobile App Screen:**
```
mobile app UI design for [app type], [screen name],
[design style], [color palette], [key elements],
modern interface, user-friendly, clean layout,
iOS/Android style, vertical format
```

**Examples:**
```
✅ "mobile app UI design for fitness tracker, dashboard screen,
minimalist modern style, green and white palette,
activity rings, statistics cards, bottom navigation,
clean layout, iOS style, vertical format"
```

### **Dashboard:**
```
admin dashboard UI design, [data visualization types],
[color scheme], [layout grid], modern interface,
charts and graphs, KPI cards, clean professional,
dark/light mode, desktop view
```

**Examples:**
```
✅ "admin dashboard UI design, analytics charts and graphs,
dark mode with blue accents, 12-column grid layout,
line charts, pie charts, KPI cards, modern interface,
professional design, desktop view"
```

---

## 🎭 3. Illustrations & Art

### **Flat Illustration:**
```
flat design illustration of [subject], [action/scene],
[color palette], [style modifiers], simple shapes,
minimal details, modern aesthetic, clean composition,
vector style, [perspective]
```

**Examples:**
```
✅ "flat design illustration of team collaboration,
people working on laptops around table, pastel colors,
friendly style, simple geometric shapes, minimal shadows,
modern aesthetic, isometric perspective"

✅ "flat design illustration of data analysis,
person examining charts on screen, blue and purple palette,
clean modern style, simple shapes, minimal details,
front view, professional aesthetic"
```

### **Isometric Illustration:**
```
isometric illustration of [subject/scene],
[color scheme], [style], detailed objects,
clean shadows, modern design, [mood],
technical perspective, professional quality
```

**Examples:**
```
✅ "isometric illustration of modern office workspace,
desk with computer and plants, pastel blue and pink,
minimalist style, soft shadows, clean design,
cheerful mood, professional quality"
```

### **Character Design:**
```
character design of [character description],
[personality traits], [outfit/appearance],
[art style], [color palette], [pose/expression],
full body/portrait, [background], clean lines
```

**Examples:**
```
✅ "character design of friendly AI assistant robot,
helpful and approachable personality, sleek modern design,
cartoon style, blue and white colors, smiling expression,
full body pose, white background, clean vector lines"
```

---

## 🎪 4. Marketing Materials

### **Social Media Post:**
```
social media graphic for [platform], [message/theme],
[visual style], [brand colors], [key elements],
eye-catching design, [text placement area],
modern professional, optimized for [platform]
```

**Examples:**
```
✅ "Instagram post graphic for product launch announcement,
exciting celebration theme, vibrant gradient background,
pink and purple colors, product showcase area,
confetti elements, text space at top,
modern energetic design, square 1080x1080"

✅ "LinkedIn post graphic for business tips,
professional educational theme, clean corporate style,
navy blue and gold, icon illustrations,
tip cards layout, text-friendly design,
professional modern, 1200x627 format"
```

### **Banner/Header:**
```
website banner design for [purpose], [dimensions],
[visual theme], [color scheme], [main elements],
[CTA area], professional web design, high impact,
modern aesthetic, optimized for web
```

**Examples:**
```
✅ "website hero banner for tech conference,
futuristic technology theme, 1920x600 dimensions,
dark blue gradient background, abstract tech elements,
speaker photos, CTA button area right side,
professional modern design, high contrast"
```

### **Infographic:**
```
infographic design about [topic], [layout style],
[color palette], [data visualization types],
[icons/illustrations], clear hierarchy,
professional educational, easy to read,
vertical/horizontal format
```

**Examples:**
```
✅ "infographic design about productivity tips,
vertical timeline layout, blue and green palette,
icons for each step, numbered sections,
clean modern style, clear hierarchy,
professional educational design, 800x2000"
```

---

## 💎 5. Icons & Symbols

### **Icon Set:**
```
[style] icon set for [category], [number] icons,
[design style], [color/monochrome], consistent style,
pixel-perfect, scalable, [line weight], clean design,
white/transparent background
```

**Examples:**
```
✅ "modern icon set for productivity apps, 8 icons,
minimalist line style, monochrome black, consistent 2px stroke,
pixel-perfect, scalable, clean simple design,
transparent background"

✅ "colorful icon set for social media, 6 icons,
flat design style, brand colors, consistent rounded style,
playful modern, scalable vector, white background"
```

---

## 🎯 Prompt Engineering Techniques

### **1. Style Modifiers**

#### **Art Styles:**
- `minimalist`, `maximalist`, `brutalist`
- `flat design`, `material design`, `neumorphism`
- `glassmorphism`, `skeuomorphic`, `abstract`
- `geometric`, `organic`, `futuristic`
- `retro`, `vintage`, `modern`, `contemporary`

#### **Quality Boosters:**
- `high quality`, `professional`, `award-winning`
- `detailed`, `intricate`, `polished`
- `clean`, `crisp`, `sharp`, `pristine`
- `pixel-perfect`, `vector`, `scalable`

---

### **2. Color Techniques**

#### **Color Palettes:**
```
// Monochromatic
"shades of blue, navy to sky blue gradient"

// Complementary
"orange and teal color scheme, high contrast"

// Analogous
"warm colors, red orange yellow palette"

// Triadic
"primary colors, red blue yellow vibrant"

// Brand Colors
"corporate blue #0066CC and white"
```

#### **Color Moods:**
- Calm: `pastel blues, soft greens, muted tones`
- Energetic: `vibrant colors, high saturation, bold`
- Professional: `navy blue, gray, white, minimal accent`
- Playful: `bright colors, rainbow palette, cheerful`
- Luxury: `gold, black, deep purple, elegant`

---

### **3. Composition Rules**

#### **Layout:**
- `centered composition`, `rule of thirds`
- `golden ratio`, `symmetrical balance`
- `asymmetrical dynamic`, `hierarchical`
- `grid-based layout`, `freeform organic`

#### **Perspective:**
- `front view`, `side profile`, `three-quarter view`
- `top-down view`, `isometric perspective`
- `bird's eye view`, `worm's eye view`

---

### **4. Lighting Techniques**

#### **Light Types:**
- `soft diffused lighting`, `hard directional light`
- `rim lighting`, `backlit`, `front lit`
- `natural daylight`, `golden hour`, `blue hour`
- `studio lighting`, `dramatic shadows`
- `neon glow`, `ambient light`

#### **Mood Lighting:**
- Bright: `high-key lighting, cheerful bright`
- Dark: `low-key lighting, moody dramatic`
- Warm: `golden sunset glow, cozy warm`
- Cool: `blue tone lighting, crisp cool`

---

### **5. Technical Specifications**

#### **Resolution/Format:**
- `4K resolution`, `high resolution`, `print quality`
- `vector format`, `SVG compatible`
- `square 1:1`, `landscape 16:9`, `portrait 9:16`
- `web optimized`, `mobile optimized`

#### **Background:**
- `white background`, `transparent background`
- `gradient background`, `solid color background`
- `blurred background`, `abstract background`

---

## 🚀 Advanced Prompt Patterns

### **Pattern 1: Layered Description**
```
[Primary subject] + [Secondary elements] + [Background] + [Style] + [Technical]

Example:
"Modern smartphone mockup (primary),
floating UI elements and icons around it (secondary),
gradient blue to purple background (background),
clean minimalist design style (style),
4K resolution, transparent PNG (technical)"
```

### **Pattern 2: Negative Prompts** (What to avoid)
```
Main prompt: "professional logo design..."
Avoid: "no text, no complex details, no gradients, no shadows"
```

### **Pattern 3: Reference Style**
```
"[Subject] in the style of [reference style/artist/brand]"

Examples:
- "logo design in the style of Apple minimalism"
- "illustration in the style of Kurzgesagt YouTube"
- "UI design in the style of Stripe's landing page"
```

### **Pattern 4: Emotion-Driven**
```
"[Subject] that evokes [emotion/feeling]"

Examples:
- "landing page design that evokes trust and security"
- "logo that feels innovative and futuristic"
- "illustration that conveys warmth and friendliness"
```

---

## 📊 Prompt Examples by Use Case

### **Startup Landing Page:**
```
modern SaaS landing page design, hero section with product screenshot,
gradient background from blue to purple, clean minimalist UI,
feature sections with icons, testimonial cards, pricing table,
call-to-action buttons, professional web design,
high contrast, Figma-ready, desktop view 1920x1080
```

### **Mobile App Icon:**
```
iOS app icon for productivity app, minimalist design,
abstract checkmark symbol, gradient from blue to green,
rounded square shape, clean vector style, modern professional,
simple geometric elements, scalable, 1024x1024
```

### **Blog Header Image:**
```
blog header illustration about AI technology,
flat design style, futuristic theme, abstract AI brain network,
purple and cyan color palette, clean modern aesthetic,
horizontal format 1200x400, minimal details,
professional tech vibe, web-optimized
```

### **Product Mockup:**
```
realistic product mockup, laptop showing dashboard UI,
modern workspace setting, natural lighting,
clean white desk with plant, coffee cup,
professional photography style, shallow depth of field,
high quality, commercial use, 4K resolution
```

---

## 🎨 Creative Director Agent Integration

### **Image Generation Function:**

```typescript
// backend/lib/agents/creative-director/image-generator.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ImageGenOptions {
  prompt: string;
  model?: string;
  size?: string;
  output?: string;
}

export async function generateImage(options: ImageGenOptions) {
  const {
    prompt,
    model = 'vertex/gemini-2.5-flash-image-preview',
    size = '1024*768',
    output = '/tmp/generated-image.png'
  } = options;

  const command = `node ./.claude/skills/skillboss/scripts/api-hub.js image \
    --model "${model}" \
    --prompt "${prompt}" \
    --size "${size}" \
    --output "${output}"`;

  try {
    const { stdout, stderr } = await execAsync(command);
    console.log('✅ Image generated:', output);
    return { success: true, output, stdout, stderr };
  } catch (error) {
    console.error('❌ Image generation failed:', error);
    return { success: false, error };
  }
}
```

### **Usage in Agent:**

```typescript
// When user asks for image generation
const imageRequest = {
  prompt: enhancePrompt(userInput),
  model: selectBestModel(imageType),
  size: calculateOptimalSize(platform),
  output: `/tmp/${conversationId}-${timestamp}.png`
};

const result = await generateImage(imageRequest);

if (result.success) {
  // Upload to S3
  // Save to attachments
  // Return to user
}
```

---

## 💡 Prompt Enhancement Tips

### **1. Be Specific:**
❌ "Create a logo"
✅ "Create a minimalist logo for a coffee shop with a steam icon, brown and cream colors, vector style"

### **2. Add Context:**
❌ "Design a button"
✅ "Design a primary call-to-action button for SaaS landing page, modern style, blue gradient, large size"

### **3. Specify Style:**
❌ "Make an illustration"
✅ "Make a flat design illustration in pastel colors with simple geometric shapes"

### **4. Include Technical Specs:**
❌ "Create a banner"
✅ "Create a 1920x600 website banner, high resolution, optimized for web, transparent background"

### **5. Add Mood/Emotion:**
❌ "Design an icon"
✅ "Design a friendly, approachable icon that feels trustworthy and professional"

---

## 🎯 Best Practices

### **DO:**
✅ Start with subject, then add details
✅ Use comma-separated modifiers
✅ Specify colors explicitly
✅ Include style keywords
✅ Add technical specifications
✅ Mention intended use
✅ Test multiple variations

### **DON'T:**
❌ Use vague descriptions
❌ Mix too many styles
❌ Over-complicate prompts
❌ Forget background specification
❌ Skip quality modifiers
❌ Ignore aspect ratio

---

## 🔄 Iteration Strategy

### **First Try:**
```
Basic prompt with core elements
Example: "minimalist logo, coffee cup, brown colors"
```

### **Second Try:**
```
Add style and technical details
Example: "minimalist coffee shop logo, steam forming letter C,
warm brown and cream colors, vector style, white background"
```

### **Third Try:**
```
Fine-tune with specific requirements
Example: "minimalist coffee shop logo, stylized steam forming letter C,
warm brown #8B4513 and cream #F5F5DC palette, clean line art,
negative space design, modern professional, scalable vector,
white background, suitable for print and digital"
```

---

## 📚 Resources

### **Prompt Libraries:**
- [Midjourney Prompts](https://prompthero.com/midjourney-prompts)
- [DALL-E Prompt Book](https://dallery.gallery/the-dalle-2-prompt-book/)
- [Stable Diffusion Guide](https://prompthero.com/stable-diffusion-prompts)

### **Design Inspiration:**
- [Dribbble](https://dribbble.com) - UI/UX designs
- [Behance](https://behance.net) - Creative work
- [Awwwards](https://awwwards.com) - Web design
- [LogoLounge](https://logolounge.com) - Logo designs

### **Color Tools:**
- [Coolors](https://coolors.co) - Color palette generator
- [Adobe Color](https://color.adobe.com) - Color wheel
- [ColorHunt](https://colorhunt.co) - Color palettes

---

## 🎉 Summary

**Key Takeaways:**

1. **Structure matters** - Use the framework consistently
2. **Be specific** - Details produce better results
3. **Style keywords** - Essential for desired aesthetic
4. **Technical specs** - Don't forget resolution, format, background
5. **Iterate** - First attempt is rarely perfect
6. **Test models** - Different models for different needs

**Formula for Success:**
```
Specific Subject + Clear Style + Color Palette +
Technical Specs + Quality Modifiers = Great Results
```

---

**Created for:** Special AI Agent - Creative Director
**Purpose:** Enable high-quality AI image generation
**Integration:** SkillBoss API + MCP Tools
**Next Steps:** Add to Creative Director's Knowledge Base

🎨 Happy Prompting! ✨
