import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';

type QuestoesRoute = RouteProp<RootStackParamList, 'Questoes'>;

type Flashcard = {
  pergunta: string;
  correta: string;
  alternativas: Record<string, string> | string[];
  traducao?: string;
  observacao?: string;
  materia?: string;
  ordem?: number;
};

const COLLECTION_MAP: Record<string, string> = {
  'Inglês nivel 1': 'Inglês nivel 1',
  'Atualidades': 'atualidades_questoes',
  'Conhecimentos Gerais': 'conhecimentos_gerais',
  'Contabilidade': 'contabilidade_questoes',
  'Direito Administrativo': 'direito_administrativo',
  'Direito Constitucional': 'direito_constitucional',
  'Informática': 'informatica',
  'Inglês': 'ingles_questoes',
  'Matemática': 'matematica',
  'Português': 'portugues_questoes',
  'Raciocínio Lógico': 'raciocinio_Logico',
};

const MATERIAS_COM_TRADUCAO = ['Inglês', 'Inglês nivel 1', 'Inglês nível 2'];

function toAltArray(alt: Flashcard['alternativas']) {
  if (Array.isArray(alt)) {
    return alt.map((texto, i) => ({ letra: String.fromCharCode(65 + i), texto }));
  }
  return Object.entries(alt || {})
    .map(([letra, texto]) => ({ letra, texto }))
    .sort((a, b) => a.letra.localeCompare(b.letra));
}


