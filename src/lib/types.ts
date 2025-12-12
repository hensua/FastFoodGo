export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  category: string;
  stock?: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
  note?: string;
};

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'delivered';

export type Order = {
  id: string;
  customerId: string;
  orderDate: any;
  totalAmount: number;
  paymentMethod: string;
  deliveryAddress: string;
  status: OrderStatus;
  items: CartItem[];
  customerName?: string;
};
