import "server-only";

export const instagramProfile = "https://www.instagram.com/miloysusamigoscl/";
export const googleMapsUrl = "https://maps.app.goo.gl/LFqX5JzjS843idPN9";
export const socialVerifiedAt = "19 de octubre de 2026";

export type InstagramPost = { code: string; url: string; publishedAt: string };
export type GoogleReview = { author: string; authorUrl?: string; rating: number; text: string; url: string; dateLabel: string; excerpt?: boolean };

// These are the first three public posts observed on the real profile, in order.
const verifiedPosts: InstagramPost[] = [
  { code: "DepmDPbPvii", url: "https://www.instagram.com/reel/DepmDPbPvii/", publishedAt: "18 de octubre de 2026" },
  { code: "Deepc3rvD4K", url: "https://www.instagram.com/reel/Deepc3rvD4K/", publishedAt: "14 de octubre de 2026" },
  { code: "Deaajnfmjum", url: "https://www.instagram.com/p/Deaajnfmjum/", publishedAt: "12 de octubre de 2026" },
];

// Short, literal excerpts read on the Google Maps listing supplied by the owner.
// This snapshot is dated; it is never presented as an automatically refreshed feed.
const verifiedReviews: GoogleReview[] = [
  { author: "Britnie Viloria", rating: 5, text: "Excelente trato servicio y atención!", url: googleMapsUrl, dateLabel: "Reseña verificada el " + socialVerifiedAt, excerpt: true },
  { author: "Jean Diaz Uzcategui", rating: 5, text: "Mi consentido greco quedó excelente limpiacito olorocito y hermoso 100% recomendados", url: googleMapsUrl, dateLabel: "Reseña verificada el " + socialVerifiedAt, excerpt: true },
];

export async function getInstagramPosts(): Promise<{ posts: InstagramPost[]; automatic: boolean }> {
  const { INSTAGRAM_ACCESS_TOKEN: token, INSTAGRAM_USER_ID: user, INSTAGRAM_API_VERSION: version } = process.env;
  if (token && user && version && /^v\d+\.\d+$/.test(version) && /^\d+$/.test(user)) {
    try {
      const endpoint = new URL("https://graph.instagram.com/" + version + "/" + user + "/media");
      endpoint.searchParams.set("fields", "permalink,timestamp");
      endpoint.searchParams.set("limit", "3");
      const response = await fetch(endpoint, { headers: { Authorization: "Bearer " + token }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Instagram unavailable");
      const data = await response.json();
      const posts: InstagramPost[] = (Array.isArray(data.data) ? data.data : []).flatMap((item: { permalink?: string; timestamp?: string }) => {
        const match = item.permalink?.match(/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)\//);
        if (!match || !item.timestamp || !Number.isFinite(Date.parse(item.timestamp))) return [];
        return [{ code: match[1], url: item.permalink!, publishedAt: new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date(item.timestamp)) }];
      }).slice(0, 3);
      if (posts.length) return { posts, automatic: true };
    } catch { /* Keep the verified posts visible if the provider is unavailable. */ }
  }
  return { posts: verifiedPosts, automatic: false };
}

export async function getGoogleReviews(): Promise<{ reviews: GoogleReview[]; rating: number; count: number; automatic: boolean }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const place = process.env.GOOGLE_PLACE_ID;
  if (key && place && /^[A-Za-z0-9_-]+$/.test(place)) {
    try {
      const response = await fetch("https://places.googleapis.com/v1/places/" + place + "?languageCode=es", {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
        cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Google unavailable");
      const data = await response.json();
      const reviews: GoogleReview[] = (Array.isArray(data.reviews) ? data.reviews : []).flatMap((r: { authorAttribution?: { displayName?: string; uri?: string }; rating?: number; originalText?: { text?: string }; text?: { text?: string }; googleMapsUri?: string; relativePublishTimeDescription?: string }) => {
        if (!r.authorAttribution?.displayName || !r.rating || !(r.originalText?.text || r.text?.text)) return [];
        return [{ author: r.authorAttribution.displayName, authorUrl: r.authorAttribution.uri, rating: r.rating, text: r.originalText?.text || r.text!.text!, url: r.googleMapsUri || data.googleMapsUri || googleMapsUrl, dateLabel: r.relativePublishTimeDescription || "" }];
      });
      if (reviews.length && Number.isFinite(data.rating) && Number.isFinite(data.userRatingCount)) return { reviews: reviews.slice(0, 5), rating: data.rating, count: data.userRatingCount, automatic: true };
    } catch { /* A dated, attributed selection is preferable to fabricated reviews. */ }
  }
  return { reviews: verifiedReviews, rating: 4.9, count: 373, automatic: false };
}
