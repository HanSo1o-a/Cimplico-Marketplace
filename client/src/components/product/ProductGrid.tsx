import React from "react";
import { Listing } from "@shared/schema";
import ProductCard from "./ProductCard";
import { Loader2, Package2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProductGridProps {
  products: Listing[];
  isLoading?: boolean;
  emptyMessage?: string;
  columns?: 2 | 3 | 4;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  emptyMessage = "No products found",
  columns = 3
}) => {
  // 确定列布局 class
  const getColumnClass = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 3:
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-muted/30 rounded-full p-6 mb-4">
          <Package2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">暂无结果</h3>
        <p className="text-center text-muted-foreground max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // 定义动画变体
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className={`grid ${getColumnClass()} gap-6 md:gap-8`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {products.map((product, index) => (
        <motion.div key={product.id} variants={item} custom={index}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid;