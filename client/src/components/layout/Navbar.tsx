import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MenuIcon, XIcon } from "@/assets/icons";
import { useIndustry } from "@/lib/industryContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogIn, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();

  // Get industry context
  const { selectedIndustry } = useIndustry();

  // Get business branding from localStorage
  const businessName = localStorage.getItem('businessName') || 'Scheduled Pro';

  // Check if user is logged in (admin, client, team, or superadmin)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'client' | 'team' | 'superadmin' | null>(null);
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    const checkLoginStatus = () => {
      // Check for admin
      const adminKey = sessionStorage.getItem('admin-key');
      if (adminKey) {
        setIsLoggedIn(true);
        setUserType('admin');
        setUserName('Admin');
        return;
      }

      // Check for superadmin
      const superadminKey = sessionStorage.getItem('superadmin-key');
      if (superadminKey) {
        setIsLoggedIn(true);
        setUserType('superadmin');
        setUserName('Super Admin');
        return;
      }

      // Check for client
      const clientUser = localStorage.getItem('clientUser');
      if (clientUser) {
        try {
          const user = JSON.parse(clientUser);
          setIsLoggedIn(true);
          setUserType('client');
          setUserName(user.name || user.email || 'Client');
          return;
        } catch (e) {
          // Invalid JSON, clear it
          localStorage.removeItem('clientUser');
        }
      }

      // Check for team member
      const teamMemberSession = localStorage.getItem('teamMemberSession');
      if (teamMemberSession) {
        try {
          const session = JSON.parse(teamMemberSession);
          setIsLoggedIn(true);
          setUserType('team');
          setUserName(session.name || 'Team Member');
          return;
        } catch (e) {
          localStorage.removeItem('teamMemberSession');
        }
      }

      // No login found
      setIsLoggedIn(false);
      setUserType(null);
      setUserName('User');
    };

    checkLoginStatus();
  }, [location]);
  
  // Track scrolling for enhanced mobile UX
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Generate links with service name based on industry
  const serviceLabel = selectedIndustry.name === "Influencer" ? "Content" : 
                      selectedIndustry.name === "Custom Business" ? "Services" : 
                      `${selectedIndustry.name} Services`;
  
  const links = [
    { name: serviceLabel, href: "/home", scroll: "services" },
    { name: "Book", href: "/booking" },
    { name: "Reviews", href: "/home", scroll: "reviews" }
  ];

  const handleLogout = () => {
    // Clear all authentication data
    sessionStorage.removeItem('admin-key');
    sessionStorage.removeItem('superadmin-key');
    localStorage.removeItem('clientUser');
    localStorage.removeItem('clientData');
    localStorage.removeItem('teamMemberSession');
    localStorage.removeItem('teamMemberContext');

    // Redirect to home
    setLocation('/home');

    // Update state
    setIsLoggedIn(false);
    setUserType(null);
  };

  const getDashboardLink = () => {
    switch (userType) {
      case 'admin':
        return '/admin';
      case 'superadmin':
        return '/superadmin';
      case 'client':
        return '/client-dashboard';
      case 'team':
        return '/team-dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <header 
      className={`bg-white sticky top-0 z-50 safe-top transition-all ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/home">
            <div className="flex items-center cursor-pointer text-xl font-bold text-primary">
              <img src="/scheduled-pro-logo.png" alt="Scheduled Pro" className="h-8 w-auto mr-3" />
              <span className="font-display">{businessName}</span>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-10">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
            >
              <div
                className={`cursor-pointer text-foreground hover:text-primary transition-colors tap-highlight-none ${
                  location === link.href ? "text-primary font-medium" : ""
                }`}
                onClick={(e) => {
                  if (link.scroll && location === "/home") {
                    e.preventDefault();
                    const element = document.getElementById(link.scroll);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {link.name}
              </div>
            </Link>
          ))}

          {/* Client Login Button or User Dropdown */}
          {!isLoggedIn ? (
            <Link href="/client-login">
              <Button variant="default" size="sm" className="ml-4">
                <LogIn className="w-4 h-4 mr-2" />
                Client Login
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-4">
                  <User className="w-4 h-4 mr-2" />
                  {userName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation(getDashboardLink())}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-foreground focus:outline-none tap-highlight-none"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      
      {/* Mobile menu with animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="bg-white px-4 py-2 flex flex-col space-y-4 pb-4 shadow-md">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
            >
              <div
                className={`cursor-pointer text-foreground hover:text-primary transition-colors py-2 ${
                  location === link.href ? "text-primary font-medium" : ""
                }`}
                onClick={(e) => {
                  if (link.scroll && location === "/home") {
                    e.preventDefault();
                    const element = document.getElementById(link.scroll);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {link.name}
              </div>
            </Link>
          ))}

          {/* Mobile Client Login/User Menu */}
          <div className="pt-2 border-t border-gray-200">
            {!isLoggedIn ? (
              <Link href="/client-login">
                <Button variant="default" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Client Login
                </Button>
              </Link>
            ) : (
              <div className="space-y-2">
                <div className="px-2 py-1 text-sm text-gray-600">
                  Logged in as <span className="font-medium">{userName}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation(getDashboardLink())}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
