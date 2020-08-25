import React, { createContext, useCallback, useState, useContext } from 'react';
import api from '../services/api';

interface AuthState {
  token: string;
  employee: object;
  pharmacie: object;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  employee: object;
  pharmacie: object;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@BuscaFarm:token');
    const pharmacie = localStorage.getItem('@BuscaFarm:pharmacie');
    const employee = localStorage.getItem('@BuscaFarm:employee');

    if (token && pharmacie && employee) {
      return {
        token,
        employee: JSON.parse(employee),
        pharmacie: JSON.parse(pharmacie),
      };
    }
    return {} as AuthState;
  });

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('sessions/employees', { email, password });
    const { token, employee } = response.data;
    setData({ token, employee, pharmacie: employee.pharmacie });

    localStorage.setItem('@BuscaFarm:token', token);
    localStorage.setItem(
      '@BuscaFarm:pharmacie',
      JSON.stringify(employee.pharmacie),
    );
    delete employee.pharmacie;
    localStorage.setItem('@BuscaFarm:employee', JSON.stringify(employee));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('@BuscaFarm:token');
    localStorage.removeItem('@BuscaFarm:pharmacie');
    localStorage.removeItem('@BuscaFarm:employee');
    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        employee: data.employee,
        pharmacie: data.pharmacie,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
