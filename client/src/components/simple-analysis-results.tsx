import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

export function SimpleAnalysisResults() {
  const { user } = useAuth();

  // Get patient data
  const { data: patientData } = useQuery<any>({
    queryKey: ['/api/patients/user', user?.id],
    enabled: !!user?.id,
  });

  // Get analyses for this patient
  const { data: analyses, isLoading } = useQuery<any>({
    queryKey: ['/api/skin-analyses/patient', patientData?.id],
    enabled: !!patientData?.id,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading your analysis results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-1">No Analyses Yet</h3>
            <p className="text-sm text-muted-foreground">
              Upload a skin image to get started with AI analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Skin Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {analyses.map((analysis: any) => (
          <div key={analysis.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Analysis #{analysis.id}</h3>
              <div className="text-sm text-gray-500">
                {new Date(analysis.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Analysis Image */}
            <div className="mb-4">
              <img
                src={analysis.imageUrl}
                alt="Skin analysis"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>

            {/* Validation Status Check */}
            {analysis.validationStatus === 'approved' || 
             (analysis.expertResults && analysis.expertResults.length > 0) ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">Expert Validation Complete</h4>
                </div>
                
                {analysis.expertResults && analysis.expertResults.map((result: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-lg">{result.condition}</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {Math.round(result.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                    
                    {result.severity && (
                      <div className="mb-2">
                        <strong>Severity:</strong> {result.severity}
                      </div>
                    )}
                    
                    {result.description && (
                      <div className="mb-2">
                        <strong>Description:</strong>
                        <p className="text-sm mt-1">{result.description}</p>
                      </div>
                    )}
                    
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="mb-2">
                        <strong>Treatment Recommendations:</strong>
                        <ul className="list-disc list-inside ml-2 text-sm">
                          {result.recommendations.map((rec: string, recIdx: number) => (
                            <li key={recIdx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.bestPractices && result.bestPractices.length > 0 && (
                      <div>
                        <strong>Best Practices:</strong>
                        <ul className="list-disc list-inside ml-2 text-sm">
                          {result.bestPractices.map((practice: string, practiceIdx: number) => (
                            <li key={practiceIdx}>{practice}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                {analysis.expertComments && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border">
                    <strong>Expert Comments:</strong>
                    <p className="text-sm mt-1">{analysis.expertComments}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Expert Review in Progress
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Our medical experts are reviewing your analysis. You'll be notified when the validation is complete.
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}