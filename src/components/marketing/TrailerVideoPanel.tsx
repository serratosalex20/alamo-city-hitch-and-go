/**
 * TrailerVideoPanel — per-trailer instructional video, or a graceful
 * "coming soon" placeholder while owner is filming.
 *
 * Sprint 3.4f. Trailers carry an optional `instructionalVideoUrl` on the
 * Trailer type (added in 3.4a). When set, the panel renders a lazy
 * YouTube embed. When unset, it renders a brand-styled placeholder that
 * matches the /about page's OwnerPlaceholder aesthetic — same pulse
 * indicator + tracking-widest label — so the two "coming soon" surfaces
 * feel like one intentional design language rather than two different
 * empty-state UIs.
 *
 * Video URL normalization: owner will paste whatever YouTube URL they
 * copy from the address bar (watch URL) or the "Share" button (youtu.be
 * short link). This component accepts any format and normalizes to the
 * canonical /embed/ URL that iframes require.
 *
 * The video is set to loading="lazy" — the iframe doesn't fetch YouTube's
 * player script until the panel scrolls into the viewport, so trailer
 * detail pages stay fast even with an embedded video below the fold.
 */

import { Icon } from "@/components/ui/Icon";

interface TrailerVideoPanelProps {
  trailerName: string;
  videoUrl?: string;
  posterUrl?: string;
}

/**
 * Extract a YouTube video ID from any common URL shape:
 *   - https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   - https://youtu.be/XXXXXXXXXXX
 *   - https://www.youtube.com/embed/XXXXXXXXXXX
 *   - https://www.youtube.com/shorts/XXXXXXXXXXX
 * Returns null if no ID can be extracted (in which case we fall back to
 * the placeholder — refuse to render a broken iframe).
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,        // watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,   // youtu.be/ID
    /\/embed\/([a-zA-Z0-9_-]{11})/,     // /embed/ID
    /\/shorts\/([a-zA-Z0-9_-]{11})/,    // /shorts/ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function TrailerVideoPanel({
  trailerName,
  videoUrl,
  posterUrl,
}: TrailerVideoPanelProps) {
  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

  // ─── Placeholder state ──────────────────────────────────
  if (!videoId) {
    return (
      <figure
        className="relative aspect-video bg-surface-container border border-outline-variant/15 flex flex-col items-center justify-center overflow-hidden"
        aria-label={`${trailerName} instructional video — coming soon`}
      >
        <Icon
          name="ondemand_video"
          className="text-[8rem] text-on-surface-variant/20"
          aria-hidden="true"
        />
        <figcaption className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"
              aria-hidden="true"
            />
            <span className="font-headline uppercase tracking-[0.25em] text-[10px] text-on-surface-variant/70 font-bold">
              Video Coming Soon
            </span>
          </div>
          <span className="font-headline uppercase tracking-widest text-[10px] text-on-surface-variant/50 font-light hidden sm:block">
            Towing &middot; Set-Up &middot; Safety &middot; Rules
          </span>
        </figcaption>
      </figure>
    );
  }

  // ─── Live embed ─────────────────────────────────────────
  // Privacy-enhanced host (youtube-nocookie.com) — no tracking cookie
  // set unless the visitor actually plays the video.
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;

  return (
    <figure className="relative aspect-video bg-black border border-outline-variant/15 overflow-hidden">
      <iframe
        src={embedUrl}
        title={`${trailerName} — instructional video (towing, set-up, safety, rules)`}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 w-full h-full"
        {...(posterUrl ? { poster: posterUrl } : {})}
      />
    </figure>
  );
}
