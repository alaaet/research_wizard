import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import rwiz from '../../assets/icons/png/rwiz.png'
import { 
  Home, 
  MapPin, 
  Wand, 
  Package, 
  Wallet, 
  BarChart2, 
  Menu, 
  X,
  Sun,
  Moon,
  ChevronRight,
  Settings,
  Users,
  FileText,
  Cog
} from 'lucide-react';
import { useUserMetaData } from '../context/UserMetaDataContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const { name, email } = useUserMetaData();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  // Handle theme toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const navItems = [
    { title: 'Home', path: '/', icon: Home },
    { title: 'Projects', path: '/projects', icon: Package },
    { title: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Navigation Toggle with improved animation */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={toggleSidebar} 
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-all active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation with improved animation and transitions */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:relative md:translate-x-0 flex flex-col h-full overflow-y-auto`}
      >
        <div className="p-2 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            {/* <Wand className="h-6 w-6 text-rwiz-primary" /> */}
            <img src={rwiz} alt="Research Wizard" className="h-8 w-8" />
            <span className="text-lg font-bold text-foreground">Research Wizard</span>
          </Link>
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'bg-rwiz-primary/10 text-rwiz-primary font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-foreground'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-rwiz-primary' : ''}`} />
              <span>{item.title}</span>
              
              {isActive(item.path) && (
                <div className="ml-auto flex items-center">
                  <span className="h-2 w-2 rounded-full bg-rwiz-primary animate-pulse-slow"></span>
                  <ChevronRight className="h-4 w-4 text-rwiz-primary ml-1" />
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{name.split(' ').map(n => n[0]).join('').toUpperCase() || 'DU'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{name || 'Default User'}</p>
              <p className="text-xs text-muted-foreground truncate">{email || 'user@rwiz.eu'}</p>
            </div>
            <Link to="/settings">
              <div className="w-6 h-6  rounded-full flex items-center justify-center">
                <Cog size={18} />
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile with improved transition */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
