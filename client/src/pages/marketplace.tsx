import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Listing, VendorProfile } from "@shared/schema";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar from "@/components/product/FilterSidebar";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  ChevronDown,
  Filter,
  ShoppingBag,
  Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Marketplace = () => {
  const { t } = useTranslation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("newest");
  const [filterQuery, setFilterQuery] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Special filters from URL
  const featured = searchParams.get("featured") === "true";
  const newArrivals = searchParams.get("newArrivals") === "true";
  const vendorId = searchParams.get("vendor");
  const freeOnly = searchParams.get("freeOnly") === "true";
  const vendorsPage = searchParams.get("vendors") === "true";

  // Determine the appropriate API endpoint and params based on filters
  const getQueryParams = () => {
    const params: Record<string, string> = {};
    
    if (searchQuery) params.search = searchQuery;
    if (category && category !== "all") params.category = category;
    if (minPrice !== undefined) params.minPrice = minPrice.toString();
    if (maxPrice !== undefined) params.maxPrice = maxPrice.toString();
    if (freeOnly) params.freeOnly = "true";
    if (vendorId) params.vendorId = vendorId;
    
    // Add offset and limit for pagination
    params.offset = ((currentPage - 1) * itemsPerPage).toString();
    params.limit = itemsPerPage.toString();
    
    return new URLSearchParams(params).toString();
  };

  // Determine which endpoint to use
  const getQueryEndpoint = () => {
    if (vendorsPage) return "/api/vendors";
    if (featured) return "/api/listings/featured";
    if (newArrivals) return "/api/listings?newArrivals=true";
    return "/api/listings";
  };

  // Fetch products based on filters
  const { data, isLoading, refetch } = useQuery<Listing[] | VendorProfile[]>({
    queryKey: [getQueryEndpoint(), getQueryParams()],
    keepPreviousData: true,
  });

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  // Apply filters and update URL
  const updateFilters = (newFilters: Record<string, any>) => {
    // Reset to first page when filters change
    setCurrentPage(1);
    
    // Create a new URLSearchParams object
    const params = new URLSearchParams(search);
    
    // Update or remove params based on the newFilters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });
    
    // Apply filters immediately
    setFilterQuery(params.toString());
    
    // Update URL without triggering navigation
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.pushState({ path: newUrl }, "", newUrl);
    
    // Trigger query refetch
    refetch();
  };

  // Apply sort
  const handleSort = (value: string) => {
    setSortBy(value);
    
    // Apply sort logic (in a real application this would be handled by the API)
    // For now, we'll just refetch to simulate
    refetch();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Determine the page title and content based on URL params
  const getPageTitle = () => {
    if (vendorsPage) return t("home.vendors.title");
    if (featured) return t("home.featured.title");
    if (newArrivals) return t("home.newArrivals.title");
    if (freeOnly) return t("nav.freeResources");
    if (vendorId) return t("product.vendor");
    if (category && category !== "all") {
      // Map category to translated name
      const categoryMap: Record<string, string> = {
        financial: t("categories.financial"),
        audit: t("categories.audit"),
        tax: t("categories.tax"),
        compliance: t("categories.compliance"),
        analysis: t("categories.analysis")
      };
      return categoryMap[category] || t("nav.marketplace");
    }
    return t("nav.marketplace");
  };

  // Determine total pages
  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Render vendors grid if on vendors page
  if (vendorsPage && data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{getPageTitle()}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(data as VendorProfile[]).map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  {vendor.user?.avatar ? (
                    <img 
                      src={vendor.user.avatar} 
                      alt={vendor.companyName} 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary-600">
                      {vendor.companyName.charAt(0)}
                    </span>
                  )}
                </div>
                {vendor.verificationStatus === "APPROVED" && (
                  <span className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold mb-2">{vendor.companyName}</h3>
              
              {vendor.verificationStatus === "APPROVED" && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs mb-2">
                  {t("vendor.approved")}
                </span>
              )}
              
              <p className="text-gray-600 text-sm text-center mb-4 line-clamp-3">
                {vendor.description || t("vendor.profile")}
              </p>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="mr-2">4.8</span>
                <span>{vendor.listingsCount || 0} {t("home.categories.products")}</span>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => window.location.href = `/marketplace?vendor=${vendor.id}`}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t("nav.marketplace")}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        {/* Mobile Filter Button */}
        <div className="w-full md:hidden mb-4">
          <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                {t("product.filter")}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="py-4">
                <FilterSidebar 
                  currentCategory={category}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onFilterChange={(filters) => {
                    updateFilters(filters);
                    setIsMobileFilterOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block md:w-1/4 lg:w-1/5">
          <FilterSidebar 
            currentCategory={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onFilterChange={updateFilters}
          />
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">{getPageTitle()}</h1>
            
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative flex-grow">
                <Input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </form>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder={t("product.sort")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("product.sortNewest")}</SelectItem>
                  <SelectItem value="price-low-high">{t("product.sortPriceLowHigh")}</SelectItem>
                  <SelectItem value="price-high-low">{t("product.sortPriceHighLow")}</SelectItem>
                  <SelectItem value="rating">{t("product.sortRating")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid 
            products={data as Listing[] || []}
            isLoading={isLoading}
            emptyMessage={t("product.noProducts")}
            columns={3}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === index + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(index + 1);
                        }}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
