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

    // Handle empty string businessUnitId - convert to null
    if (accountData.businessUnitId === '') {
      accountData.businessUnitId = null;
    }

    // Handle empty string accountManagerId - convert to null
    if (accountData.accountManagerId === '') {
      accountData.accountManagerId = null;
    }

    // If user is SALES_MANAGER, ensure account is assigned to their business unit
    if (req.user.role === 'SALES_MANAGER' && req.user.businessUnitId) {
      accountData.businessUnitId = req.user.businessUnitId;
    }

    // Validate that the business unit exists if provided
    if (accountData.businessUnitId) {
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: accountData.businessUnitId }
      });
      
      if (!businessUnit) {
        return res.status(400).json({ error: 'Selected business unit does not exist' });
      }
    }

    // Validate that the account manager exists if provided
    if (accountData.accountManagerId) {
      const accountManager = await prisma.user.findUnique({
        where: { id: accountData.accountManagerId }
      });
      
      if (!accountManager) {
        return res.status(400).json({ error: 'Selected account manager does not exist' });
      }
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
// PUT update account (SYSTEM_ADMIN or SALES_MANAGER only)
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.ACCOUNTS_WRITE), requireTenantAccess('account'), async (req, res) => {
  try {
    console.log(`Attempting to update account with ID: ${req.params.id}`);
    
    // Only SYSTEM_ADMIN or SALES_MANAGER can edit accounts
    if (!['SYSTEM_ADMIN', 'SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only system administrators or sales managers can edit accounts' });
    }

    // First, check if the account exists
    const existingAccount = await prisma.account.findUnique({
      where: { id: req.params.id }
    });

    if (!existingAccount) {
      console.log(`Account with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Account not found' });
    }

    console.log(`Found account: ${existingAccount.name} (${existingAccount.id})`);

    // If user is SALES_MANAGER, ensure they can only edit accounts in their business unit
    if (req.user.role === 'SALES_MANAGER') {
      if (existingAccount.businessUnitId !== req.user.businessUnitId) {
        return res.status(403).json({ error: 'You can only edit accounts in your business unit' });
      }
    }

    // Prepare update data - handle empty strings
    const updateData = { ...req.body };
    
    // Handle empty string businessUnitId - convert to null
    if (updateData.businessUnitId === '') {
      updateData.businessUnitId = null;
    }

    // Handle empty string accountManagerId - convert to null
    if (updateData.accountManagerId === '') {
      updateData.accountManagerId = null;
    }

    // Validate that the business unit exists if provided
    if (updateData.businessUnitId) {
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: updateData.businessUnitId }
      });
      
      if (!businessUnit) {
        return res.status(400).json({ error: 'Selected business unit does not exist' });
      }
    }

    // Validate that the account manager exists if provided
    if (updateData.accountManagerId) {
      const accountManager = await prisma.user.findUnique({
        where: { id: updateData.accountManagerId }
      });
      
      if (!accountManager) {
        return res.status(400).json({ error: 'Selected account manager does not exist' });
      }
    }

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: updateData,
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

    console.log(`Successfully updated account: ${account.name}`);
    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    
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

    // First, check if the account exists
    const existingAccount = await prisma.account.findUnique({
      where: { id: req.params.id }
    });

    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // If user is SALES_MANAGER, ensure they can only delete accounts in their business unit
    if (req.user.role === 'SALES_MANAGER') {
      if (existingAccount.businessUnitId !== req.user.businessUnitId) {
        return res.status(403).json({ error: 'You can only delete accounts in your business unit' });
      }
    }

    // Check if account has any related records that would prevent deletion
    const hasDeals = await prisma.deal.findFirst({
      where: { accountId: req.params.id }
    });

    const hasContactPersons = await prisma.contactPerson.findFirst({
      where: { accountId: req.params.id }
    });

    if (hasDeals || hasContactPersons) {
      return res.status(400).json({ 
        error: 'Cannot delete account that has associated deals or contact persons. Please remove these relationships first.' 
      });
    }

    // Delete the account
    await prisma.account.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;