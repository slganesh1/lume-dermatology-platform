import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { type Medication } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { getMedicationImage } from "./medication-images";

interface MedicationListProps {
  medications: Medication[];
  isLoading: boolean;
  patientId?: number;
}

export default function MedicationList({ 
  medications, 
  isLoading,
  patientId 
}: MedicationListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleMedicationClick = (medication: Medication) => {
    setSelectedMedication(medication);
    setQuantity(1);
  };

  const handleClose = () => {
    setSelectedMedication(null);
  };

  // Purchase medication mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: { medicationId: number; patientId?: number; quantity: number }) => {
      // This is a simplified version - in a real app, this would create a purchase record
      const response = await apiRequest("POST", "/api/medications/purchase", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful",
        description: "The medication has been added to the patient's prescription",
      });
      setSelectedMedication(null);
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!selectedMedication) return;
    
    if (patientId) {
      purchaseMutation.mutate({
        medicationId: selectedMedication.id,
        patientId,
        quantity,
      });
    } else {
      toast({
        title: "Patient Required",
        description: "Please select a patient before purchasing medication",
        variant: "destructive",
      });
      setLocation("/patients");
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!medications.length) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 2h18v4H3z"></path>
          <path d="M7 6v16"></path>
          <path d="M17 6v16"></path>
          <path d="M3 10h18"></path>
          <path d="M3 14h18"></path>
          <path d="M3 18h18"></path>
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No medications found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No medications match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map((medication) => (
          <Card key={medication.id} className="overflow-hidden">
            <div 
              className="h-48 bg-gray-100 overflow-hidden relative group"
              style={{
                backgroundImage: `url(${getMedicationImage(medication.name, medication.image || '/uploads/medicine-placeholder.jpg')})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-primary-700">{medication.name}</h3>
                  <Badge variant="outline" className="mb-2">{medication.category}</Badge>
                </div>
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">{formatCurrency(medication.price)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{medication.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-gray-500">Form: </span>
                  <span className="font-medium text-primary-600">{medication.dosageForm}</span>
                </div>
                <Badge variant={medication.inStock ? "success" : "destructive"}>
                  {medication.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button 
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/medications/${medication.id}/edit`);
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit
                </Button>
                <Button 
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                  onClick={() => handleMedicationClick(medication)}
                  disabled={!medication.inStock}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedMedication} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Purchase Medication</DialogTitle>
          </DialogHeader>

          {selectedMedication && (
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="flex items-center space-x-4">
                <div 
                  className="h-20 w-20 bg-gray-100 rounded-md"
                  style={{
                    backgroundImage: `url(${getMedicationImage(selectedMedication.name, selectedMedication.image || '/uploads/medicine-placeholder.jpg')})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
                <div>
                  <h3 className="font-medium text-primary-700">{selectedMedication.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMedication.dosageForm}</p>
                  <p className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">{formatCurrency(selectedMedication.price)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>

              <div className="bg-primary-50 p-4 rounded-md border border-primary-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per unit:</span>
                  <span className="text-primary-600">{formatCurrency(selectedMedication.price)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="text-primary-600">{quantity}</span>
                </div>
                <div className="flex justify-between items-center font-medium border-t border-primary-200 pt-2">
                  <span className="text-primary-700">Total:</span>
                  <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">{formatCurrency(selectedMedication.price * quantity)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
            >
              {purchaseMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
