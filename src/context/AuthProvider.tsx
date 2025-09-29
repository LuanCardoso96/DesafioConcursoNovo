import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

type UserDoc = {
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  createdAt: any;
  updatedAt: any;
};

type AuthContextType = {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDoc: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthProvider: Firebase User:', firebaseUser ? firebaseUser.uid : 'null');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Garantir existência do documento do usuário
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          
          // Tentar criar/atualizar o documento do usuário
          await setDoc(userRef, {
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || null,
            bio: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });

          // Escutar mudanças no documento do usuário em tempo real
          unsubscribeUserDoc = onSnapshot(userRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data() as UserDoc;
              setUserDoc(data);
            } else {
              setUserDoc(null);
            }
          });
        } catch (error) {
          console.error('Erro ao criar/atualizar documento do usuário:', error);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  const value: AuthContextType = {
    user,
    userDoc,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
