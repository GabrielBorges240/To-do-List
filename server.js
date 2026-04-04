const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "10mb" }));

mongoose.connect("mongodb+srv://By37LUKA22mst9aQ:dV1TDYf0dIWuqhXP@cluster0.wyhvpst.mongodb.net/todolist", {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch(err => console.error("Erro MongoDB:", err));

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB desconectado. Tentando reconectar...");
});

// 📦 MODEL — com category e dueDate
const taskSchema = new mongoose.Schema({
  text:      { type: String, required: true, trim: true },
  date:      { type: String, default: "" },
  priority:  { type: String, default: "low", enum: ["low", "medium", "high"] },
  category:  { type: String, default: null },
  dueDate:   { type: String, default: null },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", taskSchema);

// ROTA RAIZ
app.get("/", (req, res) => {
  res.send("API está funcionando 🚀");
});

// GET - ordenado
app.get("/tasks", async (req, res) => {
  try {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const tasks = await Task.find().lean();

    tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority?.toLowerCase()] ?? 0;
      const pb = priorityOrder[b.priority?.toLowerCase()] ?? 0;
      if (pb !== pa) return pb - pa;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(tasks);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

// POST
app.post("/tasks", async (req, res) => {
  try {
    const { text, date, priority, category, dueDate } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Texto da tarefa é obrigatório" });
    }

    const finalPriority = ["low", "medium", "high"].includes(priority) ? priority : "low";
    const finalCategory = category ? category.trim() : null;

    const newTask = new Task({
      text: text.trim(),
      date: date || "",
      priority: finalPriority,
      category: finalCategory,
      dueDate: dueDate || null,
      completed: false
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

// PUT — agora aceita category também
app.put("/tasks/:id", async (req, res) => {
  try {
    const { completed, category } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de tarefa inválido" });
    }

    const updateData = {};
    if (completed !== undefined) updateData.completed = Boolean(completed);
    if (category !== undefined) updateData.category = category.trim();

    const task = await Task.findByIdAndUpdate(id, updateData, { new: true });

    if (!task) return res.status(404).json({ error: "Tarefa não encontrada" });

    res.json(task);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
});

// DELETE por id
app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de tarefa inválido" });
    }

    const result = await Task.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: "Tarefa não encontrada" });

    res.sendStatus(204);
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    res.status(500).json({ error: "Erro ao deletar tarefa" });
  }
});

// DELETE ALL
app.delete("/tasks", async (req, res) => {
  try {
    const result = await Task.deleteMany();
    res.json({ deletedCount: result.deletedCount, message: "Todas as tarefas foram deletadas" });
  } catch (error) {
    console.error("Erro ao deletar todas as tarefas:", error);
    res.status(500).json({ error: "Erro ao deletar tarefas" });
  }
});

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
