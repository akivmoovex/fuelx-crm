// server/src/utils/permissions.ts

export const PERMISSIONS = {
    // User permissions
    USERS_READ: 'users:read',
    USERS_WRITE: 'users:write',
    USERS_DELETE: 'users:delete',
    
    // Customer permissions
    CUSTOMERS_READ: 'customers:read',
    CUSTOMERS_WRITE: 'customers:write',
    CUSTOMERS_DELETE: 'customers:delete',
    
    // Deal permissions
    DEALS_READ: 'deals:read',
    DEALS_WRITE: 'deals:write',
    DEALS_DELETE: 'deals:delete',
    
    // Task permissions
    TASKS_READ: 'tasks:read',
    TASKS_WRITE: 'tasks:write',
    TASKS_DELETE: 'tasks:delete',
    
    // Account permissions
    ACCOUNTS_READ: 'accounts:read',
    ACCOUNTS_WRITE: 'accounts:write',
    ACCOUNTS_DELETE: 'accounts:delete',
    
    // Business Unit permissions - WITH HYPHENS (matching client)
    BUSINESS_UNITS_READ: 'business-units:read',
    BUSINESS_UNITS_WRITE: 'business-units:write',
    BUSINESS_UNITS_DELETE: 'business-units:delete',
    
    // Tenant permissions
    TENANTS_READ: 'tenants:read',
    TENANTS_WRITE: 'tenants:write',
    TENANTS_DELETE: 'tenants:delete',
    
    // Report permissions
    REPORTS_READ: 'reports:read',
    REPORTS_WRITE: 'reports:write'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS = {
  SYSTEM_ADMIN: Object.values(PERMISSIONS),
  HQ_ADMIN: [
    PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ACCOUNTS_WRITE, PERMISSIONS.ACCOUNTS_DELETE,
    PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE, PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.DEALS_READ, PERMISSIONS.DEALS_WRITE, PERMISSIONS.DEALS_DELETE,
    PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_WRITE, PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE,
    PERMISSIONS.BUSINESS_UNITS_READ, PERMISSIONS.BUSINESS_UNITS_WRITE
  ],
  SALES_MANAGER: [
    PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ACCOUNTS_WRITE,
    PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.DEALS_READ, PERMISSIONS.DEALS_WRITE,
    PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.REPORTS_READ
  ],
  SALES_REP: [
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.DEALS_READ, PERMISSIONS.DEALS_WRITE,
    PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_WRITE
  ],
  SUPPORT: [
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_WRITE
  ]
};
  
export class PermissionService {
  // Fetch user permissions from the database
  static async getUserPermissions(userId: string, prisma: any): Promise<string[]> {
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
    prisma: any
  ): Promise<boolean> {
    try {
      console.log(`🔍 Checking access for user ${userId} to ${resourceType} ${resourceId}`);
      
      switch (resourceType) {
        case 'account':
          const account = await prisma.account.findUnique({
            where: { id: resourceId },
            include: { 
              businessUnit: {
                include: {
                  tenant: true
                }
              }
            }
          });
          if (!account) {
            console.log('❌ Account not found');
            return false;
          }
          
          console.log(`📋 Account: ${account.name}, BU: ${account.businessUnit?.name}, Tenant: ${account.businessUnit?.tenant?.name}`);
          
          // Check if user can access this account
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              businessUnit: {
                include: {
                  tenant: true
                }
              }
            }
          });
          
          if (!user) {
            console.log('❌ User not found');
            return false;
          }
          
          console.log(`👤 User: ${user.email} (${user.role}), BU: ${user.businessUnit?.name}, Tenant: ${user.businessUnit?.tenant?.name}`);
          
          // SYSTEM_ADMIN can access any account
          if (user.role === 'SYSTEM_ADMIN') {
            console.log('✅ SYSTEM_ADMIN access granted');
            return true;
          }
          
          // User must be in the same tenant (through business unit)
          const sameTenant = user.businessUnit?.tenantId === account.businessUnit?.tenantId;
          console.log(`🏢 Tenant check: ${sameTenant ? '✅' : '❌'} Same tenant`);
          if (!sameTenant) return false;
          
          // SALES_MANAGER can only access accounts in their business unit
          if (user.role === 'SALES_MANAGER') {
            const sameBusinessUnit = user.businessUnitId === account.businessUnitId;
            console.log(`🏢 Business unit check: ${sameBusinessUnit ? '✅' : '❌'} Same business unit`);
            return sameBusinessUnit;
          }
          
          // SALES_REP can only access accounts they manage
          if (user.role === 'SALES_REP') {
            const isManager = account.accountManagerId === userId;
            console.log(`👤 Manager check: ${isManager ? '✅' : '❌'} Is account manager`);
            return isManager;
          }
          
          // HQ_ADMIN can access any account in their tenant
          if (user.role === 'HQ_ADMIN') {
            console.log('✅ HQ_ADMIN access granted (same tenant)');
            return true; // Already checked tenant access above
          }
          
          console.log('❌ No matching role found');
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
          
        case 'tenant':
          const tenant = await prisma.tenant.findUnique({
            where: { id: resourceId }
          });
          if (!tenant) return false;
          
          const tUser = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!tUser) return false;
          
          // SYSTEM_ADMIN can access any tenant
          if (tUser.role === 'SYSTEM_ADMIN') return true;
          
          // User must be in the same tenant
          return tUser.tenantId === tenant.id;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }
}