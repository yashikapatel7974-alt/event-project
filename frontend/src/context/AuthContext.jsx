import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto login on mount if there's a stored session or valid refresh token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          // Attempt token refresh to verify session
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const resData = await response.json();
          if (response.ok && resData.status === 'success') {
            setAccessToken(resData.data.accessToken);
            setUser(JSON.parse(storedUser));
          } else {
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const resData = await response.json();

    if (!response.ok || resData.status !== 'success') {
      throw new Error(resData.message || 'Login failed.');
    }

    const { user: loggedInUser, accessToken: token, refreshToken } = resData.data;
    setUser(loggedInUser);
    setAccessToken(token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    
    // Store refresh token in local storage as fallback if cookies aren't set up
    localStorage.setItem('refreshToken', refreshToken);

    return loggedInUser;
  };

  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const resData = await response.json();

    if (!response.ok || resData.status !== 'success') {
      throw new Error(resData.message || 'Registration failed.');
    }

    return resData.data;
  };

  const logout = async () => {
    const token = localStorage.getItem('refreshToken');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }
  };

  // Helper to make authenticated requests
  const authFetch = async (url, options = {}) => {
    let currentToken = accessToken;

    // Check if we need to refresh token
    // For simplicity, we just pass the header. If we get a 401, we try to refresh and retry once.
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token might be expired, try refreshing
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
        });
        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.status === 'success') {
          const newToken = refreshData.data.accessToken;
          setAccessToken(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh failed, logout
          logout();
        }
      } catch (err) {
        logout();
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
