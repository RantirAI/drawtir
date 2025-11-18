import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import loginBackground from "@/assets/login-background.jpg";

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
          src={loginBackground} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        {/* Drawtir Logo Overlay */}
        <div className="absolute top-8 left-8">
          <svg 
            width="100" 
            height="22" 
            viewBox="0 0 134 29" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-90"
          >
            <path 
              d="M0 25.3158V16.8596C0 14.4035 3.41632 14.4035 4.63643 14.7719C7.30206 15.7896 7.9826 19.0609 8.13875 21.6454C8.39888 18.8079 9.7967 16.8476 10.615 16.1228C12.5561 14.4035 15.8208 14.4444 17.6916 14.4035C15.7395 14.4035 12.5672 13.7045 11.3471 12.807C8.53743 10.7404 8.15241 7.58209 8.15761 5.46496C8.01196 8.69057 6.97258 10.927 6.36842 11.6491C4.58861 14.0105 1.91462 13.9158 0.611804 13.6144C0.229751 13.526 0 13.1693 0 12.7771V3C0 2.44772 0.447715 2 0.999999 2H10.615C19.107 2.29474 21.718 9.73684 21.962 13.4211C22.5477 22.2632 16.2275 26.3158 11.9571 26.3158H1C0.447715 26.3158 0 25.8681 0 25.3158Z" 
              fill="#ffffff"
            />
            <path 
              d="M122.816 26V9.67999H127.52V13.52H127.616V26H122.816ZM127.616 17.488L127.2 13.616C127.584 12.2293 128.214 11.1733 129.088 10.448C129.963 9.72265 131.051 9.35999 132.352 9.35999C132.758 9.35999 133.056 9.40265 133.248 9.48799V13.968C133.142 13.9253 132.992 13.904 132.8 13.904C132.608 13.8827 132.374 13.872 132.096 13.872C130.56 13.872 129.43 14.1493 128.704 14.704C127.979 15.2373 127.616 16.1653 127.616 17.488Z" 
              fill="#ffffff"
            />
            <path 
              d="M115.151 26V9.68001H119.951V26H115.151ZM114.991 7.50401V2.32001H120.111V7.50401H114.991Z" 
              fill="#ffffff"
            />
            <path 
              d="M110.543 26.352C108.452 26.352 106.895 25.8507 105.871 24.848C104.868 23.824 104.367 22.2773 104.367 20.208V6.03199L109.167 4.23999V20.368C109.167 21.0933 109.369 21.6373 109.775 22C110.18 22.3627 110.809 22.544 111.663 22.544C111.983 22.544 112.281 22.512 112.559 22.448C112.836 22.384 113.113 22.3093 113.391 22.224V25.872C113.113 26.0213 112.719 26.1387 112.207 26.224C111.716 26.3093 111.161 26.352 110.543 26.352ZM101.327 13.328V9.67999H113.391V13.328H101.327Z" 
              fill="#ffffff"
            />
            <path 
              d="M81.0258 26L76.0338 9.67999H81.0898L83.5858 21.072H83.4578L86.5938 9.67999H91.0737L94.2418 21.072H94.1138L96.5778 9.67999H101.506L96.5138 26H91.9058L88.7058 14.64H88.8338L85.6338 26H81.0258Z" 
              fill="#ffffff"
            />
            <path 
              d="M63.3178 26.288C61.4618 26.288 59.8618 25.872 58.5178 25.04C57.1952 24.208 56.1711 23.0667 55.4458 21.616C54.7418 20.1653 54.3898 18.5227 54.3898 16.688C54.3898 14.832 54.7525 13.1787 55.4778 11.728C56.2245 10.2773 57.2698 9.13599 58.6138 8.30399C59.9792 7.47199 61.5792 7.05599 63.4138 7.05599C65.3125 7.05599 66.9338 7.45066 68.2778 8.23999C69.6432 9.00799 70.6885 10.0853 71.4138 11.472C72.1605 12.8587 72.5338 14.448 72.5338 16.24C72.5338 16.4533 72.5232 16.688 72.5018 16.944C72.5018 17.1787 72.4912 17.424 72.4698 17.68H58.5498V14.576H68.8858L67.3178 15.536C67.3178 14.448 67.1471 13.5093 66.8058 12.72C66.4645 11.9093 65.9738 11.2827 65.3338 10.84C64.6938 10.3973 63.9258 10.176 63.0298 10.176C62.1125 10.176 61.3125 10.4 60.6298 10.848C59.9685 11.2747 59.4565 11.8933 59.0938 12.704C58.7525 13.4933 58.5818 14.4213 58.5818 15.488V16.784C58.5818 17.9147 58.7738 18.9067 59.1578 19.76C59.5632 20.592 60.1285 21.2293 60.8538 21.672C61.5792 22.1147 62.4325 22.336 63.4138 22.336C64.2245 22.336 64.9605 22.1787 65.6218 21.864C66.2832 21.5493 66.9018 21.0667 67.4778 20.416L70.5498 22.656C69.7605 23.7013 68.7365 24.528 67.4778 25.136C66.2192 25.7227 64.8325 26.016 63.3178 26.016V26.288Z" 
              fill="#ffffff"
            />
            <path 
              d="M40.3353 26L35.3433 9.67999H40.3993L42.8953 21.072H42.7673L45.9033 9.67999H50.3833L53.5513 21.072H53.4233L55.8873 9.67999H60.8153L55.8233 26H51.2153L48.0153 14.64H48.1433L44.9433 26H40.3353Z" 
              fill="#ffffff"
            />
            <path 
              d="M24.6259 26V2.32001H29.4259V26H24.6259Z" 
              fill="#ffffff"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
