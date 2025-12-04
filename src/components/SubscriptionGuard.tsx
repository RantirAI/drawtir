import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const navigate = useNavigate();
  const { subscribed, isLoading: subscriptionLoading } = useSubscription();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsAuthenticated(true);
      setIsAuthChecking(false);
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthChecking && isAuthenticated && !subscriptionLoading && !subscribed) {
      navigate('/pricing');
    }
  }, [isAuthChecking, isAuthenticated, subscriptionLoading, subscribed, navigate]);

  if (isAuthChecking || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !subscribed) {
    return null;
  }

  return <>{children}</>;
};
