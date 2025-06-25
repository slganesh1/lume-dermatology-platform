import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, ArrowLeft, Save, Upload } from "lucide-react";
import { type Medication } from "@shared/schema";

export default function EditMedication() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    dosageForm: "",
    price: "",
    inStock: true
  });

  // Fetch the medication details
  const { data: medication, isLoading } = useQuery<Medication>({
    queryKey: [`/api/medications/${id}`],
    enabled: !!id
  });

  // Pre-fill form when medication data is loaded
  useEffect(() => {
    if (medication) {
      setForm({
        name: medication.name || "",
        category: medication.category || "",
        description: medication.description || "",
        dosageForm: medication.dosageForm || "",
        price: (medication.price / 100).toFixed(2),
        inStock: medication.inStock
      });
    }
  }, [medication]);

  // Update medication mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("PUT", `/api/medications/${id}`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Medication Updated",
        description: "The medication has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/medications/${id}`] });
      setLocation("/pharmacy");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating the medication.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("description", form.description);
    formData.append("dosageForm", form.dosageForm);
    
    // Convert price from dollars to cents
    formData.append("price", (parseFloat(form.price) * 100).toString());
    formData.append("inStock", form.inStock.toString());
    
    if (image) {
      formData.append("image", image);
    }
    
    updateMutation.mutate(formData);
  };

  const handleImageSelected = (file: File) => {
    setImage(file);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/pharmacy")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pharmacy
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Medication</CardTitle>
            <CardDescription>
              Update medication details and add a product image
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Medication Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dosageForm">Dosage Form</Label>
                    <Input
                      id="dosageForm"
                      value={form.dosageForm}
                      onChange={(e) => setForm({ ...form, dosageForm: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="inStock"
                      checked={form.inStock}
                      onCheckedChange={(checked) => setForm({ ...form, inStock: checked })}
                    />
                    <Label htmlFor="inStock">In Stock</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Medication Image</Label>
                    <div className="mt-2">
                      <div className="flex flex-col items-center">
                        {medication?.image && !image && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                            <img 
                              src={medication.image} 
                              alt={medication.name} 
                              className="max-h-40 rounded-md shadow-sm" 
                            />
                          </div>
                        )}
                        
                        {image && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">New Image Preview:</p>
                            <img 
                              src={URL.createObjectURL(image)} 
                              alt="Preview" 
                              className="max-h-40 rounded-md shadow-sm" 
                            />
                          </div>
                        )}
                        
                        <div className="w-full">
                          <ImageUpload onImageSelected={handleImageSelected} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/pharmacy")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}