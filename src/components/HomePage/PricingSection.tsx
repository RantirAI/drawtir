import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    billing: "12/Monthly",
    price: "$49 USD Lifetime Starter",
    features: [
      "Unlimited Collaboration files for UI, Whiteboarding, Slides & Video Creation",
      "Animation, Timeline & Video Export",
      "100 Credits for Frames, Video & Image generation",
      "Slack and Discord Connection",
    ],
  },
  {
    name: "Business",
    billing: "29/monthly",
    price: "$89 USD Lifetime Starter",
    popular: true,
    features: [
      "Unlimited Collaboration files for UI, Whiteboarding, Slides & Video Creation",
      "Animation, Timeline & Video Export",
      "300 Credits for Frames, Video & Image generation",
      "Slack and Discord Connection",
      "Priority Feedback and Support",
    ],
  },
  {
    name: "SDK Whitelable",
    billing: "1999/Yearly",
    price: "$299 USD Lifetime Starter",
    features: [
      "Unlimited Collaboration files for UI, Whiteboarding, Slides & Video Creation",
      "Animation, Timeline & Video Export",
      "500 Credits for Frames, Video & Image generation",
      "Slack and Discord Connection",
      "Priority Feedback and Support",
      "White-label and embed Drawtir SDK",
      "Custom Development support (up to 4 hours)",
    ],
  },
];

export default function PricingSection() {
  return (
    <div id="pricing" className="relative z-10 py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the perfect plan for your creative needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all relative ${
                plan.popular ? 'border-primary shadow-lg shadow-primary/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Popular
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-foreground mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mb-2">
                  {plan.billing}
                </CardDescription>
                <div className="text-3xl font-bold text-foreground">{plan.price}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => window.location.href = '/auth'}
                >
                  Get Started
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
