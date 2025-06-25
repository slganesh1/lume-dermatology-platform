import { useTabContext } from "@/contexts/TabContext";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { activeTab, setActiveTab } = useTabContext();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      
      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button 
            className={`${activeTab === 'skinAnalysis' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('skinAnalysis')}
          >
            Skin Analysis
          </button>
          <button 
            className={`${activeTab === 'patients' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('patients')}
          >
            Patients
          </button>
          <button 
            className={`${activeTab === 'appointments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button 
            className={`${activeTab === 'medications' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab('medications')}
          >
            Medications
          </button>
        </nav>
      </div>
    </div>
  );
}
