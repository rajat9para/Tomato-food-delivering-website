import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface AuthContextType {
  token: string | null;
  role: string | null;
  userId: string | null;
  name: string | null;
  profilePhoto: string | null;
  premiumMember: boolean;
  premiumExpiry: string | null;
  loading: boolean;
  login: (token: string, role: string, userId: string, name: string, profilePhoto?: string | null, premiumMember?: boolean, premiumExpiry?: string | null) => void;
  logout: () => void;
  updateProfile: (profilePhoto?: string | null, premiumMember?: boolean, premiumExpiry?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [name, setName] = useState<string | null>(localStorage.getItem('name'));
  const [profilePhoto, setProfilePhoto] = useState<string | null>(localStorage.getItem('profilePhoto'));
  const [premiumMember, setPremiumMember] = useState<boolean>(localStorage.getItem('premiumMember') === 'true');
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(localStorage.getItem('premiumExpiry'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/verify');


      const data = response.data;

      if (data.user) {
        setUserId(data.user.id);
        setName(data.user.name);
        setRole(data.user.role);
        setProfilePhoto(data.user.profilePhoto);
        setPremiumMember(Boolean(data.user.premiumMember));
        setPremiumExpiry(data.user.premiumExpiry || null);

        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('name', data.user.name);
        localStorage.setItem('role', data.user.role);
        if (data.user.profilePhoto) {
          localStorage.setItem('profilePhoto', data.user.profilePhoto);
        } else {
          localStorage.removeItem('profilePhoto');
        }
        localStorage.setItem('premiumMember', Boolean(data.user.premiumMember).toString());
        if (data.user.premiumExpiry) {
          localStorage.setItem('premiumExpiry', data.user.premiumExpiry);
        } else {
          localStorage.removeItem('premiumExpiry');
        }
      }
    } catch (error) {
      console.log('Session expired or invalid, logging out...', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, role: string, userId: string, name: string, userProfilePhoto?: string | null, isPremium?: boolean, userPremiumExpiry?: string | null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    localStorage.setItem('name', name);
    if (userProfilePhoto) localStorage.setItem('profilePhoto', userProfilePhoto);
    else localStorage.removeItem('profilePhoto');
    if (isPremium !== undefined) localStorage.setItem('premiumMember', isPremium.toString());
    if (userPremiumExpiry) localStorage.setItem('premiumExpiry', userPremiumExpiry);
    else localStorage.removeItem('premiumExpiry');

    setToken(token);
    setRole(role);
    setUserId(userId);
    setName(name);
    setProfilePhoto(userProfilePhoto || null);
    if (isPremium !== undefined) setPremiumMember(isPremium);
    setPremiumExpiry(userPremiumExpiry || null);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUserId(null);
    setName(null);
    setProfilePhoto(null);
    setPremiumMember(false);
    setPremiumExpiry(null);
  };

  const updateProfile = (newProfilePhoto?: string | null, newPremiumStatus?: boolean, newPremiumExpiry?: string | null) => {
    if (newProfilePhoto !== undefined) {
      setProfilePhoto(newProfilePhoto);
      if (newProfilePhoto) localStorage.setItem('profilePhoto', newProfilePhoto);
      else localStorage.removeItem('profilePhoto');
    }
    if (newPremiumStatus !== undefined) {
      setPremiumMember(newPremiumStatus);
      localStorage.setItem('premiumMember', newPremiumStatus.toString());
    }
    if (newPremiumExpiry !== undefined) {
      setPremiumExpiry(newPremiumExpiry);
      if (newPremiumExpiry) localStorage.setItem('premiumExpiry', newPremiumExpiry);
      else localStorage.removeItem('premiumExpiry');
    }
  };

  return (
    <AuthContext.Provider value={{
      token, role, userId, name, profilePhoto, premiumMember, premiumExpiry, loading,
      login, logout, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
