import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthProvider';

const { width } = Dimensions.get('window');
const guidelineBaseWidth = 390; // base iPhone 14
const scale = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(size * (width / guidelineBaseWidth)));

const COLORS = {
  bg: '#0c0f14',
  bgSoft: '#121722',
  border: '#263042',
  text: '#e7eef7',
  textMuted: '#a2afc2',
  primary: '#5eead4',     // teal
  primaryAlt: '#22c55e',  // green
  accent: '#ffd54a',      // yellow
  danger: '#ef4444',
  card: '#161c28',
  cardAlt: '#1a2232',
  inputBg: '#1d2636',
  inputText: '#f3f7fd',
  inputPlaceholder: '#8ea0b8',
};

const SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 8 },
});

const MATERIAS = [
  { nome: 'Direito Constitucional', descricao: 'Questões para concursos policiais e administrativos' },
  { nome: 'Direito Administrativo', descricao: 'Entenda as leis e normas do setor público' },
  { nome: 'Português', descricao: 'Gramática, interpretação e redação' },
  { nome: 'Matemática', descricao: 'Raciocínio lógico e matemática básica' },
  { nome: 'Informática', descricao: 'Conceitos básicos, segurança, e ferramentas de TI' },
  { nome: 'Raciocínio Lógico', descricao: 'Problemas de lógica, sequências e deduções' },
  { nome: 'Atualidades', descricao: 'Acontecimentos recentes no Brasil e no mundo' },
  { nome: 'Conhecimentos Gerais', descricao: 'Assuntos diversos para enriquecer seu repertório' },
  { nome: 'Contabilidade', descricao: 'Noções contábeis, balanços, contas e princípios básicos' },
  { nome: 'Inglês', descricao: 'Compreensão e vocabulário para provas' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userDoc } = useAuth();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [showAlterarNome, setShowAlterarNome] = useState(false);
  const [inputNome, setInputNome] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // Atualizar nome do usuário quando userDoc mudar
  useEffect(() => {
    if (userDoc?.displayName) {
      setNomeUsuario(userDoc.displayName);
      setInputNome(userDoc.displayName);
    }
  }, [userDoc]);

  const handleMateriaPress = async (materia: string) => {
    try {
      await AsyncStorage.setItem('materiaSelecionada', materia);
    } catch (error) {
      console.log('Erro ao salvar matéria:', error);
    }
    navigation.navigate('Questoes', { materia });
  };

  const handleSair = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao sair da conta');
    }
  };

  const salvarNome = () => {
    const novoNome = inputNome.trim();
    if (novoNome.length < 2) {
      Alert.alert('Erro', 'Por favor, insira um nome válido com pelo menos 2 caracteres.');
      return;
    }
    setNomeUsuario(novoNome);
    setShowAlterarNome(false);
  };

  const goTo = (route: 'Perfil' | 'Forum' | 'Sobre') => {
    setShowMenu(false);
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              PasseConcurso <Text style={styles.titleEmoji}>📚</Text>
            </Text>
            <Text style={styles.welcome}>
              Olá, <Text style={styles.welcomeName}>{nomeUsuario}</Text>! Vamos estudar?
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={() => setShowMenu((v) => !v)}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alterar Nome */}
        {showAlterarNome && (
          <View style={[styles.alterarNomeBox, SHADOW]}>
            <TextInput
              style={styles.inputNome}
              value={inputNome}
              onChangeText={setInputNome}
              placeholder="Como você quer ser chamado(a)?"
              placeholderTextColor={COLORS.inputPlaceholder}
              maxLength={30}
            />
            <TouchableOpacity style={styles.btnSalvar} activeOpacity={0.9} onPress={salvarNome}>
              <Text style={styles.btnSalvarText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Matérias */}
        <View style={styles.materiasContainer}>
          <Text style={styles.sectionTitle}>Matérias para Estudo</Text>

          {MATERIAS.map((materia, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.materiaCard, SHADOW]}
              activeOpacity={0.9}
              onPress={() => handleMateriaPress(materia.nome)}
            >
              <View style={styles.materiaHeader}>
                <Text style={styles.materiaNome}>{materia.nome}</Text>
                <View style={styles.rightChip}>
                  <Text style={styles.rightChipText}>Abrir</Text>
                </View>
              </View>
              <Text style={styles.materiaDescricao}>{materia.descricao}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão Sair */}
        <TouchableOpacity style={[styles.btnSair, SHADOW]} activeOpacity={0.9} onPress={handleSair}>
          <Text style={styles.btnSairText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Menu + Backdrop */}
      {showMenu && (
        <>
          {/* backdrop para fechar ao tocar fora */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.backdrop}
            onPress={() => setShowMenu(false)}
          />
          <View style={[styles.dropdown, SHADOW]}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => goTo('Perfil')}>
              <Text style={styles.dropdownIcon}>👤</Text>
              <Text style={styles.dropdownText}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropdownItem} onPress={() => goTo('Forum')}>
              <Text style={styles.dropdownIcon}>💬</Text>
              <Text style={styles.dropdownText}>Fórum</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropdownItem} onPress={() => goTo('Sobre')}>
              <Text style={styles.dropdownIcon}>ℹ️</Text>
              <Text style={styles.dropdownText}>Sobre</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity style={styles.dropdownItemDanger} onPress={handleSair}>
              <Text style={styles.dropdownIcon}>🚪</Text>
              <Text style={styles.dropdownTextDanger}>Sair</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Glow decorativo */}
      <View pointerEvents="none" style={styles.glowTopRight} />
      <View pointerEvents="none" style={styles.glowBottomLeft} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: {
    paddingHorizontal: Math.max(16, Math.min(24, Math.floor(width * 0.05))),
    paddingTop: 10,
    paddingBottom: 40,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flex: 1, paddingRight: 8 },
  headerRight: { alignItems: 'center' },
  title: {
    fontSize: scale(26),
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  titleEmoji: { fontSize: scale(22) },
  welcome: { fontSize: scale(14), color: COLORS.textMuted },
  welcomeName: { color: COLORS.accent, fontWeight: '800' },
  menuButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bgSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: { fontSize: scale(18), color: COLORS.text },

  /* Alterar nome */
  alterarNomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSoft,
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  inputNome: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    color: COLORS.inputText,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    borderRadius: 10,
    fontSize: scale(16),
    borderWidth: 1,
    borderColor: '#243247',
  },
  btnSalvar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#36cbb9',
  },
  btnSalvarText: {
    color: '#05201d',
    fontWeight: '900',
    fontSize: scale(14),
    letterSpacing: 0.3,
  },

  /* Matérias */
  materiasContainer: { marginTop: 8, marginBottom: 28 },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  materiaCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  materiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  materiaNome: { fontSize: scale(17), fontWeight: '800', color: COLORS.text },
  rightChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rightChipText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: scale(11),
    letterSpacing: 0.3,
  },
  materiaDescricao: { fontSize: scale(13), color: COLORS.textMuted, lineHeight: 20 },

  /* Botão sair */
  btnSair: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bb2d2d',
  },
  btnSairText: { color: '#fff', fontSize: scale(15), fontWeight: '900', letterSpacing: 0.4 },

  /* Dropdown menu */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 9, 15, 0.55)',
  },
  dropdown: {
    position: 'absolute',
    top: 70, // alinhado ao header
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    width: Math.max(220, width * 0.56),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownIcon: { fontSize: scale(16), marginRight: 10 },
  dropdownText: { color: COLORS.text, fontSize: scale(14), fontWeight: '700' },
  dropdownTextDanger: { color: COLORS.danger, fontSize: scale(14), fontWeight: '900' },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  /* Glows decorativos */
  glowTopRight: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    transform: [{ rotate: '15deg' }],
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: 'rgba(255, 213, 74, 0.08)',
    transform: [{ rotate: '-10deg' }],
  },
});
