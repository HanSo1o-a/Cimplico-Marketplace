import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Download, FileCheck, Star, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

  // 动画变体
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const featureCards = [
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: t("hero.features.highQuality"),
      description: t("hero.features.highQualityDesc")
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: t("hero.features.verified"),
      description: t("hero.features.verifiedDesc")
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: t("hero.features.instant"),
      description: t("hero.features.instantDesc")
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Blob decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 -right-[10%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[80%] h-[80%] bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <Badge 
              variant="outline" 
              className="mb-6 px-4 py-2 border-primary/30 text-primary font-medium bg-primary/5 hover:bg-primary/10"
            >
              Cimplico Marketplace
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{t("hero.highlight")}</span>{" "}
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{t("hero.title")}</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {t("hero.description")}
            </p>

            <form 
              onSubmit={handleSearch}
              className="relative flex max-w-md mb-10 drop-shadow-sm"
            >
              <Input
                type="text"
                placeholder={t("hero.searchPlaceholder")}
                className="w-full pr-12 py-6 rounded-l-full rounded-r-full pl-6 border-slate-200 focus-visible:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1 h-[calc(100%-8px)] rounded-full bg-primary hover:bg-primary/90"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="default"
                size="lg"
                className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90"
                onClick={() => navigate("/marketplace")}
              >
                {t("hero.browseMarketplace")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 border-primary/20 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/30"
                onClick={() => navigate("/marketplace?featured=true")}
              >
                {t("hero.featuredContent")}
              </Button>
            </div>
            
            {/* Feature mini-cards */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {featureCards.map((feature, index) => (
                <motion.div key={index} variants={fadeIn} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative lg:flex items-center justify-center hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.7,
              ease: "easeOut",
              delay: 0.2
            }}
          >
            {/* Floating cards effect */}
            <div className="relative">
              {/* Main featured card */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4,
                  ease: "easeInOut"
                }}
              >
                <Card className="relative z-30 bg-white dark:bg-slate-900 shadow-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden w-full max-w-md">
                  <div className="absolute top-3 right-3 z-20">
                    <Badge className="bg-green-500 text-white border-0">
                      {t("product.featured")}
                    </Badge>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/20 relative overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <FileCheck className="h-16 w-16 text-primary/50" />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs py-1.5 px-2.5 rounded-full flex items-center shadow-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">4.9</span>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-primary/80 flex items-center bg-primary/5 px-2.5 py-1 rounded-full">
                        <FileCheck className="h-3.5 w-3.5 mr-1" />
                        <span>{t("categories.checklist")}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {t("hero.featuredProductTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {t("hero.featuredProductDescription")}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-lg bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">$199</span>
                      <Button size="sm" className="rounded-full" onClick={(e) => {e.stopPropagation(); navigate('/product/1');}}>
                        {t("hero.learnMore")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Background floating cards */}
              <motion.div 
                className="absolute -left-16 -bottom-12 z-10 w-64 h-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200/50 dark:border-slate-700/50 transform -rotate-6"
                initial={{ y: 0 }}
                animate={{ y: [0, 10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              
              <motion.div 
                className="absolute -right-12 -top-14 z-10 w-56 h-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200/50 dark:border-slate-700/50 transform rotate-12"
                initial={{ y: 0 }}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4.5,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;