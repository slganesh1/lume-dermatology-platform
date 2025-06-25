import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";

// Define MCQ questionnaire schema
const mcqQuestionnaireSchema = z.object({
  patientId: z.number(),
  questionnaireType: z.enum(["skin", "hair", "antiaging"]),
  // Basic info
  ageGroup: z.string(),
  gender: z.string(),
  
  // Skin concerns
  skinConcerns: z.array(z.string()).optional(),
  acneFrequency: z.string().optional(),
  acneCount: z.string().optional(),
  irregularCycles: z.string().optional(),
  pigmentationLevel: z.string().optional(),
  
  // Anti-aging specific
  antiAgingConcerns: z.array(z.string()).optional(),
  wrinkleVisibility: z.string().optional(),
  skinFeelDaily: z.string().optional(),
  antiAgingProductUsage: z.string().optional(),
  retinolUsage: z.string().optional(),
  antiAgingIngredientPreference: z.string().optional(),
  skinSensitivity: z.string().optional(),
  antiAgingCommitmentLevel: z.string().optional(),
  preferAntiAgingType: z.string().optional(), // preventative or corrective
  preferNaturalProducts: z.string().optional(),
  
  // Primary goal
  primaryGoal: z.string(),
  
  // Skin characteristics
  skinType: z.string(),
  dryness: z.string(),
  sunSensitivity: z.string(),
  climate: z.string(),
  routineTime: z.string(),
  texturePreference: z.string(),
  makeupUsage: z.string(),
  fragrance: z.string(),
  spfPreference: z.string(),
  additionalInfo: z.string().optional(),
  
  // Response data (will be filled after submission)
  responseProducts: z.array(z.string()).optional(),
  responseRoutine: z.string().optional(),
  responseRecommendations: z.string().optional(),
});

type MCQQuestionnaireFormValues = z.infer<typeof mcqQuestionnaireSchema>;

interface MCQQuestionnaireProps {
  questionnaireType: "skin" | "hair" | "antiaging";
  patientId: number;
  onComplete?: () => void;
}

