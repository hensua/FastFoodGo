import type { Product } from "@/lib/types";
import ProductCard from "./product-card";

interface ProductListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductList({ products, onProductClick }: ProductListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
      ))}
    </div>
  );
}