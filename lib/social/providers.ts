import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PostPayload, PostResult } from "@/lib/social";

const GRAPH = "https://graph.facebook.com/v21.0";

// ---------- helpers ----------

// Local uploads (e.g. /uploads/x.png) must be publicly reachable for IG/FB.
// Set APP_PUBLIC_URL (e.g. https://yourdomain.com) in Settings/.env.
export function toPublicUrl(url: string): string | null {
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  return base ? `${base}${url.startsWith("/") ? "" : "/"}${url}` : null;
}

// Read image bytes — from local public/ dir or by fetching the URL.
async function imageBytes(url: string): Promise<Buffer> {
  if (!/^https?:\/\//i.test(url)) {
    const file = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    return fs.readFile(file);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function graphPost(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Graph API error ${res.status}`);
  return json;
}

// ---------- Instagram (Meta Graph API) ----------

export async function postInstagram(p: PostPayload): Promise<PostResult> {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
    const igId = process.env.INSTAGRAM_BUSINESS_ID!;
    const imageUrl = toPublicUrl(p.posterUrl);
    if (!imageUrl)
      return { ok: false, error: "Instagram needs a public image URL — set APP_PUBLIC_URL in Settings." };

    const media = await graphPost(`${GRAPH}/${igId}/media`, {
      image_url: imageUrl,
      caption: p.caption,
      access_token: token,
    });
    const pub = await graphPost(`${GRAPH}/${igId}/media_publish`, {
      creation_id: media.id,
      access_token: token,
    });
    return { ok: true, platformPostId: pub.id };
  } catch (e: any) {
    return { ok: false, error: `Instagram: ${e.message}` };
  }
}

// ---------- Facebook Page ----------

export async function postFacebook(p: PostPayload): Promise<PostResult> {
  try {
    const token = process.env.FACEBOOK_PAGE_TOKEN!;
    const pageId = process.env.FACEBOOK_PAGE_ID!;
    const imageUrl = toPublicUrl(p.posterUrl);

    const json = imageUrl
      ? await graphPost(`${GRAPH}/${pageId}/photos`, {
          url: imageUrl,
          message: p.caption,
          access_token: token,
        })
      : await graphPost(`${GRAPH}/${pageId}/feed`, {
          message: p.caption,
          access_token: token,
        });
    return { ok: true, platformPostId: json.post_id ?? json.id };
  } catch (e: any) {
    return { ok: false, error: `Facebook: ${e.message}` };
  }
}

// ---------- Twitter / X (OAuth 1.0a) ----------

function oauth1Header(
  method: string,
  url: string,
  extraParams: Record<string, string> = {},
): string {
  const consumerKey = process.env.TWITTER_API_KEY!;
  const consumerSecret = process.env.TWITTER_API_SECRET!;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN!;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET!;

  const oauth: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const all = { ...oauth, ...extraParams };
  const paramStr = Object.keys(all)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(all[k])}`)
    .join("&");
  const base = [method.toUpperCase(), encodeURIComponent(url), encodeURIComponent(paramStr)].join("&");
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauth[k])}"`)
      .join(", ")
  );
}

export async function postTwitter(p: PostPayload): Promise<PostResult> {
  try {
    let mediaId: string | undefined;

    // 1) Upload image (v1.1 media endpoint).
    try {
      const bytes = await imageBytes(p.posterUrl);
      const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
      const form = new FormData();
      form.append("media_data", bytes.toString("base64"));
      const up = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: oauth1Header("POST", uploadUrl) },
        body: form,
      });
      const upJson = await up.json().catch(() => ({}));
      if (up.ok) mediaId = upJson.media_id_string;
    } catch {
      /* tweet without image */
    }

    // 2) Create tweet (v2).
    const tweetUrl = "https://api.twitter.com/2/tweets";
    const body: any = { text: p.caption.slice(0, 280) };
    if (mediaId) body.media = { media_ids: [mediaId] };
    const res = await fetch(tweetUrl, {
      method: "POST",
      headers: {
        Authorization: oauth1Header("POST", tweetUrl),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.detail ?? json?.title ?? `HTTP ${res.status}`);
    return { ok: true, platformPostId: json.data?.id };
  } catch (e: any) {
    return { ok: false, error: `Twitter: ${e.message}` };
  }
}

// ---------- LinkedIn ----------

async function linkedinAuthorUrn(token: string): Promise<string> {
  if (process.env.LINKEDIN_AUTHOR_URN) return process.env.LINKEDIN_AUTHOR_URN;
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.sub) throw new Error("Could not resolve LinkedIn author URN — set LINKEDIN_AUTHOR_URN.");
  return `urn:li:person:${json.sub}`;
}

export async function postLinkedIn(p: PostPayload): Promise<PostResult> {
  try {
    const token = process.env.LINKEDIN_ACCESS_TOKEN!;
    const author = await linkedinAuthorUrn(token);

    let asset: string | undefined;
    try {
      // Register + upload image.
      const reg = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: author,
            serviceRelationships: [
              { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
            ],
          },
        }),
      });
      const regJson = await reg.json();
      const uploadUrl =
        regJson?.value?.uploadMechanism?.[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ]?.uploadUrl;
      asset = regJson?.value?.asset;
      if (uploadUrl && asset) {
        const bytes = await imageBytes(p.posterUrl);
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: new Uint8Array(bytes),
        });
      } else {
        asset = undefined;
      }
    } catch {
      asset = undefined; // post text-only
    }

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: p.caption },
            shareMediaCategory: asset ? "IMAGE" : "NONE",
            ...(asset && { media: [{ status: "READY", media: asset }] }),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
    return { ok: true, platformPostId: json.id };
  } catch (e: any) {
    return { ok: false, error: `LinkedIn: ${e.message}` };
  }
}

// ---------- WhatsApp (Cloud API — sends to a broadcast recipient) ----------

export async function postWhatsApp(p: PostPayload): Promise<PostResult> {
  try {
    const token = process.env.FACEBOOK_PAGE_TOKEN!;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipient = process.env.WHATSAPP_RECIPIENT;
    if (!phoneId || !recipient)
      return { ok: false, error: "WhatsApp: set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_RECIPIENT in Settings." };

    const imageUrl = toPublicUrl(p.posterUrl);
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        imageUrl
          ? {
              messaging_product: "whatsapp",
              to: recipient,
              type: "image",
              image: { link: imageUrl, caption: p.caption },
            }
          : { messaging_product: "whatsapp", to: recipient, type: "text", text: { body: p.caption } },
      ),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    return { ok: true, platformPostId: json.messages?.[0]?.id };
  } catch (e: any) {
    return { ok: false, error: `WhatsApp: ${e.message}` };
  }
}

export const SOCIAL_PROVIDERS: Record<string, (p: PostPayload) => Promise<PostResult>> = {
  instagram: postInstagram,
  facebook: postFacebook,
  twitter: postTwitter,
  linkedin: postLinkedIn,
  whatsapp: postWhatsApp,
};
