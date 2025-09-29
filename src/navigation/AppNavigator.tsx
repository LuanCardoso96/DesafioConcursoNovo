import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthProvider';
import HomeScreen from '../screens/HomeScreen';
import QuestoesScreen from '../screens/QuestoesScreen';
import ForumScreen from '../screens/ForumScreen';
import PerfilScreen from '../screens/PerfilScreen';
import SobreScreen from '../screens/SobreScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export type RootStackParamList = {
  Home: undefined;
  Questoes: { materia: string };
  Forum: undefined;
  Sobre: undefined;
  Perfil: { uid?: string } | undefined;
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3498db" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Rotas internas (usuário logado)
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
            <Stack.Screen name="Forum" component={ForumScreen} options={{ title: 'Fórum' }} />
            <Stack.Screen name="Questoes" component={QuestoesScreen} options={{ title: 'Questões' }} />
            <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre' }} />
          </>
        ) : (
          // Rotas públicas (usuário não logado)
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});
