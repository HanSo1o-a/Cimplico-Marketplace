import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/useCartStore";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Listing, Comment as CommentType, CommentStatus } from "@shared/schema";
import ProductGrid from "@/components/product/ProductGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  Heart,
  ShoppingCart,
  Download,
  Clock,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Tag,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewDialogProps {
  listingId: number;
  onSuccess: () => void;
}

const ReviewDialog = ({ listingId, onSuccess }: ReviewDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = async () => {
    if (!content.trim()) {
      toast({
        title: t("product.reviewError"),
        description: t("product.reviewRequired"),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", `/api/listings/${listingId}/comments`, {
        content,
        rating
      });

      toast({
        title: t("product.reviewAdded"),
        description: t("product.reviewPending"),
      });

      setContent("");
      setRating(5);
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: t("product.reviewError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4">
          <Star className="mr-2 h-4 w-4" />
          {t("product.addReview")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("product.addReview")}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("product.yourRating")}
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("product.yourReview")}
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("product.reviewPlaceholder")}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("common.cancel")}</Button>
          </DialogClose>
          <Button onClick={submitReview} disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("common.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const addToCart = useCartStore((state) => state.addItem);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch product details
  const { data: product, isLoading, refetch } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
    onError: () => {
      navigate("/marketplace");
      toast({
        title: t("product.notFound"),
        description: t("product.notFoundDesc"),
        variant: "destructive"
      });
    }
  });

  // Fetch similar products
  const { data: similarProducts } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { category: product?.category, limit: 4 }],
    enabled: !!product,
  });

  // Add to cart
  const handleAddToCart = () => {
    if (product) {
      // 使用标准化的CartItem格式
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
        title: t("product.addedToCart"),
        description: product.title,
      });
    }
  };

  // Save/unsave product
  const toggleSave = async () => {
    if (!product) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsSaving(true);

    try {
      if (product.isSaved) {
        await apiRequest("DELETE", `/api/users/favorites/${product.id}`);
        toast({
          title: t("product.removedFromFavorites"),
        });
      } else {
        await apiRequest("POST", "/api/users/favorites", { listingId: product.id });
        toast({
          title: t("product.savedToFavorites"),
        });
      }
      
      // Refresh product data to update isSaved status
      refetch();
      
      // Invalidate favorites cache
      queryClient.invalidateQueries(["/api/users/favorites"]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Change active image
  const changeImage = (index: number) => {
    setActiveImageIndex(index);
  };

  // Next/previous image
  const nextImage = () => {
    if (!product) return;
    const images = product.images as string[];
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!product) return;
    const images = product.images as string[];
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading || !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <div className="bg-gray-300 rounded-lg h-96 w-full mb-4"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-300 rounded-lg h-20 w-20"></div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="h-10 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6 mb-6"></div>
              <div className="h-10 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-12 bg-gray-300 rounded w-1/2"></div>
                <div className="h-12 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFree = product && product.price === 0;
  const images = product.images as string[];
  const activeImage = images && images.length > 0 ? images[activeImageIndex] : null;
  const tags = product.tags as string[];
  const comments = product.comments || [];
  const approvedComments = comments.filter(comment => comment.status === CommentStatus.APPROVED);

  // Calculate average rating
  const averageRating = approvedComments.length 
    ? approvedComments.reduce((sum, comment) => sum + comment.rating, 0) / approvedComments.length 
    : 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <a href="/" className="hover:text-primary-600">{t("nav.home")}</a>
        <span className="mx-2">/</span>
        <a href="/marketplace" className="hover:text-primary-600">{t("nav.marketplace")}</a>
        <span className="mx-2">/</span>
        <a href={`/marketplace?category=${product.category}`} className="hover:text-primary-600">
          {product.category}
        </a>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.title}</span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Images */}
        <div className="lg:w-1/2">
          <div className="relative bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
            {activeImage ? (
              <img 
                src={activeImage} 
                alt={product.title} 
                className="w-full h-96 object-contain p-4"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400">
                <Info className="h-12 w-12" />
              </div>
            )}
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => changeImage(index)}
                  className={`${
                    index === activeImageIndex 
                      ? "border-primary-500" 
                      : "border-gray-200"
                  } border-2 rounded-md overflow-hidden h-20 w-20 flex-shrink-0`}
                >
                  <img 
                    src={image} 
                    alt={`${product.title} - ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="lg:w-1/2">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {isFree && (
                <Badge variant="success">{t("product.free")}</Badge>
              )}
              {product.vendor?.verificationStatus === "APPROVED" && (
                <Badge variant="secondary" className="bg-secondary-500 border-0 text-white">
                  <Check className="mr-1 h-3 w-3" /> {t("vendor.approved")}
                </Badge>
              )}
              {product.status === "PENDING" && (
                <Badge variant="outline">
                  <Clock className="mr-1 h-3 w-3" /> {t("product.pending")}
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating) 
                          ? "text-yellow-400 fill-yellow-400" 
                          : i < averageRating 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {averageRating.toFixed(1)} {t("product.outOf5")}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {approvedComments.length} {t("product.reviews")}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-primary-700 mb-4">
              {isFree ? t("product.free") : `¥${product.price.toFixed(2)}`}
            </div>
            
            <div className="prose prose-sm max-w-none mb-6">
              <p>{product.description}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">{t("product.vendor")}</h3>
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={product.vendor?.user?.avatar || undefined} />
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {product.vendor?.companyName?.[0] || "V"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{product.vendor?.companyName}</div>
                  <div className="text-sm text-gray-500">
                    {product.vendor?.verificationStatus === "APPROVED" 
                      ? t("vendor.approved") 
                      : t("vendor.pending")}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6 flex flex-wrap gap-2">
              {tags && tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="bg-gray-100">
                  <Tag className="mr-1 h-3 w-3" /> {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">
              {!isFree && (
                <Button 
                  size="lg"
                  variant="primary" 
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {t("common.addToCart")}
                </Button>
              )}
              
              {isFree && product.downloadUrl && (
                <Button 
                  size="lg"
                  variant="success" 
                  onClick={() => window.open(product.downloadUrl, '_blank')}
                >
                  <Download className="h-5 w-5" />
                  {t("common.download")}
                </Button>
              )}
              
              <Button 
                size="lg" 
                variant="outline" 
                className={product.isSaved ? 'text-red-500 hover:bg-red-50' : ''}
                onClick={toggleSave}
                disabled={isSaving}
              >
                <Heart className={`h-5 w-5 ${product.isSaved ? 'fill-red-500' : ''}`} />
                {product.isSaved ? t("product.saved") : t("product.save")}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-500 flex gap-4">
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {new Date(product.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <Tag className="mr-1 h-4 w-4" />
                {product.category}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Details Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="w-full border-b justify-start">
            <TabsTrigger value="description">{t("product.description")}</TabsTrigger>
            <TabsTrigger value="reviews">{t("product.reviews")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="py-6">
            <div className="prose max-w-none">
              <p>{product.description}</p>
              
              {/* Additional details would go here in a real implementation */}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="py-6">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-bold">{t("product.reviews")}</h3>
                <span className="ml-2 text-sm text-gray-500">
                  ({approvedComments.length})
                </span>
              </div>
              
              {user ? (
                <ReviewDialog listingId={product.id} onSuccess={refetch} />
              ) : (
                <Alert>
                  <AlertDescription>
                    {t("product.loginToReview")}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => navigate("/auth")}
                    >
                      {t("auth.login")}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {approvedComments.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {t("product.noReviews")}
              </div>
            ) : (
              <div className="space-y-6">
                {approvedComments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={comment.user?.avatar || undefined} />
                            <AvatarFallback className="bg-primary-100 text-primary-700">
                              {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {comment.user?.firstName} {comment.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < comment.rating 
                                  ? "text-yellow-400 fill-yellow-400" 
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-gray-700">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Similar Products */}
      {similarProducts && similarProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">{t("product.similarProducts")}</h2>
          <ProductGrid 
            products={similarProducts.filter(p => p.id !== product.id).slice(0, 4)} 
            columns={4}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
