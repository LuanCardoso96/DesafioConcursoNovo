# Deploy das Regras do Firestore

## Como aplicar as regras de segurança

### 1. Instalar Firebase CLI (se não tiver)
```bash
npm install -g firebase-tools
```

### 2. Fazer login no Firebase
```bash
firebase login
```

### 3. Inicializar projeto Firebase (se não tiver)
```bash
firebase init firestore
```

### 4. Deploy das regras
```bash
firebase deploy --only firestore:rules
```

## Regras implementadas

### ✅ Coleções protegidas:
- **users** - Apenas o próprio usuário pode editar
- **forumPosts** - Usuários logados podem criar, apenas dono pode editar/deletar
- **forumPosts/{postId}/comments** - Usuários logados podem comentar
- **friendRequests** - Sistema de amizades seguro
- **friendships** - Amizades confirmadas
- **chats/{chatId}/messages** - Chat privado entre amigos
- **notifications** - Notificações do sistema
- **answers** - Respostas para KPIs

### ✅ Questões por matéria:
- **Leitura pública** - Qualquer um pode ler questões
- **Escrita restrita** - Apenas admins podem criar/editar/deletar

### ✅ Validações implementadas:
- Tamanho máximo de posts (500 chars)
- Tamanho máximo de comentários (200 chars)
- Tamanho máximo de mensagens (1000 chars)
- Verificação de autenticação
- Verificação de propriedade

## Testando as regras

### 1. Teste de leitura (deve funcionar)
- Carregar questões
- Ver posts do fórum
- Ver perfil de usuários

### 2. Teste de escrita (deve funcionar se logado)
- Publicar post no fórum
- Comentar em posts
- Atualizar bio
- Aceitar/rejeitar amizades

### 3. Teste de segurança (deve falhar)
- Tentar editar post de outro usuário
- Tentar acessar chat sem ser amigo
- Tentar criar questões sem ser admin

## Comandos úteis

```bash
# Ver regras atuais
firebase firestore:rules:get

# Testar regras localmente
firebase emulators:start --only firestore

# Ver logs de deploy
firebase deploy --only firestore:rules --debug
```

## Troubleshooting

### Erro "permission-denied"
- Verificar se usuário está logado
- Verificar se tem permissão para a operação
- Verificar se dados estão no formato correto

### Erro "failed-precondition"
- Verificar se campos obrigatórios estão presentes
- Verificar se tipos de dados estão corretos
- Verificar se tamanhos estão dentro dos limites

### Erro "unavailable"
- Serviço temporariamente indisponível
- Tentar novamente em alguns minutos

