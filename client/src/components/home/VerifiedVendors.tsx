import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { VendorProfile } from "@shared/schema";
import { Loader2, CheckCircle, Users, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

const VerifiedVendors: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  // 获取已验证的供应商
  const { data: vendors, isLoading } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors", { verified: true, limit: 4 }],
  });

  const viewAllVendors = () => {
    navigate("/marketplace?vendors=true");
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("home.vendors.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("home.vendors.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(vendors || []).map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden">
              <div className="h-20 bg-primary/10 relative">
                <div className="absolute -bottom-8 left-4">
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border-2 border-primary">
                    {vendor.user?.avatar ? (
                      <img
                        src={vendor.user.avatar}
                        alt={vendor.companyName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {vendor.companyName.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <CheckCircle className="text-primary h-5 w-5" />
                </div>
              </div>
              <CardContent className="pt-10">
                <h3 className="font-bold text-lg mb-2">{vendor.companyName}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {vendor.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1 text-primary" />
                    <span>{vendor.listingsCount || 0} {t("home.vendors.products")}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-primary" />
                    <span>{vendor.customersCount || 0} {t("home.vendors.customers")}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-400" />
                    <span>{vendor.rating || 4.5}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/marketplace?vendor=${vendor.id}`)}
                >
                  {t("home.vendors.viewProducts")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button onClick={viewAllVendors} variant="outline">
            {t("home.vendors.viewAll")}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VerifiedVendors;