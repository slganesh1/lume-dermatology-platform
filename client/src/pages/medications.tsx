import { useState } from "react";
import { MedicationList } from "@/components/medications/MedicationList";
import { MedicationCart } from "@/components/medications/MedicationCart";

export default function Medications() {
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Medication Catalog</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {!showCart && (
            <MedicationList 
              onShowCart={() => setShowCart(true)}
            />
          )}
          
          {showCart && (
            <MedicationCart 
              onContinueShopping={() => setShowCart(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}
