import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Sidebar from '../components/common/Sidebar';

const ResponsiveLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin');
  const isBuyerRoute = !isAdminRoute;
  
  const shouldShowSidebar = isAdminRoute && user && (user.role === 'admin' || user.role === 'superadmin');
  const isSuperAdmin = user?.role === 'superadmin';
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    const handleSidebarToggled = (event) => {
      setIsSidebarOpen(event.detail.isOpen);
    };
    
    window.addEventListener('sidebarToggled', handleSidebarToggled);
    
    if (!window.mySidebar) {
      window.mySidebar = { isOpen: false };
    }
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggled);
    };
  }, []);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (window.innerWidth < 1024 && window.mySidebar) {
      window.mySidebar.isOpen = false;
      window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: false } }));
    }
  }, [location.pathname]);
  
  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      
      if (currentWidth < 1024 && window.mySidebar && window.mySidebar.isOpen) {
        window.mySidebar.isOpen = false;
        window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: false } }));
      }
      
      if (currentWidth >= 1024 && shouldShowSidebar) {
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldShowSidebar]);
  
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {shouldShowSidebar && <Sidebar isSuperAdmin={isSuperAdmin} />}
      
      <main 
        className={`flex-grow transition-all duration-300 pt-16 ${
          shouldShowSidebar && isSidebarOpen ? 'lg:ml-64' : 
          shouldShowSidebar ? 'lg:ml-64' : ''
        }`}
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        {children}
      </main>
      
      {isBuyerRoute && <Footer />}

      {showBackToTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 bg-npc-gold hover:bg-npc-darkGold text-white rounded-full p-3 shadow-lg transition-all duration-300 opacity-80 hover:opacity-100 z-40 transform hover:scale-110"
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ResponsiveLayout;