import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageFooter from "@/components/Footer/PageFooter";
import { Link } from "react-router-dom";

export default function Pricing() {
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
      features: [
        "Unlimited Collaboration files for UI, Whiteboarding, Slides & Video Creation",
        "Animation, Timeline & Video Export",
        "300 Credits for Frames, Video & Image generation",
        "Slack and Discord Connection",
        "Priority Feedback and Support",
      ],
      popular: true,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/10 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <svg 
              width="67" 
              height="14.5" 
              viewBox="0 0 134 29" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-90"
            >
              <path 
                d="M0 25.3158V16.8596C0 14.4035 3.41632 14.4035 4.63643 14.7719C7.30206 15.7896 7.9826 19.0609 8.13875 21.6454C8.39888 18.8079 9.7967 16.8476 10.615 16.1228C12.5561 14.4035 15.8208 14.4444 17.6916 14.4035C15.7395 14.4035 12.5672 13.7045 11.3471 12.807C8.53743 10.7404 8.15241 7.58209 8.15761 5.46496C8.01196 8.69057 6.97258 10.927 6.36842 11.6491C4.58861 14.0105 1.91462 13.9158 0.611804 13.6144C0.229751 13.526 0 13.1693 0 12.7771V3C0 2.44772 0.447715 2 0.999999 2H10.615C19.107 2.29474 21.718 9.73684 21.962 13.4211C22.5477 22.2632 16.2275 26.3158 11.9571 26.3158H1C0.447715 26.3158 0 25.8681 0 25.3158Z" 
                fill="currentColor"
              />
              <path 
                d="M122.816 26V9.67999H127.52V13.52H127.616V26H122.816ZM127.616 17.488L127.2 13.616C127.584 12.2293 128.214 11.1733 129.088 10.448C129.963 9.72265 131.051 9.35999 132.352 9.35999C132.758 9.35999 133.056 9.40265 133.248 9.48799V13.968C133.142 13.9253 132.992 13.904 132.8 13.904C132.608 13.8827 132.374 13.872 132.096 13.872C130.56 13.872 129.43 14.1493 128.704 14.704C127.979 15.2373 127.616 16.1653 127.616 17.488Z" 
                fill="currentColor"
              />
            </svg>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm">Select the perfect plan for your creative needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`p-5 ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="text-xs font-semibold text-primary mb-2">MOST POPULAR</div>
              )}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{plan.billing}</p>
              <p className="text-xl font-bold mb-4">{plan.price}</p>
              
              <Button className="w-full mb-4" size="sm" variant={plan.popular ? "default" : "outline"}>
                Get Started
              </Button>

              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </main>

      <PageFooter />
    </div>
  );
}
