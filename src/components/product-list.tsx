
import type { Product } from "@/lib/types";
import ProductCard from "./product-card";

interface ProductListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductList({ products, onProductClick }: ProductListProps) {
  return (
    <div className="grid grid-cols-2 gap-3 pb-20">
      {products.map((product) => (
        <div key={product.id}>
            <ProductCard product={product} onClick={() => onProductClick(product)} />
        </div>
      ))}
    </div>
  );
}
