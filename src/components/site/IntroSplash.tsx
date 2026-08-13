import { useEffect, useRef, useState } from "react";
import { LOGO_SRC } from "@/lib/logo";
import { INTRO_VIDEO_SRC, INTRO_POSTER_SRC, INTRO_VIDEO_ASPECT } from "@/lib/intro-media";

const SESSION_KEY = "omora-intro-shown";

/**
 * Luxury intro splash — animated OM logo reveal on matte black, shown once per
 * browser session. Renders only after hydration so SSR markup stays stable.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = true;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(true);
    document.body.style.overflow = "hidden";

    const holdMs = INTRO_VIDEO_SRC ? 6500 : 1600;
    const fadeAt = window.setTimeout(() => setFading(true), holdMs);
    const hideAt = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, holdMs + 700);

    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(hideAt);
      document.body.style.overflow = "";
    };
  }, []);

  // Force muted inline autoplay — mobile browsers block sound-on autoplay.
  useEffect(() => {
    const video = videoRef.current;
    if (!visible || !video) return;
    video.muted = true;
    video.defaultMuted = true;
    const play = () => {
      const attempt = video.play();
      if (attempt) attempt.catch(() => setVideoFailed(true));
    };

    play();
    const onVisible = () => {
      if (document.visibilityState === "visible") play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center bg-[color:var(--noir)] transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex w-full flex-col items-center gap-4 px-5 sm:gap-5 animate-[omora-intro-in_900ms_ease-out_both]">
        {INTRO_VIDEO_SRC ? (
          <video
            ref={videoRef}
            src={INTRO_VIDEO_SRC}
            {...(INTRO_POSTER_SRC ? { poster: INTRO_POSTER_SRC } : {})}
            autoPlay
            muted
            playsInline
            // iOS Safari legacy attribute
            // eslint-disable-next-line react/no-unknown-property
            webkit-playsinline="true"
            preload="auto"
            controls={false}
            disablePictureInPicture
            onEnded={() => setFading(true)}
            style={{ aspectRatio: String(INTRO_VIDEO_ASPECT) }}
            className="block h-auto max-h-[62svh] w-auto max-w-[86vw] rounded-2xl object-contain sm:max-h-[68svh] sm:max-w-[70vw] md:max-w-[46vw] lg:max-w-[34vw] xl:max-w-[26vw]"
          />
        ) : (
          <img
            src={LOGO_SRC}
            alt=""
            className="h-20 w-20 rounded-full object-cover border border-[color:var(--gold)]/60 shadow-[0_0_40px_-8px_var(--gold)] sm:h-24 sm:w-24"
          />
        )}
        <p className="eyebrow text-center text-[color:var(--gold)]">Crafted to last forever</p>
        <span className="block h-px w-20 bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent sm:w-24" />
      </div>

    </div>
  );
}
