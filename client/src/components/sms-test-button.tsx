import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

export function SMSTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testSMS = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-sms", {
        method: "POST",
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "SMS Test Successful",
          description: data.message,
        });
      } else {
        const isVerificationError = data.message?.includes('not configured');
        toast({
          title: isVerificationError ? "SMS Setup Required" : "SMS Test Failed",
          description: isVerificationError 
            ? "Phone number needs verification in Twilio Console for trial accounts"
            : data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "SMS Test Error",
        description: "Failed to test SMS service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={testSMS}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      {isLoading ? "Testing..." : "Test SMS Alert"}
    </Button>
  );
}