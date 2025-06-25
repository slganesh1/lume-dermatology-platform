import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkinAnalysis } from "@shared/schema";

export default function TestProfilePage() {
  const { user } = useAuth();

  // Direct query to test skin analyses API
  const { data: skinAnalyses = [], isLoading } = useQuery<SkinAnalysis[]>({
    queryKey: [`/api/skin-analyses/patient/11`],
    enabled: !!user,
  });

  console.log('Test Profile - User:', user);
  console.log('Test Profile - Skin Analyses:', skinAnalyses);
  console.log('Test Profile - Is Loading:', isLoading);

  if (isLoading) {
    return <div>Loading test profile...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Profile - Debug View</h1>
      <p>User: {user?.username} (ID: {user?.id})</p>
      <p>Analyses found: {skinAnalyses.length}</p>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Skin Analyses (Raw Data)</CardTitle>
        </CardHeader>
        <CardContent>
          {skinAnalyses.length === 0 ? (
            <p>No skin analyses found</p>
          ) : (
            <div className="space-y-4">
              {skinAnalyses.map((analysis) => (
                <div key={analysis.id} className="border p-4 rounded">
                  <p><strong>ID:</strong> {analysis.id}</p>
                  <p><strong>Validation Status:</strong> {analysis.validationStatus}</p>
                  <p><strong>Expert Results:</strong> {analysis.expertResults ? 'Yes' : 'No'}</p>
                  <p><strong>Created:</strong> {analysis.createdAt?.toString()}</p>
                  
                  {/* Force render button for every analysis */}
                  <Button 
                    className="mt-2 bg-green-600 text-white"
                    onClick={() => console.log('Clicked analysis:', analysis.id)}
                  >
                    TEST BUTTON {analysis.id}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}