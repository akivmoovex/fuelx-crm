import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks
router.get('/', async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
});

// Add a task
router.post('/', async (req, res) => {
  try {
    const task = await prisma.task.create({ data: req.body });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Edit a task
router.put('/:id', async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await prisma.task.delete({
      where: { id: req.params.id },
    });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;