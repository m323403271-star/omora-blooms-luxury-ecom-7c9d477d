import { RecommendationSection } from "./RecommendationSection";
import type { RecommendationLayout, RecommendedProduct } from "./types";

interface PeopleAlsoViewedProps {
  products: RecommendedProduct[];
  layout?: RecommendationLayout | undefined;
  isLoading?: boolean | undefined;
  viewAllHref?: string | undefined;
  onSelect?: ((product: RecommendedProduct) => void) | undefined;
  className?: string | undefined;
}

export function PeopleAlsoViewed({
  products,
  layout = "carousel",
  ...rest
}: PeopleAlsoViewedProps) {
  return (
    <RecommendationSection
      title="People Also Viewed"
      subtitle="Popular with shoppers browsing this product"
      products={products}
      layout={layout}
      {...rest}
    />
  );
}
