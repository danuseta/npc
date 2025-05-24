import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/ui/Modal';
import { userAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('simple');
  
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view this page',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    window.Swal = Swal;
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: 'buyer'
      };
      
      console.log("Fetching users with params:", params);
      
      const response = await userAPI.getAllUsers(params);
      
      if (response.data?.success) {
        console.log("Users data:", response.data.data);
        setUsers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCount(response.data.pagination?.totalItems || 0);
      } else {
        throw new Error(response?.data?.message || 'Failed to load user data');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load user data. Please try again.');
      
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to load user data. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, statusFilter, searchQuery, itemsPerPage]);
  
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);
  
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 300);
    
    setSearchTimeout(timeoutId);
  };
  
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      
      const response = await userAPI.getUserById(userId);
      
      if (response.data?.success) {
        console.log("User details:", response.data.data);
        setSelectedUser(response.data.data);
        setIsViewModalOpen(true);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'Failed to fetch user details. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleStatus = async (userId) => {
    try {
      const userToUpdate = users.find(user => user.id === userId);
      
      if (!userToUpdate) return;
      
      Swal.fire({
        title: `${userToUpdate.isActive ? 'Deactivate' : 'Activate'} User?`,
        text: `Are you sure you want to ${userToUpdate.isActive ? 'deactivate' : 'activate'} ${userToUpdate.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#F0A84E',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, proceed!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await userAPI.updateUserStatus(userId, { isActive: !userToUpdate.isActive });
            
            if (response.data?.success) {
              const updatedUsers = users.map(user => 
                user.id === userId ? { ...user, isActive: !user.isActive } : user
              );
              
              setUsers(updatedUsers);
              
              Swal.fire({
                title: 'Status Updated',
                text: `User has been ${userToUpdate.isActive ? 'deactivated' : 'activated'} successfully.`,
                icon: 'success',
                timer: 2000,
                confirmButtonColor: '#F0A84E',
                showConfirmButton: false,
              });
              
              if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({
                  ...selectedUser,
                  isActive: !selectedUser.isActive
                });
              }
            } else {
              throw new Error(response?.data?.message || 'Failed to update user status');
            }
          } catch (error) {
            console.error('Error updating user status:', error);
            
            Swal.fire({
              title: 'Error!',
              text: error.response?.data?.message || 'Failed to update user status.',
              icon: 'error',
              confirmButtonColor: '#F0A84E'
            });
          }
        }
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    fetchUsers();
  };
  
  const handleExportUsers = async () => {
    try {
      Swal.fire({
        title: 'Exporting Users',
        text: 'Your users are being exported to Excel.',
        icon: 'info',
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const headers = [
        'User ID',
        'Name',
        'Email',
        'Phone',
        'Status',
        'Registration Date',
        'Last Login',
        'Total Orders',
        'Total Spent'
      ];
      
      let usersToExport = [...users];
      
      if (users.length < totalCount) {
        try {
          console.log('Fetching all users for export...');
          const response = await userAPI.getAllUsers({
            limit: 1000,
            role: 'buyer'
          });
          
          if (response.data?.success && response.data.data?.length > 0) {
            usersToExport = response.data.data;
            console.log(`Fetched ${usersToExport.length} users for export`);
          }
        } catch (fetchError) {
          console.error('Error fetching all users for export:', fetchError);
        }
      }
      
      if (!usersToExport || usersToExport.length === 0) {
        throw new Error('No user data available for export');
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
                  <x:Name>User Management</x:Name>
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
      
      usersToExport.forEach(user => {
        htmlContent += '<tr>';
        htmlContent += `<td>${user.id || ''}</td>`;
        htmlContent += `<td>${user.name || ''}</td>`;
        htmlContent += `<td>${user.email || ''}</td>`;
        htmlContent += `<td>${user.phone || ''}</td>`;
        htmlContent += `<td>${user.isActive ? 'Active' : 'Inactive'}</td>`;
        htmlContent += `<td>${formatDate(user.createdAt)}</td>`;
        htmlContent += `<td>${formatDate(user.lastLogin)}</td>`;
        htmlContent += `<td>${user.orderCount || 0}</td>`;
        htmlContent += `<td>${formatPrice(user.totalSpent || 0)}</td>`;
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
      link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Swal.fire({
        title: 'Export Complete',
        text: 'Your users have been exported to Excel.',
        icon: 'success',
        timer: 2000,
        confirmButtonColor: '#F0A84E',
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      
      Swal.fire({
        title: 'Export Failed',
        text: 'There was an error exporting the users: ' + error.message,
        icon: 'error',
        confirmButtonColor: '#F0A84E',
      });
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
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
  
  const renderUserCard = (user) => {
    return (
      <div key={user.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {user.profileImage ? (
              <div className="flex-shrink-0 w-12 h-12">
                <img 
                  src={user.profileImage}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                <span>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-medium text-npc-navy">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  {user.orderCount || 0} orders
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <div className="text-sm font-medium text-npc-gold">
              {formatPrice(user.totalSpent || 0)}
            </div>
            
            <div className="flex space-x-2">
              <button 
                className="btn btn-ghost btn-sm rounded"
                onClick={() => handleViewUser(user.id)}
                aria-label="View Details"
              >
                <i className="fas fa-eye text-blue-600"></i>
              </button>
              
              <button 
                className="btn btn-ghost btn-sm rounded"
                onClick={() => handleToggleStatus(user.id)}
                aria-label={user.isActive ? 'Deactivate User' : 'Activate User'}
              >
                <i className={`fas fa-${user.isActive ? 'ban text-red-600' : 'check-circle text-green-600'}`}></i>
              </button>
            </div>
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
  
  if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
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
        <Sidebar isAdmin={true} />
        
        <div className="flex-1 p-4 md:p-6 mb-16 md:mb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">User Management</h1>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold flex-1 sm:flex-auto"
                onClick={handleExportUsers}
              >
                <i className="fas fa-file-export mr-2"></i>
                Export
              </button>
              
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold flex-1 sm:flex-auto"
                onClick={fetchUsers}
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
                Search
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
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1">
                <div className="form-control">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email or phone..."
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
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="inactive">Inactive Users</option>
                </select>
              </div>
            </div>
            
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
                    placeholder="Search users..."
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
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found
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
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive Users</option>
                  </select>
                </div>
                
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
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-300 border-t-npc-gold" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64">
                <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  className="btn bg-npc-gold hover:bg-npc-darkGold text-white"
                  onClick={fetchUsers}
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2 text-gray-900">No Users Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 
                    `No users match your search criteria "${searchQuery}".` : 
                    "No users match your current filter criteria."
                  }
                </p>
                <button 
                  className="btn btn-outline btn-sm text-gray-600 hover:text-white"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="block md:hidden p-4">
                  <div className="text-sm text-gray-500 mb-4">
                    Showing {users.length} of {totalCount} users
                  </div>
                  {users.map(user => renderUserCard(user))}
                </div>
                
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="table w-full text-gray-700">
                      <thead className="text-gray-700 bg-gray-200">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Registered</th>
                          <th className="px-4 py-3">Orders</th>
                          <th className="px-4 py-3">Total Spent</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                {user.profileImage ? (
                                  <div className="flex-shrink-0 w-10 h-10">
                                    <img 
                                      src={user.profileImage}
                                      alt={user.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                                    <span>
                                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-800">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.phone || 'No phone'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{formatDate(user.createdAt)}</div>
                              <div className="text-xs text-gray-500">
                                Last login: {formatDate(user.lastLogin)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {user.orderCount || 0}
                            </td>
                            <td className="px-4 py-3">
                              {formatPrice(user.totalSpent || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handleViewUser(user.id)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye text-blue-600"></i>
                                </button>
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => handleToggleStatus(user.id)}
                                  title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                >
                                  <i className={`fas fa-${user.isActive ? 'ban text-red-600' : 'check-circle text-green-600'}`}></i>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} users
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
                  onClick={fetchUsers}
                >
                  <i className="fas fa-sync-alt text-lg"></i>
                  <span className="text-xs mt-1">Refresh</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={handleExportUsers}
                >
                  <i className="fas fa-file-export text-lg"></i>
                  <span className="text-xs mt-1">Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isViewModalOpen && selectedUser && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`User Details - ${selectedUser.name}`}
        >
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              {selectedUser.profileImage ? (
                <img 
                  src={selectedUser.profileImage} 
                  alt={selectedUser.name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-npc-gold text-white flex items-center justify-center text-xl font-bold border-4 border-gray-200">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2 text-npc-navy">Basic Information</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800">{selectedUser.name}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-800">{selectedUser.email}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-800">{selectedUser.phone || 'Not provided'}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-npc-navy">Address</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100 text-gray-800">
                  {selectedUser.address ? (
                    typeof selectedUser.address === 'object' ? (
                      <>
                        <p>{selectedUser.address.street || 'No street address'}</p>
                        <p>
                          {selectedUser.address.city || selectedUser.city || 'No city'}, 
                          {selectedUser.address.province || selectedUser.state || 'No province'}, 
                          {selectedUser.address.postalCode || selectedUser.zipCode || 'No postal code'}
                        </p>
                      </>
                    ) : (
                      <p>{selectedUser.address}</p>
                    )
                  ) : (
                    <p className="text-gray-500">No address information</p>
                  )}
                </div>
                
                <h3 className="font-medium mb-2 mt-4 text-npc-navy">Account Information</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Registered:</span>
                    <span className="text-gray-800">{formatDate(selectedUser.createdAt)}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="text-gray-800">{formatDate(selectedUser.lastLogin)}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Total Orders:</span>
                    <span className="text-gray-800">{selectedUser.orderCount || 0}</span>
                  </p>
                  <p className="flex justify-between py-1">
                    <span className="text-gray-600">Total Spent:</span>
                    <span className="font-medium text-gray-800">{formatPrice(selectedUser.totalSpent || 0)}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className={`btn ${
                  selectedUser.isActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-none' 
                    : 'bg-green-600 hover:bg-green-700 text-white border-none'
                }`}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleToggleStatus(selectedUser.id);
                }}
              >
                <i className={`fas fa-${selectedUser.isActive ? 'ban' : 'check-circle'} mr-2`}></i>
                {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;