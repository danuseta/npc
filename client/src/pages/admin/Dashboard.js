import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatisticsCard from '../../components/superadmin/StatisticsCard';
import { orderAPI, productAPI, userAPI } from '../../services/api';
import Swal from 'sweetalert2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stats'); 
  
  const scrollPositionRef = useRef(0);
  const chartSectionRef = useRef(null);
  
  useEffect(() => {
    window.Swal = Swal;
    fetchDashboardData();
  }, []);
  
  useEffect(() => {
    scrollPositionRef.current = window.scrollY;
    
    if (!loading) {
      fetchSalesData(selectedPeriod);
    }
  }, [selectedPeriod, loading]);
  
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
      try {
        const userStatsResponse = await userAPI.getUserStats();
        if (userStatsResponse?.data?.success) {
          const userStats = userStatsResponse.data.data;
          console.log("User stats:", userStats);
          setStats(prevStats => ({
            ...prevStats,
            totalCustomers: userStats.buyerCount || 0
          }));
        }
      } catch (err) {
        console.log("Error getting user stats:", err);
      }
      
      const orderStatsResponse = await orderAPI.getOrderStats();
      if (orderStatsResponse?.data?.success) {
        const orderStats = orderStatsResponse.data.data;
        setStats(prevStats => ({
          ...prevStats,
          totalSales: orderStats.totalSales || 0,
          totalOrders: orderStats.totalOrders || 0
        }));
      }
      
      try {
        const productStatsResponse = await productAPI.getProductStats();
        if (productStatsResponse?.data?.success) {
          const productStats = productStatsResponse.data.data;
          setStats(prevStats => ({
            ...prevStats,
            totalProducts: productStats.totalProducts || 0
          }));
        }
      } catch (err) {
        try {
          const productsResponse = await productAPI.getAllProducts({ limit: 1 });
          if (productsResponse?.data?.count) {
            setStats(prevStats => ({
              ...prevStats,
              totalProducts: productsResponse.data.count
            }));
          }
        } catch (innerErr) {
          console.log("Error getting product count:", innerErr);
        }
      }
      
      const ordersResponse = await orderAPI.getRecentOrders(5);
      if (ordersResponse?.data?.success) {
        setRecentOrders(ordersResponse.data.orders || []);
      }
      
      try {
        const popularResponse = await productAPI.getPopularProducts({ limit: 5 });
        console.log("Popular products response:", popularResponse);
        
        if (popularResponse?.data?.data) {
          setTopProducts(popularResponse.data.data);
        } else if (popularResponse?.data) {
          setTopProducts(popularResponse.data);
        }
      } catch (err) {
        console.log("Error fetching popular products, trying top products instead");
        
        try {
          const topResponse = await productAPI.getTopProducts(5);
          if (topResponse?.data?.success) {
            if (topResponse.data.products) {
              setTopProducts(topResponse.data.products);
            } else if (topResponse.data.data) {
              setTopProducts(topResponse.data.data);
            }
          }
        } catch (topErr) {
          console.log("Error getting top products:", topErr);
        }
      }
      
      await fetchSalesData(selectedPeriod);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError("Failed to load dashboard data. Please check your connection and try again.");
      
      Swal.fire({
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

      const response = await orderAPI.getSalesData(period);
      
      if (response?.data?.success) {
        setSalesData(response.data.salesData || []);
      } else {
        console.warn('No sales data available or unexpected response format');
        setSalesData([]);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setSalesData([]);
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
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-gray-200 text-gray-700">Pending</span>;
      case 'processing':
        return <span className="badge bg-yellow-100 text-yellow-700">Processing</span>;
      case 'shipped':
        return <span className="badge bg-blue-100 text-blue-700">Shipped</span>;
      case 'delivered':
        return <span className="badge bg-green-100 text-green-700">Delivered</span>;
      case 'cancelled':
        return <span className="badge bg-red-100 text-red-700">Cancelled</span>;
      case 'refunded':
        return <span className="badge bg-orange-100 text-orange-700">Refunded</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-700">{status}</span>;
    }
  };
  
  const renderOrderCard = (order) => {
    return (
      <div key={order.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-npc-navy">Order #{order.orderNumber || order.id}</h3>
              <div className="text-xs text-gray-500 mt-1">{formatDate(order.date || order.createdAt)}</div>
              <div className="text-sm text-gray-700 mt-1">{order.customerName || order.User?.name || 'Unknown'}</div>
            </div>
            <div>
              {getStatusBadge(order.status)}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t flex justify-between">
            <div className="text-sm text-gray-700">
              Items: {order.OrderItems?.length || order.items?.length || 0}
            </div>
            <div className="font-medium text-npc-gold">
              {formatPrice(order.grandTotal || order.total || 0)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderProductCard = (product) => {
    return (
      <div key={product.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100">
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img 
                src={product.image || product.imageUrl || '/images/product-placeholder.png'} 
                alt={product.name} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/product-placeholder.png';
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-npc-navy">{product.name}</h3>
              <div className="text-sm text-gray-500 mt-1">Stock: {product.stock || 0}</div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-700">Sold: {product.sold || product.totalSold || 0}</div>
                <div className="font-medium text-npc-gold">{formatPrice(product.price || 0)}</div>
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
          <Sidebar isAdmin={true} />
          
          <div className="flex-1 p-4 sm:p-6">
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
          <Sidebar isAdmin={true} />
          
          <div className="flex-1 p-4 sm:p-6">
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
        <Sidebar isAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6 mb-16 md:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-npc-navy">Admin Dashboard</h1>
          
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
                  activeTab === 'orders' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                Orders
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'products' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('products')}
              >
                <i className="fas fa-box mr-2"></i>
                Products
              </button>
            </div>
          </div>
          
          <div className={`${activeTab !== 'stats' ? 'hidden md:grid' : 'grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6`}>
            <StatisticsCard
              title="Total Sales"
              value={formatPrice(stats.totalSales)}
              icon="fa-dollar-sign"
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              percentChange={12.5}
              trend="up"
            />
            
            <StatisticsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon="fa-shopping-cart"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              percentChange={8.2}
              trend="up"
            />
            
            <StatisticsCard
              title="Total Products"
              value={stats.totalProducts}
              icon="fa-box"
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              percentChange={3.1}
              trend="up"
            />
            
            <StatisticsCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon="fa-users"
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
              percentChange={5.7}
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
                <h2 className="text-lg font-bold text-npc-navy">Sales Overview</h2>
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
                      There is no sales data available for the {selectedPeriod} period.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {salesData.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="text-xs text-gray-500 mb-2 sm:mb-0">
                  <span className="font-medium">Total Sales:</span> {formatPrice(salesData.reduce((sum, item) => sum + (item.sales || 0), 0))}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Peak:</span> {formatPrice(Math.max(...salesData.map(d => d.sales || 0)))}
                </div>
              </div>
            )}
          </div>
          
          <div className={`${activeTab !== 'orders' && activeTab !== 'stats' ? 'hidden md:block' : (activeTab === 'orders' ? 'block' : 'hidden md:block')} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-npc-navy">Recent Orders</h2>
              <Link to="/admin/orders" className="text-npc-gold hover:text-npc-darkGold text-sm font-medium">
                View All
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <>
                <div className="block md:hidden">
                  {recentOrders.map(order => renderOrderCard(order))}
                </div>
                
                <div className="hidden md:block overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="text-gray-700">Order ID</th>
                        <th className="text-gray-700">Customer</th>
                        <th className="text-gray-700">Date</th>
                        <th className="text-gray-700">Status</th>
                        <th className="text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id} className="hover">
                          <td className="text-gray-700">{order.orderNumber || order.id}</td>
                          <td className="text-gray-700">{order.customerName || order.User?.name || 'Unknown'}</td>
                          <td className="text-gray-700">{formatDate(order.date || order.createdAt)}</td>
                          <td className="text-gray-700">{getStatusBadge(order.status)}</td>
                          <td className="text-gray-700">{formatPrice(order.total || order.grandTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <i className="fas fa-shopping-cart text-gray-300 text-4xl mb-2"></i>
                  <p className="text-gray-500">No recent orders found</p>
                </div>
              </div>
            )}
          </div>
          
          <div className={`${activeTab !== 'products' && activeTab !== 'stats' ? 'hidden md:block' : (activeTab === 'products' ? 'block' : 'hidden md:block')} bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-npc-navy">Top Selling Products</h2>
              <Link to="/admin/products" className="text-npc-gold hover:text-npc-darkGold text-sm font-medium">
                View All
              </Link>
            </div>
            
            {topProducts.length > 0 ? (
              <>
                <div className="block md:hidden">
                  {topProducts.map(product => renderProductCard(product))}
                </div>
                
                <div className="hidden md:block">
                  <div className="space-y-4">
                    {topProducts.map(product => (
                      <div key={product.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={product.image || product.imageUrl || '/images/product-placeholder.png'} 
                            alt={product.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/product-placeholder.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${product.id}`} className="font-medium text-npc-navy hover:text-npc-gold truncate block">
                            {product.name}
                          </Link>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <span className="mr-4">Sold: {product.sold || product.totalSold || 0}</span>
                            <span>Stock: {product.stock || 0}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-npc-gold">{formatPrice(product.price || 0)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Revenue: {formatPrice(product.revenue || (product.price * (product.sold || product.totalSold || 0)) || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-48">
                <div className="text-center">
                  <i className="fas fa-box text-gray-300 text-4xl mb-2"></i>
                  <p className="text-gray-500">No top products found</p>
                </div>
              </div>
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
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'orders' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <i className="fas fa-shopping-cart text-lg"></i>
                  <span className="text-xs mt-1">Orders</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeTab === 'products' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('products')}
                >
                  <i className="fas fa-box text-lg"></i>
                  <span className="text-xs mt-1">Products</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;