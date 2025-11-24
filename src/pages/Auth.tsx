import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import authBackground from "@/assets/auth-background.jpg";
import drawtirLogo from "@/assets/drawtir-login-logo.svg";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate("/");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        
        if (error) throw error;
        
        // Store flag for onboarding
        if (data.user) {
          localStorage.setItem("showOnboarding", "true");
        }
        
        toast.success("Account created! Welcome aboard!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 bg-background">
        <div className="max-w-md w-full mx-auto">
          {/* Rantir Studio Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Rantir Studio</h1>
          </div>

          <h2 className="text-xl font-semibold mb-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {isLogin
              ? "Sign in to continue to your projects"
              : "Get started with your creative journey"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/pricing" className="text-xs text-primary hover:underline">
              See our pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image with Logo */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src={authBackground} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        {/* Drawtir Logo Overlay */}
        <div className="absolute top-8 left-8">
          <img 
            src={drawtirLogo} 
            alt="Drawtir" 
            className="w-64 opacity-90"
          />
        </div>
      </div>
    </div>
  );
}
