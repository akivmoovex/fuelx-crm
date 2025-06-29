import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTenantPermissions() {
  console.log('Fixing tenant permissions for SYSTEM_ADMIN...');

  try {
    // Create tenant permissions if they don't exist
    const tenantPermissions = [
      { 
        name: 'tenants:read', 
        description: 'Read tenant information',
        resource: 'tenants',
        action: 'read'
      },
      { 
        name: 'tenants:write', 
        description: 'Create and update tenants',
        resource: 'tenants',
        action: 'write'
      },
      { 
        name: 'tenants:delete', 
        description: 'Delete tenants',
        resource: 'tenants',
        action: 'delete'
      },
    ];

    console.log('Creating tenant permissions...');
    for (const permission of tenantPermissions) {
      const createdPermission = await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      });
      console.log(`Permission ${permission.name} created/updated:`, createdPermission.id);
    }

    // Add role permissions for SYSTEM_ADMIN
    console.log('Adding role permissions for SYSTEM_ADMIN...');
    for (const permissionName of ['tenants:read', 'tenants:write', 'tenants:delete']) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (permission) {
        const rolePermission = await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: 'SYSTEM_ADMIN',
              permissionId: permission.id
            }
          },
          update: { granted: true },
          create: {
            role: 'SYSTEM_ADMIN',
            permissionId: permission.id,
            granted: true
          },
        });
        console.log(`Role permission ${permissionName} for SYSTEM_ADMIN:`, rolePermission.id);
      } else {
        console.error(`Permission ${permissionName} not found`);
      }
    }

    // Verify the permissions were added
    console.log('\nVerifying permissions...');
    const systemAdminPermissions = await prisma.rolePermission.findMany({
      where: {
        role: 'SYSTEM_ADMIN',
        granted: true
      },
      include: {
        permission: true
      }
    });

    console.log('SYSTEM_ADMIN permissions:');
    systemAdminPermissions.forEach(rp => {
      console.log(`- ${rp.permission.name}`);
    });

    console.log('\nTenant permissions fixed successfully!');
  } catch (error) {
    console.error('Error fixing permissions:', error);
  }
}

fixTenantPermissions()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 