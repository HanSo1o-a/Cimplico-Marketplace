import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LinkedinIcon,
  TwitterIcon,
  Facebook,
  Instagram,
  ExternalLink
} from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#0F2B46] text-gray-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">{t("footer.about")}</h3>
            <p className="mb-4 text-sm leading-relaxed">
              {t("footer.aboutText")}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#0096FF] transition-colors">
                <LinkedinIcon className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0096FF] transition-colors">
                <TwitterIcon className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0096FF] transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0096FF] transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-[#0096FF] transition-colors">{t("nav.home")}</a></li>
              <li><a href="/marketplace" className="hover:text-[#0096FF] transition-colors">{t("nav.marketplace")}</a></li>
              <li><a href="/marketplace?vendors=true" className="hover:text-[#0096FF] transition-colors">{t("nav.vendors")}</a></li>
              <li><a href="/marketplace?newArrivals=true" className="hover:text-[#0096FF] transition-colors">{t("nav.newArrivals")}</a></li>
              <li><a href="/marketplace?freeOnly=true" className="hover:text-[#0096FF] transition-colors">{t("nav.freeResources")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.termsOfService")}</a></li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">{t("footer.support")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.helpCenter")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.faq")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.contact")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.refundPolicy")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.termsOfService")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.privacyPolicy")}</a></li>
            </ul>
          </div>

          {/* Vendor Section */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">{t("footer.vendors")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/auth?vendor=true" className="hover:text-[#0096FF] transition-colors">{t("footer.becomeVendor")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.vendorGuidelines")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.uploadRules")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.sellingTerms")}</a></li>
              <li><a href="#" className="hover:text-[#0096FF] transition-colors">{t("footer.vendorResources")}</a></li>
              <li><a href="/auth" className="hover:text-[#0096FF] transition-colors">{t("footer.vendorLogin")}</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-[#1A3A5A] pt-8 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-heading text-xl font-bold text-white mb-4">{t("footer.newsletter")}</h3>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              {t("footer.newsletterText")}
            </p>

            <form className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
              <Input
                type="email"
                placeholder={t("footer.emailAddress")}
                className="flex-grow py-3 px-4 bg-[#1A3A5A] border-[#1A3A5A] text-white focus:ring-[#0096FF]/50"
              />
              <Button type="submit" className="bg-[#0096FF] hover:bg-[#0084E3] text-white">
                {t("footer.subscribe")}
              </Button>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              {t("auth.privacyPolicy")}
            </p>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-[#1A3A5A] pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0">
              {t("footer.copyright")}
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm hover:text-[#0096FF] transition-colors">{t("footer.termsOfService")}</a>
              <span>|</span>
              <a href="#" className="text-sm hover:text-[#0096FF] transition-colors">{t("footer.privacyPolicy")}</a>
              <span>|</span>
              <a href="#" className="text-sm hover:text-[#0096FF] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
