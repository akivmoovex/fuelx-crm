import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    console.log('Checking SYSTEM_ADMIN permissions...');
    
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@fuelx.com' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log(`Admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})`);
    
    // Get role permissions for SYSTEM_ADMIN
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role: 'SYSTEM_ADMIN' },
      include: {
        permission: true
      }
    });
    
    console.log('SYSTEM_ADMIN Role Permissions:');
    rolePermissions.forEach(rp => {
      console.log(`- ${rp.permission.name} (${rp.permission.resource}:${rp.permission.action}) - Granted: ${rp.granted}`);
    });
    
    // Check if business unit permissions exist
    const businessUnitPermissions = await prisma.permission.findMany({
      where: {
        resource: 'business_units'
      }
    });
    
    console.log('\nBusiness Unit Permissions in Database:');
    businessUnitPermissions.forEach(perm => {
      console.log(`- ${perm.name} (${perm.resource}:${perm.action})`);
    });
    
    // Check if SYSTEM_ADMIN has business unit permissions
    const adminBusinessUnitPerms = rolePermissions.filter(rp => 
      rp.permission.resource === 'business_units'
    );
    
    console.log('\nSYSTEM_ADMIN Business Unit Permissions:');
    if (adminBusinessUnitPerms.length === 0) {
      console.log('❌ No business unit permissions found for SYSTEM_ADMIN');
    } else {
      adminBusinessUnitPerms.forEach(rp => {
        console.log(`✅ ${rp.permission.name} - Granted: ${rp.granted}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions(); 