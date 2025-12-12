import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    billing: "$19/mo",
    price: "$89 Lifetime",
    popular: true,
    priceId: SUBSCRIPTION_TIERS.starter.price_id,
    features: [
      "Unlimited collaboration files",
      "Animation & Video Export",
      "100 AI Credits",
      "Slack & Discord",
    ],
  },
  {
    name: "SDK Whitelabel",
    billing: "$999/yr",
    price: "$299 Lifetime",
    priceId: SUBSCRIPTION_TIERS.sdk_whitelabel.price_id,
    features: [
      "Everything in Starter",
      "500 AI Credits",
      "White-label SDK",
      "MIT Extended License",
      "4hr Dev Support",
    ],
    isEnterprise: true,
  },
];

export default function PricingSectionNew() {
  const navigate = useNavigate();
  const { createCheckout, subscribed, priceId: currentPriceId, isLoading: subLoading } = useSubscription();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.info("Please sign in to subscribe");
        navigate("/auth");
        return;
      }

      setLoadingPriceId(priceId);
      await createCheckout(priceId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <section id="pricing" className="relative z-10 py-10 sm:py-16 px-4">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          className="text-center mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[hsl(40,20%,92%)] mb-2 sm:mb-3">
            Simple Pricing
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[520px] mx-auto px-2 sm:px-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => {
            const isCurrentPlan = subscribed && currentPriceId === plan.priceId;
            const isLoading = loadingPriceId === plan.priceId;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`
                    h-full bg-card/50 backdrop-blur-sm border-border/20 relative
                    ${plan.popular ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}
                    ${isCurrentPlan ? 'ring-2 ring-green-500/50' : ''}
                    hover:border-border/40 transition-all duration-300
                  `}
                >
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-medium">
                      Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-0.5 rounded-full text-xs font-medium">
                      Your Plan
                    </div>
                  )}
                  <CardHeader className="text-center pb-3 pt-5">
                    <CardTitle className="text-base font-semibold text-[hsl(40,20%,92%)]">
                      {plan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{plan.billing}</p>
                    <p className="text-lg font-bold text-foreground mt-1">{plan.price}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-5">
                    {plan.isEnterprise ? (
                      <div className="space-y-2">
                        <Button 
                          size="sm"
                          className="w-full text-xs h-8" 
                          variant="outline"
                          disabled={isLoading || isCurrentPlan}
                          onClick={() => handleSubscribe(plan.priceId)}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : isCurrentPlan ? (
                            "Current Plan"
                          ) : (
                            "Subscribe Now"
                          )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center">
                          Email support: hello@rantir.com
                        </p>
                      </div>
                    ) : (
                      <Button 
                        size="sm"
                        className="w-full text-xs h-8" 
                        variant={plan.popular ? "default" : "outline"}
                        disabled={isLoading || isCurrentPlan}
                        onClick={() => handleSubscribe(plan.priceId)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          "Get Started"
                        )}
                      </Button>
                    )}
                    <ul className="space-y-1.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
