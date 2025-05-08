import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckSquare, FileCheck, FileSpreadsheet, FileBarChart, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  const { data: categoriesData = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn(),
    staleTime: 1000 * 60 * 5,
  });

  const categoryIcons = {
    calculation: <FileBarChart className="h-9 w-9" />,
    checklist: <CheckSquare className="h-9 w-9" />,
    procedure: <FileCheck className="h-9 w-9" />,
    report: <FileText className="h-9 w-9" />,
    otherSchedules: <FileSpreadsheet className="h-9 w-9" />,
  };

  const categoryColors = {
    calculation: {
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      hoverColor: "group-hover:from-blue-600 group-hover:to-blue-700",
    },
    checklist: {
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
      hoverColor: "group-hover:from-green-600 group-hover:to-green-700",
    },
    procedure: {
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      hoverColor: "group-hover:from-purple-600 group-hover:to-purple-700",
    },
    report: {
      color: "from-amber-500 to-amber-600",
      bgColor: "from-amber-50 to-amber-100",
      hoverColor: "group-hover:from-amber-600 group-hover:to-amber-700",
    },
    otherSchedules: {
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100",
      hoverColor: "group-hover:from-red-600 group-hover:to-red-700",
    },
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 md:gap-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl mb-5"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50/50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-3">
            <LayoutGrid className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">{t("home.sections.categories")}</span>
          </div>
          <h2 className="text-4xl font-bold mb-5 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {t("home.categories.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("home.categories.description")}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 md:gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {categoriesData.map((category: any) => {
            const colors = categoryColors[category.slug as keyof typeof categoryColors] || categoryColors.report;
            const icon = categoryIcons[category.slug as keyof typeof categoryIcons] || <FileText className="h-9 w-9" />;

            return (
              <motion.div key={category.id} variants={item}>
                <Card
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 border border-slate-200/70 dark:border-slate-800/50 hover:border-transparent overflow-hidden group h-full"
                  onClick={() => navigate(`/marketplace?category=${category.slug}`)}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center h-full">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors.bgColor} mb-5 transition-colors duration-300 relative`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${colors.color} ${colors.hoverColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}></div>
                      <div className="relative text-slate-700 group-hover:text-white transition-colors duration-300 z-10">
                        {icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors duration-300">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("home.categories.browseCategory")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;