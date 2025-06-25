import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

export function DirectAnalysisResults() {
  const { user } = useAuth();

  // Debug: Log current user
  console.log('DirectAnalysisResults - Current user:', user);

  // Get patient data
  const { data: patientData, isLoading: patientLoading } = useQuery<any>({
    queryKey: ['/api/patients/user', user?.id],
    enabled: !!user?.id,
  });

  console.log('DirectAnalysisResults - Patient data:', patientData);
  console.log('DirectAnalysisResults - Component rendering at:', new Date().toISOString());

  // Get analyses for this patient - use custom query function with error handling
  const { data: analyses, isLoading: analysesLoading, error } = useQuery<any>({
    queryKey: [`/api/skin-analyses/patient/${patientData?.id}`],
    queryFn: async () => {
      if (!patientData?.id) return [];
      try {
        const response = await fetch(`/api/skin-analyses/patient/${patientData.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('DirectAnalysisResults - Raw API response:', data);
        return data;
      } catch (err) {
        console.error('DirectAnalysisResults - API fetch error:', err);
        throw err;
      }
    },
    enabled: !!patientData?.id,
    staleTime: 0,
    refetchInterval: 2000,
    retry: 3,
  });

  console.log('DirectAnalysisResults - Analyses data:', analyses);
  console.log('DirectAnalysisResults - Error:', error);

  if (patientLoading || analysesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading analysis results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
            <p>Error loading analyses: {error.message}</p>
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
        <CardTitle>Analysis Results (Direct)</CardTitle>
        <div className="text-sm text-muted-foreground">
          Patient ID: {patientData?.id} | User ID: {user?.id} | Count: {analyses.length}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {analyses.map((analysis: any) => {
          console.log('DirectAnalysisResults - Processing analysis:', {
            id: analysis.id,
            validationStatus: analysis.validationStatus,
            expertResults: analysis.expertResults,
            expertResultsLength: analysis.expertResults ? analysis.expertResults.length : 0
          });

          return (
            <div key={analysis.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Analysis #{analysis.id}</h3>
                <div className="text-sm text-gray-500">
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Debug info */}
              <div className="bg-gray-100 p-2 text-xs mb-4 rounded">
                Status: {analysis.validationStatus || 'null'} | 
                Expert Results: {analysis.expertResults ? analysis.expertResults.length : 0} items
              </div>

              {/* Analysis Image */}
              <div className="mb-4">
                <img
                  src={analysis.imageUrl}
                  alt="Skin analysis"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>

              {/* Force show validation if ANY validation indicators exist */}
              {(analysis.validationStatus === 'approved' || 
                analysis.validationStatus === 'modified' ||
                (analysis.expertResults && Array.isArray(analysis.expertResults) && analysis.expertResults.length > 0) ||
                (analysis.finalResults && Array.isArray(analysis.finalResults) && analysis.finalResults.length > 0) ||
                analysis.expertComments ||
                analysis.reviewedAt) ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">Expert Validation Complete</h4>
                  </div>
                  
                  {/* Show expert results - prioritize expertResults, then finalResults */}
                  {(() => {
                    const results = (analysis.expertResults && analysis.expertResults.length > 0) ? analysis.expertResults : 
                                   (analysis.finalResults && analysis.finalResults.length > 0) ? analysis.finalResults : [];
                    return results.map((result: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-lg">{result.condition}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {Math.round((result.confidence || 0) * 100)}% Confidence
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
                      </div>
                    ));
                  })()}
                  
                  {/* Show expert comments if available */}
                  {analysis.expertComments && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border">
                      <strong>Expert Comments:</strong>
                      <p className="text-sm mt-1">{analysis.expertComments}</p>
                    </div>
                  )}
                  
                  {/* If no results but validation is approved, show generic approval */}
                  {(!analysis.expertResults || analysis.expertResults.length === 0) && 
                   (!analysis.finalResults || analysis.finalResults.length === 0) && (
                    <div className="bg-white p-3 rounded border">
                      <p>Expert validation approved - Analysis confirmed accurate.</p>
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
                    Status: {analysis.validationStatus || 'pending'} | 
                    Expert Results: {analysis.expertResults ? analysis.expertResults.length : 0}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}