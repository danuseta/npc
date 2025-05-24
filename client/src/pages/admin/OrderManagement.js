import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/ui/Modal';
import { orderAPI } from '../../services/api';
import Swal from 'sweetalert2';
import InvoiceTemplate from '../../components/invoice/InvoiceTemplate';
import { PDFViewer, pdf } from '@react-pdf/renderer';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeFilter, setActiveFilter] = useState('simple'); 
  
  const [allOrders, setAllOrders] = useState([]);
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [storeInfo] = useState({
    storeName: 'NPC Nusantara Computer',
    address: 'Jl. Raya Utama No. 123',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postalCode: '12345',
    phoneNumber: '+62 123-4567-890',
    email: 'contact@npccomputer.com'
  });

  useEffect(() => {
    window.Swal = Swal;
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, dateFilter]);
  
  const fetchOrders = async () => {
    setLoading(true);
    
    try {
      let dateRange = {};
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        dateRange = { startDate: today, endDate: today };
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        dateRange = { startDate: yesterdayStr, endDate: yesterdayStr };
      } else if (dateFilter === 'last7days') {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        dateRange = { 
          startDate: last7Days.toISOString().split('T')[0], 
          endDate: new Date().toISOString().split('T')[0] 
        };
      } else if (dateFilter === 'last30days') {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        dateRange = { 
          startDate: last30Days.toISOString().split('T')[0], 
          endDate: new Date().toISOString().split('T')[0] 
        };
      } else if (dateFilter === 'custom' && startDate && endDate) {
        dateRange = { startDate, endDate };
      }
      
      if (statusFilter === 'all') {
        const baseParams = {
          page: 1,
          limit: 100,
          ...dateRange
        };
        
        if (searchQuery && searchQuery.trim() !== '') {
          baseParams.search = searchQuery.trim();
        }
        
        try {
          const [pendingResponse, processingResponse, shippedResponse] = await Promise.all([
            orderAPI.getAllOrders({ ...baseParams, status: 'pending' }),
            orderAPI.getAllOrders({ ...baseParams, status: 'processing' }),
            orderAPI.getAllOrders({ ...baseParams, status: 'shipped' })
          ]);
          
          let combinedOrders = [];
          let totalCount = 0;
          
          if (pendingResponse.data.success) {
            combinedOrders = [...combinedOrders, ...pendingResponse.data.data];
            totalCount += pendingResponse.data.count || pendingResponse.data.pagination?.totalItems || 0;
          }
          
          if (processingResponse.data.success) {
            combinedOrders = [...combinedOrders, ...processingResponse.data.data];
            totalCount += processingResponse.data.count || processingResponse.data.pagination?.totalItems || 0;
          }
          
          if (shippedResponse.data.success) {
            combinedOrders = [...combinedOrders, ...shippedResponse.data.data];
            totalCount += shippedResponse.data.count || shippedResponse.data.pagination?.totalItems || 0;
          }
          
          combinedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setAllOrders(combinedOrders);
          
          let filteredOrders = combinedOrders;
          if (searchQuery && searchQuery.trim() !== '') {
            const searchTerm = searchQuery.trim().toLowerCase();
            filteredOrders = combinedOrders.filter(order => {
              const orderId = String(order.orderNumber || order.id || '').toLowerCase();
              
              const customerName = String(order.User?.name || '').toLowerCase();
              const customerEmail = String(order.User?.email || '').toLowerCase();
              
              const hasMatchingProduct = (order.OrderItems || []).some(item => 
                String(item.productName || '').toLowerCase().includes(searchTerm)
              );
              
              return orderId.includes(searchTerm) || 
                     customerName.includes(searchTerm) || 
                     customerEmail.includes(searchTerm) ||
                     hasMatchingProduct;
            });
          }
          
          setTotalCount(filteredOrders.length);
          
          const calculatedTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);
          setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
          
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
          
          setOrders(paginatedOrders);
          setLoading(false);
          
        } catch (error) {
          console.error('Error fetching combined orders:', error);
          setLoading(false);
          setOrders([]);
        }
      } else {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter,
          ...dateRange
        };
        
        if (searchQuery && searchQuery.trim() !== '') {
          params.search = searchQuery.trim();
        }
        
        const response = await orderAPI.getAllOrders(params);
        
        if (response.data.success) {
          setOrders(response.data.data);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setTotalCount(response.data.pagination?.totalItems || response.data.count || response.data.data.length);
          
          setAllOrders(response.data.data);
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      setOrders([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      
      if (statusFilter === 'all' && allOrders.length > 0) {
        const searchTerm = query.trim().toLowerCase();
        
        let filteredOrders = allOrders;
        if (searchTerm !== '') {
          filteredOrders = allOrders.filter(order => {
            const orderId = String(order.orderNumber || order.id || '').toLowerCase();
            
            const customerName = String(order.User?.name || '').toLowerCase();
            const customerEmail = String(order.User?.email || '').toLowerCase();
            
            const hasMatchingProduct = (order.OrderItems || []).some(item => 
              String(item.productName || '').toLowerCase().includes(searchTerm)
            );
            
            return orderId.includes(searchTerm) || 
                   customerName.includes(searchTerm) || 
                   customerEmail.includes(searchTerm) ||
                   hasMatchingProduct;
          });
        }
        
        setTotalCount(filteredOrders.length);
        
        const calculatedTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
        
        const startIndex = 0;
        const endIndex = startIndex + itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        
        setOrders(paginatedOrders);
        setIsSearching(false);
      } else {
        fetchOrders();
      }
    }, 300);
    
    setSearchTimeout(timeoutId);
  };
  
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
    
    if (e.target.value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    
    if (statusFilter === 'all' && allOrders.length > 0) {
      let filteredOrders = allOrders;
      if (searchQuery && searchQuery.trim() !== '') {
        const searchTerm = searchQuery.trim().toLowerCase();
        filteredOrders = allOrders.filter(order => {
          const orderId = String(order.orderNumber || order.id || '').toLowerCase();
          
          const customerName = String(order.User?.name || '').toLowerCase();
          const customerEmail = String(order.User?.email || '').toLowerCase();
          
          const hasMatchingProduct = (order.OrderItems || []).some(item => 
            String(item.productName || '').toLowerCase().includes(searchTerm)
          );
          
          return orderId.includes(searchTerm) || 
                 customerName.includes(searchTerm) || 
                 customerEmail.includes(searchTerm) ||
                 hasMatchingProduct;
        });
      }
      
      const startIndex = (newPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      setOrders(paginatedOrders);
    }
  };
  
  const handleViewOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderById(orderId);
      
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setIsViewModalOpen(true);
      } else {
        console.error('Error fetching order details:', response.data.message);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setIsUpdateStatusModalOpen(true);
  };
  
  const handleStatusUpdateSubmit = async () => {
    if (!selectedOrder) return;
    
    if (newStatus === 'shipped' && !trackingNumber.trim()) {
      window.Swal.fire({
        title: 'Tracking Number Required',
        text: 'Please enter a tracking number for shipped orders.',
        icon: 'warning',
        confirmButtonColor: '#F0A84E',
      });
      return;
    }
    
    try {
      let data = { 
        status: newStatus,
        paymentStatus: selectedOrder.paymentStatus || 'paid'
      };
      
      if (newStatus === 'shipped') {
        data.trackingNumber = trackingNumber;
      }
      
      console.log('Sending order update data:', data);
      
      const response = await orderAPI.updateOrderStatus(selectedOrder.id, data);
      
      if (response.data.success) {
        const updatedOrders = orders.map(order => 
          order.id === selectedOrder.id 
            ? { 
                ...order, 
                status: newStatus,
                trackingNumber: newStatus === 'shipped'
                  ? trackingNumber 
                  : order.trackingNumber
              } 
            : order
        );
        
        setOrders(updatedOrders);
        setIsUpdateStatusModalOpen(false);
        
        const updatedAllOrders = allOrders.map(order => 
          order.id === selectedOrder.id 
            ? { 
                ...order, 
                status: newStatus,
                trackingNumber: newStatus === 'shipped'
                  ? trackingNumber 
                  : order.trackingNumber
              } 
            : order
        );
        
        setAllOrders(updatedAllOrders);
        
        window.Swal.fire({
          title: 'Status Updated',
          text: `Order ${selectedOrder.id} status has been changed to ${newStatus}.`,
          icon: 'success',
          timer: 2000,
          confirmButtonColor: '#F0A84E',
          showConfirmButton: false,
        });
        
        fetchOrders();
      } else {
        console.error('Error updating order status:', response.data.message);
        
        window.Swal.fire({
          title: 'Update Failed',
          text: response.data.message || 'Failed to update order status.',
          icon: 'error',
          confirmButtonColor: '#F0A84E',
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      
      window.Swal.fire({
        title: 'Update Failed',
        text: error.response?.data?.message || 'An error occurred while updating order status.',
        icon: 'error',
        confirmButtonColor: '#F0A84E',
      });
    }
  };
  
  const applyDateFilter = () => {
    if (dateFilter === 'custom' && (!startDate || !endDate)) {
      window.Swal.fire({
        title: 'Missing Dates',
        text: 'Please select both start and end dates.',
        icon: 'warning',
        confirmButtonColor: '#F0A84E',
      });
      return;
    }
    
    setCurrentPage(1);
    fetchOrders();
  };
  
  const handlePrintInvoice = async (order) => {
    try {
      if (!order) return;
      
      let orderData = order;
      
      if (!orderData.OrderItems || !Array.isArray(orderData.OrderItems) || orderData.OrderItems.length === 0) {
        try {
          const response = await orderAPI.getOrderById(orderData.id);
          if (response.data?.success) {
            orderData = response.data.data;
          }
        } catch (e) {
          console.error('Error fetching full order details:', e);
        }
      }
      
      let shippingAddressObj = {};
      try {
        shippingAddressObj = typeof orderData.shippingAddress === 'string' ? 
          JSON.parse(orderData.shippingAddress) : 
          orderData.shippingAddress || {};
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
      
      let shippingDetailsObj = {};
      try {
        if (orderData.shippingDetails) {
          shippingDetailsObj = typeof orderData.shippingDetails === 'string' ?
            JSON.parse(orderData.shippingDetails) :
            orderData.shippingDetails;
        }
      } catch (e) {
        console.error('Error parsing shipping details:', e);
      }
      
      let orderItems = [];
      if (orderData.OrderItems && Array.isArray(orderData.OrderItems)) {
        orderItems = orderData.OrderItems.map(item => ({
          id: item.id,
          name: item.productName || item.Product?.name || 'Product',
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity || 1),
          image: item.Product?.imageUrl || '/images/placeholder.png'
        }));
      } else if (orderData.items && Array.isArray(orderData.items)) {
        orderItems = orderData.items.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          name: item.name || item.productName || 'Product',
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity || 1),
          image: item.image || item.Product?.imageUrl || '/images/placeholder.png'
        }));
      }
      
      console.log('Invoice Order Items:', orderItems);
      
      const formattedOrder = {
        id: orderData.id,
        orderNumber: orderData.orderNumber || orderData.id,
        date: orderData.createdAt || orderData.date,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus || 'paid',
        paymentMethod: orderData.paymentMethod || 'bank_transfer',
        shippingAddress: shippingAddressObj,
        shippingDetails: shippingDetailsObj,
        shippingMethod: orderData.shippingMethod || '',
        items: orderItems,
        total: parseFloat(orderData.grandTotal || orderData.total || 0),
        subtotal: parseFloat(orderData.totalAmount || (orderData.grandTotal - (orderData.shippingFee || 0)) || 0),
        shippingFee: parseFloat(orderData.shippingFee || 0)
      };
      
      console.log('Formatted Order for Invoice:', formattedOrder);
      
      setPrintingOrder(formattedOrder);
      setIsPrintModalOpen(true);
    } catch (error) {
      console.error("Error preparing invoice:", error);
      window.Swal.fire({
        title: 'Error',
        text: 'Failed to generate invoice. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const handleExportOrders = async () => {
    try {
      window.Swal.fire({
        title: 'Exporting Orders',
        text: 'Your orders are being exported to Excel.',
        icon: 'info',
        showConfirmButton: false,
        didOpen: () => {
          window.Swal.showLoading();
        }
      });
      
      const headers = [
        'Order ID', 
        'Customer Name', 
        'Customer Email', 
        'Date', 
        'Status', 
        'Payment Method', 
        'Payment Status', 
        'Total',
        'Items Count',
        'Tracking Number'
      ];
      
      let dataToExport = [];
      
      if (allOrders.length > 0) {
        dataToExport = allOrders;
      } else if (orders.length > 0) {
        dataToExport = orders;
        
        try {
          if (orders.length < totalCount) {
            const statuses = ['pending', 'processing', 'shipped'];
            const allOrdersData = [];
            
            for (const status of statuses) {
              const response = await orderAPI.getAllOrders({ 
                status, 
                limit: 1000 
              });
              
              if (response.data?.success) {
                allOrdersData.push(...response.data.data);
              }
            }
            
            if (allOrdersData.length > 0) {
              dataToExport = allOrdersData;
            }
          }
        } catch (fetchError) {
          console.error('Error fetching all orders for export:', fetchError);
        }
      }
      
      if (!dataToExport || dataToExport.length === 0) {
        throw new Error('No order data available for export');
      }
      
      console.log(`Exporting ${dataToExport.length} orders`);
      
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Order Management</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table, th, td {
              border: 1px solid black;
              border-collapse: collapse;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `;
      
      dataToExport.forEach(order => {
        htmlContent += '<tr>';
        htmlContent += `<td>${order.orderNumber || order.id || ''}</td>`;
        htmlContent += `<td>${order.User?.name || 'Unknown'}</td>`;
        htmlContent += `<td>${order.User?.email || ''}</td>`;
        htmlContent += `<td>${formatDate(order.createdAt)}</td>`;
        htmlContent += `<td>${order.status || ''}</td>`;
        htmlContent += `<td>${(order.paymentMethod || '').replace(/_/g, ' ')}</td>`;
        htmlContent += `<td>${order.paymentStatus || ''}</td>`;
        htmlContent += `<td>${formatPrice(order.grandTotal || 0)}</td>`;
        htmlContent += `<td>${order.OrderItems?.length || 0}</td>`;
        htmlContent += `<td>${order.trackingNumber || ''}</td>`;
        htmlContent += '</tr>';
      });
      
      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-export-${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      window.Swal.fire({
        title: 'Export Complete',
        text: 'Your orders have been exported to Excel.',
        icon: 'success',
        timer: 2000,
        confirmButtonColor: '#F0A84E',
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error exporting orders:', error);
      
      window.Swal.fire({
        title: 'Export Failed',
        text: 'There was an error exporting the orders: ' + error.message,
        icon: 'error',
        confirmButtonColor: '#F0A84E',
      });
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchOrders();
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-gray-200 text-gray-700 py-1 px-3 rounded-full font-medium">Pending</span>;
      case 'processing':
        return <span className="badge bg-yellow-100 text-yellow-700 py-1 px-3 rounded-full font-medium">Processing</span>;
      case 'shipped':
        return <span className="badge bg-blue-100 text-blue-700 py-1 px-3 rounded-full font-medium">Shipped</span>;
      case 'delivered':
        return <span className="badge bg-green-100 text-green-700 py-1 px-3 rounded-full font-medium">Delivered</span>;
      case 'cancelled':
        return <span className="badge bg-red-100 text-red-700 py-1 px-3 rounded-full font-medium">Cancelled</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-700 py-1 px-3 rounded-full font-medium">{status}</span>;
    }
  };
  
  const renderOrderCard = (order) => {
    return (
      <div key={order.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-npc-navy">Order #{order.orderNumber || order.id}</h3>
              <div className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</div>
            </div>
            <div>
              {getStatusBadge(order.status)}
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center border-t pt-3">
            <div className="flex items-center space-x-3">
              {order.User?.profileImage ? (
                <div className="flex-shrink-0 w-10 h-10">
                  <img 
                    src={order.User.profileImage}
                    alt={order.User?.name || 'Unknown'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                  <span>
                    {order.User?.name ? order.User.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-700">{order.User?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{order.User?.email || ''}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Total:</div>
              <div className="font-medium text-npc-gold">{formatPrice(order.grandTotal)}</div>
              <div className="text-xs text-gray-500 capitalize">{(order.paymentMethod || '').replace('_', ' ')}</div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
            <button 
              className="btn btn-ghost btn-sm rounded"
              onClick={() => handleViewOrder(order.id)}
              aria-label="View"
            >
              <i className="fas fa-eye text-blue-600"></i>
            </button>
            
            <button 
              className="btn btn-ghost btn-sm rounded"
              onClick={() => handleUpdateStatus(order)}
              aria-label="Update Status"
            >
              <i className="fas fa-edit text-npc-gold"></i>
            </button>
            
            <button 
              className="btn btn-ghost btn-sm rounded"
              onClick={() => handlePrintInvoice(order)}
              aria-label="Print Invoice"
            >
              <i className="fas fa-print text-gray-600"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let visiblePages = [];
    
    if (totalPages <= 7) {
      visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 3) {
        visiblePages = [1, 2, 3, 4, 5, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        visiblePages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        visiblePages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }
    
    return (
      <div className="flex justify-center items-center py-4 overflow-x-auto">
        <div className="flex items-center space-x-1">
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
          
          {visiblePages.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <button
                key={`page-${page}`}
                className={`btn btn-sm min-w-[2.5rem] ${
                  currentPage === page 
                    ? 'bg-npc-gold border-npc-gold text-white hover:bg-npc-darkGold' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          ))}
          
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex overflow-hidden">
        <Sidebar isAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">Order Management</h1>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold flex-1 sm:flex-auto"
                onClick={handleExportOrders}
              >
                <i className="fas fa-file-export mr-2"></i>
                Export
              </button>
              
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold flex-1 sm:flex-auto"
                onClick={fetchOrders}
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
            <div className="flex rounded-md bg-gray-200 p-1">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'simple' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveFilter('simple')}
              >
                <i className="fas fa-search mr-2"></i>
                Basic Search
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'advanced' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveFilter('advanced')}
              >
                <i className="fas fa-filter mr-2"></i>
                Filters
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mb-6 hidden md:block">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="form-control">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by order ID, customer, or product name..."
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-npc-gold rounded-full animate-spin"></div>
                      ) : (
                        <i className="fas fa-search text-gray-400"></i>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <select 
                  className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                  value={statusFilter}
                  onChange={handleStatusFilter}
                >
                  <option value="all">All Active Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>
              
              <div className="w-full md:w-48">
                <select 
                  className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                  value={dateFilter}
                  onChange={handleDateFilter}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="form-control flex-1">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-control flex-1">
                  <label className="label">
                    <span className="label-text">End Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end mb-2">
                  <button 
                    className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                    onClick={applyDateFilter}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500">
                {searchQuery && !loading && (
                  <span>
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found for "{searchQuery}"
                  </span>
                )}
              </div>
              <button 
                className="btn btn-ghost btn-sm text-gray-600 hover:text-white"
                onClick={clearFilters}
              >
                <i className="fas fa-undo mr-1"></i>
                Clear Filters
              </button>
            </div>
          </div>
          
          {activeFilter === 'simple' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <div className="form-control">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by order ID, customer..."
                    className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-npc-gold rounded-full animate-spin"></div>
                    ) : (
                      <i className="fas fa-search text-gray-400"></i>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {searchQuery && !loading && (
                  <span>
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found for "{searchQuery}"
                  </span>
                )}
              </div>
            </div>
          )}
          
          {activeFilter === 'advanced' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <div className="space-y-4">
                <div className="w-full">
                  <select 
                    className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={statusFilter}
                    onChange={handleStatusFilter}
                  >
                    <option value="all">All Active Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
                
                <div className="w-full">
                  <select 
                    className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={dateFilter}
                    onChange={handleDateFilter}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {dateFilter === 'custom' && (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Start Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">End Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <button 
                      className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none w-full"
                      onClick={applyDateFilter}
                    >
                      Apply Date Range
                    </button>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button 
                    className="btn btn-ghost btn-sm text-gray-600 hover:text-white"
                    onClick={clearFilters}
                  >
                    <i className="fas fa-undo mr-1"></i>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow overflow-hidden max-w-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-300 border-t-npc-gold" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-gray-600">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-box-open text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Orders Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 
                    `No orders match your search criteria "${searchQuery}".` : 
                    "No active orders match your current filter criteria."
                  }
                </p>
                <button 
                  className="btn btn-outline btn-sm text-gray-700 hover:text-white"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="block md:hidden p-4">
                  <div className="text-sm text-gray-500 mb-4">
                    Showing {orders.length} of {totalCount} orders
                  </div>
                  {orders.map(order => renderOrderCard(order))}
                </div>
                
                <div className="hidden md:block">
                  <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <table className="table min-w-full text-gray-700">
                      <thead className="text-gray-700 bg-gray-200">
                        <tr>
                          <th className="px-4 py-3" style={{ minWidth: '80px' }}>Order ID</th>
                          <th className="px-4 py-3" style={{ minWidth: '220px' }}>Customer</th>
                          <th className="px-4 py-3" style={{ minWidth: '150px' }}>Date</th>
                          <th className="px-4 py-3" style={{ minWidth: '100px' }}>Status</th>
                          <th className="px-4 py-3" style={{ minWidth: '120px' }}>Payment</th>
                          <th className="px-4 py-3" style={{ minWidth: '100px' }}>Total</th>
                          <th className="px-4 py-3" style={{ minWidth: '120px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <td className="px-4 py-3">
                              <div className="font-medium">{order.orderNumber || order.id}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                {order.User?.profileImage ? (
                                  <div className="flex-shrink-0 w-10 h-10">
                                    <img 
                                      src={order.User.profileImage}
                                      alt={order.User?.name || 'Unknown'}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                                    <span>
                                      {order.User?.name ? order.User.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{order.User?.name || 'Unknown'}</div>
                                  <div className="text-xs text-gray-500">{order.User?.email || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                            <td className="px-4 py-3">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium capitalize">{(order.paymentMethod || '').replace(/_/g, ' ')}</div>
                              <div className={`text-xs ${
                                order.paymentStatus === 'paid' ? 'text-green-600' : 
                                order.paymentStatus === 'pending' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {order.paymentStatus ? (order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)) : 'Unknown'}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium">{formatPrice(order.grandTotal)}</td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handleViewOrder(order.id)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye text-blue-600"></i>
                                </button>
                                
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handleUpdateStatus(order)}
                                  title="Update Status"
                                >
                                  <i className="fas fa-edit text-npc-gold"></i>
                                </button>
                                
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handlePrintInvoice(order)}
                                  title="Print Invoice"
                                >
                                  <i className="fas fa-print text-gray-600"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                
                {renderPagination()}
                
                
                <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} orders
                </div>
              </>
            )}
          </div>
          
          
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
            <div className="container mx-auto px-4 py-2">
              <div className="flex justify-around">
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeFilter === 'simple' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveFilter('simple')}
                >
                  <i className="fas fa-search text-lg"></i>
                  <span className="text-xs mt-1">Search</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeFilter === 'advanced' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveFilter('advanced')}
                >
                  <i className="fas fa-filter text-lg"></i>
                  <span className="text-xs mt-1">Filters</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={fetchOrders}
                >
                  <i className="fas fa-sync-alt text-lg"></i>
                  <span className="text-xs mt-1">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      {isViewModalOpen && selectedOrder && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Order Details - ${selectedOrder.orderNumber || selectedOrder.id}`}
          size="lg"
          className="max-w-full overflow-hidden"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2 text-npc-navy">Order Information</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium text-gray-800">{selectedOrder.orderNumber || selectedOrder.id}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-800">{formatDate(selectedOrder.createdAt)}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      selectedOrder.status === 'completed' ? 'text-green-600' :
                      selectedOrder.status === 'cancelled' ? 'text-red-600' :
                      selectedOrder.status === 'shipped' ? 'text-blue-600' :
                      selectedOrder.status === 'processing' ? 'text-yellow-600' :
                      'text-gray-800'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="capitalize text-gray-800">{(selectedOrder.paymentMethod || '').replace(/_/g, ' ')}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`font-medium ${
                      selectedOrder.paymentStatus === 'paid' ? 'text-green-600' :
                      selectedOrder.paymentStatus === 'refunded' ? 'text-orange-600' :
                      selectedOrder.paymentStatus === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedOrder.paymentStatus ? (selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)) : 'Unknown'}
                    </span>
                  </p>
                  {selectedOrder.trackingNumber && (
                    <p className="flex justify-between py-1">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="text-gray-800">{selectedOrder.trackingNumber}</span>
                    </p>
                  )}

                  {selectedOrder.shippingMethod && (
                    <p className="flex justify-between py-1">
                      <span className="text-gray-600">Courier:</span>
                      <span className="text-gray-800">
                        {(() => {
                          let shippingDetails = {};
                          try {
                            if (typeof selectedOrder.shippingDetails === 'string') {
                              shippingDetails = JSON.parse(selectedOrder.shippingDetails);
                            } else if (typeof selectedOrder.shippingDetails === 'object') {
                              shippingDetails = selectedOrder.shippingDetails;
                            }
                            
                            const courier = shippingDetails.courier || selectedOrder.shippingMethod.split('_')[0];
                            const service = shippingDetails.service || selectedOrder.shippingMethod.split('_')[1];
                            
                            return `${courier.toUpperCase()} - ${service.toUpperCase()}`;
                          } catch (e) {
                            return (selectedOrder.shippingMethod || '').toUpperCase().replace('_', ' ');
                          }
                        })()}
                      </span>
                    </p>
                  )}

                  {selectedOrder.notes && (
                    <p className="flex justify-between py-1">
                      <span className="text-gray-600">Notes:</span>
                      <span className="text-gray-800">{selectedOrder.notes}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-npc-navy">Customer Information</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800">{selectedOrder.User?.name || 'Unknown'}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-800">{selectedOrder.User?.email || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-800">{selectedOrder.User?.phone || 'N/A'}</span>
                  </p>
                </div>
                
                <h3 className="font-medium mb-2 mt-4 text-npc-navy">Shipping Address</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100 text-gray-800">
                  {typeof selectedOrder.shippingAddress === 'object' ? (
                    <>
                      <p>{selectedOrder.shippingAddress.fullName || selectedOrder.User?.name}</p>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      <p>
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province}, {selectedOrder.shippingAddress.postalCode}
                      </p>
                      <p>{selectedOrder.shippingAddress.phoneNumber}</p>
                    </>
                  ) : (
                    (() => {
                      try {
                        if (typeof selectedOrder.shippingAddress === 'string') {
                          const addressObj = JSON.parse(selectedOrder.shippingAddress);
                          return (
                            <>
                              <p>{addressObj.fullName || selectedOrder.User?.name}</p>
                              <p>{addressObj.address}</p>
                              <p>
                                {addressObj.city}, {addressObj.province}, {addressObj.postalCode}
                              </p>
                              <p>{addressObj.phoneNumber}</p>
                            </>
                          );
                        }
                        return <p>No address information available</p>;
                      } catch (e) {
                        return <p>{selectedOrder.shippingAddress || 'No address information available'}</p>;
                      }
                    })()
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-npc-navy">Order Items</h3>
              <div className="overflow-x-auto border border-gray-100 rounded" style={{ maxWidth: '100%' }}>
                <table className="table w-full">
                  <thead className="text-gray-700 bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-gray-700">Product</th>
                      <th className="px-4 py-3 text-gray-700">Price</th>
                      <th className="px-4 py-3 text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.OrderItems && selectedOrder.OrderItems.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                <img 
                                  src={item.Product?.imageUrl || '/images/product-placeholder.png'} 
                                  alt={item.productName} 
                                  className="bg-gray-100"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/product-placeholder.png';
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{item.productName}</div>
                              {item.productSku && (
                                <div className="text-xs text-gray-500">SKU: {item.productSku}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700">{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th colSpan="3" className="px-4 py-3 text-right text-gray-800">Subtotal</th>
                      <th className="px-4 py-3 text-gray-800">{formatPrice(selectedOrder.totalAmount)}</th>
                    </tr>
                    {selectedOrder.tax > 0 && (
                      <tr>
                        <th colSpan="3" className="px-4 py-3 text-right text-gray-800">Tax</th>
                        <th className="px-4 py-3 text-gray-800">{formatPrice(selectedOrder.tax)}</th>
                      </tr>
                    )}
                    {selectedOrder.shippingFee > 0 && (
                      <tr>
                        <th colSpan="3" className="px-4 py-3 text-right text-gray-800">Shipping</th>
                        <th className="px-4 py-3 text-gray-800">{formatPrice(selectedOrder.shippingFee)}</th>
                      </tr>
                    )}
                    <tr>
                      <th colSpan="3" className="px-4 py-3 text-right text-gray-800">Total</th>
                      <th className="px-4 py-3 text-gray-800">{formatPrice(selectedOrder.grandTotal)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button 
                className="btn bg-gray-800 hover:bg-black text-white border-none"
                onClick={() => handlePrintInvoice(selectedOrder)}
              >
                <i className="fas fa-print mr-2"></i>
                Print Invoice
              </button>
              <button 
                className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleUpdateStatus(selectedOrder);
                }}
              >
                <i className="fas fa-edit mr-2"></i>
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isUpdateStatusModalOpen && selectedOrder && (
        <Modal
          isOpen={isUpdateStatusModalOpen}
          onClose={() => setIsUpdateStatusModalOpen(false)}
          title={`Update Status - ${selectedOrder.orderNumber || selectedOrder.id}`}
        >
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Status</span>
              </label>
              <select
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {(newStatus === 'shipped') && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-800">Tracking Number <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${
                    newStatus === 'shipped' && !trackingNumber ? 'border-red-400' : ''
                  }`}
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                />
                {newStatus === 'shipped' && !trackingNumber && (
                  <label className="label">
                    <span className="label-text-alt text-red-500">Tracking number is required for shipped orders</span>
                  </label>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 mt-6">
              <button 
                className="btn btn-outline text-gray-700 hover:text-white order-last sm:order-first w-full sm:w-auto"
                onClick={() => setIsUpdateStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-white w-full sm:w-auto"
                onClick={handleStatusUpdateSubmit}
                disabled={newStatus === 'shipped' && !trackingNumber}
              >
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {isPrintModalOpen && printingOrder && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Invoice Preview"
          size="xl"
          className="max-w-full overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Order Invoice #{printingOrder.orderNumber}</h3>
              <div className="space-x-2">
                <button
                  className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                  onClick={async () => {
                    try {
                      window.Swal.fire({
                        title: 'Generating PDF',
                        text: 'Please wait...',
                        allowOutsideClick: false,
                        didOpen: () => {
                          window.Swal.showLoading();
                        }
                      });
                      
                      const blob = await pdf(
                        <InvoiceTemplate order={printingOrder} storeInfo={storeInfo} />
                      ).toBlob();
                      
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Invoice-${printingOrder.orderNumber}.pdf`;
                      link.click();
                      
                      URL.revokeObjectURL(url);
                      
                      window.Swal.fire({
                        title: 'Success',
                        text: 'Invoice has been downloaded',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        confirmButtonColor: '#F0A84E'
                      });
                    } catch (error) {
                      console.error('Error downloading PDF:', error);
                      window.Swal.fire({
                        title: 'Error',
                        text: 'Failed to download invoice',
                        icon: 'error',
                        confirmButtonColor: '#F0A84E'
                      });
                    }
                  }}
                >
                  <i className="fas fa-download mr-2"></i>
                  Download PDF
                </button>
                
                <button 
                  className="btn btn-ghost"
                  onClick={() => setIsPrintModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="flex-grow bg-gray-100 p-2 rounded-md overflow-auto" style={{ height: '75vh' }}>
              {printingOrder.items && Array.isArray(printingOrder.items) && printingOrder.items.length > 0 ? (
                <PDFViewer width="100%" height="100%" className="border-0">
                  <InvoiceTemplate order={printingOrder} storeInfo={storeInfo} />
                </PDFViewer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center p-8 bg-white rounded-lg shadow">
                    <i className="fas fa-exclamation-circle text-yellow-500 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium mb-2">No Item Data Available</h3>
                    <p className="text-gray-600 mb-4">
                      The order items data could not be loaded properly. Please try again or contact support.
                    </p>
                    <div>
                      <pre className="text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(printingOrder, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderManagement;