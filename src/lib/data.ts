import type { Product } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) {
    return {
      imageUrl: 'https://placehold.co/600x400',
      imageHint: 'placeholder',
    };
  }
  return { imageUrl: image.imageUrl, imageHint: image.imageHint };
};

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'A juicy beef burger with lettuce, tomato, and our special sauce.',
    price: 8.99,
    ...getImage('classic-burger'),
  },
  {
    id: '2',
    name: 'Crispy Fries',
    description: 'Golden, crispy, and perfectly salted. The best side for any meal.',
    price: 3.49,
    ...getImage('crispy-fries'),
  },
  {
    id: '3',
    name: 'Cheese Pizza Slice',
    description: 'A hot slice of our classic cheese pizza with a rich tomato base.',
    price: 4.99,
    ...getImage('cheese-pizza'),
  },
  {
    id: '4',
    name: 'Chicken Nuggets',
    description: '6 pieces of tender, juicy chicken nuggets. Perfect for dipping.',
    price: 5.99,
    ...getImage('chicken-nuggets'),
  },
  {
    id: '5',
    name: 'Ice Cold Soda',
    description: 'Choose from our selection of refreshing soft drinks.',
    price: 1.99,
    ...getImage('ice-cold-soda'),
  },
  {
    id: '6',
    name: 'Chocolate Milkshake',
    description: 'A rich and creamy milkshake to satisfy your sweet tooth.',
    price: 4.49,
    ...getImage('chocolate-milkshake'),
  },
  {
    id: '7',
    name: 'Classic Hotdog',
    description: 'A delicious all-beef hotdog served in a warm, soft bun.',
    price: 6.49,
    ...getImage('classic-hotdog'),
  },
    {
    id: '8',
    name: 'Onion Rings',
    description: 'Crispy battered onion rings, fried to golden perfection.',
    price: 4.99,
    ...getImage('onion-rings'),
  },
];
