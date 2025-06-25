import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Patient } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface PatientListProps {
  onNewPatient: () => void;
  onViewPatient: (id: number) => void;
}

export function PatientList({ onNewPatient, onViewPatient }: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: patients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });
  
  // Filter patients based on search query
  const filteredPatients = patients?.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const pid = patient.pid.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || pid.includes(query);
  });

  return (
    <Card className="shadow">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">Patient Records</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Search and manage patient information</p>
          </div>
          <Button onClick={onNewPatient}>
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Patient
          </Button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {/* Search input */}
          <div className="max-w-lg w-full lg:max-w-xs mb-6">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2"
                placeholder="Search by name or PID"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Patient list */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading patients...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">Error loading patients</div>
            ) : filteredPatients && filteredPatients.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Gender</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Visit</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.pid}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {patient.photoUrl ? (
                              <img className="h-10 w-10 rounded-full" src={patient.photoUrl} alt={`${patient.firstName} ${patient.lastName}`} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
                            <div className="text-sm text-gray-500">{patient.issueSummary?.split('.')[0] || 'No issues recorded'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.age} / {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.contact}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.lastVisitDate ? formatDate(new Date(patient.lastVisitDate)) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.nextVisitDate ? formatDate(new Date(patient.nextVisitDate)) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-primary hover:text-primary mr-3" onClick={() => onViewPatient(patient.id)}>View</a>
                        <a href="#" className="text-gray-600 hover:text-gray-900">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-4">No patients found</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
