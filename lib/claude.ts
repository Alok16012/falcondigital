import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

export function hasClaudeKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface PosterCopy {
  tagline: string;
  caption: string;
  offer: string;
  hashtags: string[];
}

const PLATFORM_TONE: Record<string, string> = {
  instagram: "punchy, emoji-friendly, trendy, 1-2 short lines",
  facebook: "friendly and informative, slightly longer",
  twitter: "witty and concise, under 220 chars",
  linkedin: "professional, value-focused, no emojis",
  whatsapp: "warm, direct, with a clear call to action",
};

// Local fallback so the app works even without an API key configured.
function fallbackCopy(name: string, category: string): PosterCopy {
  return {
    tagline: `${name} — quality you can trust`,
    caption: `Introducing ${name}! Premium ${category.toLowerCase()} at an unbeatable price. Grab yours today.`,
    offer: "Limited time offer",
    hashtags: ["#sale", "#newdrop", `#${category.toLowerCase().replace(/\s+/g, "")}`, "#shopnow"],
  };
}

export async function generatePosterCopy(input: {
  name: string;
  description: string;
  category: string;
  price: number;
  mrp: number;
  brandColor: string;
}): Promise<{ copy: PosterCopy; source: "ai" | "fallback" }> {
  if (!hasClaudeKey()) {
    return { copy: fallbackCopy(input.name, input.category), source: "fallback" };
  }

  try {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        "You are a marketing copywriter for an e-commerce seller. Return ONLY valid JSON, no markdown fences.",
      messages: [
        {
          role: "user",
          content: `Write poster + social copy for this product. Respond as JSON with keys: tagline (max 6 words), caption (1-2 sentences), offer (short phrase like "Flat 50% OFF"), hashtags (array of 4 short tags).

Product: ${input.name}
Description: ${input.description}
Category: ${input.category}
Price: ₹${input.price} (MRP ₹${input.mrp})
Brand color: ${input.brandColor}`,
        },
      ],
    });
    const text = msg.content.find((b) => b.type === "text");
    const raw = text && "text" in text ? text.text : "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      copy: {
        tagline: parsed.tagline ?? "",
        caption: parsed.caption ?? "",
        offer: parsed.offer ?? "",
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      },
      source: "ai",
    };
  } catch (e) {
    console.error("Claude copy generation failed, using fallback:", e);
    return { copy: fallbackCopy(input.name, input.category), source: "fallback" };
  }
}

export async function generatePlatformCaption(
  platform: string,
  product: { name: string; description: string; category: string },
): Promise<string> {
  const tone = PLATFORM_TONE[platform] ?? "engaging";
  if (!hasClaudeKey()) {
    return `${product.name} now available! ${product.description} #${product.category.toLowerCase()}`;
  }
  try {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 250,
      system: "You are a social media manager. Return only the caption text, no quotes.",
      messages: [
        {
          role: "user",
          content: `Write a ${platform} caption (${tone}) for: ${product.name} — ${product.description}`,
        },
      ],
    });
    const text = msg.content.find((b) => b.type === "text");
    return text && "text" in text ? text.text.trim() : product.name;
  } catch {
    return `${product.name} now available! ${product.description}`;
  }
}
