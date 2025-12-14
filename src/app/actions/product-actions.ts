
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

  // Simple shuffle to add some variety
  for (let i = similar.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [similar[i], similar[j]] = [similar[j], similar[i]];
  }

  // Return up to 3 similar items
  return similar.slice(0, 3);
}
