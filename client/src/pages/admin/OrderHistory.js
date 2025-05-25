import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/ui/Modal';
import { orderAPI } from '../../services/api';
import Swal from 'sweetalert2';
import InvoiceTemplate from '../../components/invoice/InvoiceTemplate';
import { PDFViewer, pdf } from '@react-pdf/renderer';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [error, setError] = useState(null);
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
  
  const statusOptions = [
    { value: 'all', label: 'All History' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseParams = {
        page: 1,
        limit: 100,
      };
      
      if (dateRange.startDate) {
        baseParams.startDate = dateRange.startDate;
      }
      
      if (dateRange.endDate) {
        baseParams.endDate = dateRange.endDate;
      }

      if (statusFilter === 'all') {
        try {
          const [deliveredResponse, cancelledResponse, refundedResponse] = await Promise.all([
            orderAPI.getOrderHistory({ ...baseParams, status: 'delivered' }),
            orderAPI.getOrderHistory({ ...baseParams, status: 'cancelled' }),
            orderAPI.getOrderHistory({ ...baseParams, status: 'refunded' })
          ]);
          
          let allOrders = [];
          let totalCount = 0;
          
          if (deliveredResponse.data?.success) {
            allOrders = [...allOrders, ...deliveredResponse.data.data];
            totalCount += deliveredResponse.data.count || deliveredResponse.data.pagination?.totalItems || 0;
          }
          
          if (cancelledResponse.data?.success) {
            allOrders = [...allOrders, ...cancelledResponse.data.data];
            totalCount += cancelledResponse.data.count || cancelledResponse.data.pagination?.totalItems || 0;
          }
          
          if (refundedResponse.data?.success) {
            allOrders = [...allOrders, ...refundedResponse.data.data];
            totalCount += refundedResponse.data.count || refundedResponse.data.pagination?.totalItems || 0;
          }
          
          allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setAllOrders(allOrders);
          
          let filteredOrders = allOrders;
          if (searchQuery && searchQuery.trim() !== '') {
            const searchTerm = searchQuery.trim().toLowerCase();
            filteredOrders = allOrders.filter(order => {
              const orderId = String(order.orderNumber || order.id || '').toLowerCase();
              
              const customerName = String(order.User?.name || order.customerName || '').toLowerCase();
              const customerEmail = String(order.User?.email || order.customerEmail || '').toLowerCase();
              
              const hasMatchingProduct = (order.OrderItems || order.items || []).some(item => 
                String(item.productName || item.name || '').toLowerCase().includes(searchTerm)
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
          setIsSearching(false);
          
        } catch (error) {
          console.error('Error fetching combined orders history:', error);
          setError('Error connecting to server. Please try again later.');
          setLoading(false);
          setIsSearching(false);
          setOrders([]);
        }
      } else {
        const params = {
          ...baseParams,
          status: statusFilter
        };
        
        if (searchQuery && searchQuery.trim() !== '') {
          params.search = searchQuery.trim();
        }
        
        const response = await orderAPI.getOrderHistory(params);
        
        if (response.data?.success) {
          setAllOrders(response.data.data);
          
          const totalItems = response.data.count || response.data.pagination?.totalItems || response.data.data.length;
          setTotalCount(totalItems);
          setTotalPages(response.data.pagination?.totalPages || Math.ceil(totalItems / itemsPerPage) || 1);
          
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedOrders = response.data.data.slice(startIndex, endIndex);
          
          setOrders(paginatedOrders);
        } else {
          setError('Failed to fetch orders');
          setOrders([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        
        setLoading(false);
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error connecting to server. Please try again later.');
      setLoading(false);
      setIsSearching(false);
      setOrders([]);
    }
  }, [statusFilter, dateRange, searchQuery, currentPage, itemsPerPage]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      
      if (allOrders.length > 0) {
        const searchTerm = query.trim().toLowerCase();
        
        let filteredOrders = allOrders;
        if (searchTerm !== '') {
          filteredOrders = allOrders.filter(order => {
            const orderId = String(order.orderNumber || order.id || '').toLowerCase();
            
            const customerName = String(order.User?.name || order.customerName || '').toLowerCase();
            const customerEmail = String(order.User?.email || order.customerEmail || '').toLowerCase();
            
            const hasMatchingProduct = (order.OrderItems || order.items || []).some(item => 
              String(item.productName || item.name || '').toLowerCase().includes(searchTerm)
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
  
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApplyDateFilter = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
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
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    
    if (allOrders.length > 0) {
      let filteredOrders = allOrders;
      if (searchQuery && searchQuery.trim() !== '') {
        const searchTerm = searchQuery.trim().toLowerCase();
        filteredOrders = allOrders.filter(order => {
          const orderId = String(order.orderNumber || order.id || '').toLowerCase();
          
          const customerName = String(order.User?.name || order.customerName || '').toLowerCase();
          const customerEmail = String(order.User?.email || order.customerEmail || '').toLowerCase();
          
          const hasMatchingProduct = (order.OrderItems || order.items || []).some(item => 
            String(item.productName || item.name || '').toLowerCase().includes(searchTerm)
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
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRange({
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    fetchOrders();
  };
  
  const handleExport = () => {
    try {
      window.Swal.fire({
        title: 'Exporting Orders',
        text: 'Your order history is being exported to Excel.',
        icon: 'info',
        showConfirmButton: false,
        didOpen: () => {
          window.Swal.showLoading();
        }
      });
      
      const headers = [
        'Order ID', 
        'Customer', 
        'Email', 
        'Date', 
        'Status', 
        'Items', 
        'Total'
      ];
      
      const dataToExport = allOrders.length > 0 ? allOrders : orders;
      
      if (!dataToExport || dataToExport.length === 0) {
        throw new Error('No order data available for export');
      }
      
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Order History</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table border="1">
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
        htmlContent += `<td>${order.User?.name || order.customerName || ''}</td>`;
        htmlContent += `<td>${order.User?.email || order.customerEmail || ''}</td>`;
        htmlContent += `<td>${formatDate(order.createdAt || order.date)}</td>`;
        htmlContent += `<td>${order.status || ''}</td>`;
        htmlContent += `<td>${order.OrderItems?.length || order.items?.length || 0}</td>`;
        htmlContent += `<td>${formatPrice(order.grandTotal || order.total || 0)}</td>`;
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
      link.setAttribute('download', `order-history-${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      window.Swal.fire({
        title: 'Export Complete',
        text: 'Your order history has been exported to Excel.',
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
  
  const handleViewOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderById(orderId);
      
      if (response.data?.success) {
        setSelectedOrder(response.data.data);
        setIsViewModalOpen(true);
      } else {
        window.Swal.fire({
          title: 'Error',
          text: 'Failed to fetch order details',
          icon: 'error',
          confirmButtonColor: '#F0A84E'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      window.Swal.fire({
        title: 'Error',
        text: 'Failed to connect to server',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
      setLoading(false);
    }
  };
  
  const handlePrintInvoice = (order) => {
    try {
      if (!order) return;
      
      let orderData = order;
      
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
          name: item.productName || 'Product',
          price: parseFloat(item.price || 0),
          quantity: item.quantity || 1,
          image: item.Product?.imageUrl || '/images/placeholder.png'
        }));
      } else if (orderData.items && Array.isArray(orderData.items)) {
        orderItems = orderData.items;
      }
      
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
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="badge bg-green-100 text-green-700 py-1 px-3 rounded-full font-medium">Delivered</span>;
      case 'cancelled':
        return <span className="badge bg-red-100 text-red-700 py-1 px-3 rounded-full font-medium">Cancelled</span>;
      case 'refunded':
        return <span className="badge bg-orange-100 text-orange-700 py-1 px-3 rounded-full font-medium">Refunded</span>;
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
              <div className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt || order.date)}</div>
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
                    alt={order.User?.name || order.customerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                  <span>
                    {(order.User?.name || order.customerName) ? (order.User?.name || order.customerName).charAt(0).toUpperCase() : 'C'}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-700">{order.User?.name || order.customerName}</div>
                <div className="text-xs text-gray-500">{order.User?.email || order.customerEmail}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Total:</div>
              <div className="font-medium text-npc-gold">{formatPrice(order.grandTotal || order.total)}</div>
              <div className="text-xs text-gray-500">Items: {order.OrderItems?.length || order.items?.length || 0}</div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
            <button 
              className="btn btn-ghost btn-sm rounded"
              onClick={() => handleViewOrder(order.id)}
            >
              <i className="fas fa-eye text-blue-600"></i>
            </button>
            
            <button 
              className="btn btn-ghost btn-sm rounded"
              onClick={() => handlePrintInvoice(order)}
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
      <div className="flex justify-center items-center py-4">
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
        
        <div className="flex-1 p-4 sm:p-6 mb-16 md:mb-0 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">Order History</h1>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold flex-1 sm:flex-auto"
                onClick={handleExport}
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
                      placeholder="Search by order ID, customer, or product..."
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      value={searchQuery}
                      onChange={handleSearchChange}
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
                  onChange={handleStatusChange}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Start Date</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                />
              </div>
              
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">End Date</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                  onClick={handleApplyDateFilter}
                  disabled={(dateRange.startDate && !dateRange.endDate) || (!dateRange.startDate && dateRange.endDate)}
                >
                  Apply Dates
                </button>
                
                <button 
                  className="btn btn-ghost text-gray-600 hover:text-white"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            {searchQuery && !loading && (
              <div className="mt-3 text-sm text-gray-500">
                {totalCount} result{totalCount !== 1 ? 's' : ''} found for "{searchQuery}"
              </div>
            )}
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
                    onChange={handleSearchChange}
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
                    onChange={handleStatusChange}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Date</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button 
                    className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none w-full"
                    onClick={handleApplyDateFilter}
                    disabled={(dateRange.startDate && !dateRange.endDate) || (!dateRange.startDate && dateRange.endDate)}
                  >
                    Apply Date Range
                  </button>
                  
                  <button 
                    className="btn btn-ghost btn-sm text-gray-600 hover:text-white w-full"
                    onClick={handleClearFilters}
                  >
                    Clear All Filters
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
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="text-red-500 text-xl mb-4">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
                <button 
                  className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                  onClick={fetchOrders}
                >
                  Try Again
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-history text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2 text-gray-900">No Order History Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 
                    `No orders match your search criteria "${searchQuery}".` : 
                    "There are no completed, cancelled, or refunded orders matching your filter criteria."
                  }
                </p>
                <button
                  className="btn btn-outline btn-sm text-gray-600 hover:text-white"
                  onClick={handleClearFilters}
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
                          <th className="px-4 py-3" style={{ minWidth: '60px' }}>Items</th>
                          <th className="px-4 py-3" style={{ minWidth: '120px' }}>Total</th>
                          <th className="px-4 py-3" style={{ minWidth: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <td className="px-4 py-3">{order.orderNumber || order.id}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                {order.User?.profileImage ? (
                                  <div className="flex-shrink-0 w-10 h-10">
                                    <img 
                                      src={order.User.profileImage}
                                      alt={order.User?.name || order.customerName}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                                    <span>
                                      {(order.User?.name || order.customerName) ? (order.User?.name || order.customerName).charAt(0).toUpperCase() : 'C'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{order.User?.name || order.customerName}</div>
                                  <div className="text-xs text-gray-500">{order.User?.email || order.customerEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{formatDate(order.createdAt || order.date)}</td>
                            <td className="px-4 py-3">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-4 py-3">
                              {order.OrderItems?.length || order.items?.length || 0}
                            </td>
                            <td className="px-4 py-3">{formatPrice(order.grandTotal || order.total)}</td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handleViewOrder(order.id)}
                                >
                                  <i className="fas fa-eye text-blue-600"></i>
                                </button>
                                
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handlePrintInvoice(order)}
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
                {/* <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={handleExport}
                >
                  <i className="fas fa-file-export text-lg"></i>
                  <span className="text-xs mt-1">Export</span>
                </button> */}
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
                    <span className="text-gray-800">{formatDate(selectedOrder.createdAt || selectedOrder.date)}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      selectedOrder.status === 'delivered' ? 'text-green-600' :
                      selectedOrder.status === 'cancelled' ? 'text-red-600' :
                      selectedOrder.status === 'refunded' ? 'text-orange-600' :
                      'text-gray-600'
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
                      'text-gray-600'
                    }`}>
                      {selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1) || 'Not Available'}
                    </span>
                  </p>
                  {selectedOrder.trackingNumber && (
                    <p className="flex justify-between py-1">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="text-gray-800">{selectedOrder.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-npc-navy">Customer Information</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800">{selectedOrder.User?.name || selectedOrder.customerName}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-800">{selectedOrder.User?.email || selectedOrder.customerEmail}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-800">{selectedOrder.User?.phone || selectedOrder.customerPhone}</span>
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
                    {(selectedOrder.OrderItems || selectedOrder.items || []).map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                <img 
                                  src={item.Product?.imageUrl || item.image || '/images/product-placeholder.png'} 
                                  alt={item.productName || item.name} 
                                  className="bg-gray-100"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/product-placeholder.png';
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{item.productName || item.name}</div>
                              {item.productSku && (
                                <div className="text-xs text-gray-500">SKU: {item.productSku}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700">{formatPrice(item.totalPrice || (item.price * item.quantity))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th colSpan="3" className="px-4 py-3 text-right text-gray-800">Subtotal</th>
                      <th className="px-4 py-3 text-gray-800">{formatPrice(selectedOrder.totalAmount || selectedOrder.total)}</th>
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
                      <th className="px-4 py-3 text-gray-800">{formatPrice(selectedOrder.grandTotal || selectedOrder.total)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="btn bg-gray-800 hover:bg-black text-white border-none"
                onClick={() => handlePrintInvoice(selectedOrder)}
              >
                <i className="fas fa-print mr-2"></i>
                Print Invoice
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
          showCloseButton={false}
        >
          <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-medium text-gray-600 text-center sm:text-left">
                Order Invoice #{printingOrder.orderNumber}
              </h3>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-sm sm:text-base w-full sm:w-auto"
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
                      
                      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                      
                      if (isMobile) {
                        const url = URL.createObjectURL(blob);
                        const newWindow = window.open(url, '_blank');
                        
                        if (!newWindow) {
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `Invoice-${printingOrder.orderNumber}.pdf`;
                          link.target = '_blank';
                          link.style.display = 'none';
                          document.body.appendChild(link);
                          
                          const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                          });
                          link.dispatchEvent(clickEvent);
                          
                          document.body.removeChild(link);
                        }
                        
                        setTimeout(() => {
                          URL.revokeObjectURL(url);
                        }, 3000);
                      } else {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Invoice-${printingOrder.orderNumber}.pdf`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }
                      
                      window.Swal.fire({
                        title: 'Success',
                        text: isMobile 
                          ? 'Invoice opened in new tab' 
                          : 'Invoice has been downloaded',
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
                  <i className="fas fa-download mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </button>
                
                <button 
                  className="btn btn-ghost text-gray-600 hover:text-white text-sm sm:text-base w-full sm:w-auto"
                  onClick={() => setIsPrintModalOpen(false)}
                >
                  <i className="fas fa-times mr-1 sm:mr-2"></i>
                  Close
                </button>
              </div>
            </div>
            
            <div className="flex-grow bg-gray-100 p-1 sm:p-2 rounded-md overflow-auto" style={{ height: '60vh', minHeight: '400px' }}>
              <div className="w-full h-full">
                <PDFViewer width="100%" height="100%" className="border-0 rounded">
                  <InvoiceTemplate order={printingOrder} storeInfo={storeInfo} />
                </PDFViewer>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrderHistory;