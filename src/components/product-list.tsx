
import type { Product } from "@/lib/types";
import ProductCard from "./product-card";

interface ProductListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductList({ products, onProductClick }: ProductListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,140px)] grid-auto-rows-[205px] gap-[18px] justify-center pb-20">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
      ))}
    </div>
  );
}
