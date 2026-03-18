const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ---- Fazer migrations automaticamente ao iniciar ----
async function runMigrations() {
  try {
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('✅ Banco de dados conectado');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error);
  }
}

runMigrations();

app.get('/tasks', async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const { text, date, priority } = req.body;
  const task = await prisma.task.create({
    data: { text, date, priority }
  });
  res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const task = await prisma.task.update({
    where: { id: parseInt(id) },
    data: { completed }
  });
  res.json(task);
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.task.delete({ where: { id: parseInt(id) } });
  res.json({ message: 'Deleted' });
});

app.delete('/tasks', async (req, res) => {
  await prisma.task.deleteMany();
  res.json({ message: 'All tasks deleted' });
});

app.listen(3000, () => console.log('Server running on port 3000'));