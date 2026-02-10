import { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'tecnico' | 'cliente';

interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

interface AuthContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextProps>({ user: null, setUser: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Simulação: buscar usuário logado (substituir por integração real)
  useEffect(() => {
    // Exemplo: buscar do localStorage ou API
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
