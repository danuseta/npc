import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { getSystemSettings, updateSystemSettings, getSystemLogs, clearSystemLogs } from '../../services/superadminService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const SystemSettings = () => {
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: ''
  });
  
  const [systemLogs, setSystemLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('store');
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      window.Swal.fire({
        title: 'Access Denied',
        text: 'Only Super Admin users can access this page.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      }).then(() => {
        navigate('/dashboard');
      });
    } else if (currentUser && currentUser.role === 'superadmin') {
      fetchStoreInfo();
      fetchSystemLogs();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'superadmin') {
      fetchSystemLogs();
    }
  }, [logPagination.currentPage, logFilter]);
  
  const fetchStoreInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSystemSettings();
      
      if (response && response.data && response.data.data) {
        const settings = response.data.data;
        setStoreInfo({
          storeName: settings.storeName || '',
          address: settings.address || '',
          city: settings.city || '',
          province: settings.province || '',
          postalCode: settings.postalCode || '',
          country: settings.country || ''
        });
      }
    } catch (err) {
      setError('Failed to load store information. Please try again.');
      
      window.Swal.fire({
        title: 'Error!',
        text: 'Failed to load store information. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSystemLogs = async () => {
    setLogsLoading(true);
    
    try {
      const params = {
        page: logPagination.currentPage,
        limit: logPagination.limit,
        level: logFilter !== 'all' ? logFilter : undefined
      };
      
      const response = await getSystemLogs(params);
      
      if (response && response.data) {
        setSystemLogs(response.data.logs || []);
        
        setLogPagination({
          ...logPagination,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalItems || 0
        });
      }
    } catch (err) {
      window.Swal.fire({
        title: 'Error!',
        text: 'Failed to load system logs. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLogsLoading(false);
    }
  };
  
  const handleClearLogs = () => {
    window.Swal.fire({
      title: 'Clear All Logs?',
      text: 'This action cannot be undone. All system logs will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear all logs!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await clearSystemLogs();
          
          setSystemLogs([]);
          setLogPagination({
            ...logPagination,
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
          });
          
          window.Swal.fire({
            title: 'Logs Cleared',
            text: 'All system logs have been successfully cleared.',
            icon: 'success',
            timer: 2000,
            confirmButtonColor: '#F0A84E',
            showConfirmButton: false,
          });
        } catch (err) {
          window.Swal.fire({
            title: 'Error!',
            text: 'Failed to clear system logs. Please try again.',
            icon: 'error',
            confirmButtonColor: '#F0A84E'
          });
        }
      }
    });
  };
  
  const handleStoreInfoChange = (e) => {
    const { name, value } = e.target;
    
    setStoreInfo({
      ...storeInfo,
      [name]: value
    });
  };
  
  const saveStoreInfo = async () => {
    setLoading(true);
    
    try {
      await updateSystemSettings(storeInfo);
      
      window.Swal.fire({
        title: 'Settings Saved',
        text: 'Your store information has been saved successfully.',
        icon: 'success',
        timer: 2000,
        confirmButtonColor: '#F0A84E',
        showConfirmButton: false,
      });
    } catch (err) {
      window.Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to save store information. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogPageChange = (page) => {
    setLogPagination({
      ...logPagination,
      currentPage: page
    });
  };

  const handleLogFilterChange = (e) => {
    setLogFilter(e.target.value);
    setLogPagination({
      ...logPagination,
      currentPage: 1
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const now = new Date();
      const timestamp = new Date(dateString);
      const diffInSeconds = Math.floor((now - timestamp) / 1000);
      
      if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      } else {
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
      }
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  const getLogTypeStyle = (type) => {
    if (!type) return 'text-gray-600';
    
    switch (type.toLowerCase()) {
      case 'info':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLogBackground = (type) => {
    if (!type) return 'bg-white';
    
    switch (type.toLowerCase()) {
      case 'info':
        return 'bg-blue-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-white';
    }
  };
  
  const renderPagination = () => {
    if (logPagination.totalPages <= 1) return null;
    
    let visiblePages = [];
    
    if (logPagination.totalPages <= 7) {
      visiblePages = Array.from({ length: logPagination.totalPages }, (_, i) => i + 1);
    } else {
      if (logPagination.currentPage <= 3) {
        visiblePages = [1, 2, 3, 4, 5, '...', logPagination.totalPages];
      } else if (logPagination.currentPage >= logPagination.totalPages - 2) {
        visiblePages = [1, '...', logPagination.totalPages - 4, logPagination.totalPages - 3, logPagination.totalPages - 2, logPagination.totalPages - 1, logPagination.totalPages];
      } else {
        visiblePages = [1, '...', logPagination.currentPage - 1, logPagination.currentPage, logPagination.currentPage + 1, '...', logPagination.totalPages];
      }
    }
    
    return (
      <div className="flex justify-center items-center py-4 overflow-x-auto">
        <div className="flex items-center space-x-1">
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={logPagination.currentPage === 1}
            onClick={() => handleLogPageChange(logPagination.currentPage - 1)}
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
                  logPagination.currentPage === page 
                    ? 'bg-npc-gold border-npc-gold text-white hover:bg-npc-darkGold' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleLogPageChange(page)}
              >
                {page}
              </button>
            )
          ))}
          
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={logPagination.currentPage === logPagination.totalPages}
            onClick={() => handleLogPageChange(logPagination.currentPage + 1)}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>
    );
  };
  
  const renderLogCard = (log) => {
    return (
      <div 
        key={log.id} 
        className={`p-4 mb-3 rounded-lg border ${getLogBackground(log.level)} shadow-sm`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            log.level?.toLowerCase() === 'info' ? 'bg-blue-100 text-blue-800' :
            log.level?.toLowerCase() === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            log.level?.toLowerCase() === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <i className={`fas fa-${
              log.level?.toLowerCase() === 'info' ? 'info-circle' :
              log.level?.toLowerCase() === 'warning' ? 'exclamation-triangle' :
              log.level?.toLowerCase() === 'error' ? 'times-circle' : 'circle'
            } mr-1`}></i>
            {log.level || 'Unknown'}
          </span>
          <div className="text-xs text-gray-500" title={formatDate(log.createdAt)}>
            {formatRelativeTime(log.createdAt)}
          </div>
        </div>
        <div className="text-sm text-gray-700 mb-1">
          {log.message}
        </div>
        <div className="text-xs text-gray-500">
          Source: {log.source || 'System'}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <div className="flex">
          <Sidebar isSuperAdmin={true} />
          
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex justify-center items-center h-96">
              <div className="border-4 border-gray-200 border-t-npc-gold rounded-full w-10 h-10 animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <div className="flex">
          <Sidebar isSuperAdmin={true} />
          
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col justify-center items-center h-96">
              <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
              <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                className="btn bg-npc-gold hover:bg-npc-darkGold text-white"
                onClick={fetchStoreInfo}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (currentUser && currentUser.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <i className="fas fa-lock text-red-500 text-5xl mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar isSuperAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">System Settings</h1>
            
            <button 
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto"
              onClick={saveStoreInfo}
            >
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </button>
          </div>
          
          {error && (
            <div className="alert alert-error mb-4 sm:mb-6">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{error}</span>
              <button 
                className="btn btn-sm btn-ghost ml-auto"
                onClick={() => setError(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          
          <div className="block md:hidden mb-4">
            <div className="flex rounded-md bg-gray-200 p-1">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'store' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('store')}
              >
                <i className="fas fa-store mr-2"></i>
                Store Info
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'logs' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('logs')}
              >
                <i className="fas fa-clipboard-list mr-2"></i>
                System Logs
              </button>
            </div>
          </div>
          
          <div className={`${activeTab === 'logs' ? 'hidden md:block' : ''} mb-6`}>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-medium flex items-center text-npc-navy">
                  <i className="fas fa-store mr-2 text-npc-gold"></i>
                  Store Information
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  This information will be displayed on your receipts, invoices, and other documents.
                </p>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Store Name</span>
                      </label>
                      <input
                        type="text"
                        name="storeName"
                        value={storeInfo.storeName}
                        onChange={handleStoreInfoChange}
                        className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                        placeholder="Enter your store name"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Address</span>
                      </label>
                      <textarea
                        name="address"
                        value={storeInfo.address}
                        onChange={handleStoreInfoChange}
                        className="textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                        rows="3"
                        placeholder="Enter store address"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium text-gray-700">City</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={storeInfo.city}
                          onChange={handleStoreInfoChange}
                          className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                          placeholder="City"
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium text-gray-700">Province</span>
                        </label>
                        <input
                          type="text"
                          name="province"
                          value={storeInfo.province}
                          onChange={handleStoreInfoChange}
                          className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                          placeholder="Province"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium text-gray-700">Postal Code</span>
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={storeInfo.postalCode}
                          onChange={handleStoreInfoChange}
                          className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                          placeholder="Postal code"
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium text-gray-700">Country</span>
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={storeInfo.country}
                          onChange={handleStoreInfoChange}
                          className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden mt-4 sm:mt-6">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-medium flex items-center text-npc-navy">
                  <i className="fas fa-eye mr-2 text-npc-gold"></i>
                  Preview
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  This is how your store information will appear on documents.
                </p>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="p-4 sm:p-6 border rounded-lg bg-gray-50">
                  {storeInfo.storeName ? (
                    <div>
                      <h3 className="text-lg font-bold text-center mb-2 text-gray-600">{storeInfo.storeName}</h3>
                      <div className="text-sm text-gray-600 text-center">
                        {storeInfo.address && <p>{storeInfo.address}</p>}
                        {(storeInfo.city || storeInfo.province || storeInfo.postalCode) && (
                          <p className="mt-1">
                            {storeInfo.city && `${storeInfo.city}, `}
                            {storeInfo.province && `${storeInfo.province} `}
                            {storeInfo.postalCode && storeInfo.postalCode}
                          </p>
                        )}
                        {storeInfo.country && <p className="mt-1">{storeInfo.country}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <i className="fas fa-store text-gray-300 text-4xl mb-3"></i>
                      <p>Enter your store information to see how it will appear</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`${activeTab === 'store' ? 'hidden md:block' : ''}`}>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="font-medium flex items-center text-npc-navy">
                      <i className="fas fa-clipboard-list mr-2 text-npc-gold"></i>
                      System Logs
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      View and manage system log entries.
                    </p>
                  </div>
                  <button 
                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none w-full sm:w-auto"
                    onClick={handleClearLogs}
                  >
                    <i className="fas fa-trash-alt mr-2"></i>
                    Clear All Logs
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div className="flex items-center w-full sm:w-auto">
                    <span className="text-sm text-gray-700 mr-2">Filter by:</span>
                    <select
                      className="select select-bordered select-sm bg-white text-gray-800 border-gray-300 flex-1 sm:flex-none"
                      value={logFilter}
                      onChange={handleLogFilterChange}
                    >
                      <option value="all">All Logs</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-right">
                    {logPagination.totalItems} log entries found
                  </div>
                </div>

                {logsLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="border-4 border-gray-200 border-t-npc-gold rounded-full w-8 h-8 animate-spin"></div>
                  </div>
                ) : systemLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <i className="fas fa-clipboard-list text-gray-300 text-4xl mb-3"></i>
                    <p className="text-gray-500">No system logs available</p>
                  </div>
                ) : (
                  <>
                    <div className="block lg:hidden">
                      <div className="space-y-3">
                        {systemLogs.map(log => renderLogCard(log))}
                      </div>
                      
                      {renderPagination()}
                      
                      {systemLogs.length > 0 && (
                        <div className="px-1 py-3 text-xs text-gray-500 text-center">
                          Showing {(logPagination.currentPage - 1) * logPagination.limit + 1} to {Math.min(logPagination.currentPage * logPagination.limit, logPagination.totalItems)} of {logPagination.totalItems} log entries
                        </div>
                      )}
                    </div>
                    
                    <div className="hidden lg:block overflow-x-auto border rounded-lg">
                      <table className="table w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {systemLogs.map(log => (
                            <tr key={log.id} className={`hover:bg-gray-50 ${getLogBackground(log.level)}`}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  log.level?.toLowerCase() === 'info' ? 'bg-blue-100 text-blue-800' :
                                  log.level?.toLowerCase() === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                  log.level?.toLowerCase() === 'error' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  <i className={`fas fa-${
                                    log.level?.toLowerCase() === 'info' ? 'info-circle' :
                                    log.level?.toLowerCase() === 'warning' ? 'exclamation-triangle' :
                                    log.level?.toLowerCase() === 'error' ? 'times-circle' : 'circle'
                                  } mr-1`}></i>
                                  {log.level || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-700 break-words max-w-md">
                                  {log.message}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {log.source || 'System'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500" title={formatDate(log.createdAt)}>
                                  {formatRelativeTime(log.createdAt)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {renderPagination()}

                      {systemLogs.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t text-xs text-gray-500">
                          Showing {(logPagination.currentPage - 1) * logPagination.limit + 1} to {Math.min(logPagination.currentPage * logPagination.limit, logPagination.totalItems)} of {logPagination.totalItems} log entries
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className={`${activeTab === 'logs' ? 'hidden md:flex' : 'flex'} flex-col sm:flex-row justify-end gap-3 mb-20 md:mb-0`}>
            <button 
              className="btn btn-outline text-gray-700 hover:text-white order-last sm:order-first w-full sm:w-auto"
              onClick={fetchStoreInfo}
            >
              <i className="fas fa-undo mr-2"></i>
              Reset
            </button>
            <button 
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto"
              onClick={saveStoreInfo}
            >
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </button>
          </div>
          
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
            <div className="container mx-auto px-4 py-2">
              <div className="flex justify-around">
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'store' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('store')}
                >
                  <i className="fas fa-store text-lg"></i>
                  <span className="text-xs mt-1">Store Info</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'logs' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('logs')}
                >
                  <i className="fas fa-clipboard-list text-lg"></i>
                  <span className="text-xs mt-1">System Logs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;