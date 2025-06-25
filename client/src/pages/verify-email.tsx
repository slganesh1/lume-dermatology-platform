import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setVerificationState('error');
      setMessage('Invalid verification link');
      return;
    }

    // Verify the email token
    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        
        if (response.ok) {
          if (data.alreadyVerified) {
            setVerificationState('already-verified');
            setMessage('Your email was already verified');
          } else {
            setVerificationState('success');
            setMessage('Email verified successfully! Welcome to LUME.');
            toast({
              title: "Email Verified",
              description: "Your email has been successfully verified!",
            });
          }
        } else {
          setVerificationState('error');
          setMessage(data.message || 'Verification failed');
          toast({
            title: "Verification Failed",
            description: data.message || 'Failed to verify email',
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error('Verification error:', error);
        setVerificationState('error');
        setMessage('Network error during verification');
        toast({
          title: "Verification Error",
          description: "Network error occurred during verification",
          variant: "destructive",
        });
      });
  }, [toast]);

  const handleContinue = () => {
    setLocation('/auth');
  };

  const getIcon = () => {
    switch (verificationState) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-amber-600 animate-spin" />;
      case 'success':
      case 'already-verified':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-600" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getTitle = () => {
    switch (verificationState) {
      case 'loading':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'already-verified':
        return 'Email Already Verified';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Email Verification';
    }
  };

  const getDescription = () => {
    switch (verificationState) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Your email has been verified and your account is now fully active. You can now access all LUME features.';
      case 'already-verified':
        return 'Your email address was already verified. You can continue using your account normally.';
      case 'error':
        return 'We encountered an issue verifying your email. Please try again or contact support.';
      default:
        return 'Email verification in progress.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            {getIcon()}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {getTitle()}
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              verificationState === 'success' || verificationState === 'already-verified'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : verificationState === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message}
            </div>
          )}

          {verificationState !== 'loading' && (
            <div className="space-y-3">
              <Button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
              >
                Continue to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {verificationState === 'success' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">What's next?</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                      Complete your patient profile
                    </div>
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                      Upload skin images for AI analysis
                    </div>
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                      Get expert-validated results
                    </div>
                    <div className="flex items-center text-gray-700">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                      Schedule appointments with specialists
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}