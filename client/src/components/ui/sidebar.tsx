import { AvatarProfile } from "@/components/ui/avatar-profile";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export default function Sidebar({ isMobileMenuOpen, toggleMobileMenu }: SidebarProps) {
  const [location] = useLocation();
  const { user, isLoading, logoutMutation } = useAuth();

  // Icons for navigation items
  const icons = {
    dashboard: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    patients: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    appointments: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    skinAnalysis: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24"></path>
        <path d="M21 8V3h-5"></path>
        <path d="M15 7c-1.07-.71-2.25-1-4-1a9 9 0 1 0 9 9"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    careHub: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        <path d="M19.5 12h2.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2H12"></path>
      </svg>
    ),
    prescriptions: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13 2 13 9 20 9"></polyline>
        <line x1="9" y1="14" x2="15" y2="14"></line>
        <line x1="9" y1="17" x2="15" y2="17"></line>
        <line x1="9" y1="11" x2="9" y2="11"></line>
      </svg>
    ),
    pharmacy: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2h18v4H3z"></path>
        <path d="M7 6v16"></path>
        <path d="M17 6v16"></path>
        <path d="M3 10h18"></path>
        <path d="M3 14h18"></path>
        <path d="M3 18h18"></path>
      </svg>
    ),
    reports: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    expertValidation: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"></path>
        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
        <path d="M13 12h3"></path>
        <path d="M8 12h3"></path>
      </svg>
    ),

  };

  // Common menu items for all roles
  const commonItems: NavItem[] = [
    {
      path: "/",
      label: "Dashboard",
      icon: icons.dashboard,
    },
    {
      path: "/appointments",
      label: "Appointments",
      icon: icons.appointments,
    },
  ];

  // Get role-based navigation items
  const getRoleBasedNavItems = () => {
    if (!user) {
      return [];
    }

    switch (user.role) {
      case "doctor":
        // Doctors have access to everything including expert validation
        return [
          ...commonItems,
          {
            path: "/expert-validation",
            label: "Expert Validation",
            icon: icons.expertValidation,
          },
          {
            path: "/patients",
            label: "Patients",
            icon: icons.patients,
          },
          {
            path: "/skin-analysis",
            label: "Skin Analysis",
            icon: icons.skinAnalysis,
          },
          {
            path: "/care-hub",
            label: "Care Hub",
            icon: icons.careHub,
          },
          {
            path: "/prescriptions",
            label: "Prescriptions",
            icon: icons.prescriptions,
          },
          {
            path: "/pharmacy",
            label: "Pharmacy",
            icon: icons.pharmacy,
          },
          {
            path: "/reports",
            label: "Reports",
            icon: icons.reports,
          },
        ];

      case "assistant":
        // Assistants have limited access
        return [
          ...commonItems,
          {
            path: "/patients",
            label: "Patients",
            icon: icons.patients,
          },
          {
            path: "/prescriptions",
            label: "Prescriptions",
            icon: icons.prescriptions,
          },
        ];

      case "expert":
        return [
          ...commonItems,
          {
            path: "/expert-validation",
            label: "Expert Validation",
            icon: icons.expertValidation,
          },
          {
            path: "/patients",
            label: "Patients",
            icon: icons.patients,
          },
        ];

      case "patient":
        // Patients only see their own data
        return [
          ...commonItems,
          {
            path: "/skin-analysis",
            label: "Skin Analysis",
            icon: icons.skinAnalysis,
          },
          {
            path: "/care-hub",
            label: "Care Hub",
            icon: icons.careHub,
          },
          {
            path: "/prescriptions",
            label: "My Prescriptions",
            icon: icons.prescriptions,
          },
          {
            path: "/pharmacy",
            label: "Buy Medications",
            icon: icons.pharmacy,
          },
        ];

      default:
        return commonItems;
    }
  };

  // Development and testing tools
  const developerItems: NavItem[] = [];
  
  // Get navigation items based on user role
  const roleBasedItems = user ? getRoleBasedNavItems() : commonItems;
  
  // Add developer tools to the navigation items
  const navItems = [...roleBasedItems, ...developerItems];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Sidebar for desktop and tablet */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b">
            <div className="flex items-center">
              <div className="rounded-full bg-black w-8 h-8 flex items-center justify-center mr-2">
                <svg
                  className="w-5 h-5 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a9 9 0 0 0-9 9s2 6 9 6 9-6 9-6a9 9 0 0 0-9-9z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <span className="text-xl font-semibold text-black">LUME</span>
              <span className="text-xs ml-1 text-primary uppercase tracking-wider font-light">Bringing Brightness</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="px-4 space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    onClick={() => {
                      if (isMobileMenuOpen) {
                        toggleMobileMenu();
                      }
                    }}
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      isActive(item.path)
                        ? "bg-black text-primary"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`mr-3 ${isActive(item.path) ? "text-primary" : "text-gray-500"}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile or Login */}
          <div className="p-4 border-t">
            {isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <AvatarProfile
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                    name={user.name}
                    size="md"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/auth" className="w-full block">
                  <Button className="w-full" variant="default">
                    Sign In
                  </Button>
                </Link>
                <div className="text-xs text-center text-gray-500">
                  Access your LUME account
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 w-full bg-white shadow-sm z-40 md:hidden">
        <div className="flex items-center justify-between p-4">
          <button
            className="text-gray-600 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="flex items-center">
            <div className="rounded-full bg-black w-8 h-8 flex items-center justify-center mr-2">
              <svg
                className="w-5 h-5 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 0-9 9s2 6 9 6 9-6 9-6a9 9 0 0 0-9-9z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <span className="text-xl font-semibold text-black">LUME</span>
          </div>
          <div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : user ? (
              <AvatarProfile
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                name={user.name}
                size="sm"
              />
            ) : (
              <Link 
                href="/auth"
                className="text-sm font-medium text-primary hover:underline"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
