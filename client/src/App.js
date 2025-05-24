import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { CartProvider } from './contexts/CartContext';
import ResponsiveLayout from './layouts/ResponsiveLayout';

import Home from './pages/buyer/Home';
import ProductList from './pages/buyer/ProductList';
import ProductDetail from './pages/buyer/ProductDetail';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import OrderHistory from './pages/buyer/OrderHistory';
import About from './pages/buyer/About';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/auth/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import OrderManagement from './pages/admin/OrderManagement';
import AdminOrderHistory from './pages/admin/OrderHistory';
import ProductManagement from './pages/admin/ProductManagement';
import UserManagement from './pages/admin/UserManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CarouselManagement from './pages/admin/CarouselManagement';

import SuperAdminDashboard from './pages/superadmin/Dashboard';
import AdminManagement from './pages/superadmin/AdminManagement';
import SystemSettings from './pages/superadmin/SystemSettings';

import FinishPayment from './pages/payment/FinishPayment';
import ErrorPayment from './pages/payment/ErrorPayment';
import UnfinishPayment from './pages/payment/UnfinishPayment';

import './App.css';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function App() {
  const { user, loading } = useAuth();

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) {
      return <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>;
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  useEffect(() => {
  }, []);

  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<ResponsiveLayout><Home /></ResponsiveLayout>} />
        <Route path="/products" element={<ResponsiveLayout><ProductList /></ResponsiveLayout>} />
        <Route path="/product/:id" element={<ResponsiveLayout><ProductDetail /></ResponsiveLayout>} />
        <Route path="/about" element={<ResponsiveLayout><About /></ResponsiveLayout>} />
        
        <Route path="/payment/finish" element={<ResponsiveLayout><FinishPayment /></ResponsiveLayout>} />
        <Route path="/payment/error" element={<ResponsiveLayout><ErrorPayment /></ResponsiveLayout>} />
        <Route path="/payment/unfinish" element={<ResponsiveLayout><UnfinishPayment /></ResponsiveLayout>} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ResponsiveLayout><Profile /></ResponsiveLayout>
          </ProtectedRoute>
        } />

        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['buyer', 'admin', 'superadmin']}>
            <ResponsiveLayout><Cart /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['buyer', 'admin', 'superadmin']}>
            <ResponsiveLayout><Checkout /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['buyer', 'admin', 'superadmin']}>
            <ResponsiveLayout><OrderHistory /></ResponsiveLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><AdminDashboard /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><OrderManagement /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/order-history" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><AdminOrderHistory /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><ProductManagement /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><CategoryManagement /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><UserManagement /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/carousel" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <ResponsiveLayout><CarouselManagement /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        

        <Route path="/superadmin" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <ResponsiveLayout><SuperAdminDashboard /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/superadmin/admins" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <ResponsiveLayout><AdminManagement /></ResponsiveLayout>
          </ProtectedRoute>
        } />
        <Route path="/superadmin/settings" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <ResponsiveLayout><SystemSettings /></ResponsiveLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
}

export default App;