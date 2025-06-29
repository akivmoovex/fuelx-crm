import { PrismaClient } from '@prisma/client';

export class PermissionService {
  // Fetch user permissions from the database
  static async getUserPermissions(userId: string, prisma: PrismaClient): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        return [];
      }

      // Get role-based permissions
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { 
          role: user.role,
          granted: true
        },
        include: {
          permission: true
        }
      });

      // Get user-specific permissions
      const userPermissions = user.userPermissions
        .filter(up => up.granted)
        .map(up => up.permission.name);

      // Combine role and user permissions
      const allPermissions = [
        ...rolePermissions.map(rp => rp.permission.name),
        ...userPermissions
      ];

      return [...new Set(allPermissions)]; // Remove duplicates
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }
  
  // Check if user can access a specific resource
  static async canAccessResource(
    userId: string,
    resourceId: string,
    resourceType: string,
    prisma: PrismaClient
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'account':
          const account = await prisma.account.findUnique({
            where: { id: resourceId },
            include: { tenant: true, businessUnit: true }
          });
          if (!account) return false;
          
          // Check if user can access this account
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!user) return false;
          
          // SYSTEM_ADMIN can access any account
          if (user.role === 'SYSTEM_ADMIN') return true;
          
          // User must be in the same tenant
          if (user.tenantId !== account.tenantId) return false;
          
          // SALES_MANAGER can only access accounts in their business unit
          if (user.role === 'SALES_MANAGER') {
            return user.businessUnitId === account.businessUnitId;
          }
          
          // SALES_REP can only access accounts they manage
          if (user.role === 'SALES_REP') {
            return account.accountManagerId === userId;
          }
          
          return false;
          
        case 'businessUnit':
          const businessUnit = await prisma.businessUnit.findUnique({
            where: { id: resourceId }
          });
          if (!businessUnit) return false;
          
          const buUser = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!buUser) return false;
          
          // SYSTEM_ADMIN can access any business unit
          if (buUser.role === 'SYSTEM_ADMIN') return true;
          
          // User must be in the same tenant
          return buUser.tenantId === businessUnit.tenantId;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }
} 