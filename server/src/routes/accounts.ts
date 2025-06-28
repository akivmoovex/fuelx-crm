import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET all accounts (tenant-filtered, but SYSTEM_ADMIN sees all)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_READ), async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const where: any = {};
    
    // SYSTEM_ADMIN can see all accounts, others are filtered by tenant
    if (req.user.role !== 'SYSTEM_ADMIN') {
      where.tenantId = req.user.tenantId;
      
      // Add role-based filtering
      if (req.user.role === 'SALES_REP') {
        // Sales reps can only see accounts they manage
        where.accountManagerId = req.user.id;
      } else if (req.user.role === 'SALES_MANAGER' && req.user.businessUnitId) {
        // Sales managers can see accounts in their business unit
        where.businessUnitId = req.user.businessUnitId;
      }
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { industry: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const accounts = await prisma.account.findMany({
      where,
      include: {
        businessUnit: {
          select: { name: true, location: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
        },
        tenant: {
          select: { name: true }
        }
      }
    });
    
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET single account
router.get('/:id', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_READ), requireTenantAccess('account'), async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        businessUnit: {
          select: { name: true, location: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
        },
        contactPersons: true,
        tenant: {
          select: { name: true }
        }
      }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// POST new account (SYSTEM_ADMIN or SALES_MANAGER only)
router.post('/', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_WRITE), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN or SALES_MANAGER can create accounts
    if (!['SYSTEM_ADMIN', 'SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only system administrators or sales managers can create accounts' });
    }

    const accountData = {
      ...req.body,
      tenantId: req.user.tenantId // Automatically assign to user's tenant
    };

    // If user is SALES_MANAGER, ensure account is assigned to their business unit
    if (req.user.role === 'SALES_MANAGER' && req.user.businessUnitId) {
      accountData.businessUnitId = req.user.businessUnitId;
    }

    const account = await prisma.account.create({
      data: accountData,
      include: {
        businessUnit: {
          select: { name: true, location: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
        },
        tenant: {
          select: { name: true }
        }
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT update account (SYSTEM_ADMIN or SALES_MANAGER only)
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_WRITE), requireTenantAccess('account'), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN or SALES_MANAGER can edit accounts
    if (!['SYSTEM_ADMIN', 'SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only system administrators or sales managers can edit accounts' });
    }

    // If user is SALES_MANAGER, ensure they can only edit accounts in their business unit
    if (req.user.role === 'SALES_MANAGER') {
      const account = await prisma.account.findUnique({
        where: { id: req.params.id }
      });
      
      if (!account || account.businessUnitId !== req.user.businessUnitId) {
        return res.status(403).json({ error: 'You can only edit accounts in your business unit' });
      }
    }

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        businessUnit: {
          select: { name: true, location: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
        },
        tenant: {
          select: { name: true }
        }
      }
    });

    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE account (SYSTEM_ADMIN or SALES_MANAGER only)
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_DELETE), requireTenantAccess('account'), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN or SALES_MANAGER can delete accounts
    if (!['SYSTEM_ADMIN', 'SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only system administrators or sales managers can delete accounts' });
    }

    // If user is SALES_MANAGER, ensure they can only delete accounts in their business unit
    if (req.user.role === 'SALES_MANAGER') {
      const account = await prisma.account.findUnique({
        where: { id: req.params.id }
      });
      
      if (!account || account.businessUnitId !== req.user.businessUnitId) {
        return res.status(403).json({ error: 'You can only delete accounts in your business unit' });
      }
    }

    await prisma.account.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;