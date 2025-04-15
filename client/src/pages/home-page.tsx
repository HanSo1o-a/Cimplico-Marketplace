import { useTranslation } from "react-i18next";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import NewArrivals from "@/components/home/NewArrivals";
import VerifiedVendors from "@/components/home/VerifiedVendors";
import BecomeVendor from "@/components/home/BecomeVendor";
import Testimonials from "@/components/home/Testimonials";
import Features from "@/components/home/Features";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const HomePage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send the email to a newsletter service
    alert(t("footer.subscribeSuccess"));
    setEmail("");
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Hero />

      {/* Categories Section */}
      <Categories />

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* New Arrivals Section */}
      <NewArrivals />

      {/* Verified Vendors Section */}
      <VerifiedVendors />

      {/* Become a Vendor Section */}
      <BecomeVendor />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Features Section */}
      <Features />

      {/* Newsletter Section */}
      <section className="py-12 bg-white border-t border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold mb-4">{t("footer.newsletter")}</h2>
            <p className="text-neutral-600 mb-6">
              {t("footer.newsletterText")}
            </p>
            
            <form className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto" onSubmit={handleSubscribe}>
              <Input 
                type="email" 
                placeholder={t("footer.emailAddress")} 
                className="flex-grow py-3 px-4 border border-neutral-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-r-lg transition-colors">
                {t("footer.subscribe")}
              </Button>
            </form>
            
            <p className="text-xs text-neutral-500 mt-4">
              {t("auth.privacyPolicy")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
