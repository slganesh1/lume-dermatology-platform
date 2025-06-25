import { ExpertDashboard } from "@/components/expert-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

export default function ExpertValidation() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-amber-600" />
            <CardTitle>Access Required</CardTitle>
            <CardDescription>Please log in to access expert validation</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!["expert", "doctor"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <CardTitle>Expert Access Required</CardTitle>
            <CardDescription>
              This section is only accessible to expert medical professionals
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expert Validation Center</h1>
            <p className="text-gray-600">Review and validate AI skin analysis results</p>
          </div>
        </div>
      </div>
      
      <ExpertDashboard expertId={user.id} />
    </div>
  );
}