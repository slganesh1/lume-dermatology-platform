import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface MobileLayoutProps {
  children: React.ReactNode;
}

interface NavItemDef {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsNativePlatform(Capacitor.isNativePlatform());
  }, []);

  // Only apply mobile layout on native platforms
  if (!isNativePlatform) {
    return <>{children}</>;
  }

  // Icons for navigation items
  const icons = {
    home: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    patients: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    appointments: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    analysis: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
      </svg>
    ),
    medications: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m17 3-5 5-5-5h10"></path>
        <path d="M17 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4"></path>
        <line x1="12" y1="12" x2="12" y2="12.01"></line>
        <line x1="12" y1="16" x2="12" y2="16.01"></line>
        <line x1="16" y1="12" x2="16" y2="12.01"></line>
        <line x1="8" y1="12" x2="8" y2="12.01"></line>
      </svg>
    ),
    prescriptions: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13 2 13 9 20 9"></polyline>
        <line x1="9" y1="14" x2="15" y2="14"></line>
        <line x1="9" y1="17" x2="15" y2="17"></line>
        <line x1="9" y1="11" x2="9" y2="11"></line>
      </svg>
    )
  };

  // Common nav items for all users
  const commonNavItems: NavItemDef[] = [
    {
      href: "/",
      icon: icons.home,
      label: "Home"
    },
    {
      href: "/appointments",
      icon: icons.appointments,
      label: "Appts"
    }
  ];

  // Get role-based navigation items
  const getRoleBasedNavItems = () => {
    if (!user) {
      return commonNavItems;
    }

    switch (user.role) {
      case "doctor":
        // Doctors have access to everything
        return [
          ...commonNavItems,
          {
            href: "/patients",
            icon: icons.patients,
            label: "Patients"
          },
          {
            href: "/skin-analysis",
            icon: icons.analysis,
            label: "Analysis"
          },
          {
            href: "/prescriptions",
            icon: icons.prescriptions,
            label: "Rx"
          }
        ];

      case "assistant":
        // Assistants focus on appointments and patients
        return [
          ...commonNavItems,
          {
            href: "/patients",
            icon: icons.patients,
            label: "Patients"
          },
          {
            href: "/prescriptions",
            icon: icons.prescriptions,
            label: "Rx"
          }
        ];

      case "patient":
        // Patients only see their own data
        return [
          ...commonNavItems,
          {
            href: "/skin-analysis",
            icon: icons.analysis,
            label: "Analysis"
          },
          {
            href: "/prescriptions",
            icon: icons.prescriptions,
            label: "Rx"
          },
          {
            href: "/pharmacy",
            icon: icons.medications,
            label: "Pharmacy"
          }
        ];

      default:
        return commonNavItems;
    }
  };

  const navItems = getRoleBasedNavItems();

  return (
    <div className="flex flex-col h-screen">
      {/* Content area */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom navigation bar - fixed to bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-1">
        <div className="flex justify-around items-center">
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={location === item.href}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex flex-col items-center justify-center px-2 py-1 rounded-md cursor-pointer",
        isActive ? "text-primary-600" : "text-gray-500 hover:text-gray-800"
      )}>
        <div className={cn(
          "rounded-full p-1",
          isActive ? "bg-primary-100" : "bg-transparent"
        )}>
          {icon}
        </div>
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
}