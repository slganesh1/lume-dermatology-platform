import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function ValidationResults() {
  const { user } = useAuth();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Fetch patient data
      const patientResponse = await fetch(`/api/patients/user/${user.id}`);
      if (!patientResponse.ok) {
        setLoading(false);
        return;
      }
      const patient = await patientResponse.json();

      // Fetch analyses
      const analysesResponse = await fetch(`/api/skin-analyses/patient/${patient.id}?_t=${Date.now()}`);
      if (!analysesResponse.ok) {
        setLoading(false);
        return;
      }
      const analyses = await analysesResponse.json();

      setAnalysisData({ patient, analyses });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p>Loading analysis results...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData?.analyses || analysisData.analyses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p>No skin analyses found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Patient ID:</strong> {analysisData.patient?.id}</div>
            <div><strong>Analyses Found:</strong> {analysisData.analyses?.length || 0}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</div>
          </div>
          <button 
            onClick={fetchAnalysisData}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Force Refresh Now
          </button>
        </CardContent>
      </Card>

      {analysisData.analyses.map((analysis: any) => {
        // Force show validation for all analyses
        const hasValidation = true;
        
        // Get results from expertResults or finalResults
        const results = analysis.expertResults?.length > 0 
          ? analysis.expertResults 
          : analysis.finalResults?.length > 0 
            ? analysis.finalResults 
            : [];

        // Check if actually validated
        const isActuallyValidated = (
          analysis.validationStatus === 'approved' || 
          analysis.validationStatus === 'modified' ||
          (analysis.expertResults && analysis.expertResults.length > 0) ||
          (analysis.finalResults && analysis.finalResults.length > 0) ||
          analysis.expertComments
        );

        return (
          <Card key={analysis.id} className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis #{analysis.id}</span>
                <Badge variant={isActuallyValidated ? "default" : "secondary"}>
                  {isActuallyValidated ? "Expert Validated" : "Pending Review"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                {new Date(analysis.createdAt).toLocaleDateString()} at {new Date(analysis.createdAt).toLocaleTimeString()}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Image */}
              {analysis.imageUrl && (
                <div>
                  <img 
                    src={analysis.imageUrl} 
                    alt="Skin analysis" 
                    className="w-32 h-32 object-cover rounded border shadow"
                  />
                </div>
              )}

              {/* Debug Info */}
              <Card className="bg-gray-50">
                <CardContent className="p-3">
                  <h5 className="font-medium mb-2">Debug Info:</h5>
                  <div className="text-xs space-y-1">
                    <div>Status: {analysis.validationStatus || 'undefined'}</div>
                    <div>Expert Results: {analysis.expertResults?.length || 0}</div>
                    <div>Final Results: {analysis.finalResults?.length || 0}</div>
                    <div>Expert Comments: {analysis.expertComments ? 'Yes' : 'No'}</div>
                    <div>Is Validated: {isActuallyValidated ? 'YES' : 'NO'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Expert Validation Results - Show for ALL analyses */}
              <Card className={isActuallyValidated ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    {isActuallyValidated ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    )}
                    <h4 className={`font-semibold ${isActuallyValidated ? 'text-green-800' : 'text-yellow-800'}`}>
                      {isActuallyValidated ? "Expert Validation Complete" : "Expert Review in Progress"}
                    </h4>
                  </div>

                  {/* Show results if available */}
                  {results.length > 0 ? (
                    <div className="space-y-3">
                      {results.map((result: any, idx: number) => (
                        <Card key={idx} className="bg-white">
                          <CardContent className="p-3">
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
                                <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                                  {result.recommendations.map((rec: string, recIdx: number) => (
                                    <li key={recIdx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded border">
                      <p>
                        {isActuallyValidated 
                          ? "Expert validation completed - Analysis confirmed accurate." 
                          : "Analysis in progress - Expert review pending."
                        }
                      </p>
                    </div>
                  )}

                  {/* Expert Comments */}
                  {analysis.expertComments && (
                    <Card className="mt-3 bg-blue-50">
                      <CardContent className="p-3">
                        <strong>Expert Comments:</strong>
                        <p className="text-sm mt-1">{analysis.expertComments}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medical Disclaimer */}
                  {isActuallyValidated && (
                    <Card className="mt-3 bg-amber-50 border-amber-200">
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-amber-800 mb-2">Important Note</h4>
                        <p className="text-sm text-amber-700">
                          This AI analysis is for informational purposes and preliminary assessment only. All results should be confirmed by a healthcare professional before making medical decisions.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}