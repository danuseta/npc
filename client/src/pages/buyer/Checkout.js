import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI, paymentAPI, userAPI, shippingAPI, cartAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [savedAddress, setSavedAddress] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    saveAddress: false
  });
  const [shippingMethod, setShippingMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [errors, setErrors] = useState({});
  const [orderNotes, setOrderNotes] = useState('');
  const [shippingOptions, setShippingOptions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalWeight, setTotalWeight] = useState(1);  const [snapScriptLoaded, setSnapScriptLoaded] = useState(false);
  const [snapPaymentUI, setSnapPaymentUI] = useState(false);
  const orderDataRef = useRef(null);
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
    useEffect(() => {
    if (!snapScriptLoaded) {
      const midtransClientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY;
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', midtransClientKey);
      script.async = true;
      script.onload = () => {
        console.log('Snap script loaded successfully');
        setSnapScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Snap script');
      };
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [snapScriptLoaded]);
  
  useEffect(() => {
    const storedItems = localStorage.getItem('checkoutItems');
    const storedDiscount = localStorage.getItem('checkoutDiscount');
    
    if (storedItems) {
      const items = JSON.parse(storedItems);
      setCartItems(items);
      
      const weight = items.reduce((total, item) => {
        const itemWeight = item.weight || 1;
        return total + (itemWeight * item.quantity);
      }, 0);
      
      setTotalWeight(Math.max(1, weight));
      
      setLoading(false);
    } else {
      navigate('/cart');
    }
    
    if (storedDiscount) {
      setDiscount(parseFloat(storedDiscount));
      if (parseFloat(storedDiscount) > 0) {
        setCouponApplied(true);
        setCouponCode('NPC10');
      }
    }
    
    fetchUserAddress();
  }, [navigate]);
  
  const fetchUserAddress = async () => {
    setAddressLoading(true);
    try {
      if (user) {
        const addressData = {
          fullName: user.name || '',
          phoneNumber: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          province: user.state || '',
          postalCode: user.zipCode || '',
        };
        
        if (user.address) {
          setSavedAddress(addressData);
          
          setShippingAddress({
            ...addressData,
            saveAddress: false
          });
        } else {
          setUseSavedAddress(false);
        }
      } else {
        setUseSavedAddress(false);
      }
    } catch (error) {
      console.error('Error processing user address:', error);
      setUseSavedAddress(false);
    } finally {
      setAddressLoading(false);
    }
  };
  
  const fetchShippingOptions = async (destinationPostalCode) => {
    setShippingLoading(true);
    
    try {
      if (!destinationPostalCode) {
        console.error('Destination postal code is required');
        setShippingOptions([]);
        return;
      }
      
      console.log("Cart items for shipping:", cartItems);
      
      const productIds = cartItems.map(item => {
        return item.productId || item.id;
      }).filter(id => id);
      
      console.log("Product IDs being sent to API:", productIds);
      
      const requestId = Date.now();
      
      const response = await shippingAPI.getRates({
        postalCode: destinationPostalCode,
        weight: totalWeight,
        productIds: productIds,
        requestId: requestId
      });
      
      if (response.data && response.data.success && response.data.data) {
        setShippingOptions(response.data.data);
        console.log("Shipping options loaded successfully:", response.data.data.length);
      } else {
        console.error('Invalid shipping API response:', response);
        setShippingOptions([]);
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      setShippingOptions([]);
    } finally {
      setShippingLoading(false);
    }
  };
  
  useEffect(() => {
    if (!addressLoading && shippingAddress.postalCode && shippingAddress.postalCode.length >= 5) {
      const timer = setTimeout(() => {
        fetchShippingOptions(shippingAddress.postalCode);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [shippingAddress.postalCode, addressLoading]); 
  
  const handleAddressTypeChange = (usesSaved) => {
    setUseSavedAddress(usesSaved);
    
    if (usesSaved && savedAddress) {
      setShippingAddress({
        ...savedAddress,
        saveAddress: false
      });
      
      const newErrors = { ...errors };
      delete newErrors.fullName;
      delete newErrors.phoneNumber;
      delete newErrors.address;
      delete newErrors.city;
      delete newErrors.province;
      delete newErrors.postalCode;
      setErrors(newErrors);
      
      if (savedAddress.postalCode) {
        fetchShippingOptions(savedAddress.postalCode);
      }
    }
  };
  
  const handleShippingAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setShippingAddress({
      ...shippingAddress,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleShippingMethodChange = (e) => {
    setShippingMethod(e.target.value);
    
    if (errors.shippingMethod) {
      setErrors({
        ...errors,
        shippingMethod: ''
      });
    }
  };
  
  const applyCoupon = () => {
    if (!couponCode.trim()) {
      return;
    }
    
    if (couponCode.toUpperCase() === 'NPC10') {
      setDiscount(0.1);
      setCouponApplied(true);
      
      window.Swal?.fire({
        icon: 'success',
        title: 'Coupon Applied',
        text: 'A 10% discount has been applied to your order.',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      setDiscount(0);
      setCouponApplied(false);
      
      window.Swal?.fire({
        icon: 'error',
        title: 'Invalid Coupon',
        text: 'The coupon code you entered is invalid or expired.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };
  
  const getDiscountedPrice = (item) => {
    if (item.discountPercentage && item.discountPercentage > 0) {
      return item.price * (1 - (item.discountPercentage / 100));
    }
    return item.price;
  };
  
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = getDiscountedPrice(item);
      return total + (itemPrice * item.quantity);
    }, 0);
  };
  
  const getShippingCost = () => {
    const selectedShipping = shippingOptions.find(option => option.id === shippingMethod);
    return selectedShipping ? selectedShipping.price : 0;
  };
  
  const getShippingDetails = () => {
    return shippingOptions.find(option => option.id === shippingMethod) || null;
  };
  
  const calculateDiscountAmount = () => {
    return calculateSubtotal() * discount;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount() + getShippingCost();
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const validateCheckoutForm = () => {
    const newErrors = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!shippingAddress.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!shippingAddress.province.trim()) {
      newErrors.province = 'Province is required';
    }
    
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    
    if (!shippingMethod) {
      newErrors.shippingMethod = 'Please select a shipping method';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const prepareOrderData = () => {
    const selectedShipping = getShippingDetails();
    const subtotal = calculateSubtotal();
    
    return {
      totalAmount: subtotal, 
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phoneNumber: shippingAddress.phoneNumber,
        address: shippingAddress.address,
        city: shippingAddress.city,
        province: shippingAddress.province,
        postalCode: shippingAddress.postalCode
      },
      paymentMethod: 'midtrans', 
      shippingMethod,
      shippingDetails: selectedShipping ? {
        courier: selectedShipping.courier,
        service: selectedShipping.service,
        estimatedDelivery: selectedShipping.estimatedDelivery
      } : null,
      shippingFee: getShippingCost(),
      discount: calculateDiscountAmount(),
      notes: orderNotes,
      items: cartItems.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        price: getDiscountedPrice(item),
        name: item.name
      })),
      saveAddress: !useSavedAddress && shippingAddress.saveAddress
    };
  };
  
  const handleCheckout = async () => {
    if (!validateCheckoutForm()) {
      const firstError = document.querySelector('.text-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    if (!snapScriptLoaded) {
      window.Swal?.fire({
        icon: 'error',
        title: 'Payment System Not Ready',
        text: 'The payment system is still initializing. Please try again in a few seconds.',
        confirmButtonColor: '#F0A84E'
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const orderData = prepareOrderData();
      
      const orderResponse = await orderAPI.createOrder(orderData);
      
      if (!orderResponse.data || !orderResponse.data.data) {
        throw new Error('Failed to create order');
      }
      
      const createdOrder = orderResponse.data.data;
      console.log("Order created successfully:", createdOrder);
      
      const tokenResponse = await paymentAPI.getSnapToken({
        ...orderData,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber
      });
      
      if (!tokenResponse.data || !tokenResponse.data.token) {
        throw new Error('Failed to get payment token');
      }
      
      const snapToken = tokenResponse.data.token;
      console.log("Received snap token:", snapToken);
      
      setSnapPaymentUI(true);
      
      window.snap.pay(snapToken, {
        onSuccess: async function(result) {
          console.log('Payment success:', result);
          await updateOrderAfterPayment(createdOrder.id, result);
        },
        onPending: function(result) {
          console.log('Payment pending:', result);
          setIsProcessing(false);
          window.Swal?.fire({
            icon: 'warning',
            title: 'Payment Pending',
            text: 'Your payment is being processed. We will notify you once it is completed.',
            confirmButtonColor: '#F0A84E'
          });
        },
        onError: function(result) {
          console.error('Payment error:', result);
          setIsProcessing(false);
          updateOrderStatus(createdOrder.id, 'cancelled');
          window.Swal?.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: 'There was an error processing your payment. Please try again.',
            confirmButtonColor: '#F0A84E'
          });
        },
        onClose: function() {
          console.log('Customer closed the payment popup without completing payment');
          setIsProcessing(false);
          setSnapPaymentUI(false);
          window.Swal?.fire({
            icon: 'info',
            title: 'Payment Canceled',
            text: 'You closed the payment window before completing your transaction.',
            confirmButtonColor: '#F0A84E'
          });
        }
      });
    } catch (error) {
      setIsProcessing(false);
      console.error('Error initiating payment:', error);
      
      let errorMessage = 'There was an error processing your payment. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      window.Swal?.fire({
        icon: 'error',
        title: 'Payment Error',
        text: errorMessage,
        confirmButtonColor: '#F0A84E'
      });
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderAPI.updateOrderAfterPayment(orderId, { 
        status: status,
        paymentStatus: status === 'cancelled' ? 'failed' : 'pending'
      });
      console.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
    }
  };

  const updateOrderAfterPayment = async (orderId, paymentResult) => {
    try {
      localStorage.setItem('lastSuccessfulPayment', JSON.stringify({
        ...paymentResult,
        timestamp: new Date().toISOString()
      }));
      
      console.log('Payment result:', paymentResult);
      
      await orderAPI.updateOrderStatus(orderId, { 
        status: 'processing',
        paymentStatus: 'paid',
        transactionId: paymentResult.transaction_id,
        paymentMethod: formatPaymentMethodForBackend(paymentResult.payment_type)
      });
      
      console.log("Order status successfully updated to 'processing' with payment status 'paid'");
      
      try {
        let purchasedProductIds = [];
        
        try {
          console.log(`Getting order details for ID: ${orderId}`);
          const orderResponse = await orderAPI.getOrderById(orderId);
          
          if (orderResponse?.data?.data?.OrderItems) {
            purchasedProductIds = orderResponse.data.data.OrderItems.map(item => item.productId);
            console.log(`Product IDs from order: ${JSON.stringify(purchasedProductIds)}`);
          } else {
            console.log('No OrderItems in API response');
          }
        } catch (orderError) {
          console.error(`Failed to get order details: ${orderError.message}`);
          
          try {
            console.log('Using checkout data from localStorage as fallback');
            const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
            purchasedProductIds = checkoutItems.map(item => item.productId || item.id).filter(Boolean);
            console.log(`Product IDs from localStorage: ${JSON.stringify(purchasedProductIds)}`);
          } catch (parseError) {
            console.error(`Error parsing localStorage data: ${parseError.message}`);
          }
        }
        
        if (purchasedProductIds.length > 0) {
          console.log(`Removing ${purchasedProductIds.length} items from cart`);
          await cartAPI.clearCart(purchasedProductIds);
          console.log("Purchased items successfully removed from cart");
        } else {
          console.warn("Cannot determine items to remove, cart not modified");
        }
      } catch (cartError) {
        console.error(`Error removing items from cart: ${cartError.message}`);
        console.error(`Stack trace: ${cartError.stack}`);
        
        try {
          console.log('Trying alternative approach to update cart...');
          const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
          const itemIds = checkoutItems.map(item => item.productId || item.id).filter(Boolean);
          
          if (itemIds.length > 0) {
            console.log(`Trying to remove items with IDs: ${JSON.stringify(itemIds)}`);
            await cartAPI.clearCart(itemIds);
            console.log('Successfully updated cart with alternative approach');
          }
        } catch (retryError) {
          console.error(`Failed to retry: ${retryError.message}`);
        }
      }
      
      localStorage.removeItem('checkoutItems');
      localStorage.removeItem('checkoutDiscount');
      
      if (!useSavedAddress && shippingAddress.saveAddress) {
        try {
          await userAPI.updateUser(user.id, {
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.province,
            zipCode: shippingAddress.postalCode,
            phone: shippingAddress.phoneNumber
          });
          console.log("User address successfully updated");
        } catch (addressError) {
          console.error("Failed to update user address:", addressError);
        }
      }
      
      window.Swal?.fire({
        icon: 'success',
        title: 'Payment Successful!',
        html: `
          <p>Your payment has been processed and your order is being processed.</p>
          <p class="mt-2 text-sm">Transaction ID: ${paymentResult.transaction_id}</p>
          <p class="mt-1 text-sm">Payment Method: ${formatPaymentMethod(paymentResult.payment_type)}</p>
          <p class="mt-1 text-sm">Total: ${formatPrice(parseFloat(paymentResult.gross_amount))}</p>
          <p class="mt-3 text-sm text-gray-500">You will be redirected to the order confirmation page...</p>
        `,
        confirmButtonColor: '#F0A84E',
        confirmButtonText: 'View Order Details'
      }).then(() => {
        navigate(`/payment/finish?order_id=${paymentResult.order_id}&status_code=${paymentResult.status_code}&transaction_status=${paymentResult.transaction_status}`);
      });
    } catch (error) {
      console.error('Error processing successful payment:', error);
      
      try {
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('checkoutDiscount');
        console.log("Checkout data removed to prevent double-charging");
      } catch (storageError) {
        console.error("Failed to remove checkout data:", storageError);
      }
      
      try {
        localStorage.setItem('lastPaymentIssue', JSON.stringify({
          transaction_id: paymentResult.transaction_id,
          payment_type: paymentResult.payment_type,
          gross_amount: paymentResult.gross_amount,
          order_id: paymentResult.order_id,
          timestamp: new Date().toISOString(),
          error: error.message || 'Unknown error'
        }));
      } catch (storageError) {
        console.error('Failed to save error data to localStorage:', storageError);
      }
      
      window.Swal?.fire({
        icon: 'warning',
        title: 'Payment Successful',
        html: `
          <p>Your payment has been processed successfully, but we encountered an issue updating your order status.</p>
          <p class="mt-2">Transaction ID: <strong>${paymentResult.transaction_id || 'unavailable'}</strong></p>
          <p class="mt-1">Payment Method: ${formatPaymentMethod(paymentResult.payment_type)}</p>
          <p class="mt-1">Total: ${formatPrice(parseFloat(paymentResult.gross_amount))}</p>
          <p class="mt-3 text-amber-600">Don't worry, your order is being processed on our server.</p>
          <p class="mt-1 text-amber-600">If your order doesn't appear within 10 minutes, please contact customer service with the Transaction ID.</p>
        `,
        confirmButtonColor: '#F0A84E'
      }).then(() => {
        navigate('/order-history');
      });
    } finally {
      setIsProcessing(false);
      setSnapPaymentUI(false);
    }
  };
  
  const formatPaymentMethod = (paymentType) => {
    if (!paymentType) return 'Midtrans';
    
    const paymentMethods = {
      'credit_card': 'Credit Card',
      'gopay': 'GoPay',
      'shopeepay': 'ShopeePay',
      'qris': 'QRIS',
      'bank_transfer': 'Bank Transfer',
      'echannel': 'Virtual Account',
      'cstore': 'Convenience Store'
    };
    
    return paymentMethods[paymentType] || paymentType;
  };
  
  const formatPaymentMethodForBackend = (paymentType) => {
    if (!paymentType) return 'bank_transfer';
    
    const paymentMethodMap = {
      'credit_card': 'credit_card',
      'debit_card': 'debit_card',
      'gopay': 'e_wallet',
      'shopeepay': 'e_wallet',
      'qris': 'qris',
      'bank_transfer': 'bank_transfer',
      'bca_va': 'bank_transfer',
      'bni_va': 'bank_transfer',
      'bri_va': 'bank_transfer',
      'permata_va': 'bank_transfer',
      'echannel': 'bank_transfer',
      'cstore': 'cash_on_delivery',
      'indomaret': 'cash_on_delivery',
      'alfamart': 'cash_on_delivery'
    };
    
    return paymentMethodMap[paymentType] || 'bank_transfer';
  };
  
  if (loading || addressLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex justify-center items-center h-64 sm:h-96">
            <span className="loading loading-spinner loading-lg text-npc-gold"></span>
          </div>
        </main>
      </div>
    );
  }
  
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="card bg-white shadow-sm p-4 sm:p-6 md:p-8 text-center">
            <img 
              src="/images/empty-cart.png" 
              alt="Empty Cart" 
              className="mx-auto h-32 sm:h-40 mb-4"
            />
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-4 sm:mb-6">
              You need to add items to your cart before proceeding to checkout.
            </p>
            <Link to="/products" className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-white">
              Browse Products
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          <div className="w-full lg:w-2/3 space-y-4 sm:space-y-6">
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-3 sm:p-4 md:p-5 border-b bg-gray-50">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Shipping Address</h2>
              </div>
              
              <div className="p-3 sm:p-4 md:p-5">
                {savedAddress && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div 
                        className={`flex-1 p-3 sm:p-4 rounded-lg border-2 cursor-pointer ${useSavedAddress ? 'border-npc-gold bg-amber-50' : 'border-gray-200'}`}
                        onClick={() => handleAddressTypeChange(true)}
                      >
                        <div className="flex items-center mb-2">
                          <input 
                            type="radio" 
                            className="radio radio-sm radio-primary mr-2" 
                            name="addressType" 
                            checked={useSavedAddress} 
                            onChange={() => handleAddressTypeChange(true)}
                          />
                          <span className="font-medium text-sm text-gray-700">Use my saved address</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700">
                          <p><span className="font-medium">{savedAddress.fullName}</span> • {savedAddress.phoneNumber}</p>
                          <p>{savedAddress.address}</p>
                          <p>{savedAddress.city}, {savedAddress.province} {savedAddress.postalCode}</p>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex-1 p-3 sm:p-4 rounded-lg border-2 cursor-pointer ${!useSavedAddress ? 'border-npc-gold bg-amber-50' : 'border-gray-200'}`}
                        onClick={() => handleAddressTypeChange(false)}
                      >
                        <div className="flex items-center mb-2">
                          <input 
                            type="radio" 
                            className="radio radio-sm radio-primary mr-2" 
                            name="addressType" 
                            checked={!useSavedAddress} 
                            onChange={() => handleAddressTypeChange(false)}
                          />
                          <span className="font-medium text-sm text-gray-700">Use a different address</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700">Enter a new shipping address for this order</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={useSavedAddress && savedAddress ? 'opacity-50 pointer-events-none' : ''}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="form-control">
                      <label className="label py-1 sm:py-2">
                        <span className="label-text text-sm text-gray-700">Full Name</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleShippingAddressChange}
                        className={`input input-bordered h-10 sm:h-12 w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm ${errors.fullName ? 'input-error' : ''}`}
                        placeholder="Enter your full name"
                      />
                      {errors.fullName && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error text-xs">{errors.fullName}</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label py-1 sm:py-2">
                        <span className="label-text text-sm text-gray-700">Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={shippingAddress.phoneNumber}
                        onChange={handleShippingAddressChange}
                        className={`input input-bordered h-10 sm:h-12 w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm ${errors.phoneNumber ? 'input-error' : ''}`}
                        placeholder="Enter your phone number"
                      />
                      {errors.phoneNumber && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error text-xs">{errors.phoneNumber}</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="form-control sm:col-span-2">
                      <label className="label py-1 sm:py-2">
                        <span className="label-text text-sm text-gray-700">Address</span>
                      </label>
                      <textarea
                        name="address"
                        value={shippingAddress.address}
                        onChange={handleShippingAddressChange}
                        className={`textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm ${errors.address ? 'textarea-error' : ''}`}
                        placeholder="Enter your address"
                        rows="2"
                      ></textarea>
                      {errors.address && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error text-xs">{errors.address}</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label py-1 sm:py-2">
                        <span className="label-text text-sm text-gray-700">Province</span>
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={shippingAddress.province}
                        onChange={handleShippingAddressChange}
                        className={`input input-bordered h-10 sm:h-12 w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm ${errors.province ? 'input-error' : ''}`}
                        placeholder="Enter your province"
                      />
                      {errors.province && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error text-xs">{errors.province}</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label py-1 sm:py-2">
                        <span className="label-text text-sm text-gray-700">City</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleShippingAddressChange}
                        className={`input input-bordered h-10 sm:h-12 w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm ${errors.city ? 'input-error' : ''}`}
                        placeholder="Enter your city"
                      />
                      {errors.city && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error text-xs">{errors.city}</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label py-1 sm:py-2">
                        <span className="label-text text-sm text-gray-700">Postal Code</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={handleShippingAddressChange}
                        className={`input input-bordered h-10 sm:h-12 w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm ${errors.postalCode ? 'input-error' : ''}`}
                        placeholder="Enter your postal code"
                      />
                      {errors.postalCode && (
                        <label className="label py-1">
                          <span className="label-text-alt text-error text-xs">{errors.postalCode}</span>
                        </label>
                      )}
                    </div>
                    
                    {!useSavedAddress && (
                      <div className="form-control sm:col-span-2">
                        <label className="cursor-pointer label justify-start py-1 sm:py-2">
                          <input
                            type="checkbox"
                            name="saveAddress"
                            checked={shippingAddress.saveAddress}
                            onChange={handleShippingAddressChange}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                          <span className="label-text ml-2 text-sm text-gray-700">Save this address for future orders</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-3 sm:p-4 md:p-5 border-b bg-gray-50">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Shipping Method</h2>
              </div>
              
              <div className="p-3 sm:p-4 md:p-5">
                {shippingLoading ? (
                  <div className="flex justify-center items-center py-6 sm:py-8">
                    <span className="loading loading-spinner loading-md text-npc-gold mr-2"></span>
                    <span className="text-sm text-gray-600">Loading shipping options...</span>
                  </div>
                ) : shippingOptions.length === 0 ? (
                  <div className="p-3 sm:p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start">
                      <i className="fas fa-exclamation-circle text-amber-500 mt-1 mr-3"></i>
                      <div>
                        <h3 className="font-medium text-sm text-amber-800">No Shipping Options Available</h3>
                        <p className="text-xs sm:text-sm text-amber-700 mt-1">
                          We couldn't find shipping options for your location. Please check your postal code or try a different address.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {shippingOptions.map(option => (
                      <div key={option.id} className="flex items-center p-2 sm:p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          id={`shipping-${option.id}`}
                          name="shippingMethod"
                          value={option.id}
                          checked={shippingMethod === option.id}
                          onChange={handleShippingMethodChange}
                          className="radio radio-primary radio-sm"
                        />
                        <label htmlFor={`shipping-${option.id}`} className="ml-2 sm:ml-3 flex-1 cursor-pointer">
                          <span className="font-medium text-sm text-gray-800">{option.name}</span>
                          <div className="flex flex-col sm:flex-row sm:items-center mt-1">
                            <span className="text-xs py-1 px-2 bg-gray-200 rounded text-gray-700 mr-0 sm:mr-2 inline-block w-fit">
                              {option.courier}
                            </span>
                            <span className="block text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Est. Delivery: {option.estimatedDelivery}</span>
                          </div>
                        </label>
                        <span className="font-medium text-sm text-gray-800">{formatPrice(option.price)}</span>
                      </div>
                    ))}
                    
                    {errors.shippingMethod && (
                      <div className="text-error text-xs mt-2">{errors.shippingMethod}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-3 sm:p-4 md:p-5 border-b bg-gray-50">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Payment</h2>
              </div>
              
              <div className="p-3 sm:p-4 md:p-5">
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-700">
                    After clicking "Place Order", a secure payment window will appear with multiple payment options:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="badge badge-outline text-gray-700 px-2 py-1 sm:px-3 sm:py-2 text-xs">Credit Card</div>
                    <div className="badge badge-outline text-gray-700 px-2 py-1 sm:px-3 sm:py-2 text-xs">Bank Transfer</div>
                    <div className="badge badge-outline text-gray-700 px-2 py-1 sm:px-3 sm:py-2 text-xs">E-Wallet</div>
                    <div className="badge badge-outline text-gray-700 px-2 py-1 sm:px-3 sm:py-2 text-xs">QRIS</div>
                    <div className="badge badge-outline text-gray-700 px-2 py-1 sm:px-3 sm:py-2 text-xs">Convenience Stores</div>
                  </div>
                  
                  <div className="mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-blue-800 text-xs sm:text-sm font-medium">Testing Information (Sandbox)</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      For testing, use card number: 4811 1111 1111 1114 with any CVV, valid expiry date, and 3D Secure OTP: 112233
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-3 sm:p-4 md:p-5 border-b bg-gray-50">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Order Notes (Optional)</h2>
              </div>
              
              <div className="p-3 sm:p-4 md:p-5">
                <div className="form-control">
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm"
                    placeholder="Add special instructions or notes about your order"
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/3">
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden sticky top-20">
              <div className="p-3 sm:p-4 md:p-5 border-b bg-gray-50">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Order Summary</h2>
              </div>
              
              <div className="p-3 sm:p-4 md:p-5">
                <div className="space-y-3 mb-4 sm:mb-6 max-h-40 sm:max-h-60 overflow-y-auto">
                  {cartItems.map(item => {
                    const discountedPrice = getDiscountedPrice(item);
                    const hasDiscount = item.discountPercentage > 0;
                    
                    return (
                      <div key={item.id || item.productId} className="flex">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={item.image || item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = '/images/product-placeholder.png';
                            }}
                          />
                        </div>
                        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                          <h3 className="font-medium text-xs sm:text-sm text-gray-800 truncate">{item.name}</h3>
                          {item.category && (
                            <p className="text-xs text-gray-500 hidden sm:block">Category: {item.category}</p>
                          )}
                          <div className="text-xs sm:text-sm mt-1">
                            <span className="text-gray-700">{item.quantity} × </span>
                            <span className="font-medium text-gray-900">{formatPrice(discountedPrice)}</span>
                            {hasDiscount && (
                              <span className="ml-1 text-gray-400 line-through text-xs">
                                ({formatPrice(item.price)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2 hidden sm:block">
                          <span className="text-xs text-gray-500">
                            Subtotal:
                          </span>
                          <div className="font-medium text-xs sm:text-sm text-gray-800">
                            {formatPrice(discountedPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mb-4 sm:mb-6">
                  <div className="flex">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="input input-bordered h-9 sm:h-10 flex-1 mr-2 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-xs sm:text-sm"
                      placeholder="Enter coupon code"
                      disabled={couponApplied}
                    />
                    <button
                      className="btn btn-sm bg-npc-gold hover:bg-npc-darkGold text-white border-none text-xs h-9 sm:h-10 min-h-0"
                      onClick={applyCoupon}
                      disabled={couponApplied}
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <div className="text-green-600 text-xs mt-2">
                      <i className="fas fa-check-circle mr-1"></i>
                      Coupon applied successfully!
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 sm:space-y-3 border-t border-gray-200 pt-3 sm:pt-4">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Subtotal</span>
                    <span className="text-xs sm:text-sm text-gray-800">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-xs sm:text-sm">Discount (10%)</span>
                      <span className="text-xs sm:text-sm">-{formatPrice(calculateDiscountAmount())}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Shipping</span>
                    <span className="text-xs sm:text-sm text-gray-800">{formatPrice(getShippingCost())}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold pt-2 sm:pt-3 border-t">
                    <span className="text-sm sm:text-base text-gray-800">Total</span>
                    <span className="text-sm sm:text-base text-npc-gold">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
                
                <button
                  className={`btn w-full mt-4 sm:mt-6 bg-npc-gold hover:bg-npc-darkGold text-white border-none h-10 sm:h-12 min-h-0 ${isProcessing ? 'loading' : ''}`}
                  onClick={handleCheckout}
                  disabled={isProcessing || shippingLoading || shippingOptions.length === 0}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </button>
                
                <div className="mt-3 sm:mt-4 text-center">
                  <Link to="/cart" className="text-npc-gold hover:text-npc-darkGold text-xs sm:text-sm">
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Cart
                  </Link>
                </div>
                
                <div className="mt-4 sm:mt-6 text-xs text-gray-500 space-y-1 sm:space-y-2">
                  <div className="flex items-center">
                    <i className="fas fa-lock text-green-600 mr-2"></i>
                    <span>Secure checkout with 256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-shield-alt text-green-600 mr-2"></i>
                    <span>Protected by our Privacy Policy and Terms of Service</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;