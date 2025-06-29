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
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
        { taxNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const accounts = await prisma.account.findMany({
      where,
      include: {
        tenant: {
          select: { name: true }
        },
        businessUnit: {
          select: { name: true, city: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
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
        tenant: {
          select: { name: true }
        },
        businessUnit: {
          select: { name: true, city: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
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

// POST new account
router.post('/', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const accountData = {
      ...req.body,
      tenantId: req.body.tenantId || req.user.tenantId // Use provided tenant or user's tenant
    };

    const account = await prisma.account.create({
      data: accountData,
      include: {
        tenant: {
          select: { name: true }
        },
        businessUnit: {
          select: { name: true, city: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT update account
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_WRITE), requireTenantAccess('account'), async (req, res) => {
  try {
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        tenant: {
          select: { name: true }
        },
        businessUnit: {
          select: { name: true, city: true }
        },
        accountManager: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE account
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_DELETE), async (req, res) => {
  try {
    // First check if the account exists
    const existingAccount = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        deals: { select: { id: true, title: true } },
        contactPersons: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if account has associated deals or contact persons
    const hasDeals = existingAccount.deals.length > 0;
    const hasContactPersons = existingAccount.contactPersons.length > 0;
    
    if (hasDeals || hasContactPersons) {
      let errorMessage = 'Cannot delete account because it has:';
      if (hasDeals) {
        errorMessage += ` ${existingAccount.deals.length} deal(s)`;
      }
      if (hasContactPersons) {
        errorMessage += ` ${existingAccount.contactPersons.length} contact person(s)`;
      }
      errorMessage += ' associated with it. Please delete these items first.';
      
      return res.status(400).json({ error: errorMessage });
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