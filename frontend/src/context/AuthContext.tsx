import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface AuthContextType {
  token: string | null;
  role: string | null;
  userId: string | null;
  name: string | null;
  profilePhoto: string | null;
  premiumMember: boolean;
  loading: boolean;
  login: (token: string, role: string, userId: string, name: string, profilePhoto?: string, premiumMember?: boolean) => void;
  logout: () => void;
  updateProfile: (profilePhoto?: string, premiumMember?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [name, setName] = useState<string | null>(localStorage.getItem('name'));
  const [profilePhoto, setProfilePhoto] = useState<string | null>(localStorage.getItem('profilePhoto'));
  const [premiumMember, setPremiumMember] = useState<boolean>(localStorage.getItem('premiumMember') === 'true');
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
        setPremiumMember(data.user.premiumMember);

        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('name', data.user.name);
        localStorage.setItem('role', data.user.role);
        if (data.user.profilePhoto) localStorage.setItem('profilePhoto', data.user.profilePhoto);
        if (data.user.premiumMember !== undefined) localStorage.setItem('premiumMember', data.user.premiumMember.toString());
      }
    } catch (error) {
      console.log('Session expired or invalid, logging out...', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, role: string, userId: string, name: string, userProfilePhoto?: string, isPremium?: boolean) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    localStorage.setItem('name', name);
    if (userProfilePhoto) localStorage.setItem('profilePhoto', userProfilePhoto);
    if (isPremium !== undefined) localStorage.setItem('premiumMember', isPremium.toString());

    setToken(token);
    setRole(role);
    setUserId(userId);
    setName(name);
    if (userProfilePhoto) setProfilePhoto(userProfilePhoto);
    if (isPremium !== undefined) setPremiumMember(isPremium);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUserId(null);
    setName(null);
    setProfilePhoto(null);
    setPremiumMember(false);
  };

  const updateProfile = (newProfilePhoto?: string, newPremiumStatus?: boolean) => {
    if (newProfilePhoto !== undefined) {
      setProfilePhoto(newProfilePhoto);
      localStorage.setItem('profilePhoto', newProfilePhoto);
    }
    if (newPremiumStatus !== undefined) {
      setPremiumMember(newPremiumStatus);
      localStorage.setItem('premiumMember', newPremiumStatus.toString());
    }
  };

  return (
    <AuthContext.Provider value={{
      token, role, userId, name, profilePhoto, premiumMember, loading,
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
