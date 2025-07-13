const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMenuTenant() {
  try {
    // Find Chirundu Tenant
    const tenant = await prisma.tenant.findFirst({ where: { name: 'Chirundu Tenant' } });
    if (!tenant) {
      console.log('Chirundu Tenant not found');
      return;
    }
    console.log(`Tenant: ${tenant.name} (ID: ${tenant.id})`);

    // Find menu items for this tenant and SALES_MANAGER role
    const menuItems = await prisma.menuItem.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        roleMenuItems: {
          some: {
            role: 'SALES_MANAGER',
            isVisible: true,
            isEnabled: true
          }
        }
      },
      include: {
        roleMenuItems: true
      }
    });

    if (menuItems.length === 0) {
      console.log('No menu items found for Chirundu Tenant and SALES_MANAGER');
    } else {
      console.log('Menu items for Chirundu Tenant and SALES_MANAGER:');
      menuItems.forEach(item => {
        console.log(`- ${item.label} (${item.path})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMenuTenant(); 