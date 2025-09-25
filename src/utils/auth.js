// Auth utility functions
export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthData = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

export const removeAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const isAdmin = () => {
  const { user } = getAuthData();
  return user?.role === 'admin';
};

export const isCustomer = () => {
  const { user } = getAuthData();
  return user?.role === 'customer';
};