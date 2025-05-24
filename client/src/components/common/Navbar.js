import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import Logo from '../../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef(null);
  
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isSuperAdmin = user && user.role === 'superadmin';
  
  const toggleSidebar = () => {
    if (isAdminRoute) {
      const newState = !isSidebarOpen;
      setIsSidebarOpen(newState);
      
      if (window.mySidebar) {
        window.mySidebar.isOpen = newState;
        window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: newState } }));
      } else {
        window.mySidebar = { isOpen: newState };
        window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: newState } }));
      }
    } else {
      setIsMenuOpen(!isMenuOpen);
    }
  };
  
  useEffect(() => {
    const handleSidebarToggled = (event) => {
      setIsSidebarOpen(event.detail.isOpen);
    };
    
    window.addEventListener('sidebarToggled', handleSidebarToggled);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggled);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsSidebarOpen(false);
    
    if (window.mySidebar) {
      window.mySidebar.isOpen = false;
      window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { isOpen: false } }));
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleCartAccess = (e) => {
    if (!user) {
      e.preventDefault();
      navigate('/login');
    }
  };

  return (
    <nav className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
      isAdminRoute ? 'bg-npc-navy text-white' : 
      scrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 py-3'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="NPC Logo" className="h-8 md:h-10 mr-2" />
              <span className={`text-lg md:text-xl font-bold ${isAdminRoute ? 'text-white' : 'text-npc-navy'}`}>
                NPC Store
              </span>
            </Link>
          </div>

          {isAdminRoute && (
            <div className="text-xl font-semibold text-white hidden lg:block">
              {location.pathname.includes('/admin/orders') ? 'Order Management' : 
               location.pathname.includes('/admin/products') ? 'Product Management' :
               location.pathname.includes('/admin/users') ? 'User Management' :
               location.pathname.includes('/superadmin/admins') ? 'Admin Management' :
               location.pathname.includes('/superadmin/settings') ? 'System Settings' :
               'Dashboard'}
            </div>
          )}

          {!isAdminRoute && (
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <Link to="/" className={`nav-link text-sm xl:text-base transition-colors duration-200 ${location.pathname === '/' ? 'text-npc-gold' : 'text-gray-600 hover:text-npc-navy'}`}>
                Home
              </Link>
              <Link to="/products" className={`nav-link text-sm xl:text-base transition-colors duration-200 ${location.pathname === '/products' || location.pathname.startsWith('/product/') ? 'text-npc-gold' : 'text-gray-600 hover:text-npc-navy'}`}>
                Products
              </Link>
              <Link to="/about" className={`nav-link text-sm xl:text-base transition-colors duration-200 ${location.pathname === '/about' ? 'text-npc-gold' : 'text-gray-600 hover:text-npc-navy'}`}>
                About
              </Link>
            </div>
          )}

          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'buyer' && (
                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-npc-gold transition-colors duration-200">
                    <i className="fas fa-shopping-cart text-xl"></i>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-npc-gold text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}
                
                <div className="relative profile-menu-container" ref={profileMenuRef}>
                  <button 
                    className={`flex items-center space-x-2 p-2 rounded-full ${isAdminRoute ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className={`font-medium ${isAdminRoute ? 'text-white' : 'text-gray-700'}`}>{user.name}</span>
                    <i className={`fas fa-chevron-down text-xs transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''} ${isAdminRoute ? 'text-gray-300' : 'text-gray-500'}`}></i>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i className="fas fa-user mr-2 text-gray-500"></i>
                        My Profile
                      </Link>
                      
                      {user.role !== 'superadmin' && (
                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <i className="fas fa-box mr-2 text-gray-500"></i>
                          My Orders
                        </Link>
                      )}
                      
                      {(user.role === 'admin' || user.role === 'superadmin') && (
                        <Link to={user.role === 'superadmin' ? '/superadmin' : '/admin'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <i className={`fas ${user.role === 'superadmin' ? 'fa-shield-alt' : 'fa-cog'} mr-2 text-gray-500`}></i>
                          {user.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-md border border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-md bg-npc-gold hover:bg-npc-darkGold text-white border-none transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center lg:hidden">
            {user ? (
              user.role === 'buyer' && (
                <Link to="/cart" className="relative p-2 mr-2 text-gray-600">
                  <i className="fas fa-shopping-cart text-xl"></i>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-npc-gold text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )
            ) : (
              <Link to="/login" className="p-2 mr-2 text-npc-navy">
                <i className="fas fa-sign-in-alt text-xl"></i>
              </Link>
            )}
            
            <button
              className={`p-2 rounded-md ${isAdminRoute ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:text-npc-navy'} focus:outline-none transition-colors`}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen || (isAdminRoute && isSidebarOpen)}
            >
              <i className={`fas ${(isMenuOpen || (isAdminRoute && isSidebarOpen)) ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && !isAdminRoute && (
        <div className="lg:hidden bg-white border-t mt-2 px-4 py-2 shadow-lg">
          <div className="flex flex-col space-y-1 py-3">
            <Link to="/" className={`py-3 px-3 rounded ${location.pathname === '/' ? 'bg-gray-100 text-npc-gold' : 'text-gray-600'}`}>
              <i className="fas fa-home mr-2"></i>
              Home
            </Link>
            <Link to="/products" className={`py-3 px-3 rounded ${location.pathname === '/products' || location.pathname.startsWith('/product/') ? 'bg-gray-100 text-npc-gold' : 'text-gray-600'}`}>
              <i className="fas fa-th mr-2"></i>
              Products
            </Link>
            <Link to="/about" className={`py-3 px-3 rounded ${location.pathname === '/about' ? 'bg-gray-100 text-npc-gold' : 'text-gray-600'}`}>
              <i className="fas fa-info-circle mr-2"></i>
              About
            </Link>
            
            {user ? (
              <>
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <div className="flex items-center px-3 py-2">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold mr-3">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-700">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  
                  <Link to="/profile" className="py-3 px-3 rounded flex items-center text-gray-600 hover:bg-gray-100 mt-2 active:bg-gray-200">
                    <i className="fas fa-user mr-2 w-5 text-center"></i>
                    My Profile
                  </Link>
                  
                  {user.role !== 'superadmin' && (
                    <Link to="/orders" className="py-3 px-3 rounded flex items-center text-gray-600 hover:bg-gray-100 active:bg-gray-200">
                      <i className="fas fa-box mr-2 w-5 text-center"></i>
                      My Orders
                    </Link>
                  )}
                  
                  {!isAdminRoute && (user.role === 'admin' || user.role === 'superadmin') && (
                    <Link to={user.role === 'superadmin' ? '/superadmin' : '/admin'} className="py-3 px-3 rounded flex items-center text-gray-600 hover:bg-gray-100 active:bg-gray-200">
                      <i className={`fas ${user.role === 'superadmin' ? 'fa-shield-alt' : 'fa-cog'} mr-2 w-5 text-center`}></i>
                      {user.role === 'superadmin' ? 'Super Admin Panel' : 'Admin Panel'}
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="py-3 px-3 rounded flex items-center text-red-600 hover:bg-gray-100 w-full text-left active:bg-gray-200"
                  >
                    <i className="fas fa-sign-out-alt mr-2 w-5 text-center"></i>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-3 mt-2 flex flex-col space-y-3">
                <Link to="/login" className="py-3 px-3 rounded border border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white text-center transition-colors active:bg-npc-darkGold">
                  Login
                </Link>
                <Link to="/register" className="py-3 px-3 rounded bg-npc-gold hover:bg-npc-darkGold text-white text-center transition-colors active:bg-npc-darkGold">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;