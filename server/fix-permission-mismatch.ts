import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPermissionMismatch() {
  console.log('Fixing permission mismatch between client and server...');

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all role permissions first
      console.log('Deleting all role permissions...');
      await tx.rolePermission.deleteMany({});

      // Delete all permissions
      console.log('Deleting all permissions...');
      await tx.permission.deleteMany({});

      // Create permissions with hyphens (matching client expectations)
      console.log('Creating permissions with hyphens...');
      const permissions = [
        // User permissions
        { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
        { name: 'users:write', description: 'Write users', resource: 'users', action: 'write' },
        { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
        
        // Customer permissions
        { name: 'customers:read', description: 'Read customers', resource: 'customers', action: 'read' },
        { name: 'customers:write', description: 'Write customers', resource: 'customers', action: 'write' },
        { name: 'customers:delete', description: 'Delete customers', resource: 'customers', action: 'delete' },
        
        // Deal permissions
        { name: 'deals:read', description: 'Read deals', resource: 'deals', action: 'read' },
        { name: 'deals:write', description: 'Write deals', resource: 'deals', action: 'write' },
        { name: 'deals:delete', description: 'Delete deals', resource: 'deals', action: 'delete' },
        
        // Task permissions
        { name: 'tasks:read', description: 'Read tasks', resource: 'tasks', action: 'read' },
        { name: 'tasks:write', description: 'Write tasks', resource: 'tasks', action: 'write' },
        { name: 'tasks:delete', description: 'Delete tasks', resource: 'tasks', action: 'delete' },
        
        // Account permissions
        { name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' },
        { name: 'accounts:write', description: 'Write accounts', resource: 'accounts', action: 'write' },
        { name: 'accounts:delete', description: 'Delete accounts', resource: 'accounts', action: 'delete' },
        
        // Business Unit permissions - WITH HYPHENS (matching client)
        { name: 'business-units:read', description: 'Read business units', resource: 'business-units', action: 'read' },
        { name: 'business-units:write', description: 'Write business units', resource: 'business-units', action: 'write' },
        { name: 'business-units:delete', description: 'Delete business units', resource: 'business-units', action: 'delete' },
        
        // Tenant permissions
        { name: 'tenants:read', description: 'Read tenants', resource: 'tenants', action: 'read' },
        { name: 'tenants:write', description: 'Write tenants', resource: 'tenants', action: 'write' },
        { name: 'tenants:delete', description: 'Delete tenants', resource: 'tenants', action: 'delete' },
        
        // Report permissions
        { name: 'reports:read', description: 'Read reports', resource: 'reports', action: 'read' },
        { name: 'reports:write', description: 'Write reports', resource: 'reports', action: 'write' }
      ];

      const createdPermissions = [];
      for (const perm of permissions) {
        const permission = await tx.permission.create({ data: perm });
        createdPermissions.push(permission);
        console.log(`✓ Created permission: ${permission.name}`);
      }

      // Create role permissions
      console.log('Creating role permissions...');
      
      // SYSTEM_ADMIN gets all permissions
      for (const permission of createdPermissions) {
        await tx.rolePermission.create({
          data: {
            role: 'SYSTEM_ADMIN',
            permissionId: permission.id,
            granted: true
          }
        });
      }
      console.log('✓ SYSTEM_ADMIN role permissions created');

      // HQ_ADMIN permissions
      const hqAdminPermissions = [
        'accounts:read', 'accounts:write', 'accounts:delete',
        'customers:read', 'customers:write', 'customers:delete',
        'deals:read', 'deals:write', 'deals:delete',
        'tasks:read', 'tasks:write', 'tasks:delete',
        'reports:read', 'users:read', 'users:write',
        'business-units:read', 'business-units:write'
      ];

      for (const permName of hqAdminPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'HQ_ADMIN',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ HQ_ADMIN role permissions created');

      // SALES_MANAGER permissions
      const salesManagerPermissions = [
        'accounts:read', 'accounts:write',
        'customers:read', 'customers:write',
        'deals:read', 'deals:write',
        'tasks:read', 'tasks:write',
        'reports:read'
      ];

      for (const permName of salesManagerPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'SALES_MANAGER',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ SALES_MANAGER role permissions created');

      // SALES_REP permissions
      const salesRepPermissions = [
        'accounts:read',
        'customers:read', 'customers:write',
        'deals:read', 'deals:write',
        'tasks:read', 'tasks:write'
      ];

      for (const permName of salesRepPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'SALES_REP',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ SALES_REP role permissions created');

      // SUPPORT permissions
      const supportPermissions = [
        'customers:read',
        'tasks:read', 'tasks:write'
      ];

      for (const permName of supportPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'SUPPORT',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ SUPPORT role permissions created');

      console.log('Permission mismatch fixed successfully!');
    });

    // Display final state
    const finalStats = await getDatabaseStats();
    console.log('\nFinal Database State:');
    console.log('=====================');
    console.log(`Permissions: ${finalStats.permissions}`);
    console.log(`Role Permissions: ${finalStats.rolePermissions}`);

    // List all permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\nAll Permissions:');
    console.log('================');
    allPermissions.forEach(perm => {
      console.log(`- ${perm.name}`);
    });

    // List SYSTEM_ADMIN permissions
    const systemAdminPermissions = await prisma.rolePermission.findMany({
      where: { role: 'SYSTEM_ADMIN' },
      include: { permission: true },
      orderBy: { permission: { name: 'asc' } }
    });

    console.log('\nSYSTEM_ADMIN Permissions:');
    console.log('=========================');
    systemAdminPermissions.forEach(rp => {
      console.log(`✅ ${rp.permission.name} - Granted: ${rp.granted}`);
    });

  } catch (error) {
    console.error('Error fixing permission mismatch:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getDatabaseStats() {
  const [
    permissions,
    rolePermissions
  ] = await Promise.all([
    prisma.permission.count(),
    prisma.rolePermission.count()
  ]);

  return {
    permissions,
    rolePermissions
  };
}

// Run the fix
fixPermissionMismatch()
  .then(() => {
    console.log('Permission mismatch fixed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fix permission mismatch:', error);
    process.exit(1);
  }); 