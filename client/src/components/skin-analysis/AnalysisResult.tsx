import { Button } from "@/components/ui/button";
import { Analysis } from "@shared/schema";

interface AnalysisResultProps {
  analysis: Analysis;
  onScheduleAppointment: () => void;
  onViewMedications: () => void;
}

export default function AnalysisResult({ analysis, onScheduleAppointment, onViewMedications }: AnalysisResultProps) {
  // Transform recommendations string into an array for display
  const recommendationsList = analysis.recommendations?.split('. ').filter(Boolean) || [];

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-3">Analysis Results</h3>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Condition Detected</h4>
            <p className="mt-1 text-lg font-semibold text-gray-900">{analysis.condition}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Details</h4>
            <p className="mt-1 text-sm text-gray-600">{analysis.details}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Recommendations</h4>
            <ul className="mt-1 text-sm text-gray-600 list-disc pl-5 space-y-1">
              {recommendationsList.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
          <div className="pt-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-2">Confidence:</span>
              <span className="text-sm font-semibold text-gray-900">{analysis.confidence}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <Button onClick={onScheduleAppointment}>
          Schedule Appointment
        </Button>
        <Button variant="outline" onClick={onViewMedications}>
          View Recommended Medications
        </Button>
      </div>
    </div>
  );
}
