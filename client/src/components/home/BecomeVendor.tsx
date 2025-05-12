import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, CheckCircle, Users } from "lucide-react";

const BecomeVendor: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  return (
    <section className="py-20 bg-primary-50">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3">
            <h2 className="text-3xl font-bold mb-6">
              {t("home.becomeVendor.title")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              {t("home.becomeVendor.description")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background rounded-lg p-6">
                <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("home.becomeVendor.benefit1.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("home.becomeVendor.benefit1.description")}
                </p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("home.becomeVendor.benefit2.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("home.becomeVendor.benefit2.description")}
                </p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <div className="bg-primary/10 rounded-full p-3 inline-block mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("home.becomeVendor.benefit3.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("home.becomeVendor.benefit3.description")}
                </p>
              </div>
            </div>

            <Button 
              className="group"
              size="lg"
              onClick={() => navigate("/vendor-dashboard")}
            >
              {t("home.becomeVendor.cta")}
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="lg:col-span-2 hidden lg:block">
            <div className="relative">
              <div className="bg-background rounded-lg shadow-lg p-8 relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold text-primary">C</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Cimplico 供应商</h3>
                    <p className="text-sm text-muted-foreground">已验证账户</p>
                  </div>
                  <CheckCircle className="ml-auto text-primary h-5 w-5" />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">本月销售额</span>
                      <span className="text-sm font-semibold">$12,850</span>
                    </div>
                    <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "70%" }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">内容总数</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <div>
                      <p className="font-medium">总客户</p>
                      <p className="text-2xl font-bold">128</p>
                    </div>
                    <div>
                      <p className="font-medium">满意度</p>
                      <p className="text-2xl font-bold">4.9/5</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  {t("home.becomeVendor.dashboard")}
                </Button>
              </div>

              <div className="absolute top-6 -right-6 w-full h-full bg-primary/5 rounded-lg -z-0"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BecomeVendor;