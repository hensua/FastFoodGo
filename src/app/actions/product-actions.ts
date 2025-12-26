
import type { Product } from "@/lib/types";

export function getSimilarItems(
  currentProduct: Product | undefined,
  allProducts: Product[]
): Product[] {
  if (!currentProduct) {
    return [];
  }

  // Filter products that are in the same category, but not the current product itself
  const similar = allProducts.filter(
    (p) => p.category === currentProduct.category && p.id !== currentProduct.id
  );

  // Return up to 3 similar items without random shuffling to avoid re-render loops
  return similar.slice(0, 3);
}
