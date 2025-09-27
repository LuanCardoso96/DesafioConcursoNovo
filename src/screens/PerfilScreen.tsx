import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

type UserProfile = {
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  createdAt: any;
  lastLogin: any;
  active: boolean;
};

type AnswerStats = {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
  byMateria: Record<string, { total: number; correct: number; percentage: number }>;
};

type FriendRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  fromUser?: {
    displayName: string;
    email: string;
  };
};

type Friendship = {
  id: string;
  users: string[];
  createdAt: any;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PerfilScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [answerStats, setAnswerStats] = useState<AnswerStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    percentage: 0,
    byMateria: {},
  });
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBio, setUpdatingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  const user = auth.currentUser;

  // Carregar dados do perfil
  const carregarPerfil = useCallback(async () => {
    if (!user) return;

    try {
      // Carregar perfil do usuário
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile(profileData);
        setNewBio(profileData.bio || '');
      }

      // Carregar estatísticas de respostas
      const answersQuery = query(
        collection(db, 'answers'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const answersSnapshot = await getDocs(answersQuery);
      
      const stats: AnswerStats = {
        total: 0,
        correct: 0,
        incorrect: 0,
        percentage: 0,
        byMateria: {},
      };

      answersSnapshot.forEach((doc) => {
        const data = doc.data();
        stats.total++;
        if (data.correct) {
          stats.correct++;
        } else {
          stats.incorrect++;
        }

        const materia = data.materia || 'Outros';
        if (!stats.byMateria[materia]) {
          stats.byMateria[materia] = { total: 0, correct: 0, percentage: 0 };
        }
        stats.byMateria[materia].total++;
        if (data.correct) {
          stats.byMateria[materia].correct++;
        }
      });

      // Calcular percentuais
      stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      Object.keys(stats.byMateria).forEach(materia => {
        const materiaStats = stats.byMateria[materia];
        materiaStats.percentage = materiaStats.total > 0 
          ? Math.round((materiaStats.correct / materiaStats.total) * 100) 
          : 0;
      });

      setAnswerStats(stats);

      // Carregar solicitações de amizade recebidas
      const friendRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('toUid', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const friendRequestsSnapshot = await getDocs(friendRequestsQuery);
      
      const requests: FriendRequest[] = [];
      for (const docSnapshot of friendRequestsSnapshot.docs) {
        const data = docSnapshot.data() as Omit<FriendRequest, 'id'>;
        const request: FriendRequest = {
          id: docSnapshot.id,
          ...data,
        };

        // Buscar dados do usuário que enviou
        try {
          const fromUserDoc = await getDoc(doc(db, 'users', request.fromUid));
          if (fromUserDoc.exists()) {
            request.fromUser = fromUserDoc.data() as FriendRequest['fromUser'];
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
        }

        requests.push(request);
      }
      setFriendRequests(requests);

      // Carregar amizades
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', user.uid)
      );
      const friendshipsSnapshot = await getDocs(friendshipsQuery);
      
      const friends: Friendship[] = [];
      friendshipsSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Friendship, 'id'>;
        friends.push({
          id: doc.id,
          ...data,
        });
      });
      setFriendships(friends);

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  // Atualizar bio
  const atualizarBio = async () => {
    if (!user || !newBio.trim()) return;

    setUpdatingBio(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio: newBio.trim(),
      });
      
      setUserProfile(prev => prev ? { ...prev, bio: newBio.trim() } : null);
      Alert.alert('Sucesso', 'Bio atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar bio:', error);
      Alert.alert('Erro', 'Falha ao atualizar bio');
    } finally {
      setUpdatingBio(false);
    }
  };

  // Aceitar solicitação de amizade
  const aceitarAmizade = async (requestId: string, fromUid: string) => {
    try {
      // Atualizar status da solicitação
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
      });

      // Criar amizade
      const pairId = [user!.uid, fromUid].sort().join('_');
      await setDoc(doc(db, 'friendships', pairId), {
        users: [user!.uid, fromUid],
        createdAt: serverTimestamp(),
      });

      // Criar notificação
      await addDoc(collection(db, 'notifications'), {
        uid: fromUid,
        type: 'friendship_accepted',
        message: `${userProfile?.displayName || 'Alguém'} aceitou sua solicitação de amizade!`,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Recarregar dados
      carregarPerfil();
      Alert.alert('Sucesso', 'Solicitação aceita!');
    } catch (error) {
      console.error('Erro ao aceitar amizade:', error);
      Alert.alert('Erro', 'Falha ao aceitar solicitação');
    }
  };

  // Rejeitar solicitação de amizade
  const rejeitarAmizade = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected',
      });

      carregarPerfil();
      Alert.alert('Sucesso', 'Solicitação rejeitada');
    } catch (error) {
      console.error('Erro ao rejeitar amizade:', error);
      Alert.alert('Erro', 'Falha ao rejeitar solicitação');
    }
  };

  // Logout
  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Falha ao sair');
            }
          },
        },
      ]
    );
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await carregarPerfil();
    setRefreshing(false);
  };

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Nunca';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header do perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {userProfile?.displayName || 'Usuário'}
          </Text>
          <Text style={styles.email}>{userProfile?.email || ''}</Text>
          <Text style={styles.memberSince}>
            Membro desde {formatarData(userProfile?.createdAt)}
          </Text>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <View style={styles.bioContainer}>
            <TextInput
              style={styles.bioInput}
              placeholder="Escreva algo sobre você..."
              value={newBio}
              onChangeText={setNewBio}
              multiline
              maxLength={200}
            />
            <Pressable
              style={[styles.updateBioButton, updatingBio && styles.updateBioButtonDisabled]}
              onPress={atualizarBio}
              disabled={updatingBio}
            >
              <Text style={styles.updateBioButtonText}>
                {updatingBio ? 'Salvando...' : 'Atualizar'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas de Estudo</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{answerStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statCorrect]}>
              {answerStats.correct}
            </Text>
              <Text style={styles.statLabel}>Acertos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.statIncorrect]}>
                {answerStats.incorrect}
              </Text>
              <Text style={styles.statLabel}>Erros</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.statPercentage]}>
                {answerStats.percentage}%
              </Text>
              <Text style={styles.statLabel}>Taxa</Text>
            </View>
          </View>

          {/* Estatísticas por matéria */}
          {Object.keys(answerStats.byMateria).length > 0 && (
            <View style={styles.materiaStats}>
              <Text style={styles.materiaStatsTitle}>Por Matéria</Text>
              {Object.entries(answerStats.byMateria).map(([materia, stats]) => (
                <View key={materia} style={styles.materiaStatRow}>
                  <Text style={styles.materiaName}>{materia}</Text>
                  <View style={styles.materiaStatDetails}>
                    <Text style={styles.materiaStatText}>
                      {stats.correct}/{stats.total} ({stats.percentage}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Solicitações de amizade */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Solicitações de Amizade ({friendRequests.length})
            </Text>
            {friendRequests.map((request) => (
              <View key={request.id} style={styles.friendRequestCard}>
                <View style={styles.friendRequestInfo}>
                  <Text style={styles.friendRequestName}>
                    {request.fromUser?.displayName || 'Usuário'}
                  </Text>
                  <Text style={styles.friendRequestEmail}>
                    {request.fromUser?.email || ''}
                  </Text>
                </View>
                <View style={styles.friendRequestActions}>
                  <Pressable
                    style={[styles.friendRequestButton, styles.acceptButton]}
                    onPress={() => aceitarAmizade(request.id, request.fromUid)}
                  >
                    <Text style={styles.acceptButtonText}>Aceitar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.friendRequestButton, styles.rejectButton]}
                    onPress={() => rejeitarAmizade(request.id)}
                  >
                    <Text style={styles.rejectButtonText}>Rejeitar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Amigos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Amigos ({friendships.length})
          </Text>
          {friendships.length === 0 ? (
            <Text style={styles.emptyText}>
              Você ainda não tem amigos. Use o fórum para conhecer pessoas!
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              {friendships.length} amigo(s) conectado(s)
            </Text>
          )}
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Forum')}>
            <Text style={styles.actionButtonText}>Ir para o Fórum</Text>
          </Pressable>
          
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Sobre')}>
            <Text style={styles.actionButtonText}>Sobre o App</Text>
          </Pressable>
          
          <Pressable style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    margin: 16,
    borderRadius: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  displayName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    color: '#999',
    fontSize: 16,
    marginBottom: 8,
  },
  memberSince: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bioContainer: {
    gap: 12,
  },
  bioInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  updateBioButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateBioButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  updateBioButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
  },
  statCorrect: {
    color: '#2ecc71',
  },
  statIncorrect: {
    color: '#e74c3c',
  },
  statPercentage: {
    color: '#f39c12',
  },
  materiaStats: {
    marginTop: 16,
  },
  materiaStatsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  materiaStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  materiaName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  materiaStatDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  materiaStatText: {
    color: '#999',
    fontSize: 14,
  },
  friendRequestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  friendRequestInfo: {
    flex: 1,
  },
  friendRequestName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendRequestEmail: {
    color: '#999',
    fontSize: 14,
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  friendRequestButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutButtonText: {
    color: '#e74c3c',
  },
});