export default function MCQQuestionnaire({ 
  questionnaireType, 
  patientId,
  onComplete
}: MCQQuestionnaireProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAcneFollowUp, setShowAcneFollowUp] = useState(false);
  const [showPigmentationFollowUp, setShowPigmentationFollowUp] = useState(false);
  
  // Define questionnaire content based on type
  const getQuestionsForType = () => {
    if (questionnaireType === "skin") {
      return {
        title: "Skin Care Questionnaire",
        maxSteps: 3,
      };
    } else if (questionnaireType === "antiaging") {
      return {
        title: "Anti-Aging Questionnaire",
        maxSteps: 3,
      };
    } else {
      return {
        title: "Hair Care Questionnaire",
        maxSteps: 3,
      };
    }
  };
  
  const questionsConfig = getQuestionsForType();

  // Form default values
  const form = useForm<MCQQuestionnaireFormValues>({
    resolver: zodResolver(mcqQuestionnaireSchema),
    defaultValues: {
      patientId,
      questionnaireType,
      ageGroup: "",
      gender: "",
      skinConcerns: [],
      acneFrequency: "",
      acneCount: "",
      irregularCycles: "",
      pigmentationLevel: "",
      primaryGoal: "",
      skinType: "",
      dryness: "",
      sunSensitivity: "",
      climate: "",
      routineTime: "",
      texturePreference: "",
      makeupUsage: "",
      fragrance: "",
      spfPreference: "",
      additionalInfo: "",
      responseProducts: [],
      responseRoutine: "",
      responseRecommendations: "",
    },
  });

  // Watch for concerns to show conditional questions
  const skinConcerns = form.watch("skinConcerns") || [];
  
  // Show follow-up questions if certain concerns are selected
  const hasAcne = skinConcerns.includes("acne");
  const hasPigmentation = skinConcerns.includes("pigmentation");

  // Questionnaire submission handler
  const submitQuestionnaire = useMutation({
    mutationFn: async (data: MCQQuestionnaireFormValues) => {
      const response = await apiRequest("POST", "/api/questionnaires", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Questionnaire Submitted",
        description: `Your ${questionnaireType} care questionnaire has been saved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaires"] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/questionnaires/patient/${patientId}`] 
      });
      // Generate personalized recommendations - this will be filled from the backend in a real implementation
      const sampleRecommendations = {
        products: [
          "Gel cleanser (Salicylic acid)",
          "Niacinamide serum",
          "Oil-free lightweight moisturizer",
          "Broad-spectrum SPF 30–50 (matte finish)"
        ],
        routine: "Morning: Cleanser → Niacinamide → Moisturizer → SPF\nEvening: Cleanser → Niacinamide → Moisturizer",
        recommendations: "Based on your oily, acne-prone skin in a humid environment, we recommend a gentle routine with products that control excess oil while maintaining proper hydration."
      };
      
      // In a real implementation, this would be returned from the API
      // For now we'll just update the form with sample data
      form.setValue("responseProducts", sampleRecommendations.products);
      form.setValue("responseRoutine", sampleRecommendations.routine);
      form.setValue("responseRecommendations", sampleRecommendations.recommendations);
      
      setCurrentStep(4); // Move to results page
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      console.error("Error submitting questionnaire:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error saving your questionnaire. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MCQQuestionnaireFormValues) => {
    // Clean up the data before submission
    if (!hasAcne) {
      data.acneFrequency = undefined;
      data.acneCount = undefined;
      data.irregularCycles = undefined;
    }
    
    if (!hasPigmentation) {
      data.pigmentationLevel = undefined;
    }
    
    // Submit the form
    submitQuestionnaire.mutate(data);
  };

  // Function to go to next step
  const goToNextStep = () => {
    const fieldsToValidate: Record<number, string[]> = {
      1: ["ageGroup", "gender"],
      2: ["skinConcerns", "primaryGoal", "skinType"],
      3: ["dryness", "sunSensitivity", "climate", "routineTime"]
    };
    
    // Validate the fields for the current step
    const currentFields = fieldsToValidate[currentStep as keyof typeof fieldsToValidate] || [];
    
    if (currentFields.length > 0) {
      form.trigger(currentFields as any).then((isValid) => {
        if (isValid) {
          setCurrentStep(currentStep + 1);
        } else {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields before continuing.",
            variant: "destructive",
          });
        }
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // Function to go to previous step
  const goToPreviousStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  // Render different steps based on currentStep
  const renderStep = () => {
    // For anti-aging questionnaire
    if (questionnaireType === "antiaging") {
      switch (currentStep) {
        case 1: // Basic Information for Anti-Aging
          return (
            <>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-base">1. What is your current age group?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="under-25" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Under 25</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="25-34" />
                            </FormControl>
                            <FormLabel className="font-normal">B) 25–34</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="35-44" />
                            </FormControl>
                            <FormLabel className="font-normal">C) 35–44</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="45-54" />
                            </FormControl>
                            <FormLabel className="font-normal">D) 45–54</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="55-64" />
                            </FormControl>
                            <FormLabel className="font-normal">E) 55–64</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="65+" />
                            </FormControl>
                            <FormLabel className="font-normal">F) 65+</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="antiAgingConcerns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">2. What are your top anti-aging concerns? (Pick up to 3)</FormLabel>
                      <FormDescription>
                        Select up to 3 concerns
                      </FormDescription>
                      <div className="mt-2 space-y-1">
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("fine-lines")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "fine-lines"]
                                  : (field.value || []).filter(value => value !== "fine-lines");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">A) Fine lines</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("deep-wrinkles")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "deep-wrinkles"]
                                  : (field.value || []).filter(value => value !== "deep-wrinkles");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">B) Deep wrinkles</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("sagging-skin")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "sagging-skin"]
                                  : (field.value || []).filter(value => value !== "sagging-skin");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">C) Sagging skin</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("dull-tired-skin")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "dull-tired-skin"]
                                  : (field.value || []).filter(value => value !== "dull-tired-skin");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">D) Dull, tired skin</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("age-spots")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "age-spots"]
                                  : (field.value || []).filter(value => value !== "age-spots");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">E) Age spots / pigmentation</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("uneven-tone")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "uneven-tone"]
                                  : (field.value || []).filter(value => value !== "uneven-tone");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">F) Uneven skin tone</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes("skin-thinning")}
                              onCheckedChange={(checked) => {
                                const updatedValues = checked
                                  ? [...(field.value || []), "skin-thinning"]
                                  : (field.value || []).filter(value => value !== "skin-thinning");
                                field.onChange(updatedValues);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">G) Skin thinning</FormLabel>
                        </FormItem>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="skinType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">3. How would you describe your skin type?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="oily" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Oily</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="dry" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Dry</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="combination" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Combination</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="normal" />
                            </FormControl>
                            <FormLabel className="font-normal">D) Normal</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          );
          
        case 2: // Anti-aging specific questions
          return (
            <>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="wrinkleVisibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">4. How visible are your wrinkles and fine lines?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="not-visible" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Not visible</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="slightly-visible" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Slightly visible</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="moderately-visible" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Moderately visible</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very-visible" />
                            </FormControl>
                            <FormLabel className="font-normal">D) Very visible</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skinFeelDaily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">5. How does your skin feel daily?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="tight-dry" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Tight and dry</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="oily-shiny" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Oily / Shiny</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="balanced" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Balanced</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="rough-flaky" />
                            </FormControl>
                            <FormLabel className="font-normal">D) Rough or flaky</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="antiAgingProductUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">6. How often do you currently use anti-aging products?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="daily" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Daily</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="occasionally" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Occasionally</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="rarely" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Rarely</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="never" />
                            </FormControl>
                            <FormLabel className="font-normal">D) Never</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retinolUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">7. Have you used retinol or retinoids before?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes-regularly" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Yes, regularly</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="tried-irritation" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Tried it but had irritation</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no-interested" />
                            </FormControl>
                            <FormLabel className="font-normal">C) No, but interested</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no-prefer-alternatives" />
                            </FormControl>
                            <FormLabel className="font-normal">D) No, prefer alternatives</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          );
          
        case 3: // Anti-aging preferences and more
          return (
            <>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="antiAgingIngredientPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">8. What is your preference for anti-aging ingredients?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="retinol" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Retinol / Retinoids</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="peptides" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Peptides</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="vitamin-c" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Vitamin C</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="natural-alternatives" />
                            </FormControl>
                            <FormLabel className="font-normal">D) Natural alternatives (Bakuchiol, botanical extracts)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no-preference" />
                            </FormControl>
                            <FormLabel className="font-normal">E) No strong preference</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skinSensitivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">9. How sensitive is your skin to active ingredients?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very-sensitive" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Very sensitive (often reacts)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="mild-sensitivity" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Mild sensitivity (occasional redness)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="not-sensitive" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Not sensitive (tolerates actives well)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="antiAgingCommitmentLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">10. What level of commitment can you give to an anti-aging routine?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="minimal" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Minimal (basic care, 5 mins)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="moderate" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Moderate (daily routine, 10–15 mins)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="advanced" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Advanced (full anti-aging regimen, &gt;15 mins)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spfPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">11. Do you wear sunscreen daily?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sometimes" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Sometimes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="rarely" />
                            </FormControl>
                            <FormLabel className="font-normal">C) Rarely</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="never" />
                            </FormControl>
                            <FormLabel className="font-normal">D) Never</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fragrance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">12. How important is fragrance-free anti-aging skincare?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very-important" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Very important</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="prefer" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Prefer fragrance-free but flexible</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no-preference" />
                            </FormControl>
                            <FormLabel className="font-normal">C) No preference</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferAntiAgingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">14. Are you interested in preventative anti-aging or corrective?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="preventative" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Preventative (early signs, maintain youth)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="corrective" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Corrective (reverse visible signs)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferNaturalProducts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">15. Do you prefer natural/organic anti-aging products?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes-must-be" />
                            </FormControl>
                            <FormLabel className="font-normal">A) Yes, must be natural</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="prefer-if-effective" />
                            </FormControl>
                            <FormLabel className="font-normal">B) Prefer natural if effective</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no-preference" />
                            </FormControl>
                            <FormLabel className="font-normal">C) No preference</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Additional Information (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any other details about your anti-aging concerns you'd like us to know..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          );
      }
    }
    
    // For skin care questionnaire (default)
    switch (currentStep) {
      case 1: // Basic Information
        return (
          <>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ageGroup"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-base">1. What's your age group?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="under-18" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Under 18</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="18-24" />
                          </FormControl>
                          <FormLabel className="font-normal">B) 18–24</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="25-34" />
                          </FormControl>
                          <FormLabel className="font-normal">C) 25–34</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="35-44" />
                          </FormControl>
                          <FormLabel className="font-normal">D) 35–44</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="45-54" />
                          </FormControl>
                          <FormLabel className="font-normal">E) 45–54</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="55+" />
                          </FormControl>
                          <FormLabel className="font-normal">F) 55+</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-base">2. What's your gender?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Male</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Female</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
        
      case 2: // Skin Concerns and Goals
        return (
          <>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="skinConcerns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">3. What are your top skin concerns? (Pick up to 3)</FormLabel>
                    <FormDescription>
                      Select up to 3 concerns
                    </FormDescription>
                    <div className="mt-2 space-y-1">
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes("acne")}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...(field.value || []), "acne"]
                                : (field.value || []).filter(value => value !== "acne");
                              
                              field.onChange(updatedValues);
                              setShowAcneFollowUp(checked as boolean);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">A) Acne / Pimples</FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes("pigmentation")}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...(field.value || []), "pigmentation"]
                                : (field.value || []).filter(value => value !== "pigmentation");
                              
                              field.onChange(updatedValues);
                              setShowPigmentationFollowUp(checked as boolean);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">B) Hyperpigmentation / Dark Spots</FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes("sensitive")}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...(field.value || []), "sensitive"]
                                : (field.value || []).filter(value => value !== "sensitive");
                              
                              field.onChange(updatedValues);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">C) Sensitive skin</FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes("wrinkles")}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...(field.value || []), "wrinkles"]
                                : (field.value || []).filter(value => value !== "wrinkles");
                              
                              field.onChange(updatedValues);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">D) Wrinkles / Fine Lines</FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes("dark-circles")}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...(field.value || []), "dark-circles"]
                                : (field.value || []).filter(value => value !== "dark-circles");
                              
                              field.onChange(updatedValues);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">E) Dark Circles / Eye Puffiness</FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes("large-pores")}
                            onCheckedChange={(checked) => {
                              const updatedValues = checked
                                ? [...(field.value || []), "large-pores"]
                                : (field.value || []).filter(value => value !== "large-pores");
                              
                              field.onChange(updatedValues);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">F) Large Pores</FormLabel>
                      </FormItem>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Acne follow-up questions */}
              {showAcneFollowUp && (
                <div className="ml-6 space-y-4 border-l-2 border-primary/20 pl-4">
                  <FormField
                    control={form.control}
                    name="acneFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do you currently experience active breakouts?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="frequent" />
                              </FormControl>
                              <FormLabel className="font-normal">A) Yes, frequently</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="occasional" />
                              </FormControl>
                              <FormLabel className="font-normal">B) Occasionally (hormonal or stress-related)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="rarely" />
                              </FormControl>
                              <FormLabel className="font-normal">C) Rarely</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="never" />
                              </FormControl>
                              <FormLabel className="font-normal">D) Never</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acneCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How much do you have at present?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="less-than-3" />
                              </FormControl>
                              <FormLabel className="font-normal">A) &lt;3</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="3-6" />
                              </FormControl>
                              <FormLabel className="font-normal">B) 3-6</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="more-than-6" />
                              </FormControl>
                              <FormLabel className="font-normal">C) &gt;6</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="irregularCycles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do you have irregular cycles?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="yes" />
                              </FormControl>
                              <FormLabel className="font-normal">A) Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="no" />
                              </FormControl>
                              <FormLabel className="font-normal">B) No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Pigmentation follow-up question */}
              {showPigmentationFollowUp && (
                <div className="ml-6 space-y-4 border-l-2 border-primary/20 pl-4">
                  <FormField
                    control={form.control}
                    name="pigmentationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How much tanned are you compared to inner arm?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="single" />
                              </FormControl>
                              <FormLabel className="font-normal">A) Single shade</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="double" />
                              </FormControl>
                              <FormLabel className="font-normal">B) Double shade</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="triple" />
                              </FormControl>
                              <FormLabel className="font-normal">C) Triple shade</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="primaryGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">4. What is your current skincare goal? (Pick 1 main goal)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="clear-breakouts" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Clear breakouts</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="brighten-spots" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Brighten dark spots</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="hydrate" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Hydrate dry skin</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="calm-redness" />
                          </FormControl>
                          <FormLabel className="font-normal">D) Calm redness</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="smooth-lines" />
                          </FormControl>
                          <FormLabel className="font-normal">E) Smooth fine lines</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="maintain-glow" />
                          </FormControl>
                          <FormLabel className="font-normal">F) Maintain healthy glow</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skinType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">5. What is your primary skin type?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="oily" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Oily</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="dry" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Dry</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="combination" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Combination</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="normal" />
                          </FormControl>
                          <FormLabel className="font-normal">D) Normal</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
        
      case 3: // Lifestyle and Preferences
        return (
          <>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="dryness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">6. How often does your skin feel dry (tight, uncomfortable)?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="always" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Always</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="sometimes" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Sometimes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="rarely" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Rarely</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="never" />
                          </FormControl>
                          <FormLabel className="font-normal">D) Never</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sunSensitivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">7. How sensitive is your skin to sun exposure?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="burns-easily" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Burns easily</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="tans-easily" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Tans easily</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="both" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Both burns and tans</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="neither" />
                          </FormControl>
                          <FormLabel className="font-normal">D) Neither (neutral)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="climate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">8. Which climate do you live in?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="humid" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Humid</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="dry" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Dry</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cold" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Cold</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="routineTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">9. How much time do you want to spend on skincare daily?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="less-than-5" />
                          </FormControl>
                          <FormLabel className="font-normal">A) &lt;5 minutes (Very basic)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="5-10" />
                          </FormControl>
                          <FormLabel className="font-normal">B) 5–10 minutes (Simple)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="10-20" />
                          </FormControl>
                          <FormLabel className="font-normal">C) 10–20 minutes (Balanced)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="more-than-20" />
                          </FormControl>
                          <FormLabel className="font-normal">D) &gt;20 minutes (Advanced)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="texturePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">10. Preferred product texture?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="gel" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Gel / Water-based</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cream" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Cream / Rich</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="oil" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Oil-based</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="makeupUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">11. Do you wear makeup daily?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Yes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="occasionally" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Occasionally</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="rarely" />
                          </FormControl>
                          <FormLabel className="font-normal">C) Rarely</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="never" />
                          </FormControl>
                          <FormLabel className="font-normal">D) Never</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fragrance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">12. How important is fragrance-free skincare for you?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="very-important" />
                          </FormControl>
                          <FormLabel className="font-normal">A) Very important</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="prefer" />
                          </FormControl>
                          <FormLabel className="font-normal">B) Prefer but not necessary</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no-preference" />
                          </FormControl>
                          <FormLabel className="font-normal">C) No preference</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spfPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">13. How much SPF protection do you prefer daily?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="15-30" />
                          </FormControl>
                          <FormLabel className="font-normal">A) 15–30</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="30-50" />
                          </FormControl>
                          <FormLabel className="font-normal">B) 30–50</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="50+" />
                          </FormControl>
                          <FormLabel className="font-normal">C) 50+</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="none" />
                          </FormControl>
                          <FormLabel className="font-normal">D) I don't use SPF</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Additional Information (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other details about your skin you'd like us to know..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );
        
      case 4: // Results
        const responseProducts = form.watch("responseProducts") || [];
        const responseRoutine = form.watch("responseRoutine") || "";
        const responseRecommendations = form.watch("responseRecommendations") || "";
        
        return (
          <div className="space-y-6">
            <div className="rounded-lg bg-primary/10 p-4">
              <h3 className="text-lg font-semibold mb-2">Your Personalized Recommendations</h3>
              <p className="text-sm mb-4">{responseRecommendations}</p>
              
              <h4 className="font-medium mb-2">Recommended Products:</h4>
              <ul className="list-disc pl-5 mb-4">
                {responseProducts.map((product, index) => (
                  <li key={index} className="mb-1">{product}</li>
                ))}
              </ul>
              
              <h4 className="font-medium mb-2">Suggested Routine:</h4>
              <p className="text-sm whitespace-pre-line">{responseRoutine}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Thank you for completing the questionnaire. Your personalized skincare recommendations
                are based on your answers and skin profile.
              </p>
              <Button 
                variant="default"
                onClick={onComplete}
                className="bg-primary text-black hover:bg-primary/90"
              >
                Return to Care Hub
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center">
          <span className="mr-2">🧴</span>
          {questionnaireType === "skin" ? "Skin Care" : 
           questionnaireType === "hair" ? "Hair Care" : "Anti-Aging"} Questionnaire
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Progress indicator */}
            {currentStep < 4 && (
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
                  <span className="text-sm font-medium">{Math.round((currentStep / 3) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Step content */}
            {renderStep()}
            
            {/* Navigation buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button type="button" onClick={goToNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={submitQuestionnaire.isPending}
                    className="bg-primary text-black hover:bg-primary/90"
                  >
                    {submitQuestionnaire.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Submit
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}