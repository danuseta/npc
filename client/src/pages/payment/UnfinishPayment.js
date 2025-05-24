import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const UnfinishPayment = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order_id');
  
  useEffect(() => { window.Swal = Swal; }, []);
  
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card bg-white shadow-sm p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-clock text-yellow-500 text-4xl"></i>
            </div>
            
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Payment Incomplete</h1>
            
            <p className="text-gray-600 mb-6">
              Your payment process was not completed. You can continue your payment or try a different payment method.
            </p>
            
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-600">Order Number: {orderId}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <Link to="/cart" className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full">
                Return to Cart
              </Link>
              
              <Link to="/checkout" className="btn btn-outline border-npc-gold text-npc-gold hover:bg-npc-gold hover:text-white w-full">
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnfinishPayment;