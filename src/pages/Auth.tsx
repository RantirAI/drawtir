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
import madeByRantir from "@/assets/made-by-rantir.svg";

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
            <svg width="98" height="22" viewBox="0 0 98 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M90.276 19.1112V7.11522H93.7336V9.93781H93.8042V19.1112H90.276ZM93.8042 12.8545L93.4984 10.0084C93.7807 8.9891 94.2433 8.21289 94.8862 7.67974C95.5291 7.14658 96.3289 6.88 97.2854 6.88C97.5833 6.88 97.8029 6.91137 97.944 6.97409V10.2671C97.8656 10.2357 97.7558 10.2201 97.6147 10.2201C97.4736 10.2044 97.3011 10.1965 97.0972 10.1965C95.9682 10.1965 95.1371 10.4004 94.6039 10.8081C94.0708 11.2001 93.8042 11.8823 93.8042 12.8545Z" fill="white"/>
              <path d="M84.6417 19.1113V7.11528H88.17V19.1113H84.6417ZM84.5241 5.51581V1.70532H88.2876V5.51581H84.5241Z" fill="white"/>
              <path d="M81.2543 19.37C79.7175 19.37 78.5728 19.0015 77.8201 18.2645C77.0831 17.5118 76.7146 16.3749 76.7146 14.8538V4.43378L80.2428 3.11658V14.9714C80.2428 15.5046 80.3918 15.9045 80.6897 16.171C80.9877 16.4376 81.4503 16.5709 82.0775 16.5709C82.3127 16.5709 82.5323 16.5474 82.7361 16.5003C82.94 16.4533 83.1438 16.3984 83.3477 16.3357V19.0171C83.1438 19.1269 82.8537 19.2132 82.4774 19.2759C82.1167 19.3386 81.709 19.37 81.2543 19.37ZM74.48 9.7967V7.11524H83.3477V9.7967H74.48Z" fill="white"/>
              <path d="M59.5579 19.1112L55.8885 7.11523H59.6049L61.4396 15.4889H61.3455L63.6506 7.11523H66.9436L69.2723 15.4889H69.1782L70.9893 7.11523H74.6116L70.9423 19.1112H67.5552L65.203 10.7611H65.2971L62.945 19.1112H59.5579Z" fill="white"/>
              <path d="M52.6412 19.1112C52.5471 18.7662 52.4765 18.3977 52.4295 18.0057C52.3981 17.6137 52.3824 17.1589 52.3824 16.6414H52.2883V10.9728C52.2883 10.4866 52.1237 10.1103 51.7944 9.84372C51.4808 9.56146 51.0103 9.42033 50.3831 9.42033C49.7872 9.42033 49.3089 9.52226 48.9483 9.72611C48.6033 9.92997 48.3759 10.2279 48.2662 10.6199H44.9026C45.0594 9.53794 45.6161 8.64412 46.5726 7.93847C47.5291 7.23283 48.8385 6.88 50.5007 6.88C52.2256 6.88 53.5428 7.26419 54.4523 8.03256C55.3618 8.80093 55.8166 9.90644 55.8166 11.3491V16.6414C55.8166 17.0335 55.8401 17.4333 55.8871 17.841C55.9499 18.2331 56.0439 18.6565 56.1694 19.1112H52.6412ZM48.4543 19.3464C47.2626 19.3464 46.3139 19.0485 45.6082 18.4526C44.9026 17.841 44.5497 17.0335 44.5497 16.0299C44.5497 14.9165 44.9653 14.0227 45.7964 13.3484C46.6432 12.6585 47.8192 12.2116 49.3246 12.0077L52.8293 11.5138V13.5601L49.9127 14.007C49.2854 14.1011 48.8228 14.2736 48.5249 14.5245C48.2269 14.7754 48.078 15.1204 48.078 15.5595C48.078 15.9515 48.2191 16.2494 48.5014 16.4533C48.7836 16.6571 49.16 16.7591 49.6304 16.7591C50.3674 16.7591 50.9946 16.563 51.5121 16.171C52.0296 15.7633 52.2883 15.2929 52.2883 14.7597L52.6176 16.6414C52.2727 17.5353 51.7473 18.2096 51.0417 18.6643C50.336 19.1191 49.4736 19.3464 48.4543 19.3464Z" fill="white"/>
              <path d="M36.8608 19.1112V7.11522H40.3185V9.93781H40.389V19.1112H36.8608ZM40.389 12.8545L40.0833 10.0084C40.3655 8.9891 40.8281 8.21289 41.471 7.67974C42.114 7.14658 42.9137 6.88 43.8702 6.88C44.1682 6.88 44.3877 6.91137 44.5288 6.97409V10.2671C44.4504 10.2357 44.3407 10.2201 44.1995 10.2201C44.0584 10.2044 43.8859 10.1965 43.6821 10.1965C42.553 10.1965 41.7219 10.4004 41.1888 10.8081C40.6556 11.2001 40.389 11.8823 40.389 12.8545Z" fill="white"/>
              <path d="M21.7633 19.1113V16.2887H26.0442C27.2673 16.2887 28.3023 16.0457 29.149 15.5595C30.0115 15.0577 30.6623 14.3756 31.1013 13.5132C31.5561 12.6507 31.7835 11.6628 31.7835 10.5495C31.7835 9.45178 31.5639 8.4874 31.1248 7.6563C30.6858 6.82521 30.035 6.17444 29.1726 5.70401C28.3258 5.23358 27.283 4.99837 26.0442 4.99837H21.8338V2.17578H26.0442C27.9416 2.17578 29.5959 2.52076 31.0072 3.21073C32.4185 3.88501 33.5084 4.85724 34.2767 6.1274C35.0608 7.38188 35.4528 8.87158 35.4528 10.5965C35.4528 12.3214 35.0608 13.8268 34.2767 15.1126C33.4927 16.3828 32.395 17.3707 30.9837 18.0763C29.5881 18.7663 27.9494 19.1113 26.0677 19.1113H21.7633ZM19.5522 19.1113V2.17578H23.1746V19.1113H19.5522Z" fill="white"/>
              <path d="M0.108521 18.2272V12.005C0.108521 10.3888 2.43783 10.3888 3.26972 10.6312C5.0872 11.3009 5.5512 13.4534 5.65767 15.154C5.83503 13.2869 6.78809 11.997 7.34601 11.5201C8.66948 10.3888 10.8954 10.4157 12.171 10.3888C10.84 10.3888 8.67704 9.9288 7.84515 9.33828C5.92949 7.97846 5.66699 5.90024 5.67053 4.50715C5.57122 6.62963 4.86256 8.10122 4.45063 8.57638C2.98649 10.4511 0.634836 9.97321 0.108521 9.74232V2.22717H7.34601C13.136 2.42111 14.9163 7.31808 15.0826 9.74232C15.4819 15.5605 11.1727 18.2272 8.2611 18.2272H0.108521Z" fill="white"/>
            </svg>
          </div>

          <h2 className="text-xl font-semibold mb-2 text-white">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-white/80 text-sm mb-6">
            {isLogin
              ? "Sign in to continue to your projects"
              : "Get started with your creative journey"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-white">Email</Label>
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
              <Label htmlFor="password" className="text-xs text-white">Password</Label>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/pricing")}
              className="text-white hover:text-white"
            >
              See our pricing
            </Button>
          </div>

          {/* Made with Rantir Studio */}
          <div className="mt-6 text-center">
            <img src={madeByRantir} alt="Made with Rantir Studio" className="mx-auto h-8 opacity-80" />
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
        <div className="absolute inset-0 bg-black/20" />
        {/* Drawtir Logo Overlay */}
        <div className="absolute top-8 left-8">
          <svg width="98" height="22" viewBox="0 0 98 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
            <path d="M90.276 19.1112V7.11522H93.7336V9.93781H93.8042V19.1112H90.276ZM93.8042 12.8545L93.4984 10.0084C93.7807 8.9891 94.2433 8.21289 94.8862 7.67974C95.5291 7.14658 96.3289 6.88 97.2854 6.88C97.5833 6.88 97.8029 6.91137 97.944 6.97409V10.2671C97.8656 10.2357 97.7558 10.2201 97.6147 10.2201C97.4736 10.2044 97.3011 10.1965 97.0972 10.1965C95.9682 10.1965 95.1371 10.4004 94.6039 10.8081C94.0708 11.2001 93.8042 11.8823 93.8042 12.8545Z" fill="white"/>
            <path d="M84.6417 19.1113V7.11528H88.17V19.1113H84.6417ZM84.5241 5.51581V1.70532H88.2876V5.51581H84.5241Z" fill="white"/>
            <path d="M81.2543 19.37C79.7175 19.37 78.5728 19.0015 77.8201 18.2645C77.0831 17.5118 76.7146 16.3749 76.7146 14.8538V4.43378L80.2428 3.11658V14.9714C80.2428 15.5046 80.3918 15.9045 80.6897 16.171C80.9877 16.4376 81.4503 16.5709 82.0775 16.5709C82.3127 16.5709 82.5323 16.5474 82.7361 16.5003C82.94 16.4533 83.1438 16.3984 83.3477 16.3357V19.0171C83.1438 19.1269 82.8537 19.2132 82.4774 19.2759C82.1167 19.3386 81.709 19.37 81.2543 19.37ZM74.48 9.7967V7.11524H83.3477V9.7967H74.48Z" fill="white"/>
            <path d="M59.5579 19.1112L55.8885 7.11523H59.6049L61.4396 15.4889H61.3455L63.6506 7.11523H66.9436L69.2723 15.4889H69.1782L70.9893 7.11523H74.6116L70.9423 19.1112H67.5552L65.203 10.7611H65.2971L62.945 19.1112H59.5579Z" fill="white"/>
            <path d="M52.6412 19.1112C52.5471 18.7662 52.4765 18.3977 52.4295 18.0057C52.3981 17.6137 52.3824 17.1589 52.3824 16.6414H52.2883V10.9728C52.2883 10.4866 52.1237 10.1103 51.7944 9.84372C51.4808 9.56146 51.0103 9.42033 50.3831 9.42033C49.7872 9.42033 49.3089 9.52226 48.9483 9.72611C48.6033 9.92997 48.3759 10.2279 48.2662 10.6199H44.9026C45.0594 9.53794 45.6161 8.64412 46.5726 7.93847C47.5291 7.23283 48.8385 6.88 50.5007 6.88C52.2256 6.88 53.5428 7.26419 54.4523 8.03256C55.3618 8.80093 55.8166 9.90644 55.8166 11.3491V16.6414C55.8166 17.0335 55.8401 17.4333 55.8871 17.841C55.9499 18.2331 56.0439 18.6565 56.1694 19.1112H52.6412ZM48.4543 19.3464C47.2626 19.3464 46.3139 19.0485 45.6082 18.4526C44.9026 17.841 44.5497 17.0335 44.5497 16.0299C44.5497 14.9165 44.9653 14.0227 45.7964 13.3484C46.6432 12.6585 47.8192 12.2116 49.3246 12.0077L52.8293 11.5138V13.5601L49.9127 14.007C49.2854 14.1011 48.8228 14.2736 48.5249 14.5245C48.2269 14.7754 48.078 15.1204 48.078 15.5595C48.078 15.9515 48.2191 16.2494 48.5014 16.4533C48.7836 16.6571 49.16 16.7591 49.6304 16.7591C50.3674 16.7591 50.9946 16.563 51.5121 16.171C52.0296 15.7633 52.2883 15.2929 52.2883 14.7597L52.6176 16.6414C52.2727 17.5353 51.7473 18.2096 51.0417 18.6643C50.336 19.1191 49.4736 19.3464 48.4543 19.3464Z" fill="white"/>
            <path d="M36.8608 19.1112V7.11522H40.3185V9.93781H40.389V19.1112H36.8608ZM40.389 12.8545L40.0833 10.0084C40.3655 8.9891 40.8281 8.21289 41.471 7.67974C42.114 7.14658 42.9137 6.88 43.8702 6.88C44.1682 6.88 44.3877 6.91137 44.5288 6.97409V10.2671C44.4504 10.2357 44.3407 10.2201 44.1995 10.2201C44.0584 10.2044 43.8859 10.1965 43.6821 10.1965C42.553 10.1965 41.7219 10.4004 41.1888 10.8081C40.6556 11.2001 40.389 11.8823 40.389 12.8545Z" fill="white"/>
            <path d="M21.7633 19.1113V16.2887H26.0442C27.2673 16.2887 28.3023 16.0457 29.149 15.5595C30.0115 15.0577 30.6623 14.3756 31.1013 13.5132C31.5561 12.6507 31.7835 11.6628 31.7835 10.5495C31.7835 9.45178 31.5639 8.4874 31.1248 7.6563C30.6858 6.82521 30.035 6.17444 29.1726 5.70401C28.3258 5.23358 27.283 4.99837 26.0442 4.99837H21.8338V2.17578H26.0442C27.9416 2.17578 29.5959 2.52076 31.0072 3.21073C32.4185 3.88501 33.5084 4.85724 34.2767 6.1274C35.0608 7.38188 35.4528 8.87158 35.4528 10.5965C35.4528 12.3214 35.0608 13.8268 34.2767 15.1126C33.4927 16.3828 32.395 17.3707 30.9837 18.0763C29.5881 18.7663 27.9494 19.1113 26.0677 19.1113H21.7633ZM19.5522 19.1113V2.17578H23.1746V19.1113H19.5522Z" fill="white"/>
            <path d="M0.108521 18.2272V12.005C0.108521 10.3888 2.43783 10.3888 3.26972 10.6312C5.0872 11.3009 5.5512 13.4534 5.65767 15.154C5.83503 13.2869 6.78809 11.997 7.34601 11.5201C8.66948 10.3888 10.8954 10.4157 12.171 10.3888C10.84 10.3888 8.67704 9.9288 7.84515 9.33828C5.92949 7.97846 5.66699 5.90024 5.67053 4.50715C5.57122 6.62963 4.86256 8.10122 4.45063 8.57638C2.98649 10.4511 0.634836 9.97321 0.108521 9.74232V2.22717H7.34601C13.136 2.42111 14.9163 7.31808 15.0826 9.74232C15.4819 15.5605 11.1727 18.2272 8.2611 18.2272H0.108521Z" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
