import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../utils/permissions';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenant?: any;
      permissions?: string[];
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: true,
        businessUnit: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    // Get user permissions from role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { 
        role: user.role,
        granted: true
      },
      include: {
        permission: true
      }
    });

    const permissions = rolePermissions.map(rp => rp.permission.name);

    req.user = user;
    req.tenant = user.tenant;
    req.permissions = permissions;

    console.log(`User ${user.email} (${user.role}) has permissions:`, permissions);

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Checking permission: ${permission}`);
    console.log(`User permissions:`, req.permissions);
    
    if (!req.permissions?.includes(permission)) {
      console.log(`Permission denied: ${permission} not found in user permissions`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    console.log(`Permission granted: ${permission}`);
    next();
  };
};

export const requireTenantAccess = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    
    if (!resourceId) {
      return next(); // No specific resource to check
    }

    // SYSTEM_ADMIN can access any resource
    if (req.user.role === 'SYSTEM_ADMIN') {
      return next();
    }

    const canAccess = await PermissionService.canAccessResource(
      req.user.id,
      resourceId,
      resourceType,
      prisma
    );

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied to this resource' });
    }

    next();
  };
}; 