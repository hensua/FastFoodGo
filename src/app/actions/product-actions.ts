
import type { Product } from "@/lib/types";

export function getSimilarItems(
  currentProduct: Product | undefined,
  allProducts: Product[]
): Product[] {
  if (!currentProduct || !allProducts || allProducts.length === 0) {
    return [];
  }

  const currentCategory = currentProduct.category;
  let complementaryCategories: string[] = [];

  // Define complementary categories based on the current product
  if (currentCategory === 'Bebidas') {
    complementaryCategories = ['Acompañamientos', 'Hamburguesas', 'Pizzas', 'Otros'];
  } else if (currentCategory === 'Acompañamientos') {
    complementaryCategories = ['Hamburguesas', 'Pizzas', 'Bebidas', 'Otros'];
  } else { // For Hamburguesas, Pizzas, Otros
    complementaryCategories = ['Acompañamientos', 'Bebidas'];
  }

  const suggestions: Product[] = [];
  const usedIds = new Set<string>([currentProduct.id]);

  // Create a list of potential products to suggest from, excluding the current one
  const potentialProducts = allProducts.filter(p => p.id !== currentProduct.id);

  // 1. Prioritize one item from each complementary category
  complementaryCategories.forEach(category => {
    if (suggestions.length < 3) {
      // Find the first product in the potential list that matches the category and hasn't been used
      const product = potentialProducts.find(p => p.category === category && !usedIds.has(p.id));
      if (product) {
        suggestions.push(product);
        usedIds.add(product.id);
      }
    }
  });

  // 2. If still not enough suggestions, fill with any other products not already used
  if (suggestions.length < 3) {
    const remainingProducts = potentialProducts.filter(p => !usedIds.has(p.id));
    
    for (const product of remainingProducts) {
      if (suggestions.length < 3) {
        suggestions.push(product);
        usedIds.add(product.id);
      } else {
        break; // Stop once we have 3 suggestions
      }
    }
  }
  
  // 3. Ensure we only return up to 3 items.
  return suggestions.slice(0, 3);
}
