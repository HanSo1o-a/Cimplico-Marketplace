import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Listing, ListingType } from "@shared/schema";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ShoppingCart,
  ExternalLink,
  Tag,
  CheckCircle,
  Star,
  FileText,
  CheckSquare,
  FileSpreadsheet,
  FileBarChart,
  FileCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getImageUrl } from "@/utils/getImageUrl";

interface ListingWithCategorySlug extends Listing {
  categorySlug?: string | null;
}

interface ProductCardProps {
  product: ListingWithCategorySlug;
  hideActions?: boolean;
  savedInitially?: boolean; // 添加初始收藏状态
  onSaveToggle?: (id: number, isSaved: boolean) => void; // 收藏状态变化回调
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  hideActions = false,
  savedInitially = false,
  onSaveToggle
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isSaved, setIsSaved] = useState(savedInitially);
  const [isLoading, setIsLoading] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  
  // 当外部savedInitially属性变化时，更新内部状态
  useEffect(() => {
    setIsSaved(savedInitially);
  }, [savedInitially]);

  // 检查产品是否已在购物车中
  const isInCart = cartItems.find((item) => item.id === product.id);

  // 获取产品类型图标
  const getTypeIcon = () => {
    switch (product.type) {
      case "calculation":
        return <FileBarChart className="h-5 w-5" />;
      case "checklist":
        return <CheckSquare className="h-5 w-5" />;
      case "procedure":
        return <FileCheck className="h-5 w-5" />;
      case "report":
        return <FileText className="h-5 w-5" />;
      case "otherSchedules":
        return <FileSpreadsheet className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // 处理收藏点击
  const handleSaveClick = async () => {
    if (!user) {
      toast({
        title: t("common.authRequired"),
        description: t("favorites.loginToSave"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      if (isSaved) {
        // 从收藏中移除
        await apiRequest("DELETE", `/api/users/current/favorites/${product.id}`);
        toast({
          title: t("favorites.removed"),
          description: t("favorites.removedDescription"),
        });
      } else {
        // 添加到收藏
        await apiRequest("POST", "/api/users/current/favorites", { listingId: product.id });
        toast({
          title: t("favorites.added"),
          description: t("favorites.addedDescription"),
        });
      }
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      // 调用父组件提供的回调函数
      if (onSaveToggle) {
        onSaveToggle(product.id, newSavedState);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("favorites.error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 点击产品时的导航
  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    if (price === 0) {
      return t("product.free");
    }
    return `¥${price.toFixed(2)}`;
  };

  // 添加到购物车
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart) {
      navigate("/cart");
      return;
    }
    
    // 添加到购物车，保持CartItem格式
    addToCart({
      quantity: 1,
      listing: {
        id: product.id,
        title: product.title,
        price: product.price,
        type: product.type || "",
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        description: product.description
      }
    });
    
    toast({
      title: t("cart.added"),
      description: t("cart.addedDescription", { title: product.title }),
    });
  };

  return (
    <Card 
      className="overflow-hidden card-hover h-full flex flex-col relative group border border-transparent hover:border-primary/30 bg-white rounded-xl"
      onClick={handleCardClick}
    >
      <div className="aspect-video bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={getImageUrl(product.images[0])}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-product.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
            {getTypeIcon()}
          </div>
        )}
        
        {/* 图片蒙层效果 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* 标签 */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.price === 0 && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-sm text-white border-0">
              {t("product.free")}
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="shadow-sm bg-gradient-to-r from-primary/70 to-primary border-0 text-white">
              {t("product.featured")}
            </Badge>
          )}
        </div>

        {/* 评分 */}
        {product.rating && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs py-1.5 px-2.5 rounded-full flex items-center shadow-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
          </div>
        )}
        
        {/* 分类 slug 展示（仅调试/可美化） */}
        {product.categorySlug && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs py-1.5 px-2.5 rounded-full flex items-center shadow-sm">
            <span className="font-mono">slug: {product.categorySlug}</span>
          </div>
        )}
        
        {/* 快速操作按钮 - 悬浮时显示 */}
        {!hideActions && (
          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveClick();
              }}
              disabled={isLoading}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2.5">
          <div className="text-sm font-medium text-primary/80 flex items-center bg-primary/5 px-2 py-1 rounded-full">
            {getTypeIcon()}
            <span className="ml-1.5">{t(`categories.${product.type || "other"}`)}</span>
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              <Tag className="h-3 w-3 mr-1" />
              <span>{product.tags[0]}</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2.5 line-clamp-2 group-hover:text-primary transition-colors duration-300">{product.title}</h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {product.description}
        </p>

        {product.vendor && (
          <div className="flex items-center mt-auto text-sm">
            <CheckCircle className="h-3.5 w-3.5 text-primary mr-1.5" />
            <span className="text-muted-foreground">{product.vendor.companyName}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto border-t border-muted/40">
        <div className="w-full flex justify-between items-center">
          <div className="font-bold text-xl bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent shadow-text">
            {formatPrice(product.price)}
          </div>
          
          {!hideActions && (
            <Button
              variant={isInCart ? "primary" : "outline"}
              size="sm"
              className={`flex-shrink-0 rounded-full px-4 ${
                isInCart 
                  ? 'btn-highlight shadow-md' 
                  : 'border-primary/30 hover:border-primary text-primary hover:bg-primary/10 hover:shadow-md'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e);
              }}
            >
              <ShoppingCart className={`${isInCart ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
              <span>{isInCart ? t("cart.viewCart") : t("cart.addToCart")}</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;