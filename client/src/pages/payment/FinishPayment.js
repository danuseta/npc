import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI, orderAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const FinishPayment = () => {
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order_id');
  const statusCode = queryParams.get('status_code');
  const transactionStatus = queryParams.get('transaction_status');
  const MAX_RETRIES = 5;
  
  useEffect(() => { window.Swal = Swal; }, []);
  
  const isPaymentSuccessful = () => {
    return statusCode === '200' && 
           (transactionStatus === 'settlement' || 
            transactionStatus === 'capture' ||
            transactionStatus === 'success');
  };
  
  const getPaymentDataFromStorage = () => {
    const paymentData = localStorage.getItem('lastSuccessfulPayment');
    if (paymentData) {
      try {
        return JSON.parse(paymentData);
      } catch (e) {
        console.error('Error parsing payment data from localStorage:', e);
      }
    }
    return null;
  };
  
  const createFallbackOrder = async (paymentData) => {
    try {
      console.log('Trying to create fallback order from payment data:', paymentData);
      
      if (!paymentData.transaction_id || !paymentData.gross_amount) {
        throw new Error('Incomplete transaction data for creating fallback order');
      }
      
      const fallbackOrderData = {
        transactionId: paymentData.transaction_id,
        paymentMethod: paymentData.payment_type || 'midtrans',
        paymentStatus: 'paid',
        grandTotal: parseFloat(paymentData.gross_amount),
        items: paymentData.item_details ? 
          paymentData.item_details
            .filter(item => item.id !== 'SHIPPING-FEE')
            .map(item => ({
              productId: parseInt(item.id),
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              name: item.name
            })) : []
      };
      
      const response = await orderAPI.createFallbackOrder(fallbackOrderData);
      
      if (response.data && response.data.success) {
        console.log('Fallback order created successfully:', response.data.data);
        
        setOrder(response.data.data);
        setErrorMessage('');
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to create fallback order');
      }
    } catch (error) {
      console.error('Error creating fallback order:', error);
      setErrorMessage('Failed to create order: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        const storedPayment = getPaymentDataFromStorage();
        if (storedPayment) {
          setPayment(storedPayment);
          console.log('Using payment data from storage:', storedPayment);
        }
        
        if (orderId.startsWith('TEMP_')) {
          console.log('Detected temporary order ID:', orderId);
          
          const attemptOrderFetch = async () => {
            try {
              console.log(`Attempting to get latest order (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
              
              const response = await orderAPI.getMyOrders({ limit: 1 });
              
              if (response.data && response.data.data && response.data.data.length > 0) {
                const latestOrder = response.data.data[0];
                
                const orderDate = new Date(latestOrder.createdAt);
                const now = new Date();
                const timeDiff = (now - orderDate) / 1000 / 60;
                
                if (timeDiff <= 5) {
                  console.log('New order found:', latestOrder);
                  setOrder(latestOrder);
                  setErrorMessage('');
                  setLoading(false);
                  return true;
                } else {
                  console.log('Order found but too old:', timeDiff, 'minutes ago');
                }
              }
              
              return false;
            } catch (error) {
              console.error('Error fetching order:', error);
              return false;
            }
          };
          
          const found = await attemptOrderFetch();
          
          if (!found && retryCount < MAX_RETRIES) {
            const retryDelay = Math.pow(2, retryCount) * 1000;
            console.log(`Order not found, retrying in ${retryDelay/1000} seconds...`);
            
            setTimeout(() => {
              setRetryCount(retryCount + 1);
            }, retryDelay);
          } else if (!found && retryCount >= MAX_RETRIES) {
            console.log('Retry limit reached, attempting to create fallback order...');
            
            if (isPaymentSuccessful() && storedPayment && user) {
              const fallbackSuccess = await createFallbackOrder(storedPayment);
              if (!fallbackSuccess) {
                setErrorMessage('Your order has been paid, but we encountered an issue creating the order. Please contact customer service.');
              }
            } else {
              setErrorMessage('Order details could not be found. Please check your order history.');
            }
            
            setLoading(false);
          }
        } else {
          try {
            const response = await orderAPI.getOrderByNumber(orderId);
            if (response.data && response.data.data) {
              setOrder(response.data.data);
              setErrorMessage('');
            } else {
              setErrorMessage('Order details not found.');
            }
          } catch (error) {
            console.error('Error fetching order details:', error);
            setErrorMessage('Failed to load order details: ' + (error.response?.data?.message || error.message));
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setErrorMessage('Failed to load order details: ' + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, retryCount, user]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  const formatPaymentMethod = (method) => {
    if (!method) return 'Midtrans';
    
    const paymentMethods = {
      'credit_card': 'Credit Card',
      'gopay': 'GoPay',
      'shopeepay': 'ShopeePay',
      'qris': 'QRIS',
      'bank_transfer': 'Bank Transfer',
      'echannel': 'Virtual Account',
      'cstore': 'Convenience Store'
    };
    
    return paymentMethods[method] || method;
  };
  
  if (loading && retryCount < MAX_RETRIES) {
    return (
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-96">
            <span className="loading loading-spinner loading-lg text-secondary mb-4"></span>
            <p className="text-gray-600">
              Processing your payment...
              {retryCount > 0 && ` (Attempt ${retryCount}/${MAX_RETRIES})`}
            </p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card bg-white shadow-sm p-8 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              errorMessage ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              <i className={`fas fa-${errorMessage ? 'exclamation-triangle text-amber-500' : 'check-circle text-green-500'} text-4xl`}></i>
            </div>
            
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
              {errorMessage ? 'Payment Processing' : 'Payment Successful!'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {errorMessage 
                ? errorMessage 
                : 'Thank you for your purchase. Your payment has been processed successfully.'}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h2 className="font-medium text-gray-800 mb-2">Order Summary</h2>
              
              {order ? (
                <>
                  <p className="text-gray-600">Order Number: {order.orderNumber}</p>
                  <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-gray-600">Total: {formatPrice(order.grandTotal)}</p>
                  <p className="text-gray-600">Status: {order.status === 'processing' ? 'Processing' : order.status}</p>
                  <p className="text-gray-600">Payment Method: {formatPaymentMethod(order.paymentMethod)}</p>
                </>
              ) : payment ? (
                <>
                  <p className="text-gray-600">Transaction ID: {payment.transaction_id}</p>
                  <p className="text-gray-600">Date: {new Date(payment.transaction_time || Date.now()).toLocaleDateString()}</p>
                  <p className="text-gray-600">Total: {formatPrice(parseFloat(payment.gross_amount))}</p>
                  <p className="text-gray-600">Payment Method: {formatPaymentMethod(payment.payment_type)}</p>
                  {!errorMessage && (
                    <p className="text-gray-600 mt-2 text-sm italic">
                      <i className="fas fa-info-circle mr-1"></i>
                      Your order is being processed. Full details will be available in your order history soon.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-600">
                  Payment has been received. Order details will be available shortly.
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <Link to="/order-history" className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full">
                View Order History
              </Link>
              
              <Link to="/" className="btn btn-outline border-npc-gold text-npc-gold hover:bg-npc-gold hover:text-white w-full">
                Continue Shopping
              </Link>
              
              {errorMessage && (
                <div className="mt-4 text-sm">
                  <p>If the problem persists, please contact our customer service:</p>
                  <p className="font-medium mt-1">Transaction ID: {payment?.transaction_id || 'Not available'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinishPayment;