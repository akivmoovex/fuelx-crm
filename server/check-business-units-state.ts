import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessUnitsState() {
  try {
    console.log('Checking business units and permissions state...\n');

    // Check if business units exist
    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        tenant: true,
        manager: true
      }
    });

    console.log(`Business Units Found: ${businessUnits.length}`);
    businessUnits.forEach(bu => {
      console.log(`- ${bu.name} (${bu.status}) - Tenant: ${bu.tenant?.name || 'No tenant'}`);
    });

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@fuelx.com' },
      include: {
        tenant: true,
        businessUnit: true
      }
    });

    if (adminUser) {
      console.log(`\nAdmin User: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`Tenant: ${adminUser.tenant?.name || 'No tenant'}`);
      console.log(`Business Unit: ${adminUser.businessUnit?.name || 'No business unit'}`);
    } else {
      console.log('\n❌ Admin user not found!');
    }

    // Check permissions
    const businessUnitPermissions = await prisma.permission.findMany({
      where: {
        name: {
          contains: 'business-units'
        }
      }
    });

    console.log(`\nBusiness Unit Permissions: ${businessUnitPermissions.length}`);
    businessUnitPermissions.forEach(perm => {
      console.log(`- ${perm.name}`);
    });

    // Check SYSTEM_ADMIN role permissions
    const systemAdminPermissions = await prisma.rolePermission.findMany({
      where: {
        role: 'SYSTEM_ADMIN',
        permission: {
          name: {
            contains: 'business-units'
          }
        }
      },
      include: {
        permission: true
      }
    });

    console.log(`\nSYSTEM_ADMIN Business Unit Permissions: ${systemAdminPermissions.length}`);
    systemAdminPermissions.forEach(rp => {
      console.log(`- ${rp.permission.name} (granted: ${rp.granted})`);
    });

    // Check if admin user has the right permissions
    if (adminUser) {
      const userPermissions = await prisma.rolePermission.findMany({
        where: {
          role: adminUser.role,
          permission: {
            name: {
              contains: 'business-units'
            }
          }
        },
        include: {
          permission: true
        }
      });

      console.log(`\n${adminUser.role} Business Unit Permissions: ${userPermissions.length}`);
      userPermissions.forEach(rp => {
        console.log(`- ${rp.permission.name} (granted: ${rp.granted})`);
      });
    }

  } catch (error) {
    console.error('Error checking state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessUnitsState(); 