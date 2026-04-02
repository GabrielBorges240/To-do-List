const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// CORS (corrigido)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "10mb" }));

// 🔗 CONEXÃO MONGODB (otimizada)
mongoose.connect("mongodb+srv://By37LUKA22mst9aQ:dV1TDYf0dIWuqhXP@cluster0.wyhvpst.mongodb.net/todolist", {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch(err => console.error("Erro MongoDB:", err));

// Monitorar desconexões
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB desconectado. Tentando reconectar...");
});

// 📦 MODEL
const taskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  date: { type: String, default: "" },
  priority: { type: String, default: "low", enum: ["low", "medium", "high"] },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", taskSchema);

// ROTA RAIZ
app.get("/", (req, res) => {
  res.send("API está funcionando 🚀");
});

// GET (Mongo) - com tratamento de erro
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().lean(); // .lean() para melhor performance
    res.json(tasks);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

// POST (Mongo) - com validação
app.post("/tasks", async (req, res) => {
  try {
    const { text, date, priority } = req.body;

    // Validação
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Texto da tarefa é obrigatório" });
    }

    const newTask = new Task({
      text: text.trim(),
      date: date || "",
      priority: priority && ["low", "medium", "high"].includes(priority) ? priority : "low",
      completed: false
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

// PUT (Mongo) - com erro handling
app.put("/tasks/:id", async (req, res) => {
  try {
    const { completed } = req.body;
    const { id } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de tarefa inválido" });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { completed: Boolean(completed) },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Tarefa não encontrada" });
    }

    res.json(task);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
});

// DELETE (Mongo) - com erro handling
app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de tarefa inválido" });
    }

    const result = await Task.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: "Tarefa não encontrada" });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    res.status(500).json({ error: "Erro ao deletar tarefa" });
  }
});

// DELETE ALL - com confirmação
app.delete("/tasks", async (req, res) => {
  try {
    const result = await Task.deleteMany();
    res.json({ deletedCount: result.deletedCount, message: "Todas as tarefas foram deletadas" });
  } catch (error) {
    console.error("Erro ao deletar todas as tarefas:", error);
    res.status(500).json({ error: "Erro ao deletar tarefas" });
  }
});


// Middleware de erro global
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Erro interno do servidor" 
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM recebido. Encerrando servidor...");
  server.close(() => {
    console.log("Servidor encerrado");
    mongoose.connection.close();
    process.exit(0);
  });
});