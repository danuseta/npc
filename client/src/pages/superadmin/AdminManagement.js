import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/ui/Modal';
import { superAdminAPI } from '../../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [adminActivities, setAdminActivities] = useState({});
  const [currentActivitiesAdmin, setCurrentActivitiesAdmin] = useState(null);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeFilter, setActiveFilter] = useState('simple');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

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
      fetchAdmins();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'superadmin') {
      fetchAdmins();
    }
  }, [currentPage, statusFilter, searchQuery, currentUser]);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    setIsSearching(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        search: searchQuery || undefined
      };

      const response = await superAdminAPI.getAllAdmins(params);

      if (response && response.data && response.data.success) {
        setAdmins(response.data.data.admins || []);
        setTotalPages(response.data.data.totalPages || 1);
        setTotalCount(response.data.data.totalItems || 0);
      } else {
        throw new Error(response?.data?.message || 'Failed to load administrator data');
      }
    } catch (error) {
      setError('Failed to load administrator data. Please try again.');

      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        window.Swal.fire({
          title: 'Access Denied',
          text: 'You do not have permission to access this resource.',
          icon: 'error',
          confirmButtonColor: '#F0A84E'
        }).then(() => {
          navigate('/dashboard');
        });
      } else {
        window.Swal.fire({
          title: 'Error!',
          text: error.response?.data?.message || 'Failed to load administrator data. Please try again.',
          icon: 'error',
          confirmButtonColor: '#F0A84E'
        });
      }
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const fetchAdminActivities = async (adminId) => {
    if (adminActivities[adminId]) {
      return;
    }

    try {
      const response = await superAdminAPI.getAdminActivities(adminId);

      if (response && response.data && response.data.success) {
        setAdminActivities(prev => ({
          ...prev,
          [adminId]: response.data.data.activities || []
        }));
      } else {
        setAdminActivities(prev => ({
          ...prev,
          [adminId]: []
        }));
      }
    } catch (error) {
      setAdminActivities(prev => ({
        ...prev,
        [adminId]: []
      }));
    }
  };

  const toggleRowExpansion = async (adminId) => {
    if (expandedRows[adminId]) {
      setExpandedRows(prev => ({
        ...prev,
        [adminId]: !prev[adminId]
      }));
      return;
    }

    try {
      await fetchAdminActivities(adminId);

      setExpandedRows(prev => ({
        ...prev,
        [adminId]: !prev[adminId]
      }));
    } catch (error) {
      window.Swal.fire({
        title: 'Error!',
        text: 'Failed to load admin details. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    }
  };

  const handleViewActivities = async (admin, e) => {
    if (e) e.stopPropagation();

    try {
      if (!adminActivities[admin.id]) {
        await fetchAdminActivities(admin.id);
      }

      setCurrentActivitiesAdmin(admin);
      setIsActivitiesModalOpen(true);
    } catch (error) {
      window.Swal.fire({
        title: 'Error!',
        text: 'Failed to load activity data. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
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
      fetchAdmins();
    }, 300);

    setSearchTimeout(timeoutId);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleEditAdmin = (admin, e) => {
    if (e) e.stopPropagation();

    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleCreateAdmin = () => {
    setSelectedAdmin(null);
    setIsCreateModalOpen(true);
  };

  const handleAdminCreateSubmit = async (formData) => {
    try {
      const response = await superAdminAPI.createAdmin(formData);

      if (response && response.data && response.data.success) {
        setIsCreateModalOpen(false);

        window.Swal.fire({
          title: 'Admin Created Successfully',
          text: `Admin ${formData.name} has been created.`,
          icon: 'success',
          timer: 2000,
          confirmButtonColor: '#F0A84E',
          showConfirmButton: false,
        });

        fetchAdmins();
      } else {
        window.Swal.fire({
          title: 'Error!',
          text: response?.data?.message || 'Failed to create administrator.',
          icon: 'error',
          confirmButtonColor: '#F0A84E'
        });
      }
    } catch (error) {
      window.Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to create administrator.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    }
  };

  const handleAdminUpdateSubmit = async (formData) => {
    if (!selectedAdmin) {
      return;
    }

    try {
      const response = await superAdminAPI.updateAdmin(selectedAdmin.id, formData);

      if (response && response.data && response.data.success) {
        setIsEditModalOpen(false);

        window.Swal.fire({
          title: 'Admin Updated Successfully',
          text: `Admin ${formData.name} has been updated.`,
          icon: 'success',
          timer: 2000,
          confirmButtonColor: '#F0A84E',
          showConfirmButton: false,
        });

        fetchAdmins();
      } else {
        window.Swal.fire({
          title: 'Error!',
          text: response?.data?.message || 'Failed to update administrator.',
          icon: 'error',
          confirmButtonColor: '#F0A84E'
        });
      }
    } catch (error) {
      window.Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update administrator.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    }
  };

  const handleToggleStatus = (adminId, e) => {
    if (e) e.stopPropagation();

    const adminToUpdate = admins.find(admin => admin.id === adminId);
    if (!adminToUpdate) {
      return;
    }

    window.Swal.fire({
      title: `${adminToUpdate.isActive ? 'Deactivate' : 'Activate'} Admin?`,
      text: `Are you sure you want to ${adminToUpdate.isActive ? 'deactivate' : 'activate'} ${adminToUpdate.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F0A84E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, proceed!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const newStatus = adminToUpdate.isActive ? 'inactive' : 'active';

          const response = await superAdminAPI.updateAdminStatus(adminId, { status: newStatus });

          if (response && response.data && response.data.success) {
            window.Swal.fire({
              title: 'Status Updated',
              text: `Admin has been successfully ${adminToUpdate.isActive ? 'deactivated' : 'activated'}.`,
              icon: 'success',
              timer: 2000,
              confirmButtonColor: '#F0A84E',
              showConfirmButton: false,
            });

            fetchAdmins();
          } else {
            window.Swal.fire({
              title: 'Error!',
              text: response?.data?.message || 'Failed to update administrator status.',
              icon: 'error',
              confirmButtonColor: '#F0A84E'
            });
          }
        } catch (error) {
          window.Swal.fire({
            title: 'Error!',
            text: error.response?.data?.message || 'Failed to update administrator status.',
            icon: 'error',
            confirmButtonColor: '#F0A84E'
          });
        }
      }
    });
  };

  const handleDeleteAdmin = (adminId, e) => {
    if (e) e.stopPropagation();

    const adminToDelete = admins.find(admin => admin.id === adminId);
    if (!adminToDelete) {
      return;
    }

    window.Swal.fire({
      title: 'Delete Admin?',
      text: `Are you sure you want to delete ${adminToDelete.name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await superAdminAPI.deleteAdmin(adminId);

          if (response && response.data && response.data.success) {
            window.Swal.fire({
              title: 'Admin Deleted',
              text: 'Administrator has been successfully deleted.',
              icon: 'success',
              timer: 2000,
              confirmButtonColor: '#F0A84E',
              showConfirmButton: false,
            });

            fetchAdmins();
          } else {
            window.Swal.fire({
              title: 'Error!',
              text: response?.data?.message || 'Failed to delete administrator.',
              icon: 'error',
              confirmButtonColor: '#F0A84E'
            });
          }
        } catch (error) {
          window.Swal.fire({
            title: 'Error!',
            text: error.response?.data?.message || 'Failed to delete administrator.',
            icon: 'error',
            confirmButtonColor: '#F0A84E'
          });
        }
      }
    });
  };

  const handleExportAdmins = async () => {
    try {
      Swal.fire({
        title: 'Exporting Admins',
        text: 'Your admin data is being exported to Excel.',
        icon: 'info',
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const headers = [
        'Admin ID',
        'Name',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Registration Date',
        'Last Login',
        'Orders Processed',
        'Response Time'
      ];

      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Admin Management</x:Name>
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

      admins.forEach(admin => {
        htmlContent += '<tr>';
        htmlContent += `<td>${admin.id || ''}</td>`;
        htmlContent += `<td>${admin.name || ''}</td>`;
        htmlContent += `<td>${admin.email || ''}</td>`;
        htmlContent += `<td>${admin.phone || ''}</td>`;
        htmlContent += `<td>${admin.role || ''}</td>`;
        htmlContent += `<td>${admin.isActive ? 'Active' : 'Inactive'}</td>`;
        htmlContent += `<td>${formatDate(admin.createdAt)}</td>`;
        htmlContent += `<td>${formatDate(admin.lastLogin)}</td>`;
        htmlContent += `<td>${admin.ordersProcessed || 0}</td>`;
        htmlContent += `<td>${admin.responseTime || 0} hours</td>`;
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
      link.setAttribute('download', `admins-export-${new Date().toISOString().slice(0, 10)}.xls`);
      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        title: 'Export Complete',
        text: 'Your admin data has been exported to Excel.',
        icon: 'success',
        timer: 2000,
        confirmButtonColor: '#F0A84E',
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        title: 'Export Failed',
        text: 'There was an error exporting the admin data: ' + error.message,
        icon: 'error',
        confirmButtonColor: '#F0A84E',
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    fetchAdmins();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

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
            onClick={() => setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
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

  const renderAdminCard = (admin) => {
    return (
      <div key={admin.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {admin.profileImage ? (
                <img 
                  src={admin.profileImage}
                  alt={admin.name}
                  className="w-12 h-12 rounded-full object-cover mr-3 border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold mr-3">
                  {admin.name ? admin.name[0].toUpperCase() : 'A'}
                </div>
              )}
              <div>
                <div className="font-bold text-gray-800">{admin.name}</div>
                <div className="text-sm text-gray-500">{admin.email}</div>
                <div className="text-xs text-gray-500 mt-1">{admin.phone || 'No phone'}</div>
              </div>
            </div>
            <div>
              <span className={`badge ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {admin.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 my-3 text-sm">
            <div className="text-gray-600">
              <span className="font-medium">Role:</span> {admin.role}
            </div>
            <div className="text-gray-600">
              <span className="font-medium">Since:</span> {formatDate(admin.createdAt)}
            </div>
            <div className="text-gray-600">
              <span className="font-medium">Orders:</span> {admin.ordersProcessed || 0}
            </div>
            <div className="text-gray-600">
              <span className="font-medium">Response:</span> {admin.responseTime || '0'}h avg
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <button 
              className="btn btn-sm bg-npc-gold hover:bg-npc-darkGold text-white"
              onClick={(e) => handleEditAdmin(admin, e)}
            >
              <i className="fas fa-edit mr-1"></i>
              Edit
            </button>
            
            <div className="flex space-x-2">
              <button 
                className="btn btn-sm btn-ghost"
                onClick={(e) => handleViewActivities(admin, e)}
                aria-label="View Activities"
              >
                <i className="fas fa-history text-blue-600"></i>
              </button>
              <button 
                className="btn btn-sm btn-ghost"
                onClick={(e) => handleToggleStatus(admin.id, e)}
                aria-label={admin.isActive ? 'Deactivate Admin' : 'Activate Admin'}
              >
                <i className={`fas fa-${admin.isActive ? 'ban text-red-600' : 'check-circle text-green-600'}`}></i>
              </button>
              <button 
                className="btn btn-sm btn-ghost"
                onClick={(e) => handleDeleteAdmin(admin.id, e)}
                aria-label="Delete Admin"
              >
                <i className="fas fa-trash text-red-600"></i>
              </button>
            </div>
          </div>
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
              <div className="flex flex-col items-center">
                <div className="border-4 border-gray-200 border-t-npc-gold rounded-full w-10 h-10 animate-spin"></div>
                <p className="mt-3 text-gray-600">Loading admins...</p>
              </div>
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
                onClick={() => {
                  fetchAdmins();
                }}
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
        
        <div className="flex-1 p-4 md:p-6 mb-16 md:mb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">Admin Management</h1>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none flex-1 sm:flex-auto"
                onClick={handleCreateAdmin}
              >
                <i className="fas fa-plus mr-2"></i>
                Add New Admin
              </button>
              
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold flex-1 sm:flex-auto"
                onClick={handleExportAdmins}
              >
                <i className="fas fa-file-export mr-2"></i>
                Export
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
                  <option value="all">All Admins</option>
                  <option value="active">Active Admins</option>
                  <option value="inactive">Inactive Admins</option>
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
                    placeholder="Search admins..."
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
                    <option value="all">All Admins</option>
                    <option value="active">Active Admins</option>
                    <option value="inactive">Inactive Admins</option>
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
            {admins.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-user-shield text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Admins Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 
                    `No admins match your search criteria "${searchQuery}".` : 
                    "No admins match your current filter criteria."
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
                <div className="block lg:hidden p-4">
                  <div className="text-sm text-gray-500 mb-4">
                    Showing {admins.length} of {totalCount} admins
                  </div>
                  {admins.map(admin => renderAdminCard(admin))}
                  
                  {renderPagination()}
                  
                  {admins.length > 0 && (
                    <div className="px-1 py-3 text-xs text-gray-500 text-center">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} admins
                    </div>
                  )}
                </div>
                
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <table className="table w-full text-gray-700">
                      <thead className="text-gray-700 bg-gray-200">
                        <tr>
                          <th className="px-4 py-3">Admin</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Performance</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map(admin => (
                          <React.Fragment key={admin.id}>
                            <tr 
                              className={`hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${expandedRows[admin.id] ? 'bg-gray-50' : ''}`}
                              onClick={() => toggleRowExpansion(admin.id)}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  {admin.profileImage ? (
                                    <div className="flex-shrink-0 w-10 h-10">
                                      <img 
                                        src={admin.profileImage}
                                        alt={admin.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                                      <span>
                                        {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-gray-800">{admin.name}</div>
                                    <div className="text-sm text-gray-500">{admin.email}</div>
                                    <div className="text-xs text-gray-500">{admin.phone || 'No phone'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-700">{admin.role}</div>
                                <div className="text-xs text-gray-500">
                                  Since: {formatDate(admin.createdAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-700">
                                  <span className="font-medium">{admin.ordersProcessed || 0}</span> orders processed
                                </div>
                                <div className="text-sm text-gray-500">
                                  {admin.responseTime || '0'}h avg response
                                </div>
                                <div className="text-xs text-gray-500">
                                  Last login: {formatDate(admin.lastLogin)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`badge ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {admin.isActive ? 'Active' : 'Inactive'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex space-x-2">
                                  <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleViewActivities(admin, e)}
                                    title="View Activities"
                                  >
                                    <i className="fas fa-history text-blue-600"></i>
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleEditAdmin(admin, e)}
                                    title="Edit Admin"
                                  >
                                    <i className="fas fa-edit text-npc-gold"></i>
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleToggleStatus(admin.id, e)}
                                    title={admin.isActive ? 'Deactivate Admin' : 'Activate Admin'}
                                  >
                                    <i className={`fas fa-${admin.isActive ? 'ban text-red-600' : 'check-circle text-green-600'}`}></i>
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleDeleteAdmin(admin.id, e)}
                                    title="Delete Admin"
                                  >
                                    <i className="fas fa-trash text-red-600"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {expandedRows[admin.id] && (
                              <tr className="bg-gray-50">
                                <td colSpan="5" className="p-0">
                                  <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="border border-base-300 rounded-lg overflow-hidden">
                                        <div className="p-3 bg-gray-100">
                                          <div className="font-medium flex items-center">
                                            <i className="fas fa-user-circle mr-2 text-npc-gold"></i> 
                                            Basic Information
                                          </div>
                                        </div>
                                        <div className="p-3 bg-white">
                                          <div className="space-y-2">
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Name:</span>
                                              <span className="font-medium text-gray-800">{admin.name}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Email:</span>
                                              <span className="text-gray-800">{admin.email}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Phone:</span>
                                              <span className="text-gray-800">{admin.phone || 'Not provided'}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Role:</span>
                                              <span className="text-gray-800">{admin.role}</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                              <span className="text-gray-600">Status:</span>
                                              <span className={`font-medium ${admin.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="border border-base-300 rounded-lg overflow-hidden">
                                        <div className="p-3 bg-gray-100">
                                          <div className="font-medium flex items-center">
                                            <i className="fas fa-id-card mr-2 text-npc-gold"></i>
                                            Account Information
                                          </div>
                                        </div>
                                        <div className="p-3 bg-white">
                                          <div className="space-y-2">
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Registered on:</span>
                                              <span className="text-gray-800">{formatDate(admin.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Last login:</span>
                                              <span className="text-gray-800">{formatDate(admin.lastLogin)}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">IP Address:</span>
                                              <span className="text-gray-800">{admin.lastIp || 'Not available'}</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                              <span className="text-gray-600">Last seen:</span>
                                              <span className="text-gray-800">{formatRelativeTime(admin.lastLogin)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="border border-base-300 rounded-lg overflow-hidden">
                                        <div className="p-3 bg-gray-100">
                                          <div className="font-medium flex items-center">
                                            <i className="fas fa-chart-line mr-2 text-npc-gold"></i>
                                            Performance Metrics
                                          </div>
                                        </div>
                                        <div className="p-3 bg-white">
                                          <div className="space-y-2">
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Orders Processed:</span>
                                              <span className="font-medium text-gray-800">{admin.ordersProcessed || 0}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Average Response:</span>
                                              <span className="font-medium text-gray-800">{admin.responseTime || 0} hours</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                              <span className="text-gray-600">Completion Rate:</span>
                                              <span className="font-medium text-gray-800">{admin.completionRate || '95'}%</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                              <span className="text-gray-600">Customer Rating:</span>
                                              <span className="font-medium text-gray-800">{admin.rating || '4.8'}/5</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-end mt-4 space-x-3">
                                      <button 
                                        className="btn btn-outline btn-sm text-gray-700 hover:text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditAdmin(admin, e);
                                        }}
                                      >
                                        <i className="fas fa-edit mr-2"></i>
                                        Edit
                                      </button>
                                      <button 
                                        className={`btn btn-sm ${admin.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white border-none`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleStatus(admin.id, e);
                                        }}
                                      >
                                        <i className={`fas fa-${admin.isActive ? 'ban' : 'check-circle'} mr-2`}></i>
                                        {admin.isActive ? 'Deactivate' : 'Activate'}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {renderPagination()}
                  
                  {admins.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} admins
                    </div>
                  )}
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
                  onClick={fetchAdmins}
                >
                  <i className="fas fa-sync-alt text-lg"></i>
                  <span className="text-xs mt-1">Refresh</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={handleCreateAdmin}
                >
                  <i className="fas fa-plus text-lg"></i>
                  <span className="text-xs mt-1">Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Add New Admin"
        >
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter admin name"
                id="name"
                name="name"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter admin email"
                id="email"
                name="email"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter password"
                id="password"
                name="password"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Phone</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter phone number"
                id="phone"
                name="phone"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Role</span>
              </label>
              <select
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300"
                id="role"
                name="role"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 mt-6">
              <button 
                className="btn btn-outline text-gray-700 hover:text-white order-last sm:order-first w-full sm:w-auto"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-white w-full sm:w-auto"
                onClick={() => handleAdminCreateSubmit({
                  name: document.getElementById('name').value,
                  email: document.getElementById('email').value,
                  password: document.getElementById('password').value,
                  phone: document.getElementById('phone').value,
                  role: document.getElementById('role').value
                })}
              >
                Create Admin
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {isEditModalOpen && selectedAdmin && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Admin - ${selectedAdmin.name}`}
        >
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter admin name"
                id="edit-name"
                name="name"
                defaultValue={selectedAdmin.name}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter admin email"
                id="edit-email"
                name="email"
                defaultValue={selectedAdmin.email}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Phone</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-white text-gray-800 border-gray-300"
                placeholder="Enter phone number"
                id="edit-phone"
                name="phone"
                defaultValue={selectedAdmin.phone}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Role</span>
              </label>
              <select
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300"
                id="edit-role"
                name="role"
                defaultValue={selectedAdmin.role}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-800">Status</span>
              </label>
              <select
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300"
                id="edit-status"
                name="status"
                defaultValue={selectedAdmin.isActive ? 'active' : 'inactive'}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 mt-6">
              <button 
                className="btn btn-outline text-gray-700 hover:text-white order-last sm:order-first w-full sm:w-auto"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-white w-full sm:w-auto"
                onClick={() => handleAdminUpdateSubmit({
                  name: document.getElementById('edit-name').value,
                  email: document.getElementById('edit-email').value,
                  phone: document.getElementById('edit-phone').value,
                  role: document.getElementById('edit-role').value,
                  isActive: document.getElementById('edit-status').value === 'active'
                })}
              >
                Update Admin
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {isActivitiesModalOpen && currentActivitiesAdmin && (
        <Modal
          isOpen={isActivitiesModalOpen}
          onClose={() => setIsActivitiesModalOpen(false)}
          title={`Recent Activities - ${currentActivitiesAdmin.name}`}
        >
          <div className="mb-4">
            <div className="flex items-center mb-4">
              {currentActivitiesAdmin.profileImage ? (
                <div className="flex-shrink-0 w-12 h-12 mr-3">
                  <img 
                    src={currentActivitiesAdmin.profileImage}
                    alt={currentActivitiesAdmin.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold mr-3">
                  <span>
                    {currentActivitiesAdmin.name ? currentActivitiesAdmin.name.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-800">{currentActivitiesAdmin.name}</h3>
                <p className="text-sm text-gray-500">{currentActivitiesAdmin.email}</p>
              </div>
            </div>
            
            <div className="divider"></div>
            
            {adminActivities[currentActivitiesAdmin.id] && adminActivities[currentActivitiesAdmin.id].length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-2">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="text-gray-600">Activity</th>
                      <th className="text-gray-600">Details</th>
                      <th className="text-gray-600">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminActivities[currentActivitiesAdmin.id].map(activity => (
                      <tr key={activity.id} className="hover">
                        <td>
                          <div className="font-medium text-gray-700">{activity.action}</div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-600">{activity.details}</div>
                        </td>
                        <td>
                          <div className="text-xs text-gray-500">{formatRelativeTime(activity.createdAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="text-gray-400 text-5xl mb-3">
                  <i className="fas fa-history"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">No Activities Found</h3>
                <p className="text-gray-500">This admin has no recorded activities yet.</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white w-full sm:w-auto"
              onClick={() => setIsActivitiesModalOpen(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminManagement;