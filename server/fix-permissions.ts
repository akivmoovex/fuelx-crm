import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPermissions() {
  try {
    console.log('Fixing permissions to match client expectations...');
    
    // Delete old business unit permissions with hyphens
    await prisma.rolePermission.deleteMany({
      where: {
        permission: {
          name: {
            in: ['business-units:read', 'business-units:write', 'business-units:delete']
          }
        }
      }
    });
    
    await prisma.permission.deleteMany({
      where: {
        name: {
          in: ['business-units:read', 'business-units:write', 'business-units:delete']
        }
      }
    });
    
    console.log('Deleted old business unit permissions');
    
    // Create new business unit permissions with underscores
    const businessUnitPermissions = [
      { name: 'business_units:read', description: 'Read business units', resource: 'business_units', action: 'read' },
      { name: 'business_units:write', description: 'Write business units', resource: 'business_units', action: 'write' },
      { name: 'business_units:delete', description: 'Delete business units', resource: 'business_units', action: 'delete' }
    ];
    
    for (const perm of businessUnitPermissions) {
      const permission = await prisma.permission.create({ data: perm });
      console.log(`✓ Created permission: ${permission.name}`);
      
      // Assign to SYSTEM_ADMIN
      await prisma.rolePermission.create({
        data: {
          role: 'SYSTEM_ADMIN',
          permissionId: permission.id,
          granted: true
        }
      });
      console.log(`✓ Assigned to SYSTEM_ADMIN`);
    }
    
    console.log('\n✅ Permissions fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermissions(); 