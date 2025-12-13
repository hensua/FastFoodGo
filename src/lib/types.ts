
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

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  customerId: string;
  orderDate: any;
  totalAmount: number;
  deliveryFee: number;
  tip: number; // New field for tips
  paymentMethod: string;
  pin: string;

  // Denormalized customer data for driver access
  customerName?: string;
  deliveryAddress: string;
  customerPhoneNumber?: string;
  
  status: OrderStatus;
  items: CartItem[];

  // Cancellation reason
  cancellationReason?: string;

  // Driver info
  driverId?: string;
  driverName?: string;
};

export type Role = 'admin' | 'driver' | 'customer';

export type AppUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: any;
  role?: Role;
  phoneNumber?: string;
  deliveryAddress?: string;
};

export type ChatMessage = {
  text: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  timestamp: any;
};
