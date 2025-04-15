import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckSquare, FileCheck, FileSpreadsheet, FileBarChart } from "lucide-react";

const Categories: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  const categories = [
    {
      id: "calculation",
      name: t("categories.calculation"),
      icon: <FileBarChart className="h-8 w-8" />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "checklist",
      name: t("categories.checklist"),
      icon: <CheckSquare className="h-8 w-8" />,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "procedure",
      name: t("categories.procedure"),
      icon: <FileCheck className="h-8 w-8" />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "report",
      name: t("categories.report"),
      icon: <FileText className="h-8 w-8" />,
      color: "bg-amber-100 text-amber-600",
    },
    {
      id: "otherSchedules",
      name: t("categories.otherSchedules"),
      icon: <FileSpreadsheet className="h-8 w-8" />,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <section className="py-12 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("home.categories.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("home.categories.description")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-none"
              onClick={() => navigate(`/marketplace?category=${category.id}`)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`p-3 rounded-full ${category.color} mb-4`}>
                  {category.icon}
                </div>
                <h3 className="font-medium text-lg mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("home.categories.browseCategory")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;