import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [tokens, setTokens] = useState(() => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return access && refresh ? { access, refresh } : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:8000/api/users/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to login');
    }

    const { access, refresh, user: userData } = data;
    setUser(userData);
    setTokens({ access, refresh });
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return userData;
  };

  const register = async (userData) => {
    const response = await fetch('http://localhost:8000/api/users/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
      // Return details of structural errors
      throw new Error(JSON.stringify(data) || 'Failed to register');
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const updateProfile = async (updatedData) => {
    const response = await fetchWithAuth('http://localhost:8000/api/users/profile/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(JSON.stringify(err) || 'Failed to update profile');
    }

    const data = await response.json();
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  };

  const refreshAccessToken = async () => {
    if (!tokens?.refresh) return null;

    try {
      const response = await fetch('http://localhost:8000/api/users/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTokens = { access: data.access, refresh: data.refresh || tokens.refresh };
        setTokens(updatedTokens);
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        return data.access;
      } else {
        logout();
        return null;
      }
    } catch (e) {
      logout();
      return null;
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    let currentAccess = tokens?.access;
    if (!currentAccess) {
      throw new Error('Not authenticated');
    }

    // Attempt request
    let headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentAccess}`,
    };

    let response = await fetch(url, { ...options, headers });

    // Handle token expired (status 401)
    if (response.status === 401) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        headers['Authorization'] = `Bearer ${newAccess}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, tokens, loading, login, register, logout, updateProfile, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
