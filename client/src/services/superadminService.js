import { superAdminAPI } from './api';

export const getSuperadminDashboardSummary = async () => {
  try {
    const response = await superAdminAPI.getDashboardSummary();
    return response.data;
  } catch (error) {
    console.error('Error fetching superadmin dashboard summary:', error);
    throw error;
  }
};

export const getSuperadminSalesData = async (period = 'weekly') => {
  try {
    const response = await superAdminAPI.getSalesData(period);
    return response.data;
  } catch (error) {
    console.error('Error fetching superadmin sales data:', error);
    throw error;
  }
};

export const getTopAdmins = async () => {
  try {
    const response = await superAdminAPI.getTopAdmins();
    return response.data;
  } catch (error) {
    console.error('Error fetching top admins:', error);
    throw error;
  }
};

export const getAllAdmins = async (params) => {
  try {
    const response = await superAdminAPI.getAllAdmins(params);
    return response.data;
  } catch (error) {
    console.error('Error fetching all admins:', error);
    throw error;
  }
};

export const getAdminById = async (id) => {
  try {
    const response = await superAdminAPI.getAdminById(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching admin with id ${id}:`, error);
    throw error;
  }
};

export const createAdmin = async (adminData) => {
  try {
    const response = await superAdminAPI.createAdmin(adminData);
    return response.data;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

export const updateAdmin = async (id, adminData) => {
  try {
    const response = await superAdminAPI.updateAdmin(id, adminData);
    return response.data;
  } catch (error) {
    console.error(`Error updating admin with id ${id}:`, error);
    throw error;
  }
};

export const updateAdminStatus = async (id, status) => {
  try {
    const response = await superAdminAPI.updateAdminStatus(id, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating admin status with id ${id}:`, error);
    throw error;
  }
};

export const deleteAdmin = async (id) => {
  try {
    const response = await superAdminAPI.deleteAdmin(id);
    return response.data;
  } catch (error) {
    console.error(`Error deleting admin with id ${id}:`, error);
    throw error;
  }
};

export const getAdminActivities = async (id) => {
  try {
    const response = await superAdminAPI.getAdminActivities(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activities for admin with id ${id}:`, error);
    throw error;
  }
};

export const getSystemSettings = async () => {
  try {
    const response = await superAdminAPI.getSystemSettings();
    return response;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (storeInfo) => {
  try {
    const response = await superAdminAPI.updateSystemSettings(storeInfo);
    return response;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};


export const getSystemLogs = async (params) => {
  try {
    const response = await superAdminAPI.getSystemLogs(params);
    return response.data;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    throw error;
  }
};

export const clearSystemLogs = async () => {
  try {
    const response = await superAdminAPI.clearSystemLogs();
    return response.data;
  } catch (error) {
    console.error('Error clearing system logs:', error);
    throw error;
  }
};

export const createSystemBackup = async () => {
  try {
    const response = await superAdminAPI.createSystemBackup();
    return response.data;
  } catch (error) {
    console.error('Error creating system backup:', error);
    throw error;
  }
};

export const clearSystemCache = async () => {
  try {
    const response = await superAdminAPI.clearSystemCache();
    return response.data;
  } catch (error) {
    console.error('Error clearing system cache:', error);
    throw error;
  }
};