import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to gallery after 5 seconds
    const timer = setTimeout(() => {
      navigate("/gallery");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-md w-full bg-card/50 backdrop-blur-sm border-border/20">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-foreground">
              Subscription Successful!
            </h1>
            
            <p className="text-muted-foreground text-sm">
              Thank you for subscribing to Drawtir. Your account is now active and you have full access to all features.
            </p>
            
            <div className="pt-4 space-y-2">
              <Button 
                onClick={() => navigate("/gallery")} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll be redirected automatically in 5 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
