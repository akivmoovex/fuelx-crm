import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBusinessUnitPermissions() {
  try {
    console.log('Fixing business unit permissions for SYSTEM_ADMIN...');
    
    // Create business unit permissions if they don't exist
    const businessUnitPermissions = [
      { name: 'business_units:read', description: 'Read business units', resource: 'business_units', action: 'read' },
      { name: 'business_units:write', description: 'Create and update business units', resource: 'business_units', action: 'write' },
      { name: 'business_units:delete', description: 'Delete business units', resource: 'business_units', action: 'delete' }
    ];
    
    for (const perm of businessUnitPermissions) {
      const permission = await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm
      });
      console.log(`✓ Permission: ${permission.name}`);
      
      // Assign to SYSTEM_ADMIN role
      await prisma.rolePermission.upsert({
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
        }
      });
      console.log(`✓ Assigned to SYSTEM_ADMIN`);
    }
    
    console.log('\n✅ Business unit permissions fixed successfully!');
    console.log('SYSTEM_ADMIN now has:');
    console.log('- business_units:read');
    console.log('- business_units:write');
    console.log('- business_units:delete');
    
  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBusinessUnitPermissions(); 