export default function QuestoesScreen() {
  const route = useRoute<QuestoesRoute>();
  const [materia, setMateria] = useState<string | null>(route.params?.materia ?? null);

  // Debug: Log da matéria recebida
  useEffect(() => {
    console.log('Matéria recebida via rota:', route.params?.materia);
    console.log('Matéria atual no estado:', materia);
    console.log('Mapeamento disponível:', Object.keys(COLLECTION_MAP));
  }, [route.params?.materia, materia]);

  // Teste de conexão com Firestore
  useEffect(() => {
    const testFirestoreConnection = async () => {
      try {
        console.log('Testando conexão com Firestore...');
        const testQuery = query(collection(db, 'usuarios'));
        const testSnap = await getDocs(testQuery);
        console.log('Conexão Firestore OK. Documentos em usuarios:', testSnap.size);
      } catch (error) {
        console.error('Erro na conexão Firestore:', error);
      }
    };
    testFirestoreConnection();
  }, []);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [resposta, setResposta] = useState<Record<number, string | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('Carregando questões...');
  const [showTrad, setShowTrad] = useState(false);

  // Fallback para pegar matéria do AsyncStorage se não veio por rota
  useEffect(() => {
    if (!materia) {
      AsyncStorage.getItem('materiaSelecionada').then((m) => {
        if (m) setMateria(m);
      });
    }
  }, [materia]);

  // Buscar questões
  useEffect(() => {
    (async () => {
      if (!materia) return;
      setLoading(true);
      setMsg('Carregando questões...');
      try {
        const col = COLLECTION_MAP[materia] || 'flashcards';
        console.log(`Buscando questões na coleção: ${col} para matéria: ${materia}`);
        
        let qRef;
        if (col === 'flashcards') {
          qRef = query(collection(db, col), where('materia', '==', materia));
        } else {
          // Primeiro tenta buscar sem ordenação para ver se há dados
          qRef = query(collection(db, col));
        }
        
        const snap = await getDocs(qRef);
        console.log(`Documentos encontrados: ${snap.size}`);
        
        if (snap.empty) {
          setCards([]);
          setMsg(`Nenhum flashcard encontrado para "${materia}" na coleção "${col}".`);
        } else {
          const list: Flashcard[] = [];
          snap.forEach((d) => {
            const data = d.data() as Flashcard;
            console.log('Documento encontrado:', data);
            list.push(data);
          });
          setCards(list);
          setMsg('');
          setIdx(0);
          setResposta({});
          setShowTrad(false);
        }
      } catch (e: any) {
        console.error('Erro ao carregar questões:', e);
        setMsg(`Erro ao carregar: ${e?.message ?? 'desconhecido'}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [materia]);

  const salvarResposta = useCallback(async (card: Flashcard, letra: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('Usuário não autenticado');
        return;
      }

      const isCorrect = letra === card.correta;
      
      // Salvar na coleção answers para KPIs do Perfil
      await addDoc(collection(db, 'answers'), {
        uid: user.uid,
        materia: materia || 'sem_materia',
        correct: isCorrect,
        pergunta: card.pergunta,
        respostaSelecionada: letra,
        respostaCorreta: card.correta,
        createdAt: serverTimestamp(),
      });

      console.log('Resposta salva com sucesso na coleção answers');
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      Alert.alert('Erro', 'Falha ao salvar resposta. Tente novamente.');
    }
  }, [materia]);

  const card = cards[idx];
  const alts = card ? toAltArray(card.alternativas) : [];

  return (
    <View style={s.container}>
      <Text style={s.h1}>Questões</Text>
      <Text style={s.progresso}>
        {cards.length ? `Questão ${idx + 1} de ${cards.length}` : 'Carregando...'}
      </Text>

      <ScrollView contentContainerStyle={s.card}>
        {loading && <Text>{msg}</Text>}
        {!loading && !card && <Text>{msg || '—'}</Text>}
        {!loading && card && (
          <>
            <Text style={s.pergunta}>{card.pergunta}</Text>

            {MATERIAS_COM_TRADUCAO.includes(materia || '') && !!card.traducao && (
              <>
                <Pressable style={s.btnTrad} onPress={() => setShowTrad(v => !v)}>
                  <Text style={s.btnTradTxt}>{showTrad ? 'Ocultar Tradução' : 'Mostrar Tradução'}</Text>
                </Pressable>
                {showTrad && <Text style={s.trad}>{card.traducao}</Text>}
                  </>
                )}

            <View style={s.alts}>
              {alts.map((a) => {
                const r = resposta[idx];
                const isResp = r === a.letra;
                const correta = a.letra === card.correta;
                const disabled = r !== undefined;
                const stateStyle = disabled
                  ? (correta ? s.altCorreta : isResp ? s.altErrada : s.altDisabled)
                  : s.alt;

                return (
                  <Pressable
                    key={a.letra}
                    disabled={disabled}
                    onPress={() => {
                      setResposta((prev) => ({ ...prev, [idx]: a.letra }));
                      salvarResposta(card, a.letra);
                      // auto-avança ao final
                      if (idx === cards.length - 1) {
                        setTimeout(() => {
                          const ac = Object.entries({...resposta, [idx]: a.letra})
                            .filter(([i, letra]) => cards[Number(i)]?.correta === letra).length;
                          const er = Object.entries({...resposta, [idx]: a.letra})
                            .filter(([i, letra]) => letra !== undefined && cards[Number(i)]?.correta !== letra).length;
                          Alert.alert(
                            'Parabéns!',
                            `Você concluiu "${materia}"!\nAcertos: ${ac}\nErros: ${er}`
                          );
                        }, 400);
                      }
                    }}
                    style={stateStyle}
                  >
                    <Text style={s.altTxt}>{a.letra}) {a.texto}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!!card.observacao && <Text style={s.obs}>{card.observacao}</Text>}
            </>
          )}
      </ScrollView>

      <View style={s.nav}>
        <Pressable
          style={[s.btnNav, idx === 0 && s.btnDisabled]}
          disabled={idx === 0}
          onPress={() => { setIdx((v) => Math.max(0, v - 1)); setShowTrad(false); }}
        >
          <Text style={s.btnNavTxt}>Anterior</Text>
        </Pressable>
        {cards.length > 0 && resposta[idx] === undefined && (
          <Pressable style={s.btnNav} onPress={() => setResposta((p) => ({ ...p, [idx]: 'MOSTRAR' }))}>
            <Text style={s.btnNavTxt}>Mostrar Resposta</Text>
          </Pressable>
        )}
        <Pressable
          style={[s.btnNav, (idx === cards.length - 1 && resposta[idx] !== undefined) && s.btnDisabled]}
          disabled={idx === cards.length - 1 && resposta[idx] !== undefined}
          onPress={() => { setIdx((v) => Math.min(cards.length - 1, v + 1)); setShowTrad(false); }}
        >
          <Text style={s.btnNavTxt}>Próxima</Text>
        </Pressable>
      </View>

      <Text style={s.disclaimer}>
        As questões apresentadas são baseadas em informações e reformuladas para fins de estudo,
        não sendo cópias exatas de provas ou materiais originais.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#111',padding:16},
  h1:{fontSize:24,fontWeight:'700',color:'#f8f8f8',textAlign:'center',marginTop:8,marginBottom:8},
  progresso:{fontSize:14,color:'#c9c9c9',textAlign:'center',marginBottom:8},
  card:{backgroundColor:'rgba(255,255,255,0.08)',borderRadius:14,padding:16},
  pergunta:{fontSize:18,color:'#ffda47',fontWeight:'700',marginBottom:12},
  alts:{gap:10,marginTop:8},
  alt:{backgroundColor:'rgba(255,255,255,0.15)',padding:12,borderRadius:10},
  altDisabled:{backgroundColor:'rgba(255,255,255,0.12)',padding:12,borderRadius:10,opacity:.9},
  altCorreta:{backgroundColor:'#2ecc71',padding:12,borderRadius:10},
  altErrada:{backgroundColor:'#e74c3c',padding:12,borderRadius:10},
  altTxt:{color:'#fff',fontSize:16},
  obs:{marginTop:12,color:'#bbb',fontStyle:'italic',backgroundColor:'rgba(0,0,0,0.35)',padding:10,borderRadius:8},
  nav:{flexDirection:'row',gap:8,justifyContent:'center',marginTop:10},
  btnNav:{backgroundColor:'#3498db',paddingVertical:10,paddingHorizontal:16,borderRadius:10},
  btnDisabled:{backgroundColor:'#7f8c8d'},
  btnNavTxt:{color:'#fff',fontWeight:'600'},
  disclaimer:{marginTop:14,color:'#999',fontSize:12,textAlign:'center'},
  btnTrad:{alignSelf:'flex-start',backgroundColor:'#2c3e50',paddingVertical:6,paddingHorizontal:10,borderRadius:8,marginBottom:8},
  btnTradTxt:{color:'#fff'},
  trad:{color:'#f1c40f',backgroundColor:'rgba(0,0,0,0.35)',padding:8,borderRadius:8,marginBottom:8},
});