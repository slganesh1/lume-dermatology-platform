import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialLoginProps {
  redirectTo?: string;
}

export function SocialLogin({ redirectTo = "/" }: SocialLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Redirect to Google OAuth endpoint
      const params = new URLSearchParams();
      if (redirectTo) {
        params.set('redirect', redirectTo);
      }
      window.location.href = `/api/auth/google?${params.toString()}`;
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Login Error",
        description: "Failed to connect to Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // Redirect to Facebook OAuth endpoint
      const params = new URLSearchParams();
      if (redirectTo) {
        params.set('redirect', redirectTo);
      }
      window.location.href = `/api/auth/facebook?${params.toString()}`;
    } catch (error) {
      console.error("Facebook login error:", error);
      toast({
        title: "Login Error",
        description: "Failed to connect to Facebook. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full"
        >
          <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
          Google
        </Button>

        <Button
          variant="outline"
          onClick={handleFacebookLogin}
          disabled={isLoading}
          className="w-full"
        >
          <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
          Facebook
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}