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
  try {
    const { email, password } = req.body;

    // Find user with tenant and business unit info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        businessUnit: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has a tenant assigned
    if (!user.tenantId) {
      console.error(`User ${email} has no tenant assigned`);
      return res.status(500).json({ 
        error: 'User account configuration error. Please contact administrator.' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user permissions
    const permissions = await PermissionService.getUserPermissions(user.id, prisma);

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId,
        businessUnitId: user.businessUnitId,
        permissions 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
      permissions
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user permissions
    const permissions = await prisma.rolePermission.findMany({
      where: { 
        role: user.role,
        granted: true
      },
      include: {
        permission: true
      }
    });

    const permissionNames = permissions.map(rp => rp.permission.name);

    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      businessUnitId: user.businessUnitId,
      status: user.status,
      permissions: permissionNames,
      tenant: user.tenant,
      businessUnit: user.businessUnit
    };

    res.json({
      user: userResponse,
      tenant: user.tenant
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 