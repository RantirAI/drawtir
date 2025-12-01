import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    billing: "$12/mo",
    price: "$49 Lifetime",
    features: [
      "Unlimited collaboration files",
      "Animation & Video Export",
      "100 AI Credits",
      "Slack & Discord",
    ],
  },
  {
    name: "Business",
    billing: "$29/mo",
    price: "$89 Lifetime",
    popular: true,
    features: [
      "Everything in Starter",
      "300 AI Credits",
      "Priority Support",
      "Team Features",
    ],
  },
  {
    name: "SDK Whitelabel",
    billing: "$199/yr",
    price: "$299 Lifetime",
    features: [
      "Everything in Business",
      "500 AI Credits",
      "White-label SDK",
      "4hr Dev Support",
    ],
  },
];

export default function PricingSectionNew() {
  return (
    <section id="pricing" className="relative z-10 py-16 px-4">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[hsl(40,20%,92%)] mb-3">
            Simple Pricing
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`
                  h-full bg-card/50 backdrop-blur-sm border-border/20
                  ${plan.popular ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}
                  hover:border-border/40 transition-all duration-300
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-medium">
                    Popular
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
                  <Button 
                    size="sm"
                    className="w-full text-xs h-8" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => window.location.href = '/auth'}
                  >
                    Get Started
                  </Button>
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
          ))}
        </motion.div>
      </div>
    </section>
  );
}
