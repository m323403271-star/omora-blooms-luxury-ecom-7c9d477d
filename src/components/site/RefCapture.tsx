import { useEffect } from "react";
import { captureRefFromUrl } from "@/lib/referral";

export function RefCapture() {
  useEffect(() => {
    captureRefFromUrl();
  }, []);
  return null;
}
