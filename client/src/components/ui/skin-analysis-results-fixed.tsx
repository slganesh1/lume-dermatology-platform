import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AnalysisResult } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SkinAnalysisResultsProps {
  patientId: number;
  patientName?: string;
  imageUrl: string;
  imageType: string;
  bodyPart?: string;
  results: AnalysisResult[];
  validationStatus?: string;
  expertComments?: string;
}

export function SkinAnalysisResults({
  patientId,
  patientName,
  imageUrl,
  imageType,
  bodyPart,
  results,
  validationStatus = "pending",
  expertComments,
}: SkinAnalysisResultsProps) {
  
  console.log("SkinAnalysisResults props:", { validationStatus, results, expertComments });
  console.log("Results array length:", results?.length);
  console.log("First result:", results?.[0]);
  
  // Always show results if we have any data - remove validation blocking
  const showResults = results && results.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {imageType === 'skin' ? 'Skin Analysis Results' : 
             imageType === 'xray' ? 'X-Ray Analysis Results' :
             imageType === 'ct' ? 'CT Scan Analysis Results' :
             imageType === 'mri' ? 'MRI Scan Analysis Results' : 'Medical Image Analysis Results'}
          </h2>
          
          {/* Validation Status Indicator */}
          <div className="mt-2">
            {validationStatus === "approved" ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Expert Approved
              </div>
            ) : validationStatus === "rejected" ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                Expert Rejected
              </div>
            ) : validationStatus === "analyzing" ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Analysis in Progress
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Pending Expert Review
              </div>
            )}
          </div>
          
          <div className="mt-1 space-y-1">
            {patientName && (
              <p className="text-sm text-gray-500">Patient: {patientName}</p>
            )}
            <p className="text-sm text-gray-500">
              Image Type: {imageType === 'skin' ? 'Skin Condition' : 
                          imageType === 'xray' ? 'X-Ray' :
                          imageType === 'ct' ? 'CT Scan' :
                          imageType === 'mri' ? 'MRI Scan' : 'Medical Image'}
            </p>
            {bodyPart && (
              <p className="text-sm text-gray-500">Body Part/Region: {bodyPart}</p>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Analyzed Image */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Analyzed Image</h3>
              <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-64 mb-4">
                <img 
                  src={imageUrl} 
                  alt="Analyzed medical image"
                  className="h-full w-full object-contain"
                />
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    View Full Size
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Full Size Image</DialogTitle>
                    <DialogDescription>
                      Detailed view of the analyzed image
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-4">
                    <img 
                      src={imageUrl} 
                      alt="Full size medical image"
                      className="max-h-[600px] max-w-full object-contain"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => window.open(imageUrl, '_blank')}>
                      Open in New Tab
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Analysis Details */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">
                Medical Assessment
              </h3>
              
              {showResults ? (
                <div className="space-y-4">
                  {/* Expert Comments */}
                  {validationStatus === "approved" && expertComments && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Expert Comments</h4>
                      <p className="text-green-700 text-sm">{expertComments}</p>
                    </div>
                  )}
                  
                  {validationStatus === "rejected" && expertComments && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Expert Review Notes</h4>
                      <p className="text-red-700 text-sm">{expertComments}</p>
                    </div>
                  )}
                  
                  {validationStatus === "pending" && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Pending Expert Review</h4>
                      <p className="text-yellow-700 text-sm">
                        This analysis is currently being reviewed by our medical experts. 
                        Results shown below are preliminary and subject to expert validation.
                      </p>
                    </div>
                  )}
                  
                  {results && results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start">
                        <div className="ml-3 flex-1">
                          <h4 className="text-md font-medium">
                            {result.condition || "Medical Analysis"}
                            {result.severity && (
                              <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                                result.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                                result.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                result.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.severity}
                              </span>
                            )}
                            {result.confidence && (
                              <span className="ml-2 text-sm text-gray-600">
                                ({Math.round(result.confidence * 100)}% confidence)
                              </span>
                            )}
                          </h4>
                          
                          {result.description && (
                            <p className="text-sm mt-2">{result.description}</p>
                          )}
                          
                          {result.recommendations && result.recommendations.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium mb-1">Recommendations:</h5>
                              <ul className="text-sm list-disc pl-5">
                                {result.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {result.bestPractices && result.bestPractices.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium mb-1">Best Practices:</h5>
                              <ul className="text-sm list-disc pl-5">
                                {result.bestPractices.map((practice, i) => (
                                  <li key={i}>{practice}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Analysis in Progress</h4>
                  <p className="text-gray-600 mb-4">
                    Your analysis is being processed. Please wait while we analyze the image.
                  </p>
                </div>
              )}
              
              {/* Action Buttons - Only show when results are available */}
              {showResults && (
                <div className="mt-6 flex flex-col space-y-3">
                  <Link href={`/appointments?patientId=${patientId}`}>
                    <Button className="w-full">
                      Schedule Appointment
                    </Button>
                  </Link>
                  <Link href={`/pharmacy?patientId=${patientId}`}>
                    <Button variant="outline" className="w-full">
                      View Recommended Treatments
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommended Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 mr-4">
                <span className="text-sm font-medium">1</span>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-800">
                  Consult with a medical specialist
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Schedule an appointment with a qualified dermatologist for professional evaluation and treatment planning.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 mr-4">
                <span className="text-sm font-medium">2</span>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-800">
                  Follow recommended treatment
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Implement the suggested treatment plan and monitor the condition's progression over time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 mr-4">
                <span className="text-sm font-medium">3</span>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-800">
                  Monitor and follow up
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Keep track of any changes and schedule follow-up consultations as recommended by your healthcare provider.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}