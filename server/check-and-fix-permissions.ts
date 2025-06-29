import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixPermissions() {
  try {
    console.log('Checking and fixing SYSTEM_ADMIN permissions...');
    
    // Check if business unit permissions exist
    const businessUnitPerms = await prisma.permission.findMany({
      where: {
        resource: 'business_units'
      }
    });
    
    console.log('Business unit permissions found:', businessUnitPerms.length);
    businessUnitPerms.forEach(perm => {
      console.log(`- ${perm.name} (${perm.resource}:${perm.action})`);
    });
    
    // If permissions don't exist, create them
    if (businessUnitPerms.length === 0) {
      console.log('Creating business unit permissions...');
      
      const permissions = [
        { name: 'business_units:read', description: 'Read business units', resource: 'business_units', action: 'read' },
        { name: 'business_units:write', description: 'Create and update business units', resource: 'business_units', action: 'write' },
        { name: 'business_units:delete', description: 'Delete business units', resource: 'business_units', action: 'delete' }
      ];
      
      for (const perm of permissions) {
        await prisma.permission.create({ data: perm });
        console.log(`✓ Created permission: ${perm.name}`);
      }
    }
    
    // Check if SYSTEM_ADMIN has these permissions
    const rolePerms = await prisma.rolePermission.findMany({
      where: {
        role: 'SYSTEM_ADMIN',
        permission: {
          resource: 'business_units'
        }
      },
      include: {
        permission: true
      }
    });
    
    console.log('SYSTEM_ADMIN business unit permissions:', rolePerms.length);
    rolePerms.forEach(rp => {
      console.log(`- ${rp.permission.name} (granted: ${rp.granted})`);
    });
    
    // If missing, assign them
    if (rolePerms.length < 3) {
      console.log('Assigning missing permissions to SYSTEM_ADMIN...');
      
      const allBusinessUnitPerms = await prisma.permission.findMany({
        where: { resource: 'business_units' }
      });
      
      for (const perm of allBusinessUnitPerms) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: 'SYSTEM_ADMIN',
              permissionId: perm.id
            }
          },
          update: { granted: true },
          create: {
            role: 'SYSTEM_ADMIN',
            permissionId: perm.id,
            granted: true
          }
        });
        console.log(`✓ Assigned ${perm.name} to SYSTEM_ADMIN`);
      }
    }
    
    // Verify the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@fuelx.com' }
    });
    
    if (adminUser) {
      console.log(`\n✅ Admin user found: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})`);
    } else {
      console.log('\n❌ Admin user not found!');
    }
    
    console.log('\n✅ Permission check and fix completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixPermissions(); 