import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkinAnalysis, AnalysisResult } from "@shared/schema";
import { useQuery } from '@tanstack/react-query';
import { Loader2, ZoomIn, Download, ArrowLeftRight, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SkinComparisonProps {
  patientId: number;
}

type MetricData = {
  name: string;
  before: number;
  after: number;
  change: number;
  changePercent: number;
};

type ComparisonResult = {
  overallChange: 'improved' | 'declined' | 'no-change';
  improvementPercentage: number;
  metrics: MetricData[];
  aiAnalysis: string;
};

export function SkinComparison({ patientId }: SkinComparisonProps) {
  const [firstVisitId, setFirstVisitId] = useState<number | null>(null);
  const [secondVisitId, setSecondVisitId] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isComparing, setIsComparing] = useState(false);

  // Fetch all skin analyses for this patient
  const { 
    data: skinAnalyses, 
    isLoading: isLoadingSkinAnalyses,
    error: skinAnalysesError
  } = useQuery<SkinAnalysis[]>({
    queryKey: [`/api/skin-analyses/patient/${patientId}`],
    enabled: !!patientId
  });
  
  // Log data when it changes
  useEffect(() => {
    console.log(`[SkinComparison] Received ${skinAnalyses?.length || 0} skin analyses for patient ${patientId}:`, skinAnalyses);
    
    if (skinAnalysesError) {
      console.error(`[SkinComparison] Error fetching skin analyses:`, skinAnalysesError);
    }
  }, [skinAnalyses, skinAnalysesError, patientId]);

  // Set default first and second visits when data is loaded
  useEffect(() => {
    if (skinAnalyses && skinAnalyses.length >= 2) {
      // Sort by date (newest first)
      const sortedAnalyses = [...skinAnalyses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Select most recent for second visit
      setSecondVisitId(sortedAnalyses[0].id);
      
      // Select previous for first visit
      setFirstVisitId(sortedAnalyses[1].id);
    }
  }, [skinAnalyses]);

  // Find the selected analysis objects
  const firstVisit = skinAnalyses?.find(analysis => analysis.id === firstVisitId);
  const secondVisit = skinAnalyses?.find(analysis => analysis.id === secondVisitId);

  // Sample function to generate comparison results
  // In a real implementation, this would call an API endpoint to analyze the images
  const compareImages = () => {
    setIsComparing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Sample comparison result (this would come from your OpenAI API in a real implementation)
      const result: ComparisonResult = {
        overallChange: 'improved',
        improvementPercentage: 68,
        metrics: [
          {
            name: 'Inflammation',
            before: 7.8,
            after: 3.2,
            change: -4.6,
            changePercent: -58.9
          },
          {
            name: 'Redness',
            before: 8.5,
            after: 2.1,
            change: -6.4,
            changePercent: -75.3
          },
          {
            name: 'Texture',
            before: 6.2,
            after: 4.3,
            change: -1.9,
            changePercent: -30.6
          },
          {
            name: 'Hyperpigmentation',
            before: 5.1,
            after: 3.8,
            change: -1.3,
            changePercent: -25.5
          }
        ],
        aiAnalysis: "The patient shows significant improvement in inflammatory acne compared to the first visit. Redness has reduced by 75.3%, suggesting effective anti-inflammatory treatment response. Texture improvement is moderate (30.6%), indicating continued need for exfoliation therapy. Recommend continuing current regimen with possible addition of gentle chemical exfoliant."
      };
      
      setComparisonResult(result);
      setIsComparing(false);
    }, 2000);
  };

  if (isLoadingSkinAnalyses) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!skinAnalyses || skinAnalyses.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skin Condition Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500 mb-4">
              At least two skin analysis sessions are required to make a comparison.
            </p>
            <p className="text-gray-400 text-sm">
              Please complete another skin analysis session for this patient.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skin Condition Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                First Visit (Before)
              </label>
              <Select
                value={firstVisitId?.toString()}
                onValueChange={(value) => setFirstVisitId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select first visit" />
                </SelectTrigger>
                <SelectContent>
                  {skinAnalyses?.map((analysis) => (
                    <SelectItem 
                      key={`first-${analysis.id}`} 
                      value={analysis.id.toString()}
                    >
                      {new Date(analysis.date).toLocaleDateString()} ({analysis.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Second Visit (After)
              </label>
              <Select
                value={secondVisitId?.toString()}
                onValueChange={(value) => setSecondVisitId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select second visit" />
                </SelectTrigger>
                <SelectContent>
                  {skinAnalyses?.map((analysis) => (
                    <SelectItem 
                      key={`second-${analysis.id}`} 
                      value={analysis.id.toString()}
                    >
                      {new Date(analysis.date).toLocaleDateString()} ({analysis.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {firstVisit && secondVisit && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-md p-2 relative group">
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-medium">
                    Before - {new Date(firstVisit.date).toLocaleDateString()}
                  </div>
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden relative">
                    <img 
                      src={firstVisit.imageUrl} 
                      alt="First visit skin condition" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center transition-opacity">
                      <Button size="sm" variant="secondary" className="gap-1">
                        <ZoomIn className="h-4 w-4" />
                        <span>Zoom</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-2 relative group">
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-medium">
                    After - {new Date(secondVisit.date).toLocaleDateString()}
                  </div>
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden relative">
                    <img 
                      src={secondVisit.imageUrl} 
                      alt="Second visit skin condition" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center transition-opacity">
                      <Button size="sm" variant="secondary" className="gap-1">
                        <ZoomIn className="h-4 w-4" />
                        <span>Zoom</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-medium mb-2">Side-by-side Comparison Slider</div>
                <div className="aspect-video bg-gray-100 rounded overflow-hidden relative border">
                  <div 
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                      backgroundImage: `url(${firstVisit.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0 h-full"
                    style={{ 
                      width: `${sliderPosition}%`,
                      backgroundImage: `url(${secondVisit.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRight: '2px solid #FFC107'
                    }}
                  ></div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={sliderPosition} 
                    onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                    className="absolute bottom-4 left-4 right-4 z-10 w-[calc(100%-2rem)]"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Before</div>
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">After</div>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <Button 
                  onClick={compareImages} 
                  disabled={isComparing}
                  className="gap-2"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Images...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="h-4 w-4" />
                      Compare Images
                    </>
                  )}
                </Button>
              </div>

              {comparisonResult && (
                <div className="space-y-6">
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={
                      comparisonResult.overallChange === 'improved' 
                        ? 'border-green-500 shadow-md' 
                        : comparisonResult.overallChange === 'declined'
                        ? 'border-red-500 shadow-md'
                        : 'border-gray-300'
                    }>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Overall Change</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center">
                          <div className={`text-2xl font-bold ${
                            comparisonResult.overallChange === 'improved' 
                              ? 'text-green-600' 
                              : comparisonResult.overallChange === 'declined'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {comparisonResult.overallChange === 'improved' 
                              ? 'Improved' 
                              : comparisonResult.overallChange === 'declined'
                              ? 'Declined'
                              : 'No Change'
                            }
                          </div>
                          <div className="text-3xl font-extrabold mt-1">
                            {comparisonResult.improvementPercentage}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">AI Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{comparisonResult.aiAnalysis}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
                    <div className="space-y-4">
                      {comparisonResult.metrics.map((metric, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <div className="font-medium">{metric.name}</div>
                            <div className="text-sm text-gray-500 flex items-baseline gap-2">
                              <span>Before: {metric.before.toFixed(1)}</span>
                              <span>After: {metric.after.toFixed(1)}</span>
                              <span className={`font-medium ${
                                metric.changePercent < 0 ? 'text-green-600' : 
                                metric.changePercent > 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {metric.changePercent < 0 ? '↓' : metric.changePercent > 0 ? '↑' : '–'}
                                {Math.abs(metric.changePercent).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400" style={{ width: `${(metric.before / 10) * 100}%` }}></div>
                            <div 
                              className={`absolute top-0 h-full ${
                                metric.changePercent < 0 ? 'bg-green-500' : 
                                metric.changePercent > 0 ? 'bg-red-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${(metric.after / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Comparison Report
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}