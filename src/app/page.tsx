import { products } from '@/lib/data';
import OrderPage from './order-page';

export default function Home() {
  // In a real application, this data would be fetched from a database.
  const productData = products;

  return <OrderPage products={productData} />;
}
