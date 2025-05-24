import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../assets/logo.png';

const Sidebar = ({ isSuperAdmin }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const sidebarRef = useRef(null);
  
  const isAdmin = isSuperAdmin === false || user?.role === 'admin';
  const isSuperAdminUser = isSuperAdmin === true || user?.role === 'superadmin';
  
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
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      
      if (currentWidth < 1024 && window.mySidebar && window.mySidebar.isOpen) {
        window.mySidebar.isOpen = false;
        window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: false } }));
      }
      
      if (currentWidth >= 1024) {
        if (sidebarRef.current) {
          const menuTexts = sidebarRef.current.querySelectorAll('.menu-text');
          menuTexts.forEach(text => {
            text.classList.remove('hidden');
            text.classList.add('text-white');
          });
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (window.innerWidth < 1024 && window.mySidebar) {
      window.mySidebar.isOpen = false;
      window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: false } }));
    }
  }, [location.pathname]);
  
  const adminMenuItems = [
    { path: '/admin', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { path: '/admin/orders', icon: 'fa-clipboard-list', label: 'Orders' },
    { path: '/admin/order-history', icon: 'fa-history', label: 'Order History' },
    { path: '/admin/products', icon: 'fa-box', label: 'Products' },
    { path: '/admin/categories', icon: 'fa-folder', label: 'Categories' },
    { path: '/admin/users', icon: 'fa-users', label: 'Users' },
    { path: '/admin/carousel', icon: 'fa-images', label: 'Carousel' },
  ];
  
  const superAdminMenuItems = [
    { path: '/superadmin', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { path: '/superadmin/admins', icon: 'fa-users-cog', label: 'Admins' },
    { path: '/superadmin/settings', icon: 'fa-cog', label: 'System Settings' },
  ];
  
  const menuItems = isSuperAdminUser 
    ? [
        ...superAdminMenuItems, 
        { isSeparator: true, label: 'Admin Menu' }, 
        ...adminMenuItems
      ] 
    : adminMenuItems;
  
  const isPathActive = (path) => {
    if (path === '/admin' || path === '/superadmin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  const closeSidebar = () => {
    if (window.mySidebar) {
      window.mySidebar.isOpen = false;
      window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: false } }));
    }
  };
  
  if (!isAdmin && !isSuperAdminUser) {
    return null;
  }
  
  return (
    <>
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}
    
      <div 
        ref={sidebarRef}
        className={`sidebar fixed top-0 left-0 h-screen bg-npc-navy text-white z-30 pt-16 shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-0 lg:w-64 overflow-hidden'
        }`}
      >
        {!isSidebarOpen && (
          <div className="hidden lg:flex justify-center items-center mt-2 mb-6">
            <img src={Logo} alt="NPC Logo" className="h-10" />
          </div>
        )}
        
        <div className={`px-6 py-5 border-b border-gray-700 ${!isSidebarOpen && 'lg:px-6 lg:py-5'}`}>
          <div className="flex items-center">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                className={`w-10 h-10 rounded-full ${!isSidebarOpen && 'lg:w-10 lg:h-10'} object-cover border-2 border-npc-gold`}
              />
            ) : (
              <div className={`w-10 h-10 ${!isSidebarOpen && 'lg:w-10 lg:h-10'} rounded-full bg-npc-gold text-white flex items-center justify-center font-bold`}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            )}
            
            <div className={`ml-3 ${!isSidebarOpen ? 'hidden lg:block' : ''}`}>
              <h3 className="font-medium truncate max-w-[150px] text-white">{user?.name}</h3>
              <p className="text-xs text-gray-400">{isSuperAdminUser ? 'Super Admin' : 'Admin'}</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-4 overflow-y-auto h-[calc(100vh-230px)]">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.isSeparator) {
                return (
                  <li key={`separator-${index}`} className="border-t border-gray-700 mt-2 pt-2">
                    {isSidebarOpen && <p className="px-6 py-2 text-xs text-gray-400">{item.label}</p>}
                  </li>
                );
              }
              
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center py-3 hover:bg-gray-700/50 transition-colors ${
                      isPathActive(item.path) 
                        ? 'bg-npc-gold/20 border-l-4 border-npc-gold text-white' 
                        : 'text-gray-300 border-l-4 border-transparent'
                    } ${isSidebarOpen ? 'px-6' : 'px-0 lg:px-6 justify-center lg:justify-start'}`}
                    title={!isSidebarOpen ? item.label : ''}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        closeSidebar();
                      }
                    }}
                  >
                    <i className={`fas ${item.icon} ${isSidebarOpen ? 'w-5' : 'text-lg lg:w-5'} text-center text-white`}></i>
                    <span className={`ml-3 menu-text text-white ${isSidebarOpen ? '' : 'hidden lg:inline'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            
            <li className="border-t border-gray-700 mt-2 pt-2">
              <Link
                to="/"
                className={`flex items-center py-3 text-gray-300 hover:bg-gray-700/50 transition-colors ${
                  isSidebarOpen ? 'px-6' : 'px-0 lg:px-6 justify-center lg:justify-start'
                }`}
                title={!isSidebarOpen ? 'View Store' : ''}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    closeSidebar();
                  }
                }}
              >
                <i className={`fas fa-home ${isSidebarOpen ? 'w-5' : 'text-lg lg:w-5'} text-center text-white`}></i>
                <span className={`ml-3 menu-text text-white ${isSidebarOpen ? '' : 'hidden lg:inline'}`}>
                  View Store
                </span>
              </Link>
            </li>
            
            <li>
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    closeSidebar();
                  }
                  logout();
                }}
                className={`flex items-center py-3 text-gray-300 hover:bg-gray-700/50 hover:text-red-300 transition-colors w-full text-left ${
                  isSidebarOpen ? 'px-6' : 'px-0 lg:px-6 justify-center lg:justify-start'
                }`}
                title={!isSidebarOpen ? 'Logout' : ''}
              >
                <i className={`fas fa-sign-out-alt ${isSidebarOpen ? 'w-5' : 'text-lg lg:w-5'} text-center text-white`}></i>
                <span className={`ml-3 menu-text text-white ${isSidebarOpen ? '' : 'hidden lg:inline'}`}>
                  Logout
                </span>
              </button>
            </li>
          </ul>
        </nav>
        
        {isSidebarOpen && window.innerWidth < 1024 && (
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-md hover:bg-gray-700/50"
            onClick={closeSidebar}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        )}
        
        {isSidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 text-xs text-gray-500 border-t border-gray-700">
            Version 1.0.0
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;