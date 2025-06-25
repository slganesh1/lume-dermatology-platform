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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define common schema that works for all questionnaire types
const questionnaireSchema = z.object({
  patientId: z.number(),
  questionnaireType: z.enum(["skin", "hair", "antiaging"]),
  age: z.string(),
  gender: z.string(),
  concerns: z.array(z.string()),
  routineLevel: z.string(),
  allergies: z.string().optional(),
  hasAllergies: z.boolean().default(false),
  currentProducts: z.array(z.string()),
  washFrequency: z.string().optional(),
  heatStyling: z.boolean().optional(),
  chemicalTreatments: z.boolean().optional(),
  dietType: z.string(),
  exerciseFrequency: z.string(),
  stressLevel: z.string(),
  urbanEnvironment: z.boolean(),
  smoker: z.boolean(),
  productPreferences: z.string(),
  budgetRange: z.string(),
  additionalInfo: z.string().optional(),
});

type QuestionnaireFormValues = z.infer<typeof questionnaireSchema>;

interface CareQuestionnaireProps {
  questionnaireType: "skin" | "hair" | "antiaging";
  patientId: number;
  onComplete?: () => void;
}

export default function CareQuestionnaire({ 
  questionnaireType, 
  patientId,
  onComplete
}: CareQuestionnaireProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define options specific to each questionnaire type
  const concernOptions = {
    skin: [
      { id: "acne", label: "Acne" },
      { id: "wrinkles", label: "Wrinkles/Fine Lines" },
      { id: "dryness", label: "Dryness" },
      { id: "redness", label: "Redness" },
      { id: "hyperpigmentation", label: "Hyperpigmentation (Dark Spots)" },
      { id: "sunDamage", label: "Sun Damage" },
      { id: "sensitivity", label: "Sensitivity" },
      { id: "oiliness", label: "Excess Oil" },
    ],
    hair: [
      { id: "dryness", label: "Dryness" },
      { id: "frizz", label: "Frizz" },
      { id: "hairLoss", label: "Hair Loss" },
      { id: "splitEnds", label: "Split Ends" },
      { id: "dullness", label: "Dullness" },
      { id: "oiliness", label: "Oiliness" },
      { id: "damage", label: "Damage (Heat/Coloring)" },
      { id: "scalpSensitivity", label: "Scalp Sensitivity" },
    ],
    antiaging: [
      { id: "wrinkles", label: "Wrinkles/Fine Lines" },
      { id: "sagging", label: "Skin Sagging" },
      { id: "ageSpots", label: "Age Spots" },
      { id: "dullness", label: "Dullness/Uneven Tone" },
      { id: "dryness", label: "Dryness" },
      { id: "thinning", label: "Skin Thinning" },
      { id: "eyeConcerns", label: "Under-eye Concerns" },
      { id: "neckConcerns", label: "Neck/Décolletage Concerns" },
    ],
  };

  const productOptions = {
    skin: [
      { id: "cleanser", label: "Cleanser" },
      { id: "moisturizer", label: "Moisturizer" },
      { id: "toner", label: "Toner" },
      { id: "serum", label: "Serum" },
      { id: "exfoliator", label: "Exfoliator" },
      { id: "faceMask", label: "Face Mask" },
      { id: "eyeCream", label: "Eye Cream" },
      { id: "spotTreatment", label: "Spot Treatment" },
      { id: "sunscreen", label: "Sunscreen" },
    ],
    hair: [
      { id: "shampoo", label: "Shampoo" },
      { id: "conditioner", label: "Conditioner" },
      { id: "hairOil", label: "Hair Oil" },
      { id: "leaveIn", label: "Leave-in Treatment" },
      { id: "hairMask", label: "Hair Mask" },
      { id: "scalpTreatment", label: "Scalp Treatment" },
      { id: "dryShampoo", label: "Dry Shampoo" },
      { id: "hairSpray", label: "Hair Spray/Styling Products" },
    ],
    antiaging: [
      { id: "cleanser", label: "Anti-aging Cleanser" },
      { id: "serum", label: "Anti-aging Serum" },
      { id: "moisturizer", label: "Anti-aging Moisturizer" },
      { id: "eyeCream", label: "Eye Cream" },
      { id: "neckCream", label: "Neck/Décolletage Cream" },
      { id: "sunscreen", label: "Sunscreen" },
      { id: "retinol", label: "Retinol Product" },
      { id: "exfoliator", label: "Gentle Exfoliator" },
      { id: "mask", label: "Anti-aging Mask" },
    ],
  };

  // Form default values
  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      patientId,
      questionnaireType,
      age: "",
      gender: "",
      concerns: [],
      routineLevel: "",
      allergies: "",
      hasAllergies: false,
      currentProducts: [],
      washFrequency: questionnaireType === "hair" ? "" : undefined,
      heatStyling: questionnaireType === "hair" ? false : undefined,
      chemicalTreatments: questionnaireType === "hair" ? false : undefined,
      dietType: "",
      exerciseFrequency: "",
      stressLevel: "",
      urbanEnvironment: false,
      smoker: false,
      productPreferences: "",
      budgetRange: "",
      additionalInfo: "",
    },
  });

  // Questionnaire submission handler
  const submitQuestionnaire = useMutation({
    mutationFn: async (data: QuestionnaireFormValues) => {
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

  const onSubmit = (data: QuestionnaireFormValues) => {
    // Clean up the data before submission
    if (!data.hasAllergies) {
      data.allergies = "";
    }
    
    // Submit the form
    submitQuestionnaire.mutate(data);
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center">
          <span className="mr-2">
            {questionnaireType === "skin" ? "🧴" : 
             questionnaireType === "hair" ? "💇" : "✨"} 
          </span>
          {questionnaireType === "skin" ? "Skin Care" : 
           questionnaireType === "hair" ? "Hair Care" : "Anti-Aging"} Questionnaire
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-muted/40 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Range</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="18-24">18-24</SelectItem>
                          <SelectItem value="25-34">25-34</SelectItem>
                          <SelectItem value="35-44">35-44</SelectItem>
                          <SelectItem value="45-54">45-54</SelectItem>
                          <SelectItem value="55+">55+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-Binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer Not to Say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Type-specific sections */}
            <div className="bg-primary/5 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">
                {questionnaireType === "skin" ? "Skin" : 
                 questionnaireType === "hair" ? "Hair" : "Anti-Aging"} Care Questions
              </h3>
              
              {/* Primary Concerns */}
              <FormField
                control={form.control}
                name="concerns"
                render={() => (
                  <FormItem className="mb-4">
                    <div className="mb-2">
                      <FormLabel>What are your primary {questionnaireType} concerns?</FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {concernOptions[questionnaireType].map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="concerns"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Routine Level */}
              <FormField
                control={form.control}
                name="routineLevel"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>
                      How would you describe your current {questionnaireType} care routine?
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select routine level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minimal">Simple/Minimal</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="none">I Don't Have a Routine</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Allergies */}
              <FormField
                control={form.control}
                name="hasAllergies"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I have allergies or sensitivities related to {questionnaireType} care products
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("hasAllergies") && (
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Please specify your allergies or sensitivities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., fragrances, specific ingredients, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Current Products */}
              <FormField
                control={form.control}
                name="currentProducts"
                render={() => (
                  <FormItem className="mb-4">
                    <div className="mb-2">
                      <FormLabel>
                        What type of {questionnaireType} care products do you currently use or are interested in?
                      </FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {productOptions[questionnaireType].map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="currentProducts"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hair-specific questions */}
              {questionnaireType === "hair" && (
                <>
                  <FormField
                    control={form.control}
                    name="washFrequency"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>How often do you wash your hair?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="2-3">2-3 times a week</SelectItem>
                            <SelectItem value="once-week">Once a week</SelectItem>
                            <SelectItem value="less-than-once">Less than once a week</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="heatStyling"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I regularly use heat styling tools (e.g., straighteners, curlers, blow dryers)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chemicalTreatments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I dye or chemically treat my hair
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Lifestyle & Environment */}
            <div className="bg-muted/40 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">Lifestyle & Environment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dietType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How would you describe your diet?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select diet type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="processed">High in Processed Foods</SelectItem>
                          <SelectItem value="plant-based">Vegan/Vegetarian</SelectItem>
                          <SelectItem value="no-attention">I Don't Pay Much Attention to My Diet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exerciseFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How often do you exercise?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exercise frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="3-5-week">3-5 times a week</SelectItem>
                          <SelectItem value="once-week">Once a week</SelectItem>
                          <SelectItem value="rarely">Rarely</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="stressLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you experience high levels of stress?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stress level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="often">Often</SelectItem>
                          <SelectItem value="sometimes">Sometimes</SelectItem>
                          <SelectItem value="rarely">Rarely</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="urbanEnvironment"
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
                          I live in a city with high pollution levels or harsh environmental conditions
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smoker"
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
                          I smoke or am frequently exposed to second-hand smoke
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Product Preferences */}
            <div className="bg-primary/5 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">Product Preferences</h3>
              
              <FormField
                control={form.control}
                name="productPreferences"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>
                      Do you prefer cruelty-free, vegan, or natural products?
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="no-preference">No Preference</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What is your budget range for {questionnaireType} care products?
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="budget">Budget-friendly ($)</SelectItem>
                        <SelectItem value="mid-range">Mid-range ($$)</SelectItem>
                        <SelectItem value="premium">Premium ($$$)</SelectItem>
                        <SelectItem value="luxury">Luxury ($$$$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormDescription>
                    Is there anything else you'd like to share that could help us personalize your recommendations?
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about your specific needs or concerns..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-primary text-black hover:bg-primary/90"
                disabled={submitQuestionnaire.isPending}
              >
                {submitQuestionnaire.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Questionnaire
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}