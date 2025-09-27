import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Clipboard from '@react-native-clipboard/clipboard';

export default function SobreScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    const email = 'contato@passeconcurso.com';
    // Clipboard.setString(email);
    setCopied(true);
    Alert.alert('Sucesso', `Email: ${email}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWebsite = () => {
    const url = 'https://passeconcurso.com';
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o site');
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Baixe o PasseConcurso - O melhor app para estudar para concursos!',
        url: 'https://passeconcurso.com',
        title: 'PasseConcurso',
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Avaliar App',
      'Gostou do PasseConcurso? Deixe sua avaliação na loja!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Avaliar',
          onPress: () => {
            // Aqui você pode implementar a lógica para abrir a loja
            Alert.alert('Obrigado!', 'Sua avaliação é muito importante para nós!');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PC</Text>
          </View>
          <Text style={styles.appName}>PasseConcurso</Text>
          <Text style={styles.version}>Versão 1.0.0</Text>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          <Text style={styles.description}>
            O PasseConcurso é a plataforma definitiva para quem está se preparando 
            para concursos públicos. Com questões atualizadas, estatísticas detalhadas 
            e uma comunidade ativa, você terá tudo que precisa para alcançar a aprovação.
          </Text>
        </View>

        {/* Funcionalidades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funcionalidades</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📚</Text>
              <Text style={styles.featureText}>Questões por matéria</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Estatísticas detalhadas</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💬</Text>
              <Text style={styles.featureText}>Fórum da comunidade</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👥</Text>
              <Text style={styles.featureText}>Sistema de amizades</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💬</Text>
              <Text style={styles.featureText}>Chat privado</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Acompanhamento de progresso</Text>
            </View>
          </View>
        </View>

        {/* Materias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matérias Disponíveis</Text>
          <View style={styles.materiasGrid}>
            {[
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
            ].map((materia, index) => (
              <View key={index} style={styles.materiaCard}>
                <Text style={styles.materiaText}>{materia}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Pressable style={styles.contactButton} onPress={handleCopyEmail}>
              <Text style={[styles.contactValue, copied && styles.contactValueCopied]}>
                contato@passeconcurso.com
              </Text>
            </Pressable>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Website:</Text>
            <Pressable style={styles.contactButton} onPress={handleOpenWebsite}>
              <Text style={styles.contactValue}>passeconcurso.com</Text>
            </Pressable>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionButtonText}>Compartilhar App</Text>
          </Pressable>
          
          <Pressable style={styles.actionButton} onPress={handleRateApp}>
            <Text style={styles.actionButtonText}>Avaliar App</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 PasseConcurso. Todos os direitos reservados.
          </Text>
          <Text style={styles.footerText}>
            Desenvolvido com ❤️ para estudantes de concursos.
          </Text>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  appName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    color: '#999',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  materiasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materiaCard: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  materiaText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactLabel: {
    color: '#999',
    fontSize: 16,
    minWidth: 60,
  },
  contactButton: {
    flex: 1,
  },
  contactValue: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  contactValueCopied: {
    color: '#2ecc71',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});