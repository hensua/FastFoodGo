
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

export const products: Omit<Product, 'id'>[] = [
  {
    name: 'Hamburguesa Clásica',
    description: 'Una jugosa hamburguesa de res con lechuga, tomate y nuestra salsa especial.',
    price: 18900,
    category: 'Hamburguesas',
    stock: 100,
    ...getImage('classic-burger'),
  },
  {
    name: 'Papas Fritas Crujientes',
    description: 'Doradas, crujientes y perfectamente saladas. El mejor acompañamiento.',
    price: 8900,
    category: 'Acompañamientos',
    stock: 200,
    ...getImage('crispy-fries'),
  },
  {
    name: 'Porción de Pizza de Queso',
    description: 'Una porción caliente de nuestra clásica pizza de queso con una rica base de tomate.',
    price: 9900,
    category: 'Pizzas',
    stock: 50,
    ...getImage('cheese-pizza'),
  },
  {
    name: 'Nuggets de Pollo',
    description: '6 piezas de tiernos y jugosos nuggets de pollo. Perfectos para dipear.',
    price: 12900,
    category: 'Acompañamientos',
    stock: 150,
    ...getImage('chicken-nuggets'),
  },
  {
    name: 'Gaseosa Helada',
    description: 'Elige entre nuestra selección de refrescantes gaseosas.',
    price: 4500,
    category: 'Bebidas',
    stock: 300,
    tag: '350ml',
    ...getImage('ice-cold-soda'),
  },
  {
    name: 'Malteada de Chocolate',
    description: 'Una malteada rica y cremosa para satisfacer tu antojo de dulce.',
    price: 11900,
    category: 'Bebidas',
    stock: 80,
    ...getImage('chocolate-milkshake'),
  },
  {
    name: 'Perro Caliente Clásico',
    description: 'Un delicioso perro caliente de res servido en un pan suave y tibio.',
    price: 14900,
    category: 'Otros',
    stock: 90,
    ...getImage('classic-hotdog'),
  },
  {
    name: 'Aros de Cebolla',
    description: 'Crujientes aros de cebolla rebozados, fritos a la perfección.',
    price: 10900,
    category: 'Acompañamientos',
    stock: 120,
    ...getImage('onion-rings'),
  },
];
