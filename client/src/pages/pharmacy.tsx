import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type Medication } from "@shared/schema";
import MedicationList from "@/components/medication-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Pharmacy() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("name-asc");

  // Extract patientId from query params if passed in URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlPatientId = urlParams.get("patientId");

  // Fetch medications
  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  // Filter medications based on search term and category
  const filteredMedications = Array.isArray(medications)
    ? medications
        .filter((medication) => {
          const matchesSearch = searchTerm
            ? medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              medication.description?.toLowerCase().includes(searchTerm.toLowerCase())
            : true;

          const matchesCategory =
            categoryFilter === "all" || medication.category === categoryFilter;

          return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
          switch (sortOption) {
            case "name-asc":
              return a.name.localeCompare(b.name);
            case "name-desc":
              return b.name.localeCompare(a.name);
            case "price-asc":
              return a.price - b.price;
            case "price-desc":
              return b.price - a.price;
            default:
              return 0;
          }
        })
    : [];

  // Get unique categories for filter dropdown
  const categories = Array.isArray(medications)
    ? ["all", ...new Set(medications.map((med) => med.category))]
    : ["all"];

  return (
    <div className="py-6 mt-16 md:mt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pharmacy</h1>
          <p className="text-gray-600">
            Browse and purchase medications for your patients
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search medications..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <Label htmlFor="category-filter">Filter by Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <Label htmlFor="sort-options">Sort by</Label>
              <Select
                value={sortOption}
                onValueChange={(value) => setSortOption(value)}
              >
                <SelectTrigger id="sort-options">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {urlPatientId && (
              <div className="w-full md:w-1/3 flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/patients/${urlPatientId}`)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  Back to Patient
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medications Grid */}
      <MedicationList 
        medications={filteredMedications} 
        isLoading={isLoading}
        patientId={urlPatientId ? parseInt(urlPatientId) : undefined}
      />
    </div>
  );
}
