"use server";

import { suggestRelevantMenuItems } from "@/ai/flows/suggest-relevant-menu-items";
import { products } from "@/lib/data";
import type { Product } from "@/lib/types";

export async function getSuggestedItems(
  cartItems: string[],
  orderHistory: string[]
): Promise<Product[]> {
  try {
    const result = await suggestRelevantMenuItems({
      cartItems,
      orderHistory,
    });
    
    const suggestedItems = result?.suggestedItems;
    if (!suggestedItems || suggestedItems.length === 0) {
      return [];
    }
    
    const lowerCaseSuggestions = suggestedItems.map(s => s.toLowerCase());

    // Filter products based on suggestions and ensure they are not already in the cart
    const suggestedProducts = products.filter(product => 
      lowerCaseSuggestions.includes(product.name.toLowerCase()) && !cartItems.includes(product.name)
    );

    return suggestedProducts;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    // Return empty array on error to prevent crashing the client
    return [];
  }
}
