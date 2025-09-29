# Teste das Regras do Firestore

## Como testar se as regras estão funcionando:

### 1. **Teste de Login/Cadastro:**
- Abra o app
- Tente fazer login ou cadastro
- Verifique se não há mais erros de "Missing or insufficient permissions"

### 2. **Teste no Console do Firebase:**
- Acesse: https://console.firebase.google.com/project/dateperfeito-e93ed/firestore
- Vá em "Rules" para verificar se as regras foram aplicadas
- Vá em "Data" para ver se os documentos `users/{uid}` estão sendo criados

### 3. **Teste de Permissões:**
- Usuário logado deve conseguir:
  - ✅ Ler documentos em `users/{uid}`
  - ✅ Criar documento em `users/{uid}` (próprio uid)
  - ✅ Atualizar documento em `users/{uid}` (próprio uid)
  - ❌ Não conseguir criar/editar documentos de outros usuários

### 4. **Se ainda houver erro:**
- Verifique se o usuário está realmente autenticado
- Verifique se o `uid` está correto
- Verifique se as regras foram deployadas corretamente

## Comandos úteis:

```bash
# Verificar regras atuais
firebase firestore:rules:get

# Deploy das regras
firebase deploy --only firestore:rules

# Ver logs do Firebase
firebase functions:log
```

## Debug no código:

Se ainda houver problemas, adicione logs no AuthProvider:

```typescript
console.log('Firebase User:', firebaseUser);
console.log('User UID:', firebaseUser.uid);
console.log('User Email:', firebaseUser.email);
```

