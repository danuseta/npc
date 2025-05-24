import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatisticsCard from '../../components/superadmin/StatisticsCard';
import { 
  getSuperadminDashboardSummary, 
  getSuperadminSalesData, 
  getTopAdmins, 
  getSystemLogs 
} from '../../services/superadminService';
import Swal from 'sweetalert2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    adminCount: 0,
    conversionRate: 0,
    systemUptime: 0
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [topAdmins, setTopAdmins] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('stats');
  const scrollPositionRef = useRef(0);
  const chartSectionRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    window.Swal = Swal;
  }, []);

  useEffect(() => {
    scrollPositionRef.current = window.scrollY;
    fetchSalesData(selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    if (!loading && scrollPositionRef.current > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'auto'
        });
      }, 0);
    }
  }, [salesData, loading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryResponse = await getSuperadminDashboardSummary();
      if (summaryResponse && summaryResponse.data) {
        const data = summaryResponse.data;
        setStats({
          totalRevenue: data.totalSales || 0,
          totalOrders: data.totalOrders || 0,
          totalCustomers: data.totalCustomers || 0,
          totalProducts: data.totalProducts || 0,
          avgOrderValue: data.avgOrderValue || 0,
          adminCount: data.adminCount || 0,
          conversionRate: data.conversionRate || 0,
          systemUptime: data.systemUptime || 99.98
        });
        if (data.recentCustomers) {
          setRecentCustomers(data.recentCustomers);
        }
        if (data.salesByCategory) {
          setSalesByCategory(data.salesByCategory);
        }
      }
      const adminsResponse = await getTopAdmins();
      if (adminsResponse && adminsResponse.data) {
        setTopAdmins(adminsResponse.data);
      }
      const logsResponse = await getSystemLogs({ limit: 5 });
      if (logsResponse && logsResponse.data) {
        setSystemLogs(logsResponse.data.logs || []);
      }
      fetchSalesData(selectedPeriod);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      window.Swal.fire({
        title: 'Error!',
        text: 'Failed to load dashboard data. Please try again.',
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async (period) => {
    try {
      if (salesData.length === 0) {
        setLoading(true);
      }
      const response = await getSuperadminSalesData(period);
      let data = [];
      if (response && response.data) {
        if (response.data.salesData) {
          data = response.data.salesData;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data) {
          data = response.data.data;
        }
      } else if (response && response.salesData) {
        data = response.salesData;
      }
      if (Array.isArray(data) && data.length > 0) {
        setSalesData(data);
        setError(null);
      } else {
        console.error('No valid sales data found in API response');
        setError('No sales data available. Please contact support if this persists.');
        setSalesData([]);
      }
    } catch (err) {
      console.error(`Error fetching ${period} sales data:`, err);
      setError(`Failed to load sales data for ${period} period: ${err.message}`);
      window.Swal.fire({
        title: 'API Error',
        text: `Could not retrieve sales data for ${period} period. Error: ${err.message}`,
        icon: 'error',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedPeriod(period);
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
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (error) {
      console.error('Error formatting date:', error);
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
      console.error('Error calculating relative time:', error);
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

  const renderAdminCard = (admin) => {
    return (
      <div key={admin.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100">
        <div className="p-4">
          <div className="flex gap-3">
            {admin.profileImage ? (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <img 
                  src={admin.profileImage}
                  alt={admin.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-npc-gold text-white flex-shrink-0 flex items-center justify-center font-bold text-xl">
                <span>{admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-npc-navy">{admin.name}</h3>
              <div className="text-xs text-gray-500 mt-1">{admin.email}</div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-700">Orders: {admin.ordersProcessed}</div>
                <div className="text-sm text-gray-700">Response: {admin.responseTime}h</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogCard = (log) => {
    return (
      <div key={log.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`text-lg ${getLogTypeStyle(log.level)}`}>
              <i className={`fas ${
                log.level?.toLowerCase() === 'info' ? 'fa-info-circle' : 
                log.level?.toLowerCase() === 'warning' ? 'fa-exclamation-triangle' : 
                log.level?.toLowerCase() === 'error' ? 'fa-times-circle' : 'fa-circle'
              }`}></i>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-700 break-words">{log.message}</div>
              <div className="text-xs text-gray-500 mt-1">{formatRelativeTime(log.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerCard = (customer) => {
    return (
      <div key={customer.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100">
        <div className="p-4">
          <div className="flex gap-3">
            {customer.profileImage ? (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <img 
                  src={customer.profileImage}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-npc-gold text-white flex-shrink-0 flex items-center justify-center font-bold text-xl">
                <span>{customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-npc-navy">{customer.name}</h3>
              <div className="text-xs text-gray-500 mt-1">
                Registered: {formatDate(customer.registeredDate || customer.createdAt)}
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-700">
                  Spent: {formatPrice(customer.totalSpent || 0)}
                </div>
                <Link 
                  to={`/admin/users/${customer.id}`} 
                  className="text-npc-gold hover:text-npc-darkGold"
                >
                  <i className="fas fa-external-link-alt"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !salesData.length) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <div className="flex">
          <Sidebar isSuperAdmin={true} />
          
          <div className="flex-1 p-4">
            <div className="flex justify-center items-center h-96">
              <div className="border-4 border-gray-200 border-t-npc-gold rounded-full w-10 h-10 animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !salesData.length) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <div className="flex">
          <Sidebar isSuperAdmin={true} />
          
          <div className="flex-1 p-4">
            <div className="flex flex-col justify-center items-center h-96">
              <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
              <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                className="btn bg-npc-gold hover:bg-npc-darkGold text-white"
                onClick={fetchDashboardData}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar isSuperAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6 mb-16 md:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-npc-navy">Super Admin Dashboard</h1>
          
          <div className="block md:hidden mb-4">
            <div className="flex rounded-md bg-gray-200 p-1">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'stats' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('stats')}
              >
                <i className="fas fa-chart-line mr-2"></i>
                Stats
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'admins' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('admins')}
              >
                <i className="fas fa-user-shield mr-2"></i>
                Admins
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
                Logs
              </button>
            </div>
          </div>
          
          <div className={`${activeTab !== 'stats' ? 'hidden md:grid' : 'grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6`}>
            <StatisticsCard
              title="Total Revenue"
              value={formatPrice(stats.totalRevenue)}
              icon="fa-dollar-sign"
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              percentChange={15.8}
              trend="up"
            />
            
            <StatisticsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon="fa-shopping-cart"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              percentChange={12.3}
              trend="up"
            />
            
            <StatisticsCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon="fa-users"
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              percentChange={8.7}
              trend="up"
            />
            
            <StatisticsCard
              title="Average Order Value"
              value={formatPrice(stats.avgOrderValue)}
              icon="fa-receipt"
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
              percentChange={3.2}
              trend="up"
            />
          </div>
          
          <div className={`${activeTab !== 'stats' ? 'hidden md:grid' : 'grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6`}>
            <StatisticsCard
              title="Products"
              value={stats.totalProducts}
              icon="fa-box"
              iconBgColor="bg-indigo-100"
              iconColor="text-indigo-600"
              percentChange={5.4}
              trend="up"
            />
            
            <StatisticsCard
              title="Admin Users"
              value={stats.adminCount}
              icon="fa-user-shield"
              iconBgColor="bg-teal-100"
              iconColor="text-teal-600"
              percentChange={0}
              trend="flat"
            />
            
            <StatisticsCard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              icon="fa-chart-line"
              iconBgColor="bg-pink-100"
              iconColor="text-pink-600"
              percentChange={1.1}
              trend="up"
            />
            
            <StatisticsCard
              title="System Uptime"
              value={`${stats.systemUptime}%`}
              icon="fa-server"
              iconBgColor="bg-emerald-100"
              iconColor="text-emerald-600"
              percentChange={0.02}
              trend="up"
            />
          </div>
          
          <div 
            ref={chartSectionRef}
            className={`${activeTab !== 'stats' ? 'hidden md:block' : 'block'} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}
            id="chart-section"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <div>
                <h2 className="text-lg font-bold text-npc-navy">Revenue Overview</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPeriod === 'weekly' && (
                    <>
                      {new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short'
                      })} - {new Date().toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </>
                  )}
                  {selectedPeriod === 'monthly' && (
                    <>
                      {new Date(new Date().setMonth(new Date().getMonth() - 5)).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })} - {new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </>
                  )}
                  {selectedPeriod === 'yearly' && (
                    <>
                      {new Date(new Date().setFullYear(new Date().getFullYear() - 4)).getFullYear()} - {new Date().getFullYear()}
                    </>
                  )}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded-md transition-colors ${selectedPeriod === 'weekly' ? 'bg-npc-gold text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => handlePeriodChange('weekly')}
                >
                  Weekly
                </button>
                <button
                  className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded-md transition-colors ${selectedPeriod === 'monthly' ? 'bg-npc-gold text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => handlePeriodChange('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`flex-1 sm:flex-none px-3 py-1 text-sm rounded-md transition-colors ${selectedPeriod === 'yearly' ? 'bg-npc-gold text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => handlePeriodChange('yearly')}
                >
                  Yearly
                </button>
              </div>
            </div>
            
            <div className="h-48 sm:h-72">
              {loading ? (
                <div className="w-full h-full flex justify-center items-center">
                  <div className="border-4 border-gray-200 border-t-npc-gold rounded-full w-10 h-10 animate-spin"></div>
                </div>
              ) : salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                        notation: 'compact',
                        compactDisplay: 'short'
                      }).format(value)}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <Tooltip 
                      formatter={(value) => [formatPrice(value), "Sales"]}
                      labelFormatter={(label) => `Period: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Bar 
                      dataKey="sales" 
                      name="Sales" 
                      fill="#F0A84E"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                      animationDuration={750}
                      animationEasing="ease-out"
                    >
                      {salesData.map((entry, index) => {
                        const isCurrentPeriod = 
                          (selectedPeriod === 'weekly' && entry.date === new Date().toLocaleDateString('en-US', { weekday: 'short' })) || 
                          (selectedPeriod === 'monthly' && entry.date === new Date().toLocaleDateString('en-US', { month: 'short' })) ||
                          (selectedPeriod === 'yearly' && entry.date === new Date().getFullYear().toString());
                        
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isCurrentPeriod ? '#E89B32' : '#F0A84E'} 
                            opacity={isCurrentPeriod ? 1 : 0.8}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col justify-center items-center">
                  <div className="text-center px-4">
                    <i className="fas fa-chart-bar text-3xl text-gray-300 mb-3"></i>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">No Data Available</h3>
                    <p className="text-gray-500 text-sm">
                      {error || `There is no revenue data available for the ${selectedPeriod} period.`}
                    </p>
                    {error && (
                      <button 
                        className="mt-4 px-4 py-2 bg-npc-gold text-white rounded-md hover:bg-npc-darkGold transition-colors"
                        onClick={() => fetchSalesData(selectedPeriod)}
                      >
                        <i className="fas fa-sync-alt mr-2"></i> Try Again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {salesData.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="text-xs text-gray-500 mb-2 sm:mb-0">
                  <span className="font-medium">Total Revenue:</span> {formatPrice(salesData.reduce((sum, item) => sum + (item.sales || 0), 0))}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Peak:</span> {formatPrice(Math.max(...salesData.map(d => d.sales || 0)))}
                </div>
              </div>
            )}
          </div>
          
          <div className={`${activeTab !== 'admins' && activeTab !== 'stats' ? 'hidden md:block' : (activeTab === 'admins' ? 'block' : 'hidden md:block')} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-npc-navy">Top Admin Performance</h2>
              <Link to="/superadmin/admins" className="text-npc-gold hover:text-npc-darkGold text-sm font-medium">
                View All
              </Link>
            </div>
            
            {topAdmins.length === 0 ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <i className="fas fa-user-shield text-gray-300 text-4xl mb-2"></i>
                  <p className="text-gray-500">No admin data available</p>
                </div>
              </div>
            ) : (
              <>
                <div className="block md:hidden">
                  {topAdmins.map(admin => renderAdminCard(admin))}
                </div>
                
                <div className="hidden md:block">
                  <div className="space-y-4">
                    {topAdmins.map(admin => (
                      <div key={admin.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-npc-navy truncate">{admin.name}</div>
                          <div className="text-xs text-gray-500 truncate">{admin.email}</div>
                          <div className="text-sm mt-1">
                            <span className="text-gray-700">
                              {admin.ordersProcessed} orders • {admin.responseTime}h avg response
                            </span>
                          </div>
                        </div>
                        <div>
                          <Link 
                            to={`/superadmin/admins/${admin.id}`}
                            className="text-npc-gold hover:text-npc-darkGold"
                          >
                            <i className="fas fa-chevron-right"></i>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className={`${activeTab !== 'logs' && activeTab !== 'stats' ? 'hidden md:block' : (activeTab === 'logs' ? 'block' : 'hidden md:block')} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-npc-navy">System Logs</h2>
              <Link to="/superadmin/settings" className="text-npc-gold hover:text-npc-darkGold text-sm font-medium">
                View All
              </Link>
            </div>
            
            {systemLogs.length === 0 ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <i className="fas fa-clipboard-list text-gray-300 text-4xl mb-2"></i>
                  <p className="text-gray-500">No system logs available</p>
                </div>
              </div>
            ) : (
              <>
                <div className="block md:hidden">
                  {systemLogs.map(log => renderLogCard(log))}
                </div>
                
                <div className="hidden md:block">
                  <div className="space-y-3">
                    {systemLogs.map(log => (
                      <div key={log.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`text-lg ${getLogTypeStyle(log.level)}`}>
                          <i className={`fas ${
                            log.level?.toLowerCase() === 'info' ? 'fa-info-circle' : 
                            log.level?.toLowerCase() === 'warning' ? 'fa-exclamation-triangle' : 
                            log.level?.toLowerCase() === 'error' ? 'fa-times-circle' : 'fa-circle'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700 break-words">{log.message}</div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(log.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className={`${activeTab !== 'stats' ? 'hidden md:block' : 'block'} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-npc-navy">Sales by Category</h2>
              <Link to="/admin/products" className="text-npc-gold hover:text-npc-darkGold text-sm font-medium">
                View Products
              </Link>
            </div>
            
            {salesByCategory.length === 0 ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <i className="fas fa-chart-pie text-gray-300 text-4xl mb-2"></i>
                  <p className="text-gray-500">No category data available</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {salesByCategory.map((item, index) => {
                  const safePercentage = Math.min(item.percentage, 100);
                  
                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{item.category}</span>
                        <span className="text-sm font-medium text-gray-700">{safePercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-npc-gold h-2 rounded-full transition-transform group-hover:bg-npc-darkGold" 
                          style={{ width: `${safePercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {formatPrice(item.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className={`${activeTab !== 'stats' ? 'hidden md:block' : 'block'} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-npc-navy">Recent Customers</h2>
              <Link to="/admin/users" className="text-npc-gold hover:text-npc-darkGold text-sm font-medium">
                View All Customers
              </Link>
            </div>
            
            {recentCustomers.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-center">
                  <i className="fas fa-users text-gray-300 text-4xl mb-2"></i>
                  <p className="text-gray-500">No recent customer data available</p>
                </div>
              </div>
            ) : (
              <>
                <div className="block md:hidden">
                  {recentCustomers.map(customer => renderCustomerCard(customer))}
                </div>
                
                <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentCustomers.map(customer => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {customer.profileImage ? (
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <img 
                                      src={customer.profileImage}
                                      alt={customer.name}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold">
                                    <span>
                                      {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                                    </span>
                                  </div>
                                )}
                                <div className="ml-3">
                                  <div className="font-medium text-gray-900">{customer.name}</div>
                                  <div className="text-xs text-gray-500 sm:hidden">
                                    {formatDate(customer.registeredDate || customer.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(customer.registeredDate || customer.createdAt)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                              {formatPrice(customer.totalSpent || 0)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm">
                              <Link 
                                to={`/admin/users/${customer.id}`} 
                                className="text-npc-gold hover:text-npc-darkGold"
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
            <div className="container mx-auto px-4 py-2">
              <div className="flex justify-around">
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'stats' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <i className="fas fa-chart-line text-lg"></i>
                  <span className="text-xs mt-1">Stats</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'admins' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('admins')}
                >
                  <i className="fas fa-user-shield text-lg"></i>
                  <span className="text-xs mt-1">Admins</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'logs' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('logs')}
                >
                  <i className="fas fa-clipboard-list text-lg"></i>
                  <span className="text-xs mt-1">Logs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;