# Workflow and Decisions

## **Abordagens sugeridas:**

### **1. Cloud Tasks (Recomendada) ⭐**

**Como funciona:**
- Backend salva emails no banco com `status: pending`
- Cria 1 task para cada email no Cloud Tasks
- Tasks dispara Cloud Function que envia email e atualiza status
- Configure rate: `0.1 dispatches/second` (1 a cada 10s)

**Prós:**
- ✅ Rate limit nativo e configurável
- ✅ Retry automático
- ✅ Não trava backend (assíncrono)
- ✅ Controle fino por email

**Contras:**
- ❌ Criar muitas tasks pode demorar (mas não trava)

---

### **2. Pub/Sub + Cloud Scheduler**

**Como funciona:**
- Backend salva emails no banco com `status: pending`
- Cloud Scheduler roda a cada 10s
- Cloud Function busca 1 email pending e envia
- Atualiza status para `sent`

**Prós:**
- ✅ Simples de implementar
- ✅ Rate limit controlado pelo Scheduler
- ✅ Não trava backend

**Contras:**
- ❌ Menos eficiente (query a cada 10s mesmo sem emails)
- ❌ Precisa gerenciar concorrência manual

---

### **3. Cron Job no próprio backend (Não recomendado)**

**Como funciona:**
- Backend tem cron que roda a cada 10s
- Busca 1 email pending e envia

**Prós:**
- ✅ Mais simples (tudo no backend)

**Contras:**
- ❌ Backend precisa ficar rodando 24/7
- ❌ Não escala bem
- ❌ Pode travar se backend cair

---

## **Comparação:**

| Aspecto | Cloud Tasks | Pub/Sub + Scheduler | Cron no Backend |
|---------|-------------|---------------------|-----------------|
| **Rate control** | ⭐⭐⭐ Nativo | ⭐⭐ Manual | ⭐ Manual |
| **Escalabilidade** | ⭐⭐⭐ Excelente | ⭐⭐ Boa | ⭐ Limitada |
| **Confiabilidade** | ⭐⭐⭐ Alta | ⭐⭐ Média | ⭐ Depende do backend |
| **Custo** | ⭐⭐ Médio | ⭐⭐ Médio | ⭐⭐⭐ Menor |
| **Complexidade** | ⭐⭐ Média | ⭐⭐ Média | ⭐⭐⭐ Simples |
| **Retry** | ⭐⭐⭐ Automático | ⭐⭐ Manual | ⭐ Manual |

---

## **Recomendação final:**

**Use Cloud Tasks** porque:
1. Rate limit nativo (configure e esqueça)
2. Não trava backend (totalmente assíncrono)
3. Retry automático se email falhar
4. Escala automaticamente

---

## **Respostas:**

### **1. Backend pode travar ao salvar muitos emails?**

**Sim, pode!** Se CSV tem 100k emails e você faz:

```typescript
for (const email of emails) {
  await db.insert(email); // ❌ Trava
}
```

**Solução:**
- ✅ Use **bulk insert** (insere vários de uma vez)
- ✅ Processe em **background** (retorna resposta rápido)
- ✅ Use **streaming** para CSVs grandes

```typescript
// ✅ Bom
async function uploadCSV(file) {
  // Retorna rápido
  response.send({ message: 'Processando...' });
  
  // Processa em background
  processInBackground(async () => {
    const emails = await parseCSV(file);
    
    // Bulk insert (1000 por vez)
    for (let i = 0; i < emails.length; i += 1000) {
      await db.batchInsert(emails.slice(i, i + 1000));
    }
  });
}
```

---

### **2. Disparo de email pode travar backend?**

**Sim, se fizer síncrono!**

```typescript
// ❌ Ruim - trava
app.post('/upload', async (req, res) => {
  const emails = await saveToDatabase(req.file);
  
  for (const email of emails) {
    await sendEmail(email); // ❌ Trava aqui
  }
  
  res.send('Done'); // Usuário espera eternamente
});
```

**Solução:**
```typescript
// ✅ Bom - não trava
app.post('/upload', async (req, res) => {
  const emails = await saveToDatabase(req.file);
  
  // Criar tasks (não espera completar)
  createTasksInBackground(emails);
  
  res.send('Processando emails...'); // Retorna rápido
});
```

---

## **Arquitetura recomendada:**

```
1. Frontend upload CSV
   ↓
2. Backend salva no DB + retorna "Processando..."
   ↓
3. Backend cria Cloud Tasks (background)
   ↓
4. Cloud Tasks dispara Cloud Function
   ↓
5. Cloud Function envia email (1 a cada 10s)
   ↓
6. Atualiza status no DB
```

**Código exemplo:**

```typescript
// Backend - Upload
@Post('upload-csv')
async uploadCSV(@UploadedFile() file) {
  // Salva no DB (bulk insert)
  const emails = await this.emailService.bulkInsert(file);
  
  // Cria tasks em background (não espera)
  this.taskService.createEmailTasks(emails);
  
  return { message: 'Processando emails...', total: emails.length };
}

// Task Service
async createEmailTasks(emails) {
  const limit = pLimit(50); // 50 por vez
  
  const tasks = emails.map(email => 
    limit(() => 
      this.cloudTasks.create({
        url: 'https://REGION-PROJECT.cloudfunctions.net/sendEmail',
        body: { emailId: email.id },
      })
    )
  );
  
  // Não espera completar
  Promise.all(tasks).catch(console.error);
}

// Cloud Function
export async function sendEmail(req, res) {
  const { emailId } = req.body;
  
  const email = await db.getEmail(emailId);
  await emailProvider.send(email);
  await db.updateStatus(emailId, 'sent');
  
  res.send('OK');
}
```

**Resumo:** Cloud Tasks + Cloud Function = backend nunca trava! 🚀