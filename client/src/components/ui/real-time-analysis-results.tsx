import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalysisResult {
  id: number;
  patientId: number;
  imageUrl: string;
  results: any;
  expertResults?: any;
  expertComments?: string;
  validationStatus: string;
  createdAt: string;
  reviewedAt?: string;
}

export function RealTimeAnalysisResults() {
  const { user } = useAuth();
  const { isConnected, subscribeToPatient, lastMessage } = useWebSocket();
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  // First get the patient record for this user
  const { data: patientData } = useQuery<any>({
    queryKey: ['/api/patients/user', user?.id],
    enabled: !!user?.id,
  });

  const patientId = patientData?.id;

  // Fetch patient's skin analyses using the correct patient ID with aggressive refresh
  const { data: analyses, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/skin-analyses/patient', patientId],
    enabled: !!patientId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Subscribe to real-time updates for this patient
  useEffect(() => {
    if (patientId && isConnected) {
      subscribeToPatient(patientId);
    }
  }, [patientId, isConnected, subscribeToPatient]);

  // Handle real-time WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'analysis_validated') {
      setRealtimeUpdates(prev => [...prev, {
        id: Date.now(),
        message: lastMessage.message,
        timestamp: lastMessage.timestamp,
        analysisId: lastMessage.analysisId
      }]);
      
      // Refetch analyses to get updated data
      refetch();
    }
  }, [lastMessage, refetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Expert Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'modified':
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Expert Modified</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />AI Analysis</Badge>;
    }
  };

  const hasExpertValidation = (analysis: AnalysisResult) => {
    // Log analysis data for debugging
    console.log('DEBUG: Analysis data:', {
      id: analysis.id,
      validationStatus: analysis.validationStatus,
      expertResults: analysis.expertResults,
      hasExpertResults: !!(analysis.expertResults && Array.isArray(analysis.expertResults) && analysis.expertResults.length > 0)
    });
    
    // Check if expert validation exists - prioritize expertResults over validationStatus
    const hasValidation = (
      (analysis.expertResults && Array.isArray(analysis.expertResults) && analysis.expertResults.length > 0) ||
      analysis.validationStatus === 'approved' || 
      analysis.validationStatus === 'modified'
    );
    
    console.log('DEBUG: Has validation:', hasValidation);
    return hasValidation;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time notification banner */}
      {realtimeUpdates.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Real-time Updates</span>
          </div>
          {realtimeUpdates.slice(-3).map((update) => (
            <div key={update.id} className="mt-2 text-sm text-green-700">
              • {update.message} ({new Date(update.timestamp).toLocaleTimeString()})
            </div>
          ))}
        </div>
      )}

      {/* WebSocket connection status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Analysis Results</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates Active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Analysis Results */}
      {analyses && analyses.length > 0 ? (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Skin Analysis #{analysis.id}
                  </CardTitle>
                  {getStatusBadge(analysis.validationStatus)}
                </div>
                <p className="text-sm text-gray-600">
                  Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}
                  {analysis.reviewedAt && (
                    <span> • Reviewed on {new Date(analysis.reviewedAt).toLocaleDateString()}</span>
                  )}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Analysis Image */}
                <div className="flex justify-center">
                  <img 
                    src={analysis.imageUrl} 
                    alt="Skin analysis" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>

                {/* Expert Results - Show if validated */}
                {hasExpertValidation(analysis) ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Expert Validation Complete</h4>
                    
                    {/* Display expert results array */}
                    {analysis.expertResults && Array.isArray(analysis.expertResults) && analysis.expertResults.length > 0 && (
                      <div className="space-y-3">
                        {analysis.expertResults.map((result: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded border">
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
                      </div>
                    )}
                    
                    {analysis.expertComments && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border">
                        <strong>Expert Comments:</strong>
                        <p className="text-sm mt-1">{analysis.expertComments}</p>
                      </div>
                    )}
                    
                    <Button className="mt-3 w-full" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Detailed Results
                    </Button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">
                        Awaiting Expert Review
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      Your analysis is being reviewed by our medical experts. 
                      You'll receive a real-time notification when complete.
                    </p>
                    
                    {/* Show AI results while waiting */}
                    {analysis.results && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <strong>Preliminary AI Analysis:</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Initial analysis complete - awaiting expert validation
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyses Yet</h3>
            <p className="text-gray-600">
              Upload your first skin image to get started with AI-powered analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}