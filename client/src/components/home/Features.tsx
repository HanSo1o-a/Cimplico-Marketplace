import React from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  ShieldCheck,
  Zap,
  Mail,
  Clock,
  CreditCard,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

const Features: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: t("features.global.title"),
      description: t("features.global.description"),
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: t("features.secure.title"),
      description: t("features.secure.description"),
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: t("features.fast.title"),
      description: t("features.fast.description"),
    },
    {
      icon: <Mail className="h-8 w-8 text-primary" />,
      title: t("features.updates.title"),
      description: t("features.updates.description"),
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: t("features.time.title"),
      description: t("features.time.description"),
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: t("features.payment.title"),
      description: t("features.payment.description"),
    },
    {
      icon: <HelpCircle className="h-8 w-8 text-primary" />,
      title: t("features.support.title"),
      description: t("features.support.description"),
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: t("features.community.title"),
      description: t("features.community.description"),
    },
  ];

  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("features.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("features.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <div className="rounded-full bg-primary/10 p-3 inline-block mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;