import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// GET all users (tenant-filtered, but SYSTEM_ADMIN sees all)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.USERS_READ), async (req, res) => {
  try {
    const { status, role, search } = req.query;
    const where: any = {};
    
    // SYSTEM_ADMIN can see all users, others are filtered by tenant
    if (req.user.role !== 'SYSTEM_ADMIN') {
      where.tenantId = req.user.tenantId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const users = await prisma.user.findMany({
      where,
      include: {
        businessUnit: {
          select: { 
            name: true, 
            city: true,
            tenant: {
              select: { id: true, name: true }
            }
          }
        }
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
      include: {
        businessUnit: {
          select: { 
            name: true, 
            city: true,
            tenant: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST new user (SYSTEM_ADMIN only)
router.post('/', authenticateToken, requirePermission(PERMISSIONS.USERS_WRITE), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN can create users
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only system administrators can create users' });
    }

    const { password, ...userData } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        businessUnitId: userData.businessUnitId || req.user.businessUnitId // Use provided businessUnit or user's businessUnit
      },
      include: {
        businessUnit: {
          select: { 
            name: true, 
            city: true,
            tenant: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user (SYSTEM_ADMIN only)
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_WRITE), requireTenantAccess('user'), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN can edit users
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only system administrators can edit users' });
    }

    const { password, ...userData } = req.body;
    
    let updateData = userData;
    
    // Hash password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData = { ...userData, password: hashedPassword };
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        businessUnit: {
          select: { 
            name: true, 
            city: true,
            tenant: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user (SYSTEM_ADMIN only)
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.USERS_DELETE), async (req, res) => {
  try {
    // Only SYSTEM_ADMIN can delete users
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Only system administrators can delete users' });
    }

    // First check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        businessUnit: { select: { id: true, name: true } }
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is managing any business units or accounts
    const isManagingBusinessUnit = existingUser.businessUnit !== null;
    
    if (isManagingBusinessUnit) {
      let errorMessage = 'Cannot delete user because they have:';
      if (isManagingBusinessUnit) {
        errorMessage += ` ${existingUser.businessUnit.name} business unit`;
      }
      errorMessage += '. Please reassign or delete this item first.';
      
      return res.status(400).json({ error: errorMessage });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;