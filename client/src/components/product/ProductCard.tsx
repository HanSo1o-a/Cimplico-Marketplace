import React, { useState } from "react";
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

interface ProductCardProps {
  product: Listing;
  hideActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, hideActions = false }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

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
        await apiRequest("DELETE", `/api/favorites/${product.id}`);
        toast({
          title: t("favorites.removed"),
          description: t("favorites.removedDescription"),
        });
      } else {
        // 添加到收藏
        await apiRequest("POST", "/api/favorites", { listingId: product.id });
        toast({
          title: t("favorites.added"),
          description: t("favorites.addedDescription"),
        });
      }
      setIsSaved(!isSaved);
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
    
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      type: product.type || "",
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      quantity: 1
    });
    
    toast({
      title: t("cart.added"),
      description: t("cart.addedDescription", { title: product.title }),
    });
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      <div className="aspect-video bg-muted/50 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            {getTypeIcon()}
          </div>
        )}
        
        {/* 标签 */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.price === 0 && (
            <Badge className="bg-green-500 hover:bg-green-600">
              {t("product.free")}
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary">
              {t("product.featured")}
            </Badge>
          )}
        </div>

        {/* 评分 */}
        {product.rating && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs py-1 px-2 rounded-md flex items-center">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-medium text-muted-foreground flex items-center">
            {getTypeIcon()}
            <span className="ml-1">{t(`categories.${product.type || "other"}`)}</span>
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Tag className="h-3 w-3 mr-1" />
              <span>{product.tags[0]}</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {product.description}
        </p>

        {product.vendor && (
          <div className="flex items-center mt-auto text-sm">
            <CheckCircle className="h-3 w-3 text-primary mr-1" />
            <span className="text-muted-foreground">{product.vendor.companyName}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
        <div className="font-semibold">
          {formatPrice(product.price)}
        </div>
        
        {!hideActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveClick();
              }}
              disabled={isLoading}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
              <span className="sr-only">{t("product.save")}</span>
            </Button>
            
            <Button
              variant={isInCart ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>{isInCart ? t("cart.viewCart") : t("cart.addToCart")}</span>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;