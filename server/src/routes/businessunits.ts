import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    const units = await prisma.businessUnit.findMany({ where });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business units' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const unit = await prisma.businessUnit.findUnique({ where: { id: req.params.id } });
    if (!unit) return res.status(404).json({ error: 'Business unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business unit' });
  }
});

router.post('/', async (req, res) => {
  try {
    const unit = await prisma.businessUnit.create({ data: req.body });
    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create business unit' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const unit = await prisma.businessUnit.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(unit);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update business unit' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.businessUnit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete business unit' });
  }
});

export default router;