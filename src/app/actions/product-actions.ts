
import type { Product } from "@/lib/types";

export function getSimilarItems(
  currentProduct: Product | undefined,
  allProducts: Product[]
): Product[] {
  if (!currentProduct) {
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

  // Prioritize one item from each complementary category
  complementaryCategories.forEach(category => {
    if (suggestions.length < 3) {
      const product = allProducts.find(p => p.category === category && !usedIds.has(p.id));
      if (product) {
        suggestions.push(product);
        usedIds.add(product.id);
      }
    }
  });

  // If still not enough suggestions, fill with any other products not from the current category
  if (suggestions.length < 3) {
    const remainingProducts = allProducts.filter(p => !usedIds.has(p.id) && p.category !== currentCategory);
    
    for (const product of remainingProducts) {
      if (suggestions.length < 3) {
        suggestions.push(product);
        usedIds.add(product.id);
      } else {
        break; // Stop once we have 3 suggestions
      }
    }
  }
  
  return suggestions.slice(0, 3);
}


