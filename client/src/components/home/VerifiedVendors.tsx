import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorProfile } from "@shared/schema";

interface VendorWithDetails extends VendorProfile {
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  listingsCount: number;
}

const VerifiedVendors = () => {
  const { t } = useTranslation();

  const { data: vendors, isLoading } = useQuery<VendorWithDetails[]>({
    queryKey: ["/api/vendors"],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-16 h-16 rounded-full mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading text-2xl font-bold flex items-center">
            <CheckCircle className="text-primary-500 mr-2 h-6 w-6" />
            {t("home.vendors.title")}
          </h2>
          <Link href="/marketplace?vendors=true">
            <a className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              {t("home.vendors.viewAll")} <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {vendors && vendors.slice(0, 6).map((vendor) => (
            <Link key={vendor.id} href={`/marketplace?vendor=${vendor.id}`}>
              <a className="bg-white rounded-lg border border-neutral-200 p-4 text-center hover:shadow-md transition-all hover:border-primary-300 flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-16 h-16 rounded-full mb-3 border-2 border-primary-100">
                    <AvatarImage src={vendor.user?.avatar || undefined} alt={vendor.companyName} />
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {vendor.companyName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs p-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                </div>
                <h3 className="font-medium text-neutral-800">{vendor.companyName}</h3>
                <p className="text-xs text-neutral-500 mt-1">{vendor.description?.substring(0, 30) || "供应商"}</p>
                <div className="flex items-center mt-2 text-xs text-neutral-600">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {(4.5 + Math.random() * 0.5).toFixed(1)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{vendor.listingsCount}{t("home.categories.products")}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VerifiedVendors;
