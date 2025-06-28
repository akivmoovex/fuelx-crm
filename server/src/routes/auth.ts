import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: true,
        businessUnit: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    // For now, compare plain text password (in production, use bcrypt)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

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

    // Return user data without password
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
      token,
      user: userResponse,
      tenant: user.tenant
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