// TikTok Oembed Helper — extracts video metadata from TikTok's free oembed API
// No auth required: GET https://www.tiktok.com/oembed?url={url}

export interface OembedResult {
  caption: string;
  authorName: string;
  thumbnailUrl: string;
  hashtags: string[];
}

/**
 * Fetch TikTok video metadata via oembed API.
 * Returns null on any error — never throws.
 */
const VALID_TIKTOK_HOSTS = ["www.tiktok.com", "tiktok.com", "vm.tiktok.com", "vn.tiktok.com"];

export async function fetchTikTokOembed(url: string): Promise<OembedResult | null> {
  try {
    // Validate hostname to prevent SSRF
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!VALID_TIKTOK_HOSTS.includes(parsed.hostname)) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json() as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };

    const caption = data.title || "";
    const hashtags = caption.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || [];

    return {
      caption,
      authorName: data.author_name || "",
      thumbnailUrl: data.thumbnail_url || "",
      hashtags,
    };
  } catch {
    return null;
  }
}
