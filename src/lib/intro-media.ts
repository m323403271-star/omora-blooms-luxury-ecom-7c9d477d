import introVideo from "@/assets/omora-intro.mp4.asset.json";

/**
 * Intro media — the animated OM / OMORA BLOOMS logo reveal.
 * Portrait (9:16) source; the splash scales it responsively.
 */
export const INTRO_VIDEO_SRC: string | null = introVideo.url;
export const INTRO_POSTER_SRC: string | null = null;
/** Intrinsic aspect ratio of the intro video (width / height). */
export const INTRO_VIDEO_ASPECT = 720 / 1280;
