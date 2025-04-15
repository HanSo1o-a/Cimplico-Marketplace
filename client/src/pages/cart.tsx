import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";

const Cart = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { items, removeItem, clearCart, updateQuantity } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: t("cart.emptyCartTitle"),
        description: t("cart.emptyCartMessage"),
      });
      return;
    }
    
    navigate("/checkout");
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.listing.price * item.quantity,
    0
  );

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t("cart.title")}</h1>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold mb-2">{t("cart.empty")}</h2>
          <p className="text-muted-foreground mb-6">{t("cart.browseProducts")}</p>
          <Button onClick={() => navigate("/marketplace")}>
            {t("cart.continueShopping")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.listing.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/4 bg-secondary aspect-square flex items-center justify-center md:aspect-auto">
                      {item.listing.image ? (
                        <img
                          src={item.listing.image}
                          alt={item.listing.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="text-5xl text-muted-foreground">📄</div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{item.listing.title}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeItem(item.listing.id)}
                        >
                          {t("cart.remove")}
                        </Button>
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {item.listing.description}
                      </p>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.listing.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.listing.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="font-medium">
                          {formatPrice(item.listing.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => clearCart()}>
                {t("cart.clearCart")}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("cart.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t("cart.subtotal")}</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("cart.tax")}</span>
                    <span>{formatPrice(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>{t("cart.total")}</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCheckout}>
                  {t("cart.proceedToCheckout")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;