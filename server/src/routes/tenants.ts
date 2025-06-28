import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET tenant details
router.get('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_READ), async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true,
            deals: true,
            tasks: true,
            customers: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// PUT update tenant
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_WRITE), async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        parent: true,
        _count: {
          select: {
            users: true,
            businessUnits: true,
            accounts: true,
            deals: true,
            tasks: true,
            customers: true
          }
        }
      }
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

export default router; 