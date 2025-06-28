import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET all users (tenant-filtered, but SYSTEM_ADMIN sees all)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.USERS_READ), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const where: any = {};
    
    // SYSTEM_ADMIN can see all users, others are filtered by tenant
    if (req.user.role !== 'SYSTEM_ADMIN') {
      where.tenantId = req.user.tenantId;
    }
    
    if (role && role !== 'all') where.role = role;
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const users = await prisma.user.findMany({ 
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        businessUnit: {
          select: { name: true, location: true }
        },
        tenant: {
          select: { name: true }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET single user
router.get('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_READ), requireTenantAccess('user'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        businessUnit: {
          select: { name: true, location: true }
        },
        tenant: {
          select: { name: true }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST new user
router.post('/', authenticateToken, requirePermission(PERMISSIONS.USERS_WRITE), async (req, res) => {
  try {
    const userData = {
      ...req.body,
      tenantId: req.user.tenantId // Automatically assign to user's tenant
    };
    
    const user = await prisma.user.create({ 
      data: userData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        businessUnit: {
          select: { name: true, location: true }
        },
        tenant: {
          select: { name: true }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// PUT update user
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_WRITE), requireTenantAccess('user'), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        businessUnit: {
          select: { name: true, location: true }
        },
        tenant: {
          select: { name: true }
        },
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_DELETE), requireTenantAccess('user'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

export default router;