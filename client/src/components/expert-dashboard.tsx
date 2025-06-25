import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Clock, 
  AlertTriangle, 
  User,
  Calendar,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { SMSTestButton } from "./sms-test-button";
import { type AnalysisValidation, type AnalysisResult } from "@shared/schema";

interface ValidationDetailsType {
  skinAnalysis: {
    id: number;
    imageUrl: string;
    bodyPart?: string;
    patient?: {
      name: string;
    };
  };
}

interface ExpertDashboardProps {
  expertId: number;
}

export function ExpertDashboard({ expertId }: ExpertDashboardProps) {
  const { toast } = useToast();
  const [selectedValidation, setSelectedValidation] = useState<AnalysisValidation | null>(null);
  const [editedResults, setEditedResults] = useState<AnalysisResult[]>([]);
  const [expertComments, setExpertComments] = useState("");
  const [validationStatus, setValidationStatus] = useState<string>("pending");

  // Fetch pending analysis validations for expert review
  const { data: pendingValidations = [], isLoading, error } = useQuery({
    queryKey: ["/api/analysis-validations/pending"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Fetch specific validation details
  const { data: validationDetails } = useQuery<ValidationDetailsType>({
    queryKey: ["/api/analysis-validations", selectedValidation?.id],
    enabled: !!selectedValidation?.id,
  });

  // Update analysis validation
  const updateValidationMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      status: string;
      expertResults?: AnalysisResult[];
      expertComments?: string;
    }) => {
      const res = await apiRequest("PUT", `/api/analysis-validations/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis validation updated",
        description: "The analysis has been successfully validated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-validations"] });
      setSelectedValidation(null);
      setEditedResults([]);
      setExpertComments("");
      setValidationStatus("pending");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update validation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleValidationSelect = (validation: AnalysisValidation) => {
    setSelectedValidation(validation);
    setEditedResults(validation.aiResults as AnalysisResult[]);
    setExpertComments(validation.expertComments || "");
    setValidationStatus(validation.status);
  };

  const handleApprove = () => {
    if (!selectedValidation) return;

    updateValidationMutation.mutate({
      id: selectedValidation.id,
      status: "approved",
      expertResults: editedResults, // Use the modified results instead of original AI results
      expertComments: expertComments || "AI analysis approved as accurate.",
    });
  };

  const handleModify = () => {
    if (!selectedValidation) return;

    updateValidationMutation.mutate({
      id: selectedValidation.id,
      status: "modified",
      expertResults: editedResults,
      expertComments: expertComments,
    });
  };

  const handleReject = () => {
    if (!selectedValidation) return;

    updateValidationMutation.mutate({
      id: selectedValidation.id,
      status: "rejected",
      expertResults: [],
      expertComments: expertComments || "AI analysis rejected - requires complete re-evaluation.",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const updateConditionField = async (index: number, field: string, value: any) => {
    const updated = [...editedResults];
    updated[index] = { ...updated[index], [field]: value };
    
    // If the condition (main disease) is being changed, update related fields automatically
    if (field === 'condition' && value !== updated[index].condition) {
      try {
        const response = await apiRequest("POST", "/api/generate-condition-details", {
          condition: value,
          severity: updated[index].severity || "Moderate",
          bodyPart: (validationDetails as ValidationDetailsType)?.skinAnalysis?.bodyPart
        });
        const conditionDetails = await response.json();
        
        // Update all related fields with the new condition information
        updated[index] = {
          ...updated[index],
          condition: value,
          description: conditionDetails.description,
          possibleCauses: conditionDetails.possibleCauses,
          recommendations: conditionDetails.recommendations,
          bestPractices: conditionDetails.bestPractices
        };
        
        toast({
          title: "Condition Updated",
          description: "Related fields have been automatically updated based on the new condition.",
        });
      } catch (error) {
        console.warn("Failed to auto-update condition details:", error);
        // Still update the condition field even if auto-update fails
        updated[index] = { ...updated[index], [field]: value };
      }
    }
    
    setEditedResults(updated);
  };

  const updateArrayField = (index: number, field: string, arrayIndex: number, value: string) => {
    const updated = [...editedResults];
    const currentArray = updated[index][field as keyof AnalysisResult] as string[] || [];
    currentArray[arrayIndex] = value;
    updated[index] = { ...updated[index], [field]: currentArray };
    setEditedResults(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Loading pending analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Pending Validations List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Pending Reviews
            </CardTitle>
            <CardDescription>
              {(pendingValidations as any[])?.length || 0} analyses awaiting expert validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(pendingValidations as any[])?.map((validation: AnalysisValidation & any) => (
              <div
                key={validation.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedValidation?.id === validation.id ? "border-amber-500 bg-amber-50" : ""
                }`}
                onClick={() => handleValidationSelect(validation)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    Patient: {(validation as any).patient?.name || (validation as any).skinAnalysis?.patient?.name || 'Unknown'}
                  </span>
                  <Badge className={getPriorityColor(validation.priority || 'normal')}>
                    {validation.priority || 'Normal'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {new Date(validation.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <FileText className="h-3 w-3" />
                  {validation.skinAnalysis?.imageType || 'Skin Analysis'}
                </div>
                {validation.skinAnalysis?.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={validation.skinAnalysis.imageUrl} 
                      alt="Patient skin condition thumbnail"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-amber-300 shadow-md hover:shadow-lg transition-all duration-300"
                    />
                  </div>
                )}
              </div>
            ))}
            {(!pendingValidations || (pendingValidations as any[]).length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                <p>All analyses reviewed!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Review Panel */}
      <div className="lg:col-span-2">
        {selectedValidation ? (
          <div className="space-y-6">
            {/* Patient & Image Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Patient Name</Label>
                    <p className="text-lg">{(selectedValidation as any)?.patient?.name || (validationDetails as ValidationDetailsType)?.skinAnalysis?.patient?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Analysis Date</Label>
                    <p>{selectedValidation.createdAt ? new Date(selectedValidation.createdAt).toLocaleString() : 'Unknown'}</p>
                  </div>
                </div>
                
                {(validationDetails as ValidationDetailsType)?.skinAnalysis?.imageUrl && (
                  <div className="mt-4">
                    <Label className="text-lg font-semibold mb-4 block text-blue-800">
                      📸 Patient Skin Image - High Resolution Medical Analysis
                    </Label>
                    <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                      {/* Extra Large Image Display for Medical Review */}
                      <div className="relative mb-6 bg-white rounded-lg shadow-2xl p-4">
                        <img 
                          src={(validationDetails as ValidationDetailsType)?.skinAnalysis?.imageUrl || ''} 
                          alt="High resolution patient skin condition for expert medical analysis" 
                          className="w-full h-auto min-h-[800px] max-h-[1200px] mx-auto rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-500 object-contain border-4 border-blue-300 hover:border-blue-500"
                          onClick={() => window.open((validationDetails as ValidationDetailsType)?.skinAnalysis?.imageUrl || '', '_blank')}
                          style={{ imageRendering: 'high-quality' }}
                        />
                        {/* Enhanced overlay with medical context */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-15 transition-all duration-500 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="bg-white bg-opacity-95 px-6 py-3 rounded-xl shadow-2xl border-2 border-blue-400">
                            <span className="text-lg font-semibold text-blue-900">🔍 Click to open full size for detailed examination</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Medical Image Information Panel */}
                      <div className="bg-blue-100 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Medical Image Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-800">Body Part:</span>
                            <span className="ml-2 text-blue-700">{(validationDetails as ValidationDetailsType)?.skinAnalysis?.bodyPart || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">Image Quality:</span>
                            <span className="ml-2 text-green-700">High Resolution</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                          💡 Tip: Click the image to open in a new tab for maximum detail visibility during your expert review
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => {
                            const imageUrl = (validationDetails as ValidationDetailsType)?.skinAnalysis?.imageUrl;
                            if (imageUrl) window.open(imageUrl, '_blank');
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                        >
                          <ImageIcon className="h-5 w-5" />
                          Open Full Size Image
                        </button>
                        <button
                          onClick={() => {
                            const details = (validationDetails as ValidationDetailsType);
                            const imageUrl = details?.skinAnalysis?.imageUrl;
                            const analysisId = details?.skinAnalysis?.id;
                            if (imageUrl && analysisId) {
                              const link = document.createElement('a');
                              link.href = imageUrl;
                              link.download = `skin_analysis_${analysisId}.jpg`;
                              link.click();
                            }
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Image
                        </button>
                      </div>
                      
                      {(validationDetails as ValidationDetailsType)?.skinAnalysis?.bodyPart && (
                        <div className="mt-4 text-center">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                            Body Part: {(validationDetails as ValidationDetailsType)?.skinAnalysis?.bodyPart}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  AI Analysis Results - Expert Review
                </CardTitle>
                <CardDescription>
                  Review and modify the AI analysis results as needed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          Condition
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Auto-updates related fields
                          </span>
                        </Label>
                        <input
                          type="text"
                          value={result.condition}
                          onChange={(e) => updateConditionField(index, 'condition', e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter skin condition name..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Changing the condition will automatically update description, causes, and recommendations
                        </p>
                        {/* Quick condition suggestions */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {["Acne", "Eczema", "Psoriasis", "Melanoma", "Rosacea"].map((condition) => (
                            <button
                              key={condition}
                              onClick={() => updateConditionField(index, 'condition', condition)}
                              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                            >
                              {condition}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Confidence Level</Label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={result.confidence}
                          onChange={(e) => updateConditionField(index, 'confidence', parseFloat(e.target.value))}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={result.description || ''}
                        onChange={(e) => updateConditionField(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Severity</Label>
                      <Select 
                        value={result.severity || ''} 
                        onValueChange={(value) => updateConditionField(index, 'severity', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mild">Mild</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {result.possibleCauses && (
                      <div>
                        <Label>Possible Causes</Label>
                        {result.possibleCauses.map((cause, causeIndex) => (
                          <input
                            key={causeIndex}
                            type="text"
                            value={cause}
                            onChange={(e) => updateArrayField(index, 'possibleCauses', causeIndex, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        ))}
                      </div>
                    )}

                    {result.recommendations && (
                      <div>
                        <Label>Recommendations</Label>
                        {result.recommendations.map((rec, recIndex) => (
                          <input
                            key={recIndex}
                            type="text"
                            value={rec}
                            onChange={(e) => updateArrayField(index, 'recommendations', recIndex, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Expert Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Expert Comments</CardTitle>
                <CardDescription>
                  Add your professional comments about this analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={expertComments}
                  onChange={(e) => setExpertComments(e.target.value)}
                  placeholder="Add your expert comments, reasoning, or additional observations..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={updateValidationMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve AI Analysis
                  </Button>
                  
                  <Button 
                    onClick={handleModify}
                    className="bg-amber-600 hover:bg-amber-700"
                    disabled={updateValidationMutation.isPending}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Save Modifications
                  </Button>
                  
                  <Button 
                    onClick={handleReject}
                    variant="destructive"
                    disabled={updateValidationMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select an Analysis to Review</h3>
              <p>Choose a pending analysis from the left panel to begin expert validation</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}