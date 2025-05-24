/**
 * @param {string} role 
 * @returns {boolean}
 */
export const canShop = (role) => {
    return role === 'buyer';
  };
  
  /**
   * @param {string} role 
   * @returns {string} 
   */
  export const getAdminViewMessage = (role) => {
    if (role === 'admin') {
      return 'You are viewing this page as Admin. Shopping features are disabled.';
    } else if (role === 'superadmin') {
      return 'You are viewing this page as Super Admin. Shopping features are disabled.';
    }
    return '';
  };
  
  export default { canShop, getAdminViewMessage };