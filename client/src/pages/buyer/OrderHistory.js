import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { orderAPI, reviewAPI, productAPI } from '../../services/api';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReviewModal from '../../components/modal/ReviewModal';
import { pdf } from '@react-pdf/renderer';
import InvoiceTemplate from '../../components/invoice/InvoiceTemplate';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalCount, setTotalCount] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [storeInfo, setStoreInfo] = useState(null);
  const [trackingDetails, setTrackingDetails] = useState({});
  const [trackingLoading, setTrackingLoading] = useState({});
  const [dateFilter, setDateFilter] = useState('all');
  
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const [userReviews, setUserReviews] = useState({});
  const [loadingReviews, setLoadingReviews] = useState({});
  const [deliveredNotifications, setDeliveredNotifications] = useState(new Set());
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseUrl}/store-info`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setStoreInfo(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching store info:', error);
      }
    };
    
    fetchStoreInfo();
  }, []);
  
  useEffect(() => {
    fetchOrders();
  }, [activeTab, currentPage, dateFilter, itemsPerPage]);
  
  useEffect(() => {
    const preloadAllReviews = async () => {
      if (orders.length > 0) {
        const loadingStates = {};
        orders.forEach(order => {
          loadingStates[order.id] = true;
        });
        setLoadingReviews(loadingStates);
        
        const completedOrders = orders.filter(
          order => order.status === 'delivered' || order.status === 'completed'
        );
        
        for (const order of completedOrders) {
          await preloadReviewsForOrder(order);
        }
        
        const completedLoadingStates = {};
        orders.forEach(order => {
          completedLoadingStates[order.id] = false;
        });
        setLoadingReviews(completedLoadingStates);
      }
    };
    
    preloadAllReviews();
  }, [orders]);

  const preloadReviewsForOrder = async (order) => {
    if (!order || !order.items || order.items.length === 0) return;
    
    try {
      for (const item of order.items) {
        const productId = item.productId;
        const orderProductKey = `${order.id}_${productId}`;
        
        if (userReviews[orderProductKey]) {
          continue;
        }
        
        try {
          const response = await reviewAPI.getUserProductReview(productId, order.id);
          
          if (response.data && response.data.success && response.data.data) {
            const reviewData = response.data.data;
            
            setUserReviews(prev => ({
              ...prev,
              [orderProductKey]: reviewData
            }));
          }
        } catch (reviewError) {
          if (reviewError.response && reviewError.response.status === 404) {
          } else {
            console.error('Error fetching review:', reviewError);
          }
        }
      }
    } catch (error) {
      console.error('Error preloading reviews for order ${order.id}:', error);
    }
  };
  
  const fetchAllOrders = async () => {
    try {
      const params = {
        limit: 100
      };
      
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        now.setHours(23, 59, 59, 999);
        
        switch (dateFilter) {
          case '1day':
            startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '3days':
            startDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '7days':
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '30days':
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '90days':
            startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          default:
            break;
        }
        
        const formattedStart = startDate.toISOString();
        const formattedEnd = now.toISOString();
        
        params.startDate = formattedStart;
        params.endDate = formattedEnd;
      }
      
      const response = await orderAPI.getMyOrders(params);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid API response format');
      }
      
      const formattedOrders = formatOrdersData(response.data.data);
      setAllOrders(formattedOrders);
      
      setTotalCount(formattedOrders.length);
      
    } catch (error) {
      console.error('Error fetching all orders for search:', error);
      setAllOrders([]);
    }
  };
  
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage === 'all' ? 100 : parseInt(itemsPerPage) 
      };
      
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        now.setHours(23, 59, 59, 999);
        
        switch (dateFilter) {
          case '1day':
            startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '3days':
            startDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '7days':
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '30days':
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          case '90days':
            startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
            break;
          default:
            break;
        }
        
        const formattedStart = startDate.toISOString();
        const formattedEnd = now.toISOString();
        
        params.startDate = formattedStart;
        params.endDate = formattedEnd;
      }
      
      const response = await orderAPI.getMyOrders(params);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid API response format');
      }
      
      const ordersData = response.data.data;
      const paginationData = response.data.pagination || { totalPages: 1, totalItems: ordersData.length };
      
      const formattedOrders = formatOrdersData(ordersData);
      
      setOrders(formattedOrders);
      setTotalPages(paginationData.totalPages || 1);
      setTotalItems(paginationData.totalItems || ordersData.length);
      
      fetchAllOrders();
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(`Failed to load orders: ${error.message}`);
      setOrders([]);
      setTotalPages(1);
      setTotalItems(0);
      setLoading(false);
    }
  };
  
  const handleItemsPerPageChange = (e) => {
    const newValue = e.target.value;
    setItemsPerPage(newValue);
    setCurrentPage(1); 
    if (newValue === 'all') {
      setTotalPages(1);
    } else {
      const calculatedTotalPages = Math.ceil(totalItems / parseInt(newValue));
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    }
  };
  
  const formatOrdersData = (ordersData) => {
    return ordersData.map(order => {
      let shippingAddressObj = {};
      try {
        shippingAddressObj = typeof order.shippingAddress === 'string' ? 
          JSON.parse(order.shippingAddress) : 
          order.shippingAddress || {};
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
      
      let shippingDetailsObj = {};
      try {
        if (order.shippingDetails) {
          shippingDetailsObj = typeof order.shippingDetails === 'string' ?
            JSON.parse(order.shippingDetails) :
            order.shippingDetails;
        }
      } catch (e) {
        console.error('Error parsing shipping details:', e);
      }
      
      let orderItems = [];
      if (order.OrderItems && Array.isArray(order.OrderItems)) {
        orderItems = order.OrderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.productName || 'Product',
          price: parseFloat(item.price || 0),
          quantity: item.quantity || 1,
          image: item.Product?.imageUrl || '/images/placeholder.png',
          description: item.Product?.description || 'No description available',
          rating: item.Product?.avgRating || 0,
          reviewCount: item.Product?.reviewCount || 0,
          options: ''
        }));
      }
      
      let canMarkDelivered = false;
      if (order.status === 'processing') {
        canMarkDelivered = true;
      }
      
      return {
        id: order.id,
        orderNumber: order.orderNumber || `Order-${order.id}`,
        date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updatedAt: order.updatedAt,
        total: parseFloat(order.grandTotal || 0),
        status: order.status || 'unknown',
        paymentMethod: order.paymentMethod || (order.Payment?.method || 'Unknown'),
        paymentStatus: order.paymentStatus || 'unknown',
        trackingNumber: order.trackingNumber || null,
        items: orderItems,
        shippingAddress: shippingAddressObj,
        shippingDetails: shippingDetailsObj,
        shippingMethod: order.shippingMethod || '',
        shippingFee: parseFloat(order.shippingFee || 0),
        canReview: order.status === 'completed' || order.status === 'delivered',
        canCancel: ['pending', 'processing'].includes(order.status),
        canMarkDelivered: canMarkDelivered
      };
    });
  };
  
  const fetchUserReviews = async (orderId, productIds) => {
    try {
      setLoadingReviews(prev => ({
        ...prev,
        [orderId]: true
      }));
      
      if (productIds && productIds.length > 0) {
        for (const productId of productIds) {
          const orderProductKey = `${orderId}_${productId}`;
          
          if (userReviews[orderProductKey]) {
            continue;
          }
          
          try {
            const response = await reviewAPI.getUserProductReview(productId, orderId);
            
            if (response.data && response.data.success && response.data.data) {
              const reviewData = response.data.data;
              
              if (Number(reviewData.orderId) === Number(orderId)) {
                setUserReviews(prev => ({
                  ...prev,
                  [orderProductKey]: reviewData
                }));
              } else {
              }
            }
          } catch (reviewError) {
            if (reviewError.response && reviewError.response.status === 404) {
            } else {
              console.error('Error fetching review:', reviewError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing user reviews:', error);
    } finally {
      setLoadingReviews(prev => ({
        ...prev,
        [orderId]: false
      }));
    }
  };
  
  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      
      const order = orders.find(o => o.id === orderId) || 
                   allOrders.find(o => o.id === orderId);
                   
      if (order) {
        if (order.items) {
          const productIds = order.items.map(item => item.productId);
          
          order.items.forEach(item => {
            fetchProductDetails(item.productId);
          });
          
          fetchUserReviews(orderId, productIds);
        }
        
        if (order.trackingNumber) {
          fetchTrackingDetails(order.trackingNumber);
        }
      }
    }
  };
  
  const fetchTrackingDetails = async (trackingNumber) => {
    if (!trackingNumber) return;
    
    setTrackingLoading(prev => ({ ...prev, [trackingNumber]: true }));
    
    try {
      const orderWithTracking = orders.find(o => o.trackingNumber === trackingNumber) || 
                               allOrders.find(o => o.trackingNumber === trackingNumber);
      
      let courier = null;
      if (orderWithTracking && orderWithTracking.shippingMethod) {
        courier = orderWithTracking.shippingMethod.split('_')[0];
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const trackingUrl = courier 
        ? `${baseUrl}/shipping/track/${trackingNumber}?courier=${courier}`
        : `${baseUrl}/shipping/track/${trackingNumber}`;
      
      const response = await axios.get(trackingUrl);
      
      if (response.data && response.data.success) {
        
        setTrackingDetails(prev => ({
          ...prev,
          [trackingNumber]: response.data.data
        }));
        
        const trackingData = response.data.data;
        const isDelivered = trackingData.status && (
          trackingData.status.toLowerCase().includes('delivered') ||
          trackingData.status.toLowerCase().includes('terkirim') ||
          trackingData.status.toLowerCase().includes('diterima')
        );
        
        if (isDelivered && response.data.source === 'binderbyte') {
          setTimeout(() => {
            fetchOrders();
          }, 2000);
        }
        
        const sourceText = response.data.source === 'binderbyte' 
          ? 'Real-time tracking data retrieved' 
          : response.data.source === 'biteship_fallback'
          ? 'Tracking information retrieved from alternative source'
          : 'Tracking information retrieved';
        
        window.Swal?.fire({
          title: 'Tracking Updated',
          text: sourceText,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        
        if (isDelivered && response.data.source === 'binderbyte') {
          if (!deliveredNotifications.has(trackingNumber)) {
            setDeliveredNotifications(prev => new Set(prev).add(trackingNumber));
            setTimeout(() => {
              window.Swal?.fire({
                title: 'Package Delivered!',
                text: 'Your package has been delivered. Order status will be updated automatically.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true
              });
            }, 3500);
          }
        }
      } else {
        window.Swal?.fire({
          title: 'No Tracking Data',
          text: 'Tracking information is not available at this time',
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error) {
      console.error('Error fetching tracking details:', error);
      window.Swal?.fire({
        title: 'Tracking Error',
        text: 'Could not retrieve tracking information',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } finally {
      setTrackingLoading(prev => ({ ...prev, [trackingNumber]: false }));
    }
  };
  
  const markAsDelivered = async (orderId) => {
    window.Swal?.fire({
      title: 'Confirm Delivery',
      text: 'Have you received this package? This action cannot be undone.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F0A84E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, I received it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await orderAPI.updateOrderStatus(orderId, {
            status: 'delivered',
            paymentStatus: 'paid' 
          });
          
          if (response.data && response.data.success) {
            const order = orders.find(o => o.id === orderId) || 
                        allOrders.find(o => o.id === orderId);
            
            const updatedOrders = orders.map(order => 
              order.id === orderId ? { ...order, status: 'delivered', canMarkDelivered: false, canReview: true } : order
            );
            
            const updatedAllOrders = allOrders.map(order => 
              order.id === orderId ? { ...order, status: 'delivered', canMarkDelivered: false, canReview: true } : order
            );
            
            setOrders(updatedOrders);
            setAllOrders(updatedAllOrders);
            
            window.Swal?.fire({
              title: 'Success!',
              text: 'Order has been marked as delivered.',
              icon: 'success',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            }).then(() => {
              if (order && order.items && order.items.length > 0) {
                window.Swal?.fire({
                  title: 'Leave a Review?',
                  text: 'Would you like to review the product(s) you received?',
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonColor: '#F0A84E',
                  cancelButtonColor: '#d33',
                  confirmButtonText: 'Yes, review now',
                  cancelButtonText: 'Review later'
                }).then((reviewResult) => {
                  if (reviewResult.isConfirmed && order.items.length === 1) {
                    openReviewModal(order.items[0], orderId);
                  } else if (reviewResult.isConfirmed) {
                    setExpandedOrder(orderId);
                    
                    window.Swal?.fire({
                      title: 'Choose a Product to Review',
                      text: 'Click "Write a Review" button for any product you want to review.',
                      icon: 'info',
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 5000,
                      timerProgressBar: true
                    });
                  }
                });
              }
            });
          } else {
            throw new Error(response.data?.message || 'Failed to update order status');
          }
        } catch (error) {
          console.error('Error marking order as delivered:', error);
          
          window.Swal?.fire({
            title: 'Error!',
            text: 'There was an error updating the order status.',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
        }
      }
    });
  };
  
  const fetchProductDetails = async (productId) => {
    if (productDetails[productId]) return;
    
    try {
      const response = await productAPI.getProductById(productId);
      
      if (response?.data?.success && response?.data?.data) {
        const productData = response.data.data;
        
        setProductDetails(prev => ({
          ...prev,
          [productId]: {
            description: productData.description || 'No description available',
            rating: productData.avgRating || 0,
            reviewCount: productData.reviewCount || 0,
            features: Array.isArray(productData.features) ? productData.features : [],
            specifications: productData.specifications || {}
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching details for product ${productId}:`, error);
      setProductDetails(prev => ({
        ...prev,
        [productId]: {
          description: 'Product details unavailable',
          rating: 0,
          reviewCount: 0,
          features: [],
          specifications: {}
        }
      }));
    }
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); 
    setExpandedOrder(null); 
  };
  
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1); 
  };
  
  const handleCancelOrder = async (orderId) => {
    window.Swal?.fire({
      title: 'Cancel Order',
      text: 'Are you sure you want to cancel this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F0A84E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await orderAPI.cancelOrder(orderId);
          
          const updatedOrders = orders.map(order => 
            order.id === orderId ? { ...order, status: 'cancelled', canCancel: false } : order
          );
          
          const updatedAllOrders = allOrders.map(order => 
            order.id === orderId ? { ...order, status: 'cancelled', canCancel: false } : order
          );
          
          setOrders(updatedOrders);
          setAllOrders(updatedAllOrders);
          
          window.Swal?.fire({
            title: 'Cancelled!',
            text: 'Your order has been cancelled.',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
        } catch (error) {
          console.error('Error cancelling order:', error);
          
          window.Swal?.fire({
            title: 'Error!',
            text: 'There was an error cancelling your order.',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
        }
      }
    });
  };
  
  const openReviewModal = (item, orderId) => {
    const orderProductKey = `${orderId}_${item.productId}`;
    
    if (userReviews[orderProductKey]) {
      window.Swal?.fire({
        title: 'Review Already Exists',
        text: 'You have already reviewed this product for this order. Thank you for your feedback!',
        icon: 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }
    
    setReviewItem(item);
    setReviewOrderId(orderId);
    setIsReviewModalOpen(true);
  };
  
  const handleReviewSubmitted = (reviewData) => {
    const orderProductKey = `${reviewOrderId}_${reviewItem.productId}`;
    
    setUserReviews(prev => {
      const updated = {
        ...prev,
        [orderProductKey]: reviewData
      };
      return updated;
    });
    
    setTimeout(() => {
      fetchOrders();
    }, 500);
    
    window.Swal?.fire({
      title: 'Review Successfully Submitted!',
      text: 'Thank you for your feedback. Your review will help other customers make purchase decisions.',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  };
  
  const downloadInvoice = async (order) => {
    try {
      window.Swal?.fire({
        title: 'Generating Invoice',
        text: 'Please wait while we prepare your invoice...',
        allowOutsideClick: false,
        didOpen: () => {
          window.Swal.showLoading();
        }
      });
      
      const blob = await pdf(
        <InvoiceTemplate order={order} storeInfo={storeInfo} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      window.Swal?.close();
      window.Swal?.fire({
        title: 'Invoice Downloaded',
        text: `Invoice for order ${order.orderNumber} has been downloaded.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      
      window.Swal?.close();
      window.Swal?.fire({
        title: 'Error',
        text: 'There was an error generating the invoice. Please try again later.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  const formatPrice = (price) => {
    if (typeof price !== 'number') {
      price = parseFloat(price) || 0;
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-ghost text-white">Pending</span>;
      case 'completed':
      case 'delivered':
        return <span className="badge badge-success text-white">Delivered</span>;
      case 'processing':
        return <span className="badge badge-warning text-white">Processing</span>;
      case 'shipped':
        return <span className="badge badge-info text-white">Shipped</span>;
      case 'cancelled':
        return <span className="badge badge-error text-white">Cancelled</span>;
      default:
        return <span className="badge badge-ghost text-gray-700">{status}</span>;
    }
  };
  
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star text-yellow-400"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt text-yellow-400"></i>);
    }
    
    for (let i = 0; i < 5 - fullStars - (hasHalfStar ? 1 : 0); i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star text-yellow-400"></i>);
    }
    
    return <div className="flex items-center">{stars}</div>;
  };
  
  const filteredOrders = (() => {
    let filteredResults = [];
    
    if (searchQuery.trim() === '') {
      filteredResults = orders;
    } else {
      const filtered = allOrders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        
        const orderMatch = (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
                          (order.id && order.id.toString().includes(searchLower));
        
        const productMatch = order.items.some(item => 
          item.name.toLowerCase().includes(searchLower)
        );
        
        return orderMatch || productMatch;
      });
      
      if (itemsPerPage === 'all') {
        filteredResults = filtered;
      } else {
        const start = (currentPage - 1) * parseInt(itemsPerPage);
        const end = start + parseInt(itemsPerPage);
        filteredResults = filtered.slice(start, end);
      }
    }
    
    return filteredResults;
  })();
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let visiblePages = [];
    
    if (totalPages <= 5) {
      visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 3) {
        visiblePages = [1, 2, 3, 4, totalPages];
      } else if (currentPage >= totalPages - 2) {
        visiblePages = [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        visiblePages = [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
      }
    }
    
    return (
      <div className="flex justify-center items-center py-4 overflow-x-auto">
        <div className="flex items-center space-x-1">
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
          
          {visiblePages.map((page, index) => (
            <button
              key={`page-${page}`}
              className={`btn btn-sm min-w-[2.5rem] ${
                currentPage === page 
                  ? 'bg-npc-gold border-npc-gold text-white hover:bg-npc-darkGold' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>
    );
  };
  
  const renderTrackingTimeline = (trackingNumber) => {
    const tracking = trackingDetails[trackingNumber];
    
    if (trackingLoading[trackingNumber]) {
      return (
        <div className="text-center py-6">
          <span className="loading loading-spinner text-npc-gold"></span>
          <p className="text-gray-600 mt-2">Fetching latest tracking information...</p>
        </div>
      );
    }
    
    if (!tracking) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-600">
            No tracking information available from shipping provider.
          </p>
          <button
            onClick={() => fetchTrackingDetails(trackingNumber)}
            className="btn btn-xs btn-outline mt-2 border-npc-gold text-npc-gold hover:bg-npc-gold hover:text-white"
          >
            <i className="fas fa-search mr-1"></i>
            Check Tracking Status
          </button>
        </div>
      );
    }
    
    const events = tracking.manifest || tracking.history || tracking.events || [];
    
    const hasRealTrackingData = events.length > 0 && !tracking.isUsingFallback;
    
    if (events.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-600">
            Tracking number is registered but no detailed events available yet.
          </p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Courier: {tracking.courier?.toUpperCase() || 'Unknown'}</p>
            <p>Status: {tracking.status || 'Pending'}</p>
            {tracking.service && <p>Service: {tracking.service}</p>}
          </div>
          <button
            onClick={() => fetchTrackingDetails(trackingNumber)}
            className="btn btn-xs btn-outline mt-2 border-npc-gold text-npc-gold hover:bg-npc-gold hover:text-white"
          >
            <i className="fas fa-sync-alt mr-1"></i>
            Refresh Tracking
          </button>
        </div>
      );
    }
    
    return (
      <div>
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                {tracking.courier?.toUpperCase() || 'Unknown'} 
                {tracking.service && ` - ${tracking.service.toUpperCase()}`}
              </p>
              <p className="text-xs text-blue-600">
                Status: <span className="font-semibold">{tracking.status || 'In Transit'}</span>
              </p>
              {tracking.shipper && (
                <p className="text-xs text-blue-600">
                  From: <span className="font-semibold">{tracking.shipper}</span>
                </p>
              )}
              {tracking.receiver && (
                <p className="text-xs text-blue-600">
                  To: <span className="font-semibold">{tracking.receiver}</span>
                </p>
              )}
              {hasRealTrackingData && (
                <p className="text-xs text-green-600 mt-1">
                  <i className="fas fa-check-circle mr-1"></i>
                  Real-time tracking data
                </p>
              )}
            </div>
            <button
              onClick={() => fetchTrackingDetails(trackingNumber)}
              className="btn btn-xs btn-ghost text-blue-600"
              title="Refresh tracking"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        
        <ol className="relative border-l border-gray-200 ml-3 my-4">
          {events.map((event, index) => {
            const eventDate = event.date || event.timestamp || new Date().toISOString();
            const eventDesc = event.desc || event.description || event.status || 'Status update';
            
            return (
              <li key={index} className="mb-6 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                  <i className={`fas ${
                    eventDesc.toLowerCase().includes('deliver') || eventDesc.toLowerCase().includes('terkirim') ? 'fa-box-open' :
                    eventDesc.toLowerCase().includes('ship') || eventDesc.toLowerCase().includes('diantar') ? 'fa-truck' :
                    eventDesc.toLowerCase().includes('process') || eventDesc.toLowerCase().includes('diproses') ? 'fa-cog' :
                    eventDesc.toLowerCase().includes('receiv') || eventDesc.toLowerCase().includes('diterima') ? 'fa-warehouse' :
                    eventDesc.toLowerCase().includes('transit') || eventDesc.toLowerCase().includes('berangkat') ? 'fa-route' :
                    'fa-circle-check'
                  } text-blue-500 text-xs`}></i>
                </span>
                <h4 className="font-semibold text-gray-800">{eventDesc}</h4>
                <div className="text-xs text-gray-600">
                  <time className="block">
                    {eventDate ? formatDate(eventDate) : 'No date available'}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  };
  
  const ExistingReview = ({ review }) => {
    return (
      <div className="bg-blue-50 p-3 rounded-md mt-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800">Your Review</h4>
          <div className="flex items-center">
            {renderStarRating(review.rating)}
          </div>
        </div>
        
        {review.title && <h5 className="font-medium text-gray-700 mt-2">{review.title}</h5>}
        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
        
        <div className="text-xs text-gray-500 mt-2">
          Posted on {formatDate(review.createdAt)}
        </div>
        
        {review.adminResponse && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center">
              <i className="fas fa-reply text-npc-navy mr-2"></i>
              <h5 className="font-medium text-npc-navy">Response from Store</h5>
            </div>
            <p className="text-sm text-gray-600 mt-1 ml-5">{review.adminResponse}</p>
            {review.adminResponseDate && (
              <div className="text-xs text-gray-500 mt-1 ml-5">
                Responded on {formatDate(review.adminResponseDate)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const hasReviewedProduct = (productId, orderId) => {
    const orderProductKey = `${orderId}_${productId}`;
    const hasReview = !!userReviews[orderProductKey];
    return hasReview;
  };
  
  const getOrderReviewStatus = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      return { total: 0, reviewed: 0 };
    }
    
    const total = order.items.length;
    let reviewed = 0;
    
    order.items.forEach(item => {
      if (hasReviewedProduct(item.productId, order.id)) {
        reviewed++;
      }
    });
    
    return { total, reviewed };
  };
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      if ((activeTab === 'all' || searchQuery) && allOrders.length > 0) {
      } else {
        fetchOrders();
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">My Order History</h1>
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full">
              <div className="form-control">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by order ID or product name..."
                    className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select 
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300 text-sm"
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select 
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300 text-sm"
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="1day">Last 24 Hours</option>
                <option value="3days">Last 3 Days</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              
              <select
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300 text-sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="all">Show All</option>
              </select>
            </div>
          </div>
          
          {(activeTab !== 'all' || dateFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {activeTab !== 'all' && (
                <span className="badge bg-gray-100 text-gray-800 py-1">
                  Status: {activeTab}
                  <button 
                    className="ml-1 text-gray-500 hover:text-gray-800"
                    onClick={() => handleTabChange('all')}
                  >
                    <i className="fas fa-times-circle text-xs"></i>
                  </button>
                </span>
              )}
              
              {dateFilter !== 'all' && (
                <span className="badge bg-gray-100 text-gray-800 py-1">
                  Time: {dateFilter === '1day' ? 'Last 24 Hours' : 
                         dateFilter === '3days' ? 'Last 3 Days' : 
                         dateFilter === '7days' ? 'Last 7 Days' : 
                         dateFilter === '30days' ? 'Last 30 Days' : 
                         dateFilter === '90days' ? 'Last 90 Days' : dateFilter}
                  <button 
                    className="ml-1 text-gray-500 hover:text-gray-800"
                    onClick={() => handleDateFilterChange('all')}
                  >
                    <i className="fas fa-times-circle text-xs"></i>
                  </button>
                </span>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredOrders.length} of {searchQuery ? (allOrders.filter(order => {
              const searchLower = searchQuery.toLowerCase();
              const orderMatch = (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
                              (order.id && order.id.toString().includes(searchLower));
              const productMatch = order.items.some(item => 
                item.name.toLowerCase().includes(searchLower)
              );
              return orderMatch || productMatch;
            }).length) : totalItems} orders
            {searchQuery && <span> matching "{searchQuery}"</span>}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg text-npc-gold"></span>
            </div>
          ) : error ? (
            <div className="alert alert-error text-white">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{error}</span>
              <button 
                className="btn btn-sm btn-ghost text-white ml-auto"
                onClick={fetchOrders}
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <img 
                src="/images/no-orders.png" 
                alt="No Orders" 
                className="w-32 h-32 mx-auto mb-4 opacity-40"
              />
              <h3 className="text-lg font-medium mb-2 text-gray-800">No Orders Found</h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'all' && searchQuery 
                  ? `No orders matching "${searchQuery}" were found.`
                  : `You don't have any ${activeTab === 'all' ? '' : activeTab} orders yet.`
                }
              </p>
              <Link to="/products" className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="border rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-gray-50 p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm sm:text-base">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        Ordered on {formatDate(order.date)}
                        {order.status === 'shipped' && order.trackingNumber && (
                          <span className="block sm:inline sm:ml-4 text-blue-600 mt-1 sm:mt-0">
                            <i className="fas fa-truck-loading mr-1"></i>
                            Receipt: 
                            <span 
                              className="ml-1 cursor-pointer hover:bg-blue-50 px-1 rounded text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(order.trackingNumber);
                                window.Swal?.fire({
                                  title: 'Copied!',
                                  text: 'Tracking number copied to clipboard',
                                  icon: 'success',
                                  toast: true,
                                  position: 'top-end',
                                  showConfirmButton: false,
                                  timer: 2000
                                });
                              }}
                              title="Click to copy tracking number"
                            >
                              {order.trackingNumber}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="sm:mt-0">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-npc-gold text-sm sm:text-base">{formatPrice(order.total)}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{order.paymentMethod.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-white flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex w-full lg:w-auto">
                      {order.items && order.items.length > 0 ? (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={order.items[0].image || '/images/placeholder.png'} 
                            alt={order.items[0].name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = '/images/placeholder.png';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                          <i className="fas fa-box text-gray-400 text-xl sm:text-2xl"></i>
                        </div>
                      )}
                      <div className="ml-3 sm:ml-4 flex-1">
                        <div className="font-medium text-gray-800 text-sm sm:text-base">
                          {order.items && order.items.length > 0 
                            ? order.items[0].name 
                            : 'Product not available'}
                          {order.items && order.items.length > 1 && 
                            ` +${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}`}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          {order.items ? order.items.reduce((total, item) => total + item.quantity, 0) : 0} item(s)
                        </div>
                        {order.trackingNumber && (
                          <div className="text-xs sm:text-sm text-gray-600 mt-1">
                            Tracking: {order.trackingNumber}
                          </div>
                        )}
                        
                        {(order.status === 'delivered' || order.status === 'completed') && order.items && order.items.length > 0 && (
                          <div className="mt-1">
                            {loadingReviews[order.id] ? (
                              <span className="text-xs flex items-center">
                                <span className="loading loading-spinner loading-xs text-gray-400 mr-1"></span>
                                Checking reviews...
                              </span>
                            ) : (
                              <span className="text-xs">
                                {(() => {
                                  const { total, reviewed } = getOrderReviewStatus(order);
                                  
                                  if (reviewed === total) {
                                    return (
                                      <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs">
                                        All items reviewed
                                      </span>
                                    );
                                  } else if (reviewed > 0) {
                                    return (
                                      <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs">
                                        {reviewed}/{total} items reviewed
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse text-xs">
                                        Needs {total} reviews
                                      </span>
                                    );
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                      <button 
                        className="btn btn-ghost btn-xs sm:btn-sm rounded-md text-xs sm:text-sm"
                        onClick={() => toggleOrderDetails(order.id)}
                        title={expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                      >
                        <i className="fas fa-eye text-blue-600"></i>
                      </button>
                      
                      {(order.status === 'processing' || order.status === 'pending') && order.canCancel && (
                        <button 
                          className="btn btn-ghost btn-xs sm:btn-sm rounded-md text-xs sm:text-sm"
                          onClick={() => handleCancelOrder(order.id)}
                          title="Cancel Order"
                        >
                          <i className="fas fa-ban text-red-500"></i>
                        </button>
                      )}
                      
                      <button 
                        className="btn btn-ghost btn-xs sm:btn-sm rounded-md text-xs sm:text-sm"
                        onClick={() => downloadInvoice(order)}
                        title="Download Invoice"
                      >
                        <i className="fas fa-print text-gray-600"></i>
                      </button>

                      {order.canMarkDelivered && (
                        <button 
                          className="btn btn-ghost btn-xs sm:btn-sm rounded-md text-xs sm:text-sm"
                          onClick={() => markAsDelivered(order.id)}
                          title="Mark as Received"
                        >
                          <i className="fas fa-check-circle text-npc-gold"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {expandedOrder === order.id && (
                    <div className="p-3 sm:p-4 border-t bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <h3 className="font-medium mb-3 text-gray-800 text-sm sm:text-base">Order Items</h3>
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-4">
                              {order.items.map((item, index) => (
                                <div key={item.id || index} className="border rounded-lg overflow-hidden">
                                  <div className="p-2 sm:p-3 flex">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                      <img 
                                        src={item.image || '/images/placeholder.png'} 
                                        alt={item.name} 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          e.target.src = '/images/placeholder.png';
                                        }}
                                      />
                                    </div>
                                    <div className="ml-3 sm:ml-4 flex-1">
                                      <div className="font-medium text-gray-800 text-sm sm:text-base">{item.name}</div>
                                      <div className="flex flex-col mt-1">
                                        <span className="text-xs sm:text-sm text-gray-600 mb-1">
                                          {item.quantity} x {formatPrice(item.price)}
                                        </span>
                                        
                                        <div className="flex items-center">
                                          {renderStarRating(productDetails[item.productId]?.rating || item.rating || 0)}
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({productDetails[item.productId]?.reviewCount || 0} reviews)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 border-t bg-gray-50">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Product Details</h4>
                                    
                                    <p className="text-sm text-gray-600 mb-2">
                                      {productDetails[item.productId]?.description || item.description || 'No description available'}
                                    </p>
                                    
                                    {productDetails[item.productId]?.features?.length > 0 && (
                                      <div className="mt-2">
                                        <h5 className="text-xs font-medium text-gray-700">Features:</h5>
                                        <ul className="text-xs text-gray-600 list-disc list-inside">
                                          {productDetails[item.productId].features.slice(0, 3).map((feature, i) => (
                                            <li key={i}>{feature}</li>
                                          ))}
                                          {productDetails[item.productId].features.length > 3 && (
                                            <li className="text-npc-gold">+{productDetails[item.productId].features.length - 3} more</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    <div className="text-right mt-2">
                                      <Link 
                                        to={`/products/${item.productId}`} 
                                        className="text-xs text-npc-gold hover:underline"
                                      >
                                        View Full Product Details
                                      </Link>
                                    </div>
                                  </div>
                                  
                                  {(order.status === 'delivered' || order.status === 'completed') && (
                                    <div className="border-t p-3">
                                      {loadingReviews[order.id] ? (
                                        <div className="flex justify-center py-2">
                                          <span className="loading loading-spinner loading-sm text-npc-gold"></span>
                                        </div>
                                      ) : hasReviewedProduct(item.productId, order.id) ? (
                                        <ExistingReview review={userReviews[`${order.id}_${item.productId}`]} />
                                      ) : (
                                        <div className="flex items-center mt-1">
                                          <button 
                                            className="btn btn-sm bg-npc-gold text-white border-none hover:bg-npc-darkGold"
                                            onClick={() => openReviewModal(item, order.id)}
                                          >
                                            <i className="fas fa-star mr-1"></i>
                                            Write a Review
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              No item data available.
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-3 text-gray-800 text-sm sm:text-base">Shipping Information</h3>
                          <div className="bg-gray-50 p-2 sm:p-3 rounded">
                            {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 ? (
                              <>
                                <p className="font-medium text-gray-800 text-sm sm:text-base">{order.shippingAddress.fullName}</p>
                                <p className="text-xs sm:text-sm text-gray-600">{order.shippingAddress.phoneNumber}</p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {order.shippingAddress.address}, {order.shippingAddress.city},
                                  {order.shippingAddress.province && ` ${order.shippingAddress.province},`} {order.shippingAddress.postalCode}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-600">
                                Address information not available.
                              </p>
                            )}
                            
                            {order.shippingMethod && (
                              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                                <p className="text-xs sm:text-sm text-gray-700 font-medium">Shipping Method:</p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {(() => {
                                    try {
                                      const courier = order.shippingMethod.split('_')[0] || '';
                                      const service = order.shippingMethod.split('_')[1] || '';
                                      return `${courier.toUpperCase()} ${service.toUpperCase()}`;
                                    } catch (e) {
                                      return order.shippingMethod;
                                    }
                                  })()}
                                </p>
                                
                                {order.trackingNumber && (
                                  <div className="mt-2">
                                    <p className="text-xs sm:text-sm text-gray-700 font-medium">Tracking Number:</p>
                                    <p className="text-xs sm:text-sm text-gray-600 flex items-center flex-wrap">
                                      <span>{order.trackingNumber}</span>
                                      <button 
                                        onClick={() => fetchTrackingDetails(order.trackingNumber)} 
                                        className="ml-2 text-xs text-npc-gold hover:underline"
                                        disabled={trackingLoading[order.trackingNumber]}
                                      >
                                        {trackingLoading[order.trackingNumber] ? (
                                          <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                          <span><i className="fas fa-sync-alt mr-1"></i>Update</span>
                                        )}
                                      </button>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {order.trackingNumber && (
                            <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-2 sm:p-3">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tracking Details</h4>
                              {renderTrackingTimeline(order.trackingNumber)}
                            </div>
                          )}
                          
                          {(() => {
                            const tracking = trackingDetails[order.trackingNumber];
                            const hasRealTrackingData = tracking && 
                              (tracking.manifest || tracking.history || []).length > 0 && 
                              !tracking.isUsingFallback;
                            
                            const shouldShowOrderTimeline = !order.trackingNumber || !hasRealTrackingData;
                            
                            if (!shouldShowOrderTimeline) {
                              return null;
                            }
                            
                            return (
                              <div className="mt-4 sm:mt-6">
                                <h3 className="font-medium mb-3 text-gray-800 text-sm sm:text-base">Order Timeline</h3>
                                
                                <ol className="relative border-l border-gray-200 ml-2 sm:ml-3">
                                  <li className="mb-4 sm:mb-6 ml-4 sm:ml-6">
                                    <span className="absolute flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full -left-2.5 sm:-left-3 ring-4 sm:ring-8 ring-white">
                                      <i className="fas fa-check text-green-500 text-xs"></i>
                                    </span>
                                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Order Placed</h4>
                                    <time className="block text-xs font-normal text-gray-600">{formatDate(order.date)}</time>
                                  </li>
                                  
                                  {(order.status === 'processing' || order.status === 'delivered' || order.status === 'completed') && (
                                    <li className="mb-4 sm:mb-6 ml-4 sm:ml-6">
                                      <span className="absolute flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full -left-2.5 sm:-left-3 ring-4 sm:ring-8 ring-white">
                                        <i className="fas fa-cog text-blue-500 text-xs"></i>
                                      </span>
                                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Processing</h4>
                                      <time className="block text-xs font-normal text-gray-600">
                                        {formatDate(new Date(new Date(order.date).getTime() + 86400000))}
                                      </time>
                                    </li>
                                  )}
                                  
                                  {(order.status === 'delivered' || order.status === 'completed') && (
                                    <li className="ml-4 sm:ml-6">
                                      <span className="absolute flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full -left-2.5 sm:-left-3 ring-4 sm:ring-8 ring-white">
                                        <i className="fas fa-box-open text-green-500 text-xs"></i>
                                      </span>
                                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Delivered</h4>
                                      <time className="block text-xs font-normal text-gray-600">
                                        {formatDate(order.updatedAt || new Date(new Date(order.date).getTime() + 432000000))}
                                      </time>
                                      {order.trackingNumber && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          Tracking Number: {order.trackingNumber}
                                        </p>
                                      )}
                                    </li>
                                  )}
                                  
                                  {order.status === 'cancelled' && (
                                    <li className="ml-4 sm:ml-6">
                                      <span className="absolute flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full -left-2.5 sm:-left-3 ring-4 sm:ring-8 ring-white">
                                        <i className="fas fa-times text-red-500 text-xs"></i>
                                      </span>
                                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Cancelled</h4>
                                      <time className="block text-xs font-normal text-gray-600">
                                        {formatDate(order.updatedAt || new Date(new Date(order.date).getTime() + 86400000))}
                                      </time>
                                    </li>
                                  )}
                                </ol>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {renderPagination()}
              
              <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
                {itemsPerPage === 'all' ? (
                  `Showing all ${filteredOrders.length} orders`
                ) : (
                  `Showing ${Math.min((currentPage - 1) * parseInt(itemsPerPage) + 1, filteredOrders.length)} to ${Math.min(currentPage * parseInt(itemsPerPage), searchQuery ? allOrders.filter(order => {
                    const searchLower = searchQuery.toLowerCase();
                    const orderMatch = (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
                                    (order.id && order.id.toString().includes(searchLower));
                    const productMatch = order.items.some(item => 
                      item.name.toLowerCase().includes(searchLower)
                    );
                    return orderMatch || productMatch;
                  }).length : totalItems)} of ${searchQuery ? allOrders.filter(order => {
                    const searchLower = searchQuery.toLowerCase();
                    const orderMatch = (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
                                    (order.id && order.id.toString().includes(searchLower));
                    const productMatch = order.items.some(item => 
                      item.name.toLowerCase().includes(searchLower)
                    );
                    return orderMatch || productMatch;
                  }).length : totalItems} orders`
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          orderId={reviewOrderId}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmitSuccess={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default OrderHistory;