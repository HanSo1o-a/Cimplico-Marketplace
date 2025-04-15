import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const Hero = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80",
      title: t("home.hero.title"),
      description: "由专业人士创建的高质量工作底稿和模板",
    },
    {
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80",
      title: "合规检查工具包",
      description: "确保您的业务符合最新的法规要求",
    },
    {
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80",
      title: "自动化审计工作流程",
      description: "提高效率，减少错误，改进审计流程",
    },
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">{t("home.hero.title")}</h1>
            <p className="text-lg mb-6 opacity-90">{t("home.hero.subtitle")}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/marketplace">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-neutral-100">
                  {t("home.hero.browseContent")}
                </Button>
              </Link>
              <Link href="/auth?vendor=true">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-700">
                  {t("home.hero.becomeVendor")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="carousel w-full rounded-lg shadow-xl overflow-hidden">
              {slides.map((slide, index) => (
                <div 
                  key={index}
                  className={`carousel-item relative w-full transition-opacity duration-500 ${
                    index === currentSlide ? 'block' : 'hidden'
                  }`}
                >
                  <img 
                    src={slide.image} 
                    alt={slide.title} 
                    className="w-full object-cover h-64 md:h-80"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center">
                    <div className="px-8 py-4">
                      <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
                      <p>{slide.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-black bg-opacity-30 border-0 text-white hover:bg-black hover:bg-opacity-50 rounded-full"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-black bg-opacity-30 border-0 text-white hover:bg-black hover:bg-opacity-50 rounded-full"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              
              {/* Slide indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
