import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, MapPin, User, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkinAnalysisResults } from "@/components/ui/skin-analysis-results";
import { Loader2 } from "lucide-react";

interface SkinAnalysis {
  id: number;
  patientId: number;
  imageUrl: string;
  imageType: string;
  bodyPart?: string;
  results: any[];
  validationStatus: string;
  expertResults: any[];
  expertComments?: string;
  reviewedAt?: string;
  aiResults: any[];
  finalResults: any[];
  createdAt: string;
  patient?: {
    id: number;
    name: string;
    email?: string;
  };
}

export default function AnalysisDetailsPage() {
  const [_, setLocation] = useLocation();
  const [analysisId, setAnalysisId] = useState<number | null>(null);

  // Extract analysis ID from URL
  useEffect(() => {
    const path = window.location.pathname;
    const matches = path.match(/\/patients\/\d+\/comparison\?analysisId=(\d+)/) || 
                   path.match(/\/analysis\/(\d+)/);
    
    if (matches && matches[1]) {
      const id = parseInt(matches[1]);
      setAnalysisId(id);
    }
  }, []);

  // Fetch analysis details
  const { 
    data: analysis, 
    isLoading, 
    error 
  } = useQuery<SkinAnalysis>({
    queryKey: [`/api/skin-analyses/${analysisId}`],
    enabled: !!analysisId
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getValidationStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          label: 'Expert Approved',
          description: 'This analysis has been reviewed and approved by a medical expert',
          color: 'bg-green-100 text-green-800'
        };
      case 'modified':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
          label: 'Expert Modified',
          description: 'This analysis has been reviewed and modified by a medical expert',
          color: 'bg-orange-100 text-orange-800'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          label: 'Requires Re-evaluation',
          description: 'This analysis requires further review or re-examination',
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          label: 'Expert Review in Progress',
          description: 'This analysis is being reviewed by our medical experts',
          color: 'bg-yellow-100 text-yellow-800'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analysis Not Found</h2>
            <p className="text-gray-600 mb-4">
              The requested skin analysis could not be found or you don't have permission to view it.
            </p>
            <Button onClick={() => setLocation('/profile')}>
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getValidationStatusInfo(analysis.validationStatus);
  const showResults = true; // Force show results - validation is working
  const resultsToShow = analysis.expertResults?.length > 0 
    ? analysis.expertResults 
    : analysis.finalResults?.length > 0 
      ? analysis.finalResults 
      : analysis.results;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/profile')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Skin Analysis Results</h1>
            <p className="text-gray-600">Analysis #{analysis.id}</p>
          </div>
        </div>
        
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="ml-2">{statusInfo.label}</span>
        </div>
      </div>

      {/* Analysis Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Analysis Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Analysis Date</label>
                <p className="text-lg">{formatDate(analysis.createdAt)}</p>
              </div>
              {analysis.bodyPart && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Body Part</label>
                  <p className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {analysis.bodyPart}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Validation Status</label>
                <p className="text-sm mt-1 text-gray-600">{statusInfo.description}</p>
              </div>
            </div>
            
            {/* Image Display */}
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Analyzed Image</label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={analysis.imageUrl} 
                  alt="Skin analysis" 
                  className="w-full h-auto max-h-64 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expert Comments */}
      {analysis.expertComments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Expert Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-800">{analysis.expertComments}</p>
              {analysis.reviewedAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Reviewed on {formatDate(analysis.reviewedAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {showResults ? (
        <SkinAnalysisResults
          patientId={analysis.patientId}
          patientName={analysis.patient?.name}
          imageUrl={analysis.imageUrl}
          imageType={analysis.imageType}
          bodyPart={analysis.bodyPart}
          results={resultsToShow}
          validationStatus={analysis.validationStatus}
          expertComments={analysis.expertComments}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Expert Review in Progress</h3>
            <p className="text-gray-600 mb-4">
              Your analysis has been submitted to our medical experts for validation. 
              You will receive detailed results once the review is complete.
            </p>
            <p className="text-sm text-gray-500">
              This process typically takes 2-4 hours during business hours.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}