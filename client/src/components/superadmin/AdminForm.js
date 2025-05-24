import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';

const AdminForm = ({ admin, onSubmit, onCancel, isEdit }) => {
  const initialPermissions = {
    manageProducts: true,
    manageOrders: true,
    manageUsers: false,
    manageContent: false,
    viewReports: true,
    manageSales: false,
    manageInventory: false,
    manageSettings: false,
    manageAdmins: false,
    viewDashboard: true
  };
  
  const initialFormData = {
    name: '',
    email: '',
    phone: '',
    role: 'admin', 
    department: 'Customer Service',
    password: '',
    confirmPassword: '',
    isActive: true,
    permissions: initialPermissions
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (admin && isEdit) {
      let parsedPermissions = initialPermissions;
      
      if (admin.permissions) {
        if (typeof admin.permissions === 'string') {
          try {
            parsedPermissions = JSON.parse(admin.permissions);
          } catch (error) {
            console.error('Error parsing permissions:', error);
          }
        } else {
          parsedPermissions = admin.permissions;
        }
      }
      
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        role: admin.role || 'admin',  
        department: admin.department || 'Customer Service',
        password: '',
        confirmPassword: '',
        isActive: admin.isActive ?? true,
        permissions: {
          ...initialPermissions,
          ...parsedPermissions
        }
      });
    }
  }, [admin, isEdit]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name.startsWith('permission_')) {
        const permissionName = name.replace('permission_', '');
        setFormData(prev => ({
          ...prev,
          permissions: {
            ...prev.permissions,
            [permissionName]: checked
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(0|\+?\d{1,3})?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4,5})$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 uppercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 number';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 uppercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 number';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const submissionData = {
      ...formData,
      permissions: JSON.stringify(formData.permissions)
    };
    
    if (isEdit && !formData.password) {
      delete submissionData.password;
      delete submissionData.confirmPassword;
    }
    
    delete submissionData.confirmPassword;
    
    onSubmit(submissionData);
  };
  
  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEdit ? `Edit Admin - ${admin?.name}` : 'Add New Admin'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-npc-navy border-b pb-2">Basic Information</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter admin's full name"
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter admin's email"
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Phone Number</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                placeholder="Enter admin's phone number"
              />
              {errors.phone && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.phone}</span>
                </label>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Role</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Department</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`select select-bordered w-full ${errors.department ? 'select-error' : ''}`}
                >
                  <option value="Customer Service">Customer Service</option>
                  <option value="Sales">Sales</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Management">Management</option>
                </select>
                {errors.department && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.department}</span>
                  </label>
                )}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">Active Status</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-npc-navy border-b pb-2">Security & Permissions</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {isEdit ? 'New Password (leave empty if not changing)' : 'Password'}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                  placeholder={isEdit ? 'Enter new password or leave empty' : 'Enter password'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={togglePasswordVisibility}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.confirmPassword}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Access Permissions</span>
              </label>
              <div className="bg-gray-50 p-3 rounded">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <label key={key} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        name={`permission_${key}`}
                        checked={value}
                        onChange={handleChange}
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <span className="label-text capitalize">
                        {key === 'manageProducts' && 'Manage Products'}
                        {key === 'manageOrders' && 'Manage Orders'}
                        {key === 'manageUsers' && 'Manage Users'}
                        {key === 'manageContent' && 'Manage Content'}
                        {key === 'viewReports' && 'View Reports'}
                        {key === 'manageSales' && 'Manage Sales'}
                        {key === 'manageInventory' && 'Manage Inventory'}
                        {key === 'manageSettings' && 'Manage Settings'}
                        {key === 'manageAdmins' && 'Manage Admins'}
                        {key === 'viewDashboard' && 'View Dashboard'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none"
          >
            {isEdit ? 'Update Admin' : 'Add Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminForm;