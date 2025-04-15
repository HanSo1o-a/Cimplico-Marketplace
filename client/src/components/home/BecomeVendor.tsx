import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const BecomeVendor = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 bg-gradient-to-r from-primary-700 to-primary-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              {t("home.becomeVendor.title")}
            </h2>
            <p className="text-primary-100 mb-6">
              {t("home.becomeVendor.description")}
            </p>
            <ul className="mb-6 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="text-secondary-400 mt-1 mr-2 h-5 w-5" />
                <span>{t("home.becomeVendor.benefit1")}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-secondary-400 mt-1 mr-2 h-5 w-5" />
                <span>{t("home.becomeVendor.benefit2")}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-secondary-400 mt-1 mr-2 h-5 w-5" />
                <span>{t("home.becomeVendor.benefit3")}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-secondary-400 mt-1 mr-2 h-5 w-5" />
                <span>{t("home.becomeVendor.benefit4")}</span>
              </li>
            </ul>
            <Link href="/auth?vendor=true">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-neutral-100 shadow-lg">
                {t("home.becomeVendor.registerNow")}
              </Button>
            </Link>
          </div>
          <div className="md:w-5/12">
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80" 
              alt={t("home.becomeVendor.title")} 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BecomeVendor;
