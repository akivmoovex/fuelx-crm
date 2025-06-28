import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { stage, assignedTo, search } = req.query;
    const where: any = {};
    if (stage && stage !== 'all') where.stage = stage;
    if (assignedTo && assignedTo !== 'all') where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    const deals = await prisma.deal.findMany({ where });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const deal = await prisma.deal.create({ data: req.body });
    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create deal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update deal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete deal' });
  }
});

export default router;