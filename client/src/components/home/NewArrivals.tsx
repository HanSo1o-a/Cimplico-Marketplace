import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import ProductGrid from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

const NewArrivals: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  // 获取最新上架的产品（移除本地测试数据，强制用API返回）
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["/api/listings", { newest: true, limit: 8 }],
    queryFn: getQueryFn(),
    staleTime: 1000 * 60 * 5,
  });

  const viewAllNewArrivals = () => {
    navigate("/marketplace?newArrivals=true");
  };

  return (
    <section className="py-16 bg-neutral-50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">{t("home.newArrivals.title")}</h2>
            <p className="text-muted-foreground">
              {t("home.newArrivals.description")}
            </p>
          </div>
          <Button
            variant="ghost"
            className="mt-4 md:mt-0"
            onClick={viewAllNewArrivals}
          >
            {t("home.newArrivals.viewAll")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <ProductGrid
          products={listings}
          isLoading={isLoading}
          emptyMessage={t("home.newArrivals.empty")}
          columns={4}
        />
      </div>
    </section>
  );
};

export default NewArrivals;