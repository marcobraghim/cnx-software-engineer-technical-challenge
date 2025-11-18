## **Problema:**

Esse código **pode derrubar seu backend** se muitas pessoas fizerem upload simultâneo porque:

1. ❌ **Memória explode** - Cada CSV enorme carrega na RAM
2. ❌ **CPU saturada** - Múltiplos `parseCSV()` rodando juntos
3. ❌ **DB sobrecarregado** - Múltiplos bulk inserts simultâneos
4. ❌ **Sem limite de concorrência** - Aceita uploads ilimitados

---

## **Soluções:**

### **1. Offload para Cloud Storage + Cloud Function (Recomendada) ⭐⭐⭐**

```typescript
// Backend - só faz upload pro Storage
async function uploadCSV(file) {
  // Upload pro Cloud Storage (rápido, não processa)
  const fileName = `uploads/${Date.now()}-${file.originalname}`;
  await storage.bucket('my-bucket').upload(file.path, {
    destination: fileName,
  });
  
  // Salva registro no DB
  const job = await db.jobs.create({
    fileName,
    status: 'pending',
    uploadedAt: new Date(),
  });
  
  // Retorna imediatamente
  return { message: 'Arquivo recebido!', jobId: job.id };
}

// Cloud Function - processa quando tem recurso
export async function processCSV(event) {
  const file = event.data; // Trigger automático
  
  // Streaming (não carrega tudo na memória)
  const stream = storage.bucket('my-bucket').file(file.name).createReadStream();
  
  let batch = [];
  
  stream
    .pipe(csv())
    .on('data', async (row) => {
      batch.push(row);
      
      if (batch.length >= 1000) {
        await db.batchInsert(batch);
        batch = [];
      }
    })
    .on('end', async () => {
      if (batch.length > 0) {
        await db.batchInsert(batch);
      }
      await db.jobs.update(file.jobId, { status: 'completed' });
    });
}
```

**Por quê é melhor:**
- ✅ Backend só faz upload (segundos)
- ✅ Cloud Function processa (escala automaticamente)
- ✅ Streaming (não estoura memória)
- ✅ Cada upload tem recursos isolados

---

### **2. Fila de processamento com concorrência limitada ⭐⭐**

```typescript
import pLimit from 'p-limit';
import { Queue } from 'bull'; // ou BullMQ

const uploadQueue = new Queue('csv-uploads', {
  redis: { host: 'localhost', port: 6379 },
  limiter: {
    max: 3, // Apenas 3 uploads processando por vez
    duration: 1000,
  },
});

// Backend
async function uploadCSV(file) {
  // Adiciona na fila
  const job = await uploadQueue.add({
    filePath: file.path,
    userId: req.user.id,
  });
  
  return { message: 'Na fila de processamento', jobId: job.id };
}

// Worker (pode rodar em outro servidor)
uploadQueue.process(3, async (job) => {
  const { filePath } = job.data;
  
  // Streaming
  const emails = [];
  await parseCSVStream(filePath, async (batch) => {
    await db.batchInsert(batch);
    job.progress(batch.length); // Atualiza progresso
  });
  
  return { processed: emails.length };
});
```

**Por quê é melhor:**
- ✅ Limita processamento simultâneo (3 por vez)
- ✅ Backend não processa (só enfileira)
- ✅ Worker pode estar em outro servidor
- ✅ Usuário pode consultar progresso

---

### **3. Pub/Sub + múltiplas Cloud Functions ⭐⭐**

```typescript
// Backend
async function uploadCSV(file) {
  const fileName = await uploadToStorage(file);
  
  // Publica evento
  await pubsub.topic('csv-uploaded').publish(
    Buffer.from(JSON.stringify({ fileName }))
  );
  
  return { message: 'Processando...' };
}

// Cloud Function (escala automaticamente)
export async function processCSVPubSub(message) {
  const { fileName } = JSON.parse(
    Buffer.from(message.data, 'base64').toString()
  );
  
  // Processa com streaming
  await processFileWithStreaming(fileName);
}
```

---

### **4. Melhorar código atual (mínimo) ⭐**

```typescript
import pLimit from 'p-limit';

// Limitar uploads simultâneos globalmente
const uploadLimit = pLimit(5); // Máximo 5 processando

async function uploadCSV(file) {
  return uploadLimit(async () => {
    response.send({ message: 'Processando...' });
    
    // Streaming (não carrega tudo)
    const emails = [];
    await parseCSVStream(file, async (batch) => {
      await db.batchInsert(batch);
    });
  });
}

// Parse com streaming
async function parseCSVStream(file, onBatch) {
  return new Promise((resolve, reject) => {
    let batch = [];
    
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', async (row) => {
        batch.push(row);
        
        if (batch.length >= 1000) {
          await onBatch(batch);
          batch = [];
        }
      })
      .on('end', async () => {
        if (batch.length > 0) await onBatch(batch);
        resolve();
      })
      .on('error', reject);
  });
}
```

---

## **Comparação:**

| Abordagem | Escala | Complexidade | Custo | Backend trava? |
|-----------|--------|--------------|-------|----------------|
| **Cloud Storage + Function** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ❌ Não |
| **Fila (Bull/Redis)** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ Não |
| **Pub/Sub** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ❌ Não |
| **Limite + Streaming** | ⭐ | ⭐ | ⭐⭐⭐ | ⚠️ Pode |

---

## **Recomendação final:**

**Use Cloud Storage + Cloud Function:**

```
1. User upload → Backend → Cloud Storage (rápido)
2. Storage trigger → Cloud Function (automático)
3. Cloud Function processa streaming
4. Insere no DB + cria Cloud Tasks
```

**Arquitetura completa:**

```
┌─────────┐
│ Upload  │ → Backend (só salva no Storage)
└─────────┘         ↓
              Cloud Storage
                    ↓ (trigger)
              Cloud Function
              (processa CSV)
                    ↓
              Database (bulk insert)
                    ↓
              Cloud Tasks
              (1 task por email)
                    ↓
              Cloud Function
              (envia email 1 a cada 10s)
```

**Vantagens:**
- ✅ Backend **nunca** trava
- ✅ Escala automaticamente
- ✅ Cada upload isolado
- ✅ Pode processar milhões de CSVs simultâneos

**Custo estimado:**
- 1 milhão de emails processados: ~$5-10 USD

Quer um exemplo de código completo dessa arquitetura? 🚀