import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// टाइप डेफिनिशन
type AuthData = {
  token: string | null;
  userData: any | null;
};

type AuthContextType = {
  authData: AuthData;
  setAuthData: (data: AuthData) => void;
  clearAuthData: () => void;
};

// कॉन्टेक्स्ट बनाना
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// प्रोवाइडर कॉम्पोनेंट
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authData, setAuthData] = useState<AuthData>({
    token: null,
    userData: null,
  });

  // इनिशियल लोड पर डेटा चेक करना
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // स्टोरेज से डेटा लोड करना
  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userDataString = await AsyncStorage.getItem('userData');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      
      setAuthData({ token, userData });
    } catch (error) {
      console.error('Error loading auth data:', error);
    }
  };

  // नया डेटा सेट करना
  const setAndStoreAuthData = async (newData: AuthData) => {
    try {
      if (newData.token) {
        await AsyncStorage.setItem('token', newData.token);
      }
      if (newData.userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(newData.userData));
      }
      setAuthData(newData);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  // डेटा क्लियर करना (लॉगआउट के लिए)
  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      setAuthData({ token: null, userData: null });
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        authData, 
        setAuthData: setAndStoreAuthData, 
        clearAuthData 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// कस्टम हुक
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 