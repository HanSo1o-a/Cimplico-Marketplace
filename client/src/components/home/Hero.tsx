import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary-50 to-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="text-primary">{t("hero.highlight")}</span>{" "}
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {t("hero.description")}
            </p>

            <form 
              onSubmit={handleSearch}
              className="relative flex max-w-md mb-8"
            >
              <Input
                type="text"
                placeholder={t("hero.searchPlaceholder")}
                className="w-full pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                onClick={() => navigate("/marketplace")}
              >
                {t("hero.browseMarketplace")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/marketplace?featured=true")}
              >
                {t("hero.featuredContent")}
              </Button>
            </div>
          </div>

          <div className="relative lg:flex items-center justify-center hidden">
            <div className="relative z-10 bg-white p-4 rounded-lg shadow-xl max-w-md">
              <div className="aspect-video bg-primary-100 flex items-center justify-center rounded mb-4">
                <svg
                  className="h-16 w-16 text-primary opacity-50"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="m9 15 3 3 3-3" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t("hero.featuredProductTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("hero.featuredProductDescription")}
              </p>
              <div className="flex justify-between items-center">
                <span className="font-medium text-primary">¥199</span>
                <Button size="sm" variant="outline">
                  {t("hero.learnMore")}
                </Button>
              </div>
            </div>

            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full bg-primary/5 -z-10"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(var(--primary-rgb), 0.1) 0%, rgba(var(--primary-rgb), 0) 70%)"
              }}
            />
          </div>
        </div>
      </div>

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 opacity-10 -z-10">
        <svg width="400" height="400" viewBox="0 0 200 200">
          <path
            fill="currentColor"
            d="M44.3,-76.1C58.1,-69.5,70.7,-59.3,78.1,-46.1C85.6,-32.9,87.8,-16.4,85.7,-1.2C83.7,14.1,77.4,28.3,68.6,40.4C59.8,52.5,48.5,62.6,35.3,70.6C22.1,78.7,7.1,84.7,-6.8,84C-20.8,83.3,-33.7,75.8,-46.8,67.5C-59.9,59.2,-73.2,50,-81.6,37C-90,23.9,-93.5,6.9,-90.8,-8.5C-88.1,-24,-79.2,-37.9,-67.8,-48.4C-56.4,-58.9,-42.5,-65.9,-28.9,-72.6C-15.4,-79.3,-2.2,-85.7,10.8,-84.8C23.9,-83.9,30.5,-82.8,44.3,-76.1Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 opacity-10 -z-10">
        <svg width="300" height="300" viewBox="0 0 200 200">
          <path
            fill="currentColor"
            d="M32.1,-51.2C44.1,-45.9,58,-42.1,68.3,-32.5C78.5,-22.9,85.1,-7.5,83.6,7.2C82,21.9,72.2,36,62.8,49.7C53.3,63.3,44.2,76.5,31.6,81.5C19.1,86.4,3.1,83.1,-13.8,79.9C-30.8,76.7,-48.6,73.6,-60.9,64C-73.2,54.5,-80,38.4,-80,23.4C-80,8.4,-73.2,-5.6,-69.3,-21.2C-65.4,-36.9,-64.4,-54.2,-55.1,-60.5C-45.8,-66.9,-28.2,-62.2,-14.6,-56.4C-0.9,-50.6,20.1,-56.6,32.1,-51.2Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;