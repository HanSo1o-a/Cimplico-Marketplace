import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const Checkout = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { items, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  if (items.length === 0) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">{t("checkout.title")}</h1>
        <p className="mb-4">{t("checkout.emptyCart")}</p>
        <Button onClick={() => navigate("/marketplace")}>
          {t("checkout.browseProducts")}
        </Button>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.listing.price * item.quantity,
    0
  );
  const tax = 0; // 在真实应用中应该计算税费
  const total = subtotal + tax;

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    
    try {
      // 准备订单项数据
      const orderItems = items.map(item => ({
        listingId: item.listing.id,
        quantity: item.quantity,
        unitPrice: item.listing.price
      }));
      
      // 创建订单
      const orderResponse = await apiRequest('POST', '/api/orders', {
        items: orderItems,
        totalAmount: total,
        currency: 'CNY'
      });
      
      const order = await orderResponse.json();
      
      // 处理支付
      const paymentResponse = await apiRequest('POST', '/api/payments', {
        orderId: order.id,
        amount: total,
        currency: 'CNY',
        paymentMethod: paymentMethod
      });
      
      const paymentResult = await paymentResponse.json();
      
      toast({
        title: t("checkout.orderSuccess"),
        description: t("checkout.orderConfirmed"),
      });
      
      clearCart();
      navigate("/profile");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("checkout.orderFailed"),
        description: error instanceof Error ? error.message : t("checkout.orderError"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t("checkout.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("checkout.customerInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("checkout.firstName")}</Label>
                  <Input 
                    id="firstName" 
                    defaultValue={user?.firstName || ""} 
                    placeholder={t("checkout.firstNamePlaceholder")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("checkout.lastName")}</Label>
                  <Input 
                    id="lastName" 
                    defaultValue={user?.lastName || ""} 
                    placeholder={t("checkout.lastNamePlaceholder")} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("checkout.email")}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user?.email || ""} 
                  placeholder={t("checkout.emailPlaceholder")} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("checkout.paymentMethod")}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                defaultValue="credit_card" 
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card">{t("checkout.creditCard")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal">PayPal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer">{t("checkout.bankTransfer")}</Label>
                </div>
              </RadioGroup>

              {paymentMethod === "credit_card" && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{t("checkout.cardNumber")}</Label>
                    <Input 
                      id="cardNumber" 
                      placeholder="0000 0000 0000 0000" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expDate">{t("checkout.expiryDate")}</Label>
                      <Input 
                        id="expDate" 
                        placeholder="MM/YY" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input 
                        id="cvv" 
                        placeholder="123" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{t("checkout.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.listing.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.listing.title}</span>
                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <span>{formatPrice(item.listing.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span>{t("checkout.subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("checkout.tax")}</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t("checkout.total")}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSubmitOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    {t("checkout.processing")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </span>
                ) : (
                  t("checkout.placeOrder")
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;