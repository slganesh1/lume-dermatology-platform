import { useLocation, Link } from "wouter";
import { useTabContext } from "@/contexts/TabContext";

export function MobileNav() {
  const [location] = useLocation();
  const { setActiveTab } = useTabContext();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleNavClick = (path: string, tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a 
            className={`group inline-flex flex-col items-center justify-center px-5 py-3 text-sm font-medium ${isActive('/') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => handleNavClick('/', 'skinAnalysis')}
          >
            <svg 
              className={`h-6 w-6 ${isActive('/') ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </a>
        </Link>
        <Link href="/patients">
          <a 
            className={`group inline-flex flex-col items-center justify-center px-5 py-3 text-sm font-medium ${isActive('/patients') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => handleNavClick('/patients', 'patients')}
          >
            <svg 
              className={`h-6 w-6 ${isActive('/patients') ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Patients</span>
          </a>
        </Link>
        <Link href="/appointments">
          <a 
            className={`group inline-flex flex-col items-center justify-center px-5 py-3 text-sm font-medium ${isActive('/appointments') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => handleNavClick('/appointments', 'appointments')}
          >
            <svg 
              className={`h-6 w-6 ${isActive('/appointments') ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Calendar</span>
          </a>
        </Link>
        <Link href="/medications">
          <a 
            className={`group inline-flex flex-col items-center justify-center px-5 py-3 text-sm font-medium ${isActive('/medications') ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => handleNavClick('/medications', 'medications')}
          >
            <svg 
              className={`h-6 w-6 ${isActive('/medications') ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Medicine</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
