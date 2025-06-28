import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireTenantAccess } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET all tasks (tenant-filtered) - temporarily removed permission requirement
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assignedTo, search } = req.query;
    const where: any = {
      tenantId: req.user.tenantId // Filter by tenant
    };
    
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (assignedTo && assignedTo !== 'all') where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const tasks = await prisma.task.findMany({ 
      where,
      include: {
        assignedUser: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET single task
router.get('/:id', authenticateToken, requireTenantAccess('task'), async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ 
      where: { id: req.params.id },
      include: {
        assignedUser: true
      }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      tenantId: req.user.tenantId // Automatically assign to user's tenant
    };
    
    const task = await prisma.task.create({ 
      data: taskData,
      include: {
        assignedUser: true
      }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: 'Failed to create task' });
  }
});

// PUT update task
router.put('/:id', authenticateToken, requireTenantAccess('task'), async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        assignedUser: true
      }
    });
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: 'Failed to update task' });
  }
});

// DELETE task
router.delete('/:id', authenticateToken, requireTenantAccess('task'), async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(400).json({ error: 'Failed to delete task' });
  }
});

export default router;