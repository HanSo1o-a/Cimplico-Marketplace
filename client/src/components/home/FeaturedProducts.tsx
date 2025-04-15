import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import ProductGrid from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

const FeaturedProducts: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  // 获取精选产品
  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { featured: true, limit: 4 }],
  });

  const viewAllFeatured = () => {
    navigate("/marketplace?featured=true");
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/30 blur-3xl"></div>
        <div className="absolute bottom-10 right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl"></div>
      </div>
      
      <div className="container relative z-10">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="flex items-center mb-3">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">{t("home.sections.featured")}</span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t("home.featured.title")}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t("home.featured.description")}
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-6 md:mt-0 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary rounded-full px-6"
            onClick={viewAllFeatured}
          >
            {t("home.featured.viewAll")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <ProductGrid
          products={listings || []}
          isLoading={isLoading}
          emptyMessage={t("home.featured.empty")}
          columns={4}
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;