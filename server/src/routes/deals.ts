import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireTenantAccess } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET all deals (tenant-filtered) - temporarily removed permission requirement
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { stage, assignedTo, search } = req.query;
    const where: any = {
      tenantId: req.user.tenantId // Filter by tenant
    };
    
    if (stage && stage !== 'all') where.stage = stage;
    if (assignedTo && assignedTo !== 'all') where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const deals = await prisma.deal.findMany({ 
      where,
      include: {
        customer: true,
        account: true,
        assignedUser: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// GET single deal
router.get('/:id', authenticateToken, requireTenantAccess('deal'), async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({ 
      where: { id: req.params.id },
      include: {
        customer: true,
        account: true,
        assignedUser: true
      }
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// POST new deal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const dealData = {
      ...req.body,
      tenantId: req.user.tenantId // Automatically assign to user's tenant
    };
    
    const deal = await prisma.deal.create({ 
      data: dealData,
      include: {
        customer: true,
        account: true,
        assignedUser: true
      }
    });
    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(400).json({ error: 'Failed to create deal' });
  }
});

// PUT update deal
router.put('/:id', authenticateToken, requireTenantAccess('deal'), async (req, res) => {
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        customer: true,
        account: true,
        assignedUser: true
      }
    });
    res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(400).json({ error: 'Failed to update deal' });
  }
});

// DELETE deal
router.delete('/:id', authenticateToken, requireTenantAccess('deal'), async (req, res) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(400).json({ error: 'Failed to delete deal' });
  }
});

export default router;