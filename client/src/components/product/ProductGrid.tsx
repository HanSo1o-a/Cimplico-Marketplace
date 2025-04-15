import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";
import { Listing } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  products: Listing[];
  isLoading?: boolean;
  emptyMessage?: string;
  columns?: number;
  horizontal?: boolean;
}

const ProductGrid = ({
  products,
  isLoading = false,
  emptyMessage,
  columns = 4,
  horizontal = false
}: ProductGridProps) => {
  const { t } = useTranslation();
  const defaultEmptyMessage = t("common.empty");

  // Determine grid columns class based on props
  const getGridClass = () => {
    if (horizontal) return "grid grid-cols-1 gap-6";
    
    switch(columns) {
      case 1: return "grid grid-cols-1 gap-6";
      case 2: return "grid grid-cols-1 md:grid-cols-2 gap-6";
      case 3: return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      case 4: 
      default: return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
    }
  };

  if (isLoading) {
    return (
      <div className={getGridClass()}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4">
              <Skeleton className="w-1/4 h-4 mb-2" />
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-full h-4 mb-3" />
              <div className="flex justify-between items-center">
                <Skeleton className="w-1/3 h-5" />
                <Skeleton className="w-1/5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg">{emptyMessage || defaultEmptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={getGridClass()}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          listing={product}
          vendor={product.vendor}
          isSaved={product.isSaved}
          horizontal={horizontal}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
