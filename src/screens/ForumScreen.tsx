import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthProvider';
import { db } from '../services/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Post = {
  id: string;
  uid: string;
  content: string;
  materia?: string;
  createdAt: any;
  user?: {
    displayName: string;
    email: string;
  };
};

type Comment = {
  id: string;
  uid: string;
  content: string;
  createdAt: any;
  user?: {
    displayName: string;
    email: string;
  };
};

// Filtro anti-palavrões básico
const PALAVROES = ['palavrao1', 'palavrao2', 'palavrao3']; // Adicione palavras aqui
const filtrarConteudo = (texto: string): string => {
  let resultado = texto;
  PALAVROES.forEach(palavrao => {
    const regex = new RegExp(palavrao, 'gi');
    resultado = resultado.replace(regex, '*'.repeat(palavrao.length));
  });
  return resultado;
};

const MATERIAS = [
  'Conhecimentos Gerais',
  'Atualidades',
  'Português',
  'Matemática',
  'Raciocínio Lógico',
  'Informática',
  'Direito Constitucional',
  'Direito Administrativo',
  'Contabilidade',
  'Inglês',
];

export default function ForumScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, userDoc } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [commenting, setCommenting] = useState<Record<string, boolean>>({});

  // Verificar se usuário tem perfil completo
  useEffect(() => {
    if (userDoc && !userDoc.displayName) {
      Alert.alert(
        'Perfil Incompleto',
        'Complete seu perfil antes de publicar no fórum.',
        [
          {
            text: 'Completar Perfil',
            onPress: () => navigation.navigate('Perfil'),
          },
        ]
      );
    }
  }, [userDoc, navigation]);

  // Carregar posts em tempo real
  useEffect(() => {
    const postsQuery = query(
      collection(db, 'forumPosts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const postsData: Post[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const postData = docSnapshot.data() as Omit<Post, 'id'>;
        const post: Post = {
          id: docSnapshot.id,
          ...postData,
        };

        // Buscar dados do usuário
        try {
          const userDocSnapshot = await getDoc(doc(db, 'users', post.uid));
          if (userDocSnapshot.exists()) {
            post.user = userDocSnapshot.data() as Post['user'];
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
        }

        postsData.push(post);
      }

      setPosts(postsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Carregar comentários de um post
  const carregarComentarios = useCallback(async (postId: string) => {
    try {
      const commentsQuery = query(
        collection(db, 'forumPosts', postId, 'comments'),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(commentsQuery);
      const commentsData: Comment[] = [];

      for (const docSnapshot of snapshot.docs) {
        const commentData = docSnapshot.data() as Omit<Comment, 'id'>;
        const comment: Comment = {
          id: docSnapshot.id,
          ...commentData,
        };

        // Buscar dados do usuário
        try {
          const userDocSnapshot = await getDoc(doc(db, 'users', comment.uid));
          if (userDocSnapshot.exists()) {
            comment.user = userDocSnapshot.data() as Comment['user'];
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
        }

        commentsData.push(comment);
      }

      setComments(prev => ({
        ...prev,
        [postId]: commentsData,
      }));
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  }, []);

  // Publicar novo post
  const publicarPost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Erro', 'Digite algo para publicar');
      return;
    }

    if (newPost.length > 500) {
      Alert.alert('Erro', 'Post muito longo (máximo 500 caracteres)');
      return;
    }

    if (!selectedMateria) {
      Alert.alert('Erro', 'Selecione uma matéria');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    if (!userDoc?.displayName) {
      Alert.alert('Erro', 'Complete seu perfil antes de publicar');
      return;
    }

    setPosting(true);
    try {
      const conteudoFiltrado = filtrarConteudo(newPost.trim());
      
      await addDoc(collection(db, 'forumPosts'), {
        uid: user.uid,
        content: conteudoFiltrado,
        materia: selectedMateria,
        createdAt: serverTimestamp(),
      });

      setNewPost('');
      setSelectedMateria('');
      Alert.alert('Sucesso', 'Post publicado!');
    } catch (error: any) {
      console.error('Erro ao publicar post:', error);
      
      // Tratamento específico de erros das regras do Firestore
      if (error.code === 'permission-denied') {
        Alert.alert('Erro', 'Sem permissão para publicar. Verifique se está logado.');
      } else if (error.code === 'failed-precondition') {
        Alert.alert('Erro', 'Dados inválidos. Verifique o conteúdo do post.');
      } else if (error.code === 'unavailable') {
        Alert.alert('Erro', 'Serviço temporariamente indisponível. Tente novamente.');
      } else {
        Alert.alert('Erro', `Falha ao publicar post: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setPosting(false);
    }
  };

  // Comentar em um post
  const comentarPost = async (postId: string) => {
    const comentario = newComments[postId];
    if (!comentario?.trim()) {
      Alert.alert('Erro', 'Digite algo para comentar');
      return;
    }

    if (comentario.length > 200) {
      Alert.alert('Erro', 'Comentário muito longo (máximo 200 caracteres)');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setCommenting(prev => ({ ...prev, [postId]: true }));
    try {
      const conteudoFiltrado = filtrarConteudo(comentario.trim());
      
      await addDoc(collection(db, 'forumPosts', postId, 'comments'), {
        uid: user.uid,
        content: conteudoFiltrado,
        createdAt: serverTimestamp(),
      });

      setNewComments(prev => ({ ...prev, [postId]: '' }));
      Alert.alert('Sucesso', 'Comentário publicado!');
    } catch (error: any) {
      console.error('Erro ao comentar:', error);
      
      // Tratamento específico de erros das regras do Firestore
      if (error.code === 'permission-denied') {
        Alert.alert('Erro', 'Sem permissão para comentar. Verifique se está logado.');
      } else if (error.code === 'failed-precondition') {
        Alert.alert('Erro', 'Dados inválidos. Verifique o conteúdo do comentário.');
      } else if (error.code === 'unavailable') {
        Alert.alert('Erro', 'Serviço temporariamente indisponível. Tente novamente.');
      } else {
        Alert.alert('Erro', `Falha ao publicar comentário: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setCommenting(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Alternar comentários
  const toggleComentarios = (postId: string) => {
    const isExpanded = expandedComments.has(postId);
    if (isExpanded) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      if (!comments[postId]) {
        carregarComentarios(postId);
      }
    }
  };

  // Navegar para perfil do autor
  const goToProfile = (uid: string) => {
    navigation.navigate('Perfil', { uid });
  };

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // O onSnapshot já atualiza automaticamente
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Carregando fórum...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Fórum</Text>
      
      {/* Input para novo post */}
      <View style={styles.newPostContainer}>
        <Text style={styles.userInfo}>
          {userDoc?.displayName || 'Usuário'} - {userDoc?.email || ''}
        </Text>
        
        <TextInput
          style={styles.newPostInput}
          placeholder="O que você está pensando?"
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={500}
        />
        
        <View style={styles.materiaContainer}>
          <Text style={styles.materiaLabel}>Matéria:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MATERIAS.map((materia) => (
              <Pressable
                key={materia}
                style={[
                  styles.materiaButton,
                  selectedMateria === materia && styles.materiaButtonSelected
                ]}
                onPress={() => setSelectedMateria(materia)}
              >
                <Text style={[
                  styles.materiaButtonText,
                  selectedMateria === materia && styles.materiaButtonTextSelected
                ]}>
                  {materia}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.newPostActions}>
          <Text style={styles.charCount}>{newPost.length}/500</Text>
          <Pressable
            style={[styles.postButton, posting && styles.postButtonDisabled]}
            onPress={publicarPost}
            disabled={posting || !newPost.trim() || !selectedMateria}
          >
            <Text style={styles.postButtonText}>
              {posting ? 'Publicando...' : 'Publicar'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Lista de posts */}
      <ScrollView
        style={styles.postsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Pressable onPress={() => goToProfile(post.uid)}>
                <Text style={styles.postAuthor}>
                  {post.user?.displayName || 'Anônimo'}
                </Text>
              </Pressable>
              <View style={styles.postMeta}>
                <Text style={styles.postMateria}>{post.materia}</Text>
                <Text style={styles.postTime}>
                  {formatarData(post.createdAt)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.postContent}>{post.content}</Text>
            
            <Pressable
              style={styles.commentsButton}
              onPress={() => toggleComentarios(post.id)}
            >
              <Text style={styles.commentsButtonText}>
                {expandedComments.has(post.id) ? 'Ocultar' : 'Ver'} comentários
                {comments[post.id] && ` (${comments[post.id].length})`}
              </Text>
            </Pressable>

            {/* Comentários */}
            {expandedComments.has(post.id) && (
              <View style={styles.commentsContainer}>
                {comments[post.id]?.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <Pressable onPress={() => goToProfile(comment.uid)}>
                        <Text style={styles.commentAuthor}>
                          {comment.user?.displayName || 'Anônimo'}
                        </Text>
                      </Pressable>
                      <Text style={styles.commentTime}>
                        {formatarData(comment.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))}

                {/* Input para novo comentário */}
                <View style={styles.newCommentContainer}>
                  <TextInput
                    style={styles.newCommentInput}
                    placeholder="Escreva um comentário..."
                    value={newComments[post.id] || ''}
                    onChangeText={(text) => setNewComments(prev => ({ ...prev, [post.id]: text }))}
                    maxLength={200}
                  />
                  <Pressable
                    style={[
                      styles.commentButton,
                      commenting[post.id] && styles.commentButtonDisabled
                    ]}
                    onPress={() => comentarPost(post.id)}
                    disabled={commenting[post.id] || !newComments[post.id]?.trim()}
                  >
                    <Text style={styles.commentButtonText}>
                      {commenting[post.id] ? '...' : 'Comentar'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ))}

        {posts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum post ainda. Seja o primeiro a publicar!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  newPostContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userInfo: {
    color: '#3498db',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  newPostInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  materiaContainer: {
    marginBottom: 12,
  },
  materiaLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  materiaButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  materiaButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  materiaButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  materiaButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  newPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    color: '#999',
    fontSize: 12,
  },
  postButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  postsContainer: {
    flex: 1,
  },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAuthor: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  postMeta: {
    alignItems: 'flex-end',
  },
  postMateria: {
    color: '#2ecc71',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  postTime: {
    color: '#999',
    fontSize: 12,
  },
  postContent: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  commentsButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 16,
  },
  commentsButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  commentsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commentCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#2ecc71',
    fontWeight: '500',
    fontSize: 14,
  },
  commentTime: {
    color: '#999',
    fontSize: 12,
  },
  commentContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  newCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  newCommentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
  },
  commentButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  commentButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
});