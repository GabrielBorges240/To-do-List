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

app.use(express.json());

// 🔗 CONEXÃO MONGODB
mongoose.connect("mongodb+srv://By37LUKA22mst9aQ:dV1TDYf0dIWuqhXP@cluster0.wyhvpst.mongodb.net/todolist")
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch(err => console.error("Erro MongoDB:", err));

// 📦 MODEL
const Task = mongoose.model("Task", {
  text: String,
  date: String,
  priority: String,
  completed: Boolean
});

// ROTA RAIZ
app.get("/", (req, res) => {
  res.send("API está funcionando 🚀");
});

// GET (Mongo)
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// POST (Mongo)
app.post("/tasks", async (req, res) => {
  const newTask = new Task({
    text: req.body.text,
    date: req.body.date || "",
    priority: req.body.priority || "baixa",
    completed: false
  });

  await newTask.save();
  res.json(newTask);
});

// PUT (Mongo)
app.put("/tasks/:id", async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { completed: req.body.completed },
    { new: true }
  );

  res.json(task);
});

// DELETE (Mongo)
app.delete("/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// DELETE ALL
app.delete("/tasks", async (req, res) => {
  await Task.deleteMany();
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});