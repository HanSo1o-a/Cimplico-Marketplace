import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Heart, ShoppingCart } from "lucide-react";
import { Listing, VendorProfile, User, ListingStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCartStore } from "@/store/useCartStore";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  listing: Listing;
  vendor?: {
    id: number;
    companyName: string;
    verificationStatus: string;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      avatar: string | null;
    } | null;
  } | null;
  isSaved?: boolean;
  className?: string;
  horizontal?: boolean;
}

const ProductCard = ({
  listing,
  vendor,
  isSaved = false,
  className = "",
  horizontal = false
}: ProductCardProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const [saved, setSaved] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  // Handle adding to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(listing);
    toast({
      title: t("product.addedToCart"),
      description: listing.title,
    });
  };

  // Handle toggling saved status
  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = "/auth";
      return;
    }

    setIsLoading(true);

    try {
      if (saved) {
        // Remove from favorites
        await apiRequest("DELETE", `/api/users/favorites/${listing.id}`);
        setSaved(false);
        toast({
          title: t("product.removedFromFavorites"),
        });
      } else {
        // Add to favorites
        await apiRequest("POST", "/api/users/favorites", { listingId: listing.id });
        setSaved(true);
        toast({
          title: t("product.savedToFavorites"),
        });
      }
      
      // Invalidate the cache for user favorites
      queryClient.invalidateQueries(["/api/users/favorites"]);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if product is free
  const isFree = listing.price === 0;

  // Get badge variant for listing status
  const getBadgeVariant = () => {
    if (isFree) return "success";
    if (listing.status === ListingStatus.PENDING) return "outline";
    return "default";
  };

  // Get badge text based on listing status
  const getBadgeText = () => {
    if (isFree) return t("product.free");
    if (listing.status === ListingStatus.PENDING) return t("product.pending");
    return t("product.popular");
  };

  // Get the first image or a placeholder
  const getImage = () => {
    const images = listing.images as string[];
    return images && images.length > 0 
      ? images[0] 
      : "https://via.placeholder.com/400x225?text=No+Image";
  };

  // Format price display
  const formatPrice = () => {
    if (isFree) return t("product.free");
    return `¥${listing.price.toFixed(2)}`;
  };

  if (horizontal) {
    return (
      <Link href={`/products/${listing.id}`}>
        <a className={`bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow flex ${className}`}>
          <div className="w-1/3">
            <img 
              src={getImage()} 
              alt={listing.title} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-2/3 p-4">
            <Badge variant={getBadgeVariant()} className="mb-2">
              {getBadgeText()}
            </Badge>
            <h3 className="font-medium text-lg mb-1 hover:text-primary-600 transition-colors">
              {listing.title}
            </h3>
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {listing.description}
            </p>
            <div className="flex justify-between items-center">
              <div className="text-primary-700 font-bold">
                {formatPrice()}
              </div>
              <Button 
                variant="ghost"
                size="sm"
                className={`text-primary-600 hover:text-primary-800 ${saved ? 'text-red-500' : ''}`}
                onClick={handleToggleSave}
                disabled={isLoading}
              >
                <Heart className={`h-5 w-5 ${saved ? 'fill-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </a>
      </Link>
    );
  }

  return (
    <Link href={`/products/${listing.id}`}>
      <a className={`bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow group block ${className}`}>
        <div className="relative">
          <img 
            src={getImage()} 
            alt={listing.title} 
            className="w-full h-48 object-cover"
          />
          {(isFree || listing.status === ListingStatus.PENDING) && (
            <div className="absolute top-0 right-0 bg-accent-500 text-white text-xs font-bold px-2 py-1 m-2 rounded">
              {getBadgeText()}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-0 left-0 m-2 text-white bg-neutral-800 bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full transition-colors ${saved ? 'text-red-500' : ''}`}
            onClick={handleToggleSave}
            disabled={isLoading}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-red-500' : ''}`} />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-center mb-2">
            {vendor?.verificationStatus === "APPROVED" && (
              <Badge variant="secondary" className="bg-secondary-500 border-0 text-white mr-2">
                {t("vendor.approved")}
              </Badge>
            )}
            <span className="text-sm text-neutral-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {/* Adding a random download count for demonstration */}
              {Math.floor(Math.random() * 1000) + 100}
            </span>
          </div>
          <h3 className="font-medium text-lg mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
            {listing.description}
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="w-6 h-6 mr-1">
                <AvatarImage src={vendor?.user?.avatar || undefined} />
                <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                  {vendor?.user?.firstName?.[0]}{vendor?.user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-neutral-500 truncate max-w-[100px]">
                {vendor?.companyName || t("product.vendor")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-700 font-bold">{formatPrice()}</span>
              {!isFree && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 text-primary-600 hover:text-primary-800"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default ProductCard;
