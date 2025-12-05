import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { CreditCard, Crown, Sparkles, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const { 
    subscribed, 
    priceId, 
    subscriptionEnd, 
    getCurrentTier, 
    createCheckout, 
    openCustomerPortal,
  } = useSubscription();

  const currentTier = getCurrentTier();
  const isStarterPlan = priceId === SUBSCRIPTION_TIERS.starter.price_id;
  const isSDKPlan = priceId === SUBSCRIPTION_TIERS.sdk_whitelabel.price_id;

  const handleUpgrade = async () => {
    try {
      await createCheckout(SUBSCRIPTION_TIERS.sdk_whitelabel.price_id);
    } catch (error: any) {
      toast.error("Error creating checkout: " + error.message);
    }
  };

  const handleManageBilling = async () => {
    try {
      await openCustomerPortal();
    } catch (error: any) {
      toast.error("Error opening portal: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Current Plan Info */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Plan</span>
              <Badge variant={subscribed ? "default" : "secondary"} className="gap-1">
                {subscribed && <Crown className="h-3 w-3" />}
                {subscribed ? (currentTier?.name || "Active") : "No Plan"}
              </Badge>
            </div>
            
            {subscribed && subscriptionEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next billing</span>
                <span className="text-sm font-medium">
                  {format(new Date(subscriptionEnd), "MMM d, yyyy")}
                </span>
              </div>
            )}

            {subscribed && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing cycle</span>
                <span className="text-sm font-medium">
                  {currentTier?.interval === "month" ? "Monthly" : "Yearly"}
                </span>
              </div>
            )}

            {subscribed && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <RefreshCw className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  Auto-renews on billing date
                </span>
              </div>
            )}
          </div>

          {/* Upgrade Option - Only show if on Starter plan */}
          {subscribed && isStarterPlan && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Upgrade Available</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Unlock SDK Whitelabel features with the extended license for commercial use.
              </p>
              <Button 
                onClick={handleUpgrade} 
                className="w-full gap-2"
                size="sm"
              >
                <Crown className="h-4 w-4" />
                Upgrade to SDK Whitelabel
              </Button>
            </div>
          )}

          {/* SDK Plan Benefits */}
          {subscribed && isSDKPlan && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">SDK Whitelabel Plan</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You have full access to commercial embedding and MIT Extended License.
              </p>
            </div>
          )}

          {/* Manage Billing Section */}
          {subscribed && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Update your payment method or view invoices:
              </p>
              <Button 
                variant="outline" 
                onClick={handleManageBilling} 
                className="w-full gap-2"
                size="sm"
              >
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </Button>
            </div>
          )}

          {!subscribed && (
            <Button 
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/pricing";
              }} 
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              View Plans
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
