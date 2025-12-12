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
    name: 'Hamburguesa Clásica',
    description: 'Una jugosa hamburguesa de res con lechuga, tomate y nuestra salsa especial.',
    price: 18900,
    ...getImage('classic-burger'),
  },
  {
    id: '2',
    name: 'Papas Fritas Crujientes',
    description: 'Doradas, crujientes y perfectamente saladas. El mejor acompañamiento.',
    price: 8900,
    ...getImage('crispy-fries'),
  },
  {
    id: '3',
    name: 'Porción de Pizza de Queso',
    description: 'Una porción caliente de nuestra clásica pizza de queso con una rica base de tomate.',
    price: 9900,
    ...getImage('cheese-pizza'),
  },
  {
    id: '4',
    name: 'Nuggets de Pollo',
    description: '6 piezas de tiernos y jugosos nuggets de pollo. Perfectos para dipear.',
    price: 12900,
    ...getImage('chicken-nuggets'),
  },
  {
    id: '5',
    name: 'Gaseosa Helada',
    description: 'Elige entre nuestra selección de refrescantes gaseosas.',
    price: 4500,
    ...getImage('ice-cold-soda'),
  },
  {
    id: '6',
    name: 'Malteada de Chocolate',
    description: 'Una malteada rica y cremosa para satisfacer tu antojo de dulce.',
    price: 11900,
    ...getImage('chocolate-milkshake'),
  },
  {
    id: '7',
    name: 'Perro Caliente Clásico',
    description: 'Un delicioso perro caliente de res servido en un pan suave y tibio.',
    price: 14900,
    ...getImage('classic-hotdog'),
  },
  {
    id: '8',
    name: 'Aros de Cebolla',
    description: 'Crujientes aros de cebolla rebozados, fritos a la perfección.',
    price: 10900,
    ...getImage('onion-rings'),
  },
];
