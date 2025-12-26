
import type { Product } from "@/lib/types";

export function getSimilarItems(
  currentProduct: Product | undefined,
  allProducts: Product[]
): Product[] {
  if (!currentProduct) {
    return [];
  }

  const currentCategory = currentProduct.category;
  let suggestionCategories: string[] = [];

  // Define complementary categories
  if (currentCategory === 'Bebidas') {
    suggestionCategories = ['Acompañamientos', 'Hamburguesas', 'Pizzas'];
  } else if (currentCategory === 'Acompañamientos') {
    suggestionCategories = ['Hamburguesas', 'Pizzas', 'Bebidas'];
  } else { // Hamburguesas, Pizzas, Otros
    suggestionCategories = ['Acompañamientos', 'Bebidas'];
  }

  const suggestions: Product[] = [];
  
  // Get one product from each suggestion category
  suggestionCategories.forEach(cat => {
    const productFromCategory = allProducts.find(p => p.category === cat && p.id !== currentProduct.id && !suggestions.some(s => s.id === p.id));
    if (productFromCategory) {
      suggestions.push(productFromCategory);
    }
  });

  // If not enough suggestions, fill with other products not from the current category
  if (suggestions.length < 3) {
    const otherProducts = allProducts.filter(p => 
      p.category !== currentCategory && 
      p.id !== currentProduct.id && 
      !suggestions.some(s => s.id === p.id)
    );
    
    let i = 0;
    while(suggestions.length < 3 && i < otherProducts.length) {
        suggestions.push(otherProducts[i]);
        i++;
    }
  }
  
  return suggestions.slice(0, 3);
}
