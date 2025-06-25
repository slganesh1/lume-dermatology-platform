import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClearSessionPage() {
  const handleClearAll = async () => {
    try {
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Force logout API call
      await fetch('/api/force-logout', { method: 'POST' });
      
      // Reload page to clear all state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Clear session error:', error);
      alert('Session cleared. Please refresh the page.');
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Clear All Sessions & Login Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will clear all browser cookies, localStorage, and session data.
            Use this to completely reset authentication state.
          </p>
          <Button 
            onClick={handleClearAll}
            variant="destructive"
            className="mr-2"
          >
            Clear All & Go to Login
          </Button>
          <Button 
            onClick={() => window.location.href = '/auth'}
            variant="outline"
          >
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}