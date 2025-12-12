'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant menu items to customers based on their current cart and order history.
 *
 * - suggestRelevantMenuItems - A function that suggests relevant menu items.
 * - SuggestRelevantMenuItemsInput - The input type for the suggestRelevantMenuItems function.
 * - SuggestRelevantMenuItemsOutput - The output type for the suggestRelevantMenuItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantMenuItemsInputSchema = z.object({
  cartItems: z
    .array(z.string())
    .describe('The list of item names currently in the customer\'s cart.'),
  orderHistory: z
    .array(z.string())
    .describe('The list of previously ordered item names by the customer.'),
});
export type SuggestRelevantMenuItemsInput = z.infer<
  typeof SuggestRelevantMenuItemsInputSchema
>;

const SuggestRelevantMenuItemsOutputSchema = z.object({
  suggestedItems: z
    .array(z.string())
    .describe('A list of suggested menu item names that are relevant to the cart and order history.'),
});
export type SuggestRelevantMenuItemsOutput = z.infer<
  typeof SuggestRelevantMenuItemsOutputSchema
>;

export async function suggestRelevantMenuItems(
  input: SuggestRelevantMenuItemsInput
): Promise<SuggestRelevantMenuItemsOutput> {
  return suggestRelevantMenuItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelevantMenuItemsPrompt',
  input: {schema: SuggestRelevantMenuItemsInputSchema},
  output: {schema: SuggestRelevantMenuItemsOutputSchema},
  prompt: `You are a restaurant menu recommendation expert.

  Based on the items currently in the customer's cart and their past order history, suggest additional menu items that they might enjoy.
  Consider ingredient compatibility and common combinations. Optimize for a fast food restaurant.
  Weigh the prices of the suggested items such that the overall order value is maximized, within reason.

  Current Cart: {{#if cartItems}}{{{cartItems}}}{{else}}No items in cart{{/if}}
  Order History: {{#if orderHistory}}{{{orderHistory}}}{{else}}No order history{{/if}}

  Suggest items that complement the current cart and order history.
  Do not suggest items already in the cart.
`,
});

const suggestRelevantMenuItemsFlow = ai.defineFlow(
  {
    name: 'suggestRelevantMenuItemsFlow',
    inputSchema: SuggestRelevantMenuItemsInputSchema,
    outputSchema: SuggestRelevantMenuItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
