import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.omorablooms.staff",
  appName: "OMORA BLOOMS Staff",
  webDir: "dist/client",
  server: {
    url: "https://omorablooms.in/admin/warehouse",
    cleartext: false,
    allowNavigation: ["omorablooms.in", "www.omorablooms.in"],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
