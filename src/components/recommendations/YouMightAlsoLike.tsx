import { RecommendationSection } from "./RecommendationSection";
import type { RecommendationLayout, RecommendationTone, RecommendedProduct } from "./types";

interface YouMightAlsoLikeProps {
  products: RecommendedProduct[];
  layout?: RecommendationLayout | undefined;
  tone?: RecommendationTone | undefined;
  isLoading?: boolean | undefined;
  viewAllHref?: string | undefined;
  onSelect?: ((product: RecommendedProduct) => void) | undefined;
  className?: string | undefined;
}

export function YouMightAlsoLike({ products, layout = "grid", ...rest }: YouMightAlsoLikeProps) {
  return (
    <RecommendationSection
      title="You Might Also Like"
      subtitle="Handpicked pieces that pair well with this one"
      products={products}
      layout={layout}
      {...rest}
    />
  );
}
