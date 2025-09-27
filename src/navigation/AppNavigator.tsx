import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import HomeScreen from '../screens/HomeScreen';
import QuestoesScreen from '../screens/QuestoesScreen';
import ForumScreen from '../screens/ForumScreen';
import PerfilScreen from '../screens/PerfilScreen';
import SobreScreen from '../screens/SobreScreen';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Questoes: { materia: string };
  Forum: undefined;
  Perfil: undefined;
  Sobre: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [isCadastro, setIsCadastro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    try {
      setErro('');
      setCarregando(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao entrar');
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastro = async () => {
    try {
      setErro('');
      setCarregando(true);
      
      if (!nome.trim()) {
        setErro('Nome é obrigatório');
        return;
      }
      
      if (senha.length < 6) {
        setErro('Senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      const user = userCredential.user;

      // Salvar dados do usuário na coleção "users" (padrão para Forum/Perfil)
      await setDoc(doc(db, 'users', user.uid), {
        displayName: nome.trim(),
        email: email.trim(),
        photoURL: null,
        bio: '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        active: true,
      }, { merge: true });

      // Manter compatibilidade com coleção "usuarios" existente
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: nome.trim(),
        email: email.trim(),
        dataCadastro: serverTimestamp(),
        ultimoAcesso: serverTimestamp(),
        ativo: true,
      }, { merge: true });

      console.log('Usuário cadastrado com sucesso!');
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao cadastrar');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isCadastro ? 'Cadastro' : 'Login'}
      </Text>
      {!!erro && <Text style={styles.error}>{erro}</Text>}
      
      {isCadastro && (
        <TextInput
          placeholder="Nome completo"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
        />
      )}
      
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={styles.input}
      />
      
      <Button 
        title={carregando ? "Carregando..." : (isCadastro ? "Cadastrar" : "Entrar")} 
        onPress={isCadastro ? handleCadastro : handleLogin}
        disabled={carregando}
      />
      
      <Button 
        title={isCadastro ? "Já tenho conta" : "Criar conta"} 
        onPress={() => {
          setIsCadastro(!isCadastro);
          setErro('');
          setNome('');
        }}
        color="#666"
      />
    </View>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      // Criar/atualizar perfil do usuário na coleção users
      if (u) {
        try {
          await setDoc(doc(db, 'users', u.uid), {
            displayName: u.displayName || 'Estudante',
            email: u.email || '',
            photoURL: u.photoURL || null,
            bio: '',
            lastLogin: serverTimestamp(),
            active: true,
          }, { merge: true });
        } catch (error) {
          console.error('Erro ao atualizar perfil do usuário:', error);
        }
      }
    });
    return unsub;
  }, []);

  if (loading) {
    return <View style={styles.container}><Text>Carregando...</Text></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
            <Stack.Screen name="Questoes" component={QuestoesScreen} options={{ title: 'Questões' }} />
            <Stack.Screen name="Forum" component={ForumScreen} options={{ title: 'Fórum' }} />
            <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 6 },
  error: { color: 'red', marginBottom: 10 },
});
