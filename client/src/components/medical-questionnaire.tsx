import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertMedicalQuestionnaireSchema, type InsertMedicalQuestionnaire } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, FileText } from "lucide-react";

interface MedicalQuestionnaireProps {
  skinAnalysisId: number;
  patientId: number;
  onComplete: (questionnaireData: any) => void;
  isSubmitting: boolean;
}

export function MedicalQuestionnaire({ 
  skinAnalysisId, 
  patientId, 
  onComplete, 
  isSubmitting 
}: MedicalQuestionnaireProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<InsertMedicalQuestionnaire>({
    resolver: zodResolver(insertMedicalQuestionnaireSchema),
    defaultValues: {
      skinAnalysisId,
      patientId,
      chiefComplaint: "",
      complaintDuration: "",
      previousMedications: "",
      currentMedications: "",
      comorbidities: "",
      familyHistory: "",
      smokingHistory: false,
      alcoholHistory: false,
      additionalSymptoms: "",
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertMedicalQuestionnaire) => {
      const res = await apiRequest("POST", "/api/medical-questionnaires", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Medical questionnaire completed",
        description: "Thank you for providing the medical information.",
      });
      onComplete(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit questionnaire",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMedicalQuestionnaire) => {
    submitMutation.mutate(data);
  };

  const questions = [
    {
      title: "Chief Complaint",
      description: "What is your main concern about the skin condition?",
      fields: ["chiefComplaint", "complaintDuration"]
    },
    {
      title: "Medication History",
      description: "Please provide information about your medications",
      fields: ["previousMedications", "currentMedications"]
    },
    {
      title: "Medical History",
      description: "Do you have any other medical conditions?",
      fields: ["comorbidities", "familyHistory"]
    },
    {
      title: "Lifestyle Factors",
      description: "Information about lifestyle habits",
      fields: ["smokingHistory", "alcoholHistory"]
    },
    {
      title: "Additional Information",
      description: "Any other symptoms or concerns",
      fields: ["additionalSymptoms"]
    }
  ];

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Medical Questionnaire
        </CardTitle>
        <CardDescription className="text-gray-600">
          Please answer these questions while our AI analyzes your skin image
        </CardDescription>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-600 font-medium">
            Step {currentStep + 1} of {questions.length}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentQuestion.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {currentQuestion.description}
              </p>

              <div className="space-y-4">
                {currentQuestion.fields.includes("chiefComplaint") && (
                  <FormField
                    control={form.control}
                    name="chiefComplaint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What is your chief complaint?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your main skin concern (e.g., rash, discoloration, irritation)"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("complaintDuration") && (
                  <FormField
                    control={form.control}
                    name="complaintDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How long have you had this condition?</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="less-than-week">Less than a week</SelectItem>
                              <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                              <SelectItem value="1-month">About a month</SelectItem>
                              <SelectItem value="2-3-months">2-3 months</SelectItem>
                              <SelectItem value="6-months">About 6 months</SelectItem>
                              <SelectItem value="1-year">About a year</SelectItem>
                              <SelectItem value="more-than-year">More than a year</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("previousMedications") && (
                  <FormField
                    control={form.control}
                    name="previousMedications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous medications for this condition</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any medications you've used for this skin condition in the past"
                            {...field}
                            value={field.value || ""}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("currentMedications") && (
                  <FormField
                    control={form.control}
                    name="currentMedications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current medications (all medications)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List all medications you are currently taking"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("comorbidities") && (
                  <FormField
                    control={form.control}
                    name="comorbidities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do you have any other medical conditions?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any other medical conditions you have (diabetes, hypertension, etc.)"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("familyHistory") && (
                  <FormField
                    control={form.control}
                    name="familyHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family history of similar skin conditions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Does anyone in your family have similar skin conditions?"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("smokingHistory") && (
                  <FormField
                    control={form.control}
                    name="smokingHistory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Do you smoke or have a history of smoking?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("alcoholHistory") && (
                  <FormField
                    control={form.control}
                    name="alcoholHistory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Do you consume alcohol regularly?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {currentQuestion.fields.includes("additionalSymptoms") && (
                  <FormField
                    control={form.control}
                    name="additionalSymptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any additional symptoms or concerns?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe any other symptoms, pain, itching, or concerns related to this condition"
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep === questions.length - 1 ? (
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {(submitMutation.isPending || isSubmitting) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Complete Analysis
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}