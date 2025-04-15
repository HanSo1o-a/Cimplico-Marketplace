import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ProductGrid from "@/components/product/ProductGrid";
import { Listing } from "@shared/schema";

const FeaturedProducts = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  // Fetching featured products
  const { data: products, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings/featured"],
  });

  // Filter products based on selected tab
  const filteredProducts = products ? products.filter(product => {
    if (filter === "all") return true;
    if (filter === "free") return product.price === 0;
    if (filter === "paid") return product.price > 0;
    return true;
  }) : [];

  return (
    <section className="py-12 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h2 className="font-heading text-2xl font-bold flex items-center">
            <Flame className="text-primary-500 mr-2 h-6 w-6" />
            {t("home.featured.title")}
          </h2>
          <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as "all" | "free" | "paid")}>
            <TabsList className="bg-white">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                {t("home.featured.all")}
              </TabsTrigger>
              <TabsTrigger value="free" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                {t("home.featured.free")}
              </TabsTrigger>
              <TabsTrigger value="paid" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                {t("home.featured.paid")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <ProductGrid 
          products={filteredProducts} 
          isLoading={isLoading} 
          emptyMessage={t("common.empty")}
        />
        
        <div className="mt-8 text-center">
          <Link href="/marketplace">
            <Button 
              variant="outline" 
              className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
            >
              {t("home.featured.viewMore")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
