import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET all business units (tenant-filtered, but SYSTEM_ADMIN sees all)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.BUSINESS_UNITS_READ), async (req, res) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    
    // SYSTEM_ADMIN can see all business units, others are filtered by tenant
    if (req.user.role !== 'SYSTEM_ADMIN') {
      where.tenantId = req.user.tenantId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const businessUnits = await prisma.businessUnit.findMany({
      where,
      include: {
        tenant: {
          select: { name: true }
        },
        manager: {
          select: { firstName: true, lastName: true, email: true }
        },
        users: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        accounts: {
          select: { id: true, name: true, status: true }
        }
      }
    });
    
    res.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    res.status(500).json({ error: 'Failed to fetch business units' });
  }
});

// GET single business unit
router.get('/:id', authenticateToken, requirePermission(PERMISSIONS.BUSINESS_UNITS_READ), requireTenantAccess('businessUnit'), async (req, res) => {
  try {
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: {
          select: { name: true }
        },
        manager: {
          select: { firstName: true, lastName: true, email: true }
        },
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        accounts: {
          select: { id: true, name: true, status: true, type: true }
        }
      }
    });
    
    if (!businessUnit) {
      return res.status(404).json({ error: 'Business unit not found' });
    }
    
    res.json(businessUnit);
  } catch (error) {
    console.error('Error fetching business unit:', error);
    res.status(500).json({ error: 'Failed to fetch business unit' });
  }
});

// POST new business unit (SYSTEM_ADMIN only)
router.post('/', authenticateToken, requirePermission(PERMISSIONS.BUSINESS_UNITS_WRITE), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN can create business units
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only system administrators can create business units' });
    }

    const businessUnitData = {
      ...req.body,
      tenantId: req.body.tenantId || req.user.tenantId // Use provided tenant or user's tenant
    };

    const businessUnit = await prisma.businessUnit.create({
      data: businessUnitData,
      include: {
        tenant: {
          select: { name: true }
        },
        manager: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json(businessUnit);
  } catch (error) {
    console.error('Error creating business unit:', error);
    res.status(500).json({ error: 'Failed to create business unit' });
  }
});

// PUT update business unit (SYSTEM_ADMIN only)
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.BUSINESS_UNITS_WRITE), requireTenantAccess('businessUnit'), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN can edit business units
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only system administrators can edit business units' });
    }

    const businessUnit = await prisma.businessUnit.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        tenant: {
          select: { name: true }
        },
        manager: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json(businessUnit);
  } catch (error) {
    console.error('Error updating business unit:', error);
    res.status(500).json({ error: 'Failed to update business unit' });
  }
});

// DELETE business unit (SYSTEM_ADMIN only)
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.BUSINESS_UNITS_DELETE), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN can delete business units
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only system administrators can delete business units' });
    }

    // First check if the business unit exists
    const existingBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, firstName: true, lastName: true } },
        accounts: { select: { id: true, name: true } }
      }
    });

    if (!existingBusinessUnit) {
      return res.status(404).json({ error: 'Business unit not found' });
    }

    // Check if business unit has associated users or accounts
    const hasUsers = existingBusinessUnit.users.length > 0;
    const hasAccounts = existingBusinessUnit.accounts.length > 0;
    
    if (hasUsers || hasAccounts) {
      let errorMessage = 'Cannot delete business unit because it has:';
      if (hasUsers) {
        errorMessage += ` ${existingBusinessUnit.users.length} user(s)`;
      }
      if (hasAccounts) {
        errorMessage += ` ${existingBusinessUnit.accounts.length} account(s)`;
      }
      errorMessage += ' associated with it. Please reassign or delete these items first.';
      
      return res.status(400).json({ error: errorMessage });
    }

    await prisma.businessUnit.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting business unit:', error);
    res.status(500).json({ error: 'Failed to delete business unit' });
  }
});

export default router;