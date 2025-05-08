import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

const Testimonials: React.FC = () => {
  const { t } = useTranslation();

  // 为 testimonials 添加类型定义，避免隐式 any 错误
  type Testimonial = {
    id: number;
    name: string;
    role: string;
    company: string;
    content: string;
    avatar: string;
    rating: number;
  };

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    queryFn: getQueryFn(),
    staleTime: 1000 * 60 * 5,
  });

  // renderStars 参数类型声明，避免 n 隐式 any
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, index: number) => (
          <svg
            key={index}
            className={`h-5 w-5 ${
              index < rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial: Testimonial) => (
            <Card key={testimonial.id} className="h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="mb-6 flex justify-between items-start">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <Quote className="h-10 w-10 text-primary/20" />
                </div>

                <div className="mb-4 flex-grow">
                  <p className="italic text-muted-foreground">{testimonial.content}</p>
                </div>

                <div className="mt-auto">{renderStars(testimonial.rating)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;