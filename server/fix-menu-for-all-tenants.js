const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMenuForAllTenants() {
  try {
    console.log('=== Fixing Menu Items for All Tenants ===\n');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.id})`);
    });
    
    // Get all menu items from the default tenant (FuelX HQ)
    const defaultTenant = tenants.find(t => t.name === 'FuelX HQ');
    if (!defaultTenant) {
      console.log('❌ Default tenant (FuelX HQ) not found');
      return;
    }
    
    const defaultMenuItems = await prisma.menuItem.findMany({
      where: { tenantId: defaultTenant.id },
      include: {
        roleMenuItems: true
      }
    });
    
    console.log(`\nFound ${defaultMenuItems.length} menu items in default tenant`);
    
    // For each other tenant, create menu items
    for (const tenant of tenants) {
      if (tenant.id === defaultTenant.id) {
        console.log(`\n⏭️  Skipping default tenant: ${tenant.name}`);
        continue;
      }
      
      console.log(`\n📋 Creating menu items for tenant: ${tenant.name}`);
      
      for (const menuItem of defaultMenuItems) {
        // Check if menu item already exists for this tenant
        const existingItem = await prisma.menuItem.findFirst({
          where: {
            tenantId: tenant.id,
            path: menuItem.path
          }
        });
        
        if (existingItem) {
          console.log(`  - ${menuItem.label}: Already exists`);
          continue;
        }
        
        // Create the menu item for this tenant
        const newMenuItem = await prisma.menuItem.create({
          data: {
            label: menuItem.label,
            path: menuItem.path,
            icon: menuItem.icon,
            order: menuItem.order,
            isActive: menuItem.isActive,
            parentId: menuItem.parentId,
            tenantId: tenant.id,
            roleMenuItems: {
              create: menuItem.roleMenuItems.map(rmi => ({
                role: rmi.role,
                isVisible: rmi.isVisible,
                isEnabled: rmi.isEnabled,
                order: rmi.order
              }))
            }
          }
        });
        
        console.log(`  ✓ Created: ${menuItem.label}`);
      }
    }
    
    console.log('\n✅ Menu items created for all tenants!');
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const testUser = await prisma.user.findFirst({
      where: { role: { not: 'SYSTEM_ADMIN' } },
      include: {
        businessUnit: {
          include: { tenant: true }
        }
      }
    });
    
    if (testUser) {
      console.log(`Testing for user: ${testUser.email} (${testUser.role})`);
      
      let tenantId = null;
      if (testUser.businessUnitId) {
        const businessUnit = await prisma.businessUnit.findUnique({
          where: { id: testUser.businessUnitId },
          select: { tenantId: true }
        });
        tenantId = businessUnit?.tenantId || null;
      }
      
      const userMenuItems = await prisma.menuItem.findMany({
        where: {
          isActive: true,
          tenantId: tenantId,
          roleMenuItems: {
            some: {
              role: testUser.role,
              isVisible: true,
              isEnabled: true
            }
          }
        }
      });
      
      console.log(`Found ${userMenuItems.length} menu items for this user:`);
      userMenuItems.forEach(item => {
        console.log(`- ${item.label} (${item.path})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMenuForAllTenants(); 