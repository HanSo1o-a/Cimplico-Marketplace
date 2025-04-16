import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckboxGroup, CheckboxItem, Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { X, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const HomePage = () => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t("footer.subscribeSuccess"));
    setEmail("");
  };

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  // 从API获取商品数据
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/listings'],
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section - Above the Fold */}
      <section className="bg-white py-12 md:py-20 border-b border-gray-200">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="flex-1 pr-0 md:pr-8 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t("home.hero.title")}
            </h1>
            <p className="text-lg mb-6 text-gray-600 max-w-lg">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setLocation("/marketplace")}
              >
                {t("home.hero.browseButton")}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/auth")}
              >
                {t("home.hero.getStartedButton")}
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <img src="/placeholder-chart.svg" alt="Analytics" className="w-full rounded-lg shadow-md" />
              <img src="/placeholder-document.svg" alt="Document" className="w-full rounded-lg shadow-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section - Products with Filters */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="w-full md:w-64 shrink-0">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-lg">{t("filters.title")}</h3>
                  {activeFilters.length > 0 && (
                    <button 
                      className="text-sm text-primary hover:underline"
                      onClick={() => setActiveFilters([])}
                    >
                      {t("filters.clearAll")}
                    </button>
                  )}
                </div>
                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeFilters.map(filter => (
                      <Badge key={filter} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        {filter}
                        <button onClick={() => removeFilter(filter)} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Categories Filter */}
                <div>
                  <h4 className="font-medium mb-2 uppercase text-sm text-gray-700">{t("filters.categories")}</h4>
                  <CheckboxGroup className="space-y-2">
                    <CheckboxItem 
                      id="calculations" 
                      label={t("categories.calculations")}
                      checked={activeFilters.includes(t("categories.calculations"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("categories.calculations"))
                          ? removeFilter(t("categories.calculations"))
                          : addFilter(t("categories.calculations"));
                      }}
                    />
                    <CheckboxItem 
                      id="reports" 
                      label={t("categories.reports")}
                      checked={activeFilters.includes(t("categories.reports"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("categories.reports"))
                          ? removeFilter(t("categories.reports"))
                          : addFilter(t("categories.reports"));
                      }}
                    />
                    <CheckboxItem 
                      id="worksheets" 
                      label={t("categories.worksheets")}
                      checked={activeFilters.includes(t("categories.worksheets"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("categories.worksheets"))
                          ? removeFilter(t("categories.worksheets"))
                          : addFilter(t("categories.worksheets"));
                      }}
                    />
                    <CheckboxItem 
                      id="procedures" 
                      label={t("categories.procedures")}
                      checked={activeFilters.includes(t("categories.procedures"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("categories.procedures"))
                          ? removeFilter(t("categories.procedures"))
                          : addFilter(t("categories.procedures"));
                      }}
                    />
                  </CheckboxGroup>
                </div>

                {/* Tags Filter */}
                <div>
                  <h4 className="font-medium mb-2 uppercase text-sm text-gray-700">{t("filters.tags")}</h4>
                  <CheckboxGroup className="space-y-2">
                    <CheckboxItem 
                      id="tax-planning" 
                      label={t("tags.taxPlanning")}
                      checked={activeFilters.includes(t("tags.taxPlanning"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("tags.taxPlanning"))
                          ? removeFilter(t("tags.taxPlanning"))
                          : addFilter(t("tags.taxPlanning"));
                      }}
                    />
                    <CheckboxItem 
                      id="reconciliation" 
                      label={t("tags.reconciliation")}
                      checked={activeFilters.includes(t("tags.reconciliation"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("tags.reconciliation"))
                          ? removeFilter(t("tags.reconciliation"))
                          : addFilter(t("tags.reconciliation"));
                      }}
                    />
                    <CheckboxItem 
                      id="audits" 
                      label={t("tags.audits")}
                      checked={activeFilters.includes(t("tags.audits"))}
                      onCheckedChange={() => {
                        activeFilters.includes(t("tags.audits"))
                          ? removeFilter(t("tags.audits"))
                          : addFilter(t("tags.audits"));
                      }}
                    />
                  </CheckboxGroup>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="border overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200"></div>
                      <CardContent className="p-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(products) && products.map((product: any) => (
                    <Card key={product.id} className="border overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/product/${product.id}`)}>
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <div className="w-full h-full flex items-center justify-center border-b">
                          <img
                            src={product.imageUrl ? `/uploads/${product.imageUrl}` : `/placeholder-product-${product.id % 6 + 1}.svg`}
                            alt={product.title}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-product.svg";
                            }}
                          />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-lg mb-1">{product.title}</h3>
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-lg">${Number(product.price).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{product.category}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {Array.isArray(products) && products.length === 0 && !isLoading && (
                    <div className="col-span-3 py-12 text-center">
                      <p className="text-lg text-gray-500">{t("listings.noProducts")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-10 bg-indigo-100 mt-auto">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold mb-4">{t("footer.newsletter")}</h2>
            
            <form className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto mb-4" onSubmit={handleSubscribe}>
              <Input 
                type="email" 
                placeholder={t("footer.emailAddress")} 
                className="flex-grow py-2 px-4 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white py-2 px-6 rounded-r-lg">
                {t("footer.subscribe")}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-6">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">{t("footer.aboutUs")}</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">{t("footer.features")}</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">{t("footer.pricing")}</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">{t("footer.resources")}</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-primary">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>© 2024 Cimplico Marketplace. {t("footer.allRightsReserved")}</p>
            <div className="flex mt-3 md:mt-0">
              <a href="#" className="mr-4 hover:text-gray-900">{t("footer.terms")}</a>
              <a href="#" className="hover:text-gray-900">{t("footer.privacy")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
