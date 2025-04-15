import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle, ChevronRight, CreditCard, Loader2, Package, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { OrderStatus } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Steps } from "@/components/ui/steps";

const PaymentSuccess = ({ 
  orderId, 
  onClose 
}: { 
  orderId: number; 
  onClose: () => void 
}) => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center text-center justify-center text-xl mb-2">
          <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
          {t("checkout.paymentSuccessful")}
        </DialogTitle>
        <DialogDescription className="text-center">
          {t("checkout.orderPlaced")}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{t("checkout.thankYou")}</h3>
        <p className="text-muted-foreground text-center mb-4">
          {t("checkout.orderConfirmed")}
        </p>
        <div className="bg-muted p-3 rounded-md text-center mb-4 w-full">
          <p className="text-sm font-medium">{t("checkout.orderNumber")}</p>
          <p className="text-lg font-bold">#{orderId}</p>
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => {
            onClose();
            navigate("/marketplace");
          }}
          className="sm:flex-1"
        >
          {t("checkout.continueShopping")}
        </Button>
        <Button
          onClick={() => {
            onClose();
            navigate("/profile");
          }}
          className="sm:flex-1"
        >
          {t("checkout.viewOrder")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const Checkout = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { items, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentStep, setPaymentStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderProgress, setOrderProgress] = useState(0);

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

  const simulatePaymentProcessing = async () => {
    // 设置进度条动画
    setOrderProgress(0);
    const interval = setInterval(() => {
      setOrderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    // 模拟付款处理时间
    return new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        setOrderProgress(100);
        resolve(true);
      }, 3000);
    });
  };

  const handleSubmitOrder = async () => {
    try {
      setIsProcessing(true);
      setPaymentStep(1);
      
      // 准备订单项数据
      const orderItems = items.map(item => ({
        listingId: item.listing.id,
        quantity: item.quantity,
        unitPrice: item.listing.price
      }));
      
      // 步骤1: 创建订单
      const orderResponse = await apiRequest('POST', '/api/orders', {
        items: orderItems,
        totalAmount: total,
        currency: 'CNY'
      });
      
      const order = await orderResponse.json();
      setOrderId(order.id);
      
      // 步骤2: 模拟支付处理
      setPaymentStep(2);
      await simulatePaymentProcessing();
      
      // 步骤3: 处理支付
      const paymentResponse = await apiRequest('POST', '/api/payments', {
        orderId: order.id,
        amount: total,
        currency: 'CNY',
        paymentMethod: paymentMethod
      });
      
      await paymentResponse.json();
      
      // 步骤4: 完成支付
      setPaymentStep(3);
      
      // 刷新订单列表
      queryClient.invalidateQueries(["/api/users/orders"]);
      
      // 显示成功对话框
      setShowSuccessDialog(true);
      clearCart();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("checkout.orderFailed"),
        description: error instanceof Error ? error.message : t("checkout.orderError"),
      });
      
      setPaymentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentProcessing = () => {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{t("checkout.processingPayment")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Steps currentStep={paymentStep} steps={[
            t("checkout.creatingOrder"),
            t("checkout.processingPayment"),
            t("checkout.confirmingOrder")
          ]} className="pb-6" />

          {paymentStep === 1 && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <AlertTitle>{t("checkout.creatingOrder")}</AlertTitle>
              <AlertDescription>
                {t("checkout.preparingOrder")}
              </AlertDescription>
            </Alert>
          )}

          {paymentStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4 mr-2" />
                <AlertTitle>{t("checkout.processingPayment")}</AlertTitle>
                <AlertDescription>
                  {t("checkout.processingPaymentDescription")}
                </AlertDescription>
              </Alert>
              <Progress value={orderProgress} className="h-2" />
              <p className="text-muted-foreground text-sm text-center">
                {t("checkout.doNotRefresh")}
              </p>
            </div>
          )}

          {paymentStep === 3 && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <AlertTitle className="text-green-700">{t("checkout.paymentComplete")}</AlertTitle>
              <AlertDescription className="text-green-600">
                {t("checkout.paymentSuccessDescription")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isProcessing) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[70vh]">
        {renderPaymentProcessing()}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <PaymentSuccess 
            orderId={orderId!} 
            onClose={() => setShowSuccessDialog(false)} 
          />
        </Dialog>
      </div>
    );
  }

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
              <CardTitle>{t("checkout.orderProcess")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{t("order.status.CREATED")}</span>
                  <span className="text-xs text-muted-foreground">{t("order.statusDescription.CREATED")}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{t("order.status.PAID")}</span>
                  <span className="text-xs text-muted-foreground">{t("order.statusDescription.PAID")}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Truck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{t("order.status.SHIPPED")}</span>
                  <span className="text-xs text-muted-foreground">{t("order.statusDescription.SHIPPED")}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{t("order.status.COMPLETED")}</span>
                  <span className="text-xs text-muted-foreground">{t("order.statusDescription.COMPLETED")}</span>
                </div>
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
                  <Label htmlFor="credit_card" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("checkout.creditCard")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alipay" id="alipay" />
                  <Label htmlFor="alipay">支付宝</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wechat_pay" id="wechat_pay" />
                  <Label htmlFor="wechat_pay">微信支付</Label>
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

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("checkout.testMode")}</AlertTitle>
                <AlertDescription>
                  {t("checkout.testModeDescription")}
                </AlertDescription>
              </Alert>
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