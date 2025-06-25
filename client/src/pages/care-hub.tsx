import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Questionnaire, Patient } from "@shared/schema";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import CareQuestionnaire from "@/components/care-questionnaire";
import MCQQuestionnaire from "@/components/mcq-questionnaire";

import { Plus, FileCheck, FileQuestion, ArrowRight, Sparkles, Droplet, Scissors, AlertCircle } from "lucide-react";

export default function CareHub() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("skin");
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Fetch patient data for the current user
  const { data: patientData, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/user/${user?.id}`],
    enabled: !!user,
  });

  // Fetch questionnaires for the current patient
  const { data: questionnaires = [], isLoading: isLoadingQuestionnaires } = useQuery<Questionnaire[]>({
    queryKey: [`/api/questionnaires/patient/${patientData?.id}`],
    enabled: !!patientData?.id,
  });

  // Filter questionnaires by type
  const skinQuestionnaires = questionnaires.filter((q: Questionnaire) => q.questionnaireType === "skin");
  const hairQuestionnaires = questionnaires.filter((q: Questionnaire) => q.questionnaireType === "hair");
  const antiagingQuestionnaires = questionnaires.filter((q: Questionnaire) => q.questionnaireType === "antiaging");

  // Helper function to get the most recent questionnaire of a type
  const getMostRecentQuestionnaire = (type: string): Questionnaire | null => {
    const filtered = questionnaires.filter((q: Questionnaire) => q.questionnaireType === type);
    if (filtered.length === 0) return null;
    
    // Sort by created date (most recent first) and return the first one
    return filtered.sort((a: Questionnaire, b: Questionnaire) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    })[0];
  };

  // Function to handle completion of a questionnaire
  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    toast({
      title: "Questionnaire Complete",
      description: "Thank you for completing the questionnaire. Your personalized recommendations are now available.",
    });
  };

  // If no patient profile exists, redirect to create profile
  if (!isLoadingPatient && !patientData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mb-6 border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle>Complete Your Patient Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To access personalized care recommendations, you need to create your patient profile. Please click below to set up your medical information.</p>
            <Button 
              onClick={() => setLocation("/create-profile")} 
              className="bg-primary text-black hover:bg-primary/90"
            >
              Create My Patient Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCareContent = (type: string, icon: React.ReactNode) => {
    const questionnairesForType = type === "skin" 
      ? skinQuestionnaires 
      : type === "hair" 
        ? hairQuestionnaires 
        : antiagingQuestionnaires;
        
    const hasCompletedQuestionnaire = questionnairesForType.length > 0;
    const mostRecentQuestionnaire = getMostRecentQuestionnaire(type);
    
    return (
      <>
        {/* Skip if showing the questionnaire form */}
        {showQuestionnaire && activeTab === type ? (
          <div className="my-6">
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => setShowQuestionnaire(false)}
            >
              Back to {type === "skin" ? "Skin" : type === "hair" ? "Hair" : "Anti-Aging"} Care
            </Button>
            {type === "skin" || type === "antiaging" ? (
              <MCQQuestionnaire 
                questionnaireType={type as "skin" | "hair" | "antiaging"}
                patientId={patientData?.id || 0}
                onComplete={handleQuestionnaireComplete}
              />
            ) : (
              <CareQuestionnaire 
                questionnaireType={type as "skin" | "hair" | "antiaging"} 
                patientId={patientData?.id || 0} 
                onComplete={handleQuestionnaireComplete}
              />
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Recommendations Card */}
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    {icon} 
                    <span className="ml-2">
                      Personalized {type === "skin" ? "Skin" : type === "hair" ? "Hair" : "Anti-Aging"} Care
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {hasCompletedQuestionnaire 
                      ? "Based on your questionnaire responses"
                      : "Complete a questionnaire to get personalized recommendations"}
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {hasCompletedQuestionnaire ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Your Concerns</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {mostRecentQuestionnaire && Array.isArray(mostRecentQuestionnaire.concerns) && 
                            mostRecentQuestionnaire.concerns.map((concern: string) => (
                              <Badge key={concern} variant="secondary" className="bg-primary/10 text-primary">
                                {concern}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommended Products</h4>
                        <ul className="space-y-2">
                          {mostRecentQuestionnaire && Array.isArray(mostRecentQuestionnaire.currentProducts) && 
                            mostRecentQuestionnaire.currentProducts.slice(0, 3).map((product: string) => (
                              <li key={product} className="flex items-center">
                                <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                                {product}
                              </li>
                            ))
                          }
                          {mostRecentQuestionnaire && 
                           Array.isArray(mostRecentQuestionnaire.currentProducts) && 
                           mostRecentQuestionnaire.currentProducts.length > 3 && (
                            <li className="text-sm text-muted-foreground">
                              +{mostRecentQuestionnaire.currentProducts.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Recommendations Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Take our {type === "skin" ? "skin" : type === "hair" ? "hair" : "anti-aging"} care questionnaire 
                        to receive personalized product and routine recommendations.
                      </p>
                      <Button 
                        className="bg-primary text-black hover:bg-primary/90"
                        onClick={() => setShowQuestionnaire(true)}
                      >
                        Take Questionnaire <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
                {hasCompletedQuestionnaire && (
                  <CardFooter className="pt-3 pb-4 flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => setShowQuestionnaire(true)}>
                      Update Questionnaire
                    </Button>
                    <Button size="sm" className="bg-primary text-black hover:bg-primary/90">
                      View Detailed Recommendations
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Care Routine Card */}
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">
                    {type === "skin" ? "Skin" : type === "hair" ? "Hair" : "Anti-Aging"} Care Routine
                  </CardTitle>
                  <CardDescription>
                    Your personalized {type === "skin" ? "skin" : type === "hair" ? "hair" : "anti-aging"} care regimen
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {hasCompletedQuestionnaire ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-3">Morning Routine</h4>
                        <ol className="space-y-2">
                          <li className="flex items-start rounded-md border p-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-3 shrink-0">
                              1
                            </span>
                            <div>
                              <h5 className="font-medium">Cleanse</h5>
                              <p className="text-sm text-muted-foreground">
                                Gentle cleanser appropriate for your {type === "skin" ? "skin" : type === "hair" ? "hair" : "skin"} type
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start rounded-md border p-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-3 shrink-0">
                              2
                            </span>
                            <div>
                              <h5 className="font-medium">Treat</h5>
                              <p className="text-sm text-muted-foreground">
                                {type === "skin" ? "Serum targeting your skin concerns" 
                                : type === "hair" ? "Leave-in conditioner or hair serum" 
                                : "Anti-aging serum with antioxidants"}
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start rounded-md border p-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-3 shrink-0">
                              3
                            </span>
                            <div>
                              <h5 className="font-medium">Protect</h5>
                              <p className="text-sm text-muted-foreground">
                                {type === "skin" || type === "antiaging" 
                                ? "Moisturizer with SPF protection" 
                                : "Heat protectant if styling with heat"}
                              </p>
                            </div>
                          </li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-3">Evening Routine</h4>
                        <ol className="space-y-2">
                          <li className="flex items-start rounded-md border p-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-3 shrink-0">
                              1
                            </span>
                            <div>
                              <h5 className="font-medium">{type === "hair" ? "Detangle" : "Double Cleanse"}</h5>
                              <p className="text-sm text-muted-foreground">
                                {type === "hair" 
                                ? "Gently detangle hair before washing" 
                                : "Remove makeup and cleanse skin thoroughly"}
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start rounded-md border p-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-3 shrink-0">
                              2
                            </span>
                            <div>
                              <h5 className="font-medium">
                                {type === "skin" ? "Treatment" : type === "hair" ? "Deep Condition" : "Anti-Aging Treatment"}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {type === "skin" ? "Active ingredients targeting specific concerns" 
                                : type === "hair" ? "Weekly deep conditioning mask" 
                                : "Retinol or peptide treatment"}
                              </p>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Routine Not Available</h3>
                      <p className="text-muted-foreground mb-4">
                        Complete the questionnaire to receive a personalized routine
                        tailored to your specific needs.
                      </p>
                    </div>
                  )}
                </CardContent>
                {hasCompletedQuestionnaire && (
                  <CardFooter className="pt-3 pb-4">
                    <Button className="w-full bg-primary text-black hover:bg-primary/90">
                      View Complete Routine
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Educational Content */}
            <div className="mt-8">
              <h3 className="text-xl font-medium mb-4">Educational Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Understanding Your {type === "skin" ? "Skin" : type === "hair" ? "Hair" : "Aging Process"}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">Learn about your {type === "skin" ? "skin type and concerns" : type === "hair" ? "hair type and common issues" : "skin's aging process"} to make better care decisions.</p>
                  </CardContent>
                  <CardFooter>
                    <a href={`/resources/${type}/understanding`} target="_blank" rel="noopener noreferrer">
                      <Button variant="link" className="p-0 h-auto text-primary">Read Article</Button>
                    </a>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{type === "skin" ? "Ingredient Guide" : type === "hair" ? "Hair Care Myths" : "Anti-Aging Ingredients"}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{type === "skin" ? "Understanding active ingredients for effective skincare" : type === "hair" ? "Separating fact from fiction in hair care" : "Key ingredients that help combat signs of aging"}</p>
                  </CardContent>
                  <CardFooter>
                    <a href={`/resources/${type}/ingredients`} target="_blank" rel="noopener noreferrer">
                      <Button variant="link" className="p-0 h-auto text-primary">Read Article</Button>
                    </a>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{type === "skin" ? "Seasonal Skin Tips" : type === "hair" ? "Healthy Hair Diet" : "Lifestyle for Aging Well"}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{type === "skin" ? "Adjusting your skincare for different seasons" : type === "hair" ? "Foods and nutrients for healthy hair growth" : "Lifestyle changes that support healthy aging"}</p>
                  </CardContent>
                  <CardFooter>
                    <a href={`/resources/${type}/tips`} target="_blank" rel="noopener noreferrer">
                      <Button variant="link" className="p-0 h-auto text-primary">Read Article</Button>
                    </a>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <PageHeader
        heading="Personal Care Hub"
        subheading="Manage your personalized skin, hair, and anti-aging care recommendations"
      />

      <div className="mt-6">
        <Tabs 
          defaultValue="skin" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skin" className="flex items-center">
              <Droplet className="h-4 w-4 mr-2" />
              Skin Care
            </TabsTrigger>
            <TabsTrigger value="hair" className="flex items-center">
              <Scissors className="h-4 w-4 mr-2" />
              Hair Care
            </TabsTrigger>
            <TabsTrigger value="antiaging" className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Anti-Aging
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="skin" className="mt-6">
            {renderCareContent("skin", <Droplet className="h-5 w-5 text-blue-500" />)}
          </TabsContent>
          
          <TabsContent value="hair" className="mt-6">
            {renderCareContent("hair", <Scissors className="h-5 w-5 text-amber-500" />)}
          </TabsContent>
          
          <TabsContent value="antiaging" className="mt-6">
            {renderCareContent("antiaging", <Sparkles className="h-5 w-5 text-purple-500" />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}