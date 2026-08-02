export const SITE_URL = "https://omorablooms.in";

type PageSeo = {
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "product";
};

/** Builds self-referencing canonical + Open Graph/Twitter tags for a leaf route. */
export function pageSeo({ path, title, description, image, type = "website" }: PageSeo) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: type },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(image
        ? [
            { property: "og:image", content: image },
            { name: "twitter:image", content: image },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
