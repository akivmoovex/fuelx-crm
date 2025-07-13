import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';
import { PermissionService } from '../utils/permissions';

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post('/login', async (req, res) => {
  // Add cache control headers to prevent caching
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    console.log('Login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    // Find user with business unit info only
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        businessUnit: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    console.log('Updating last login time for user:', user.id);
    const updateResult = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    console.log('Last login update result:', updateResult.lastLoginAt);

    // Get user permissions
    const permissions = await PermissionService.getUserPermissions(user.id, prisma);

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        businessUnitId: user.businessUnitId,
        permissions 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Get updated user data without password
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    const { password: _, ...userWithoutPassword } = updatedUser!;

    res.json({
      token,
      user: userWithoutPassword,
      permissions
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  // Add cache control headers to prevent caching
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get complete user data from database
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user permissions
    const permissions = await prisma.rolePermission.findMany({
      where: { 
        role: currentUser.role,
        granted: true
      },
      include: {
        permission: true
      }
    });

    const permissionNames = permissions.map(rp => rp.permission.name);

    // Return complete user data without password
    const { password: _, ...userWithoutPassword } = currentUser;

    res.json({
      user: {
        ...userWithoutPassword,
        permissions: permissionNames
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 