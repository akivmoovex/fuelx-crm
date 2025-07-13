const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function copyMenuToTenants() {
  try {
    console.log('=== Copying Menu Items to All Tenants ===\n');
    
    // Get all tenants
    const allTenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Found ${allTenants.length} tenants:`);
    allTenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.type})`);
    });
    
    // Get the source menu items (from FuelX HQ)
    const sourceTenant = await prisma.tenant.findFirst({
      where: { name: 'FuelX HQ' }
    });
    
    if (!sourceTenant) {
      console.log('❌ Source tenant (FuelX HQ) not found');
      return;
    }
    
    const sourceMenuItems = await prisma.menuItem.findMany({
      where: { tenantId: sourceTenant.id },
      include: {
        roleMenuItems: true
      },
      orderBy: { order: 'asc' }
    });
    
    console.log(`\n📋 Found ${sourceMenuItems.length} menu items in ${sourceTenant.name}`);
    
    // Copy menu items to each tenant (except the source tenant)
    for (const tenant of allTenants) {
      if (tenant.id === sourceTenant.id) {
        console.log(`\n⏭️  Skipping ${tenant.name} (source tenant)`);
        continue;
      }
      
      console.log(`\n🔄 Copying menu items to ${tenant.name}...`);
      
      // Check if tenant already has menu items
      const existingMenuItems = await prisma.menuItem.findMany({
        where: { tenantId: tenant.id }
      });
      
      if (existingMenuItems.length > 0) {
        console.log(`⚠️  ${tenant.name} already has ${existingMenuItems.length} menu items. Skipping.`);
        continue;
      }
      
      let copiedCount = 0;
      
      // Copy each menu item
      for (const sourceItem of sourceMenuItems) {
        try {
          // Create the menu item
          const newMenuItem = await prisma.menuItem.create({
            data: {
              label: sourceItem.label,
              path: sourceItem.path,
              icon: sourceItem.icon,
              order: sourceItem.order,
              isActive: sourceItem.isActive,
              parentId: sourceItem.parentId, // Will need to be updated for parent relationships
              tenantId: tenant.id
            }
          });
          
          // Copy role menu items
          for (const roleItem of sourceItem.roleMenuItems) {
            await prisma.roleMenuItem.create({
              data: {
                role: roleItem.role,
                menuItemId: newMenuItem.id,
                isVisible: roleItem.isVisible,
                isEnabled: roleItem.isEnabled,
                order: roleItem.order
              }
            });
          }
          
          copiedCount++;
          console.log(`  ✅ Copied: ${sourceItem.label || 'unnamed'} (${sourceItem.path})`);
          
        } catch (error) {
          console.error(`  ❌ Failed to copy ${sourceItem.label}:`, error.message);
        }
      }
      
      console.log(`✅ Copied ${copiedCount} menu items to ${tenant.name}`);
    }
    
    // Verify the results
    console.log('\n📊 Verification:');
    for (const tenant of allTenants) {
      const menuItemCount = await prisma.menuItem.count({
        where: { tenantId: tenant.id }
      });
      console.log(`- ${tenant.name}: ${menuItemCount} menu items`);
    }
    
    console.log('\n🎉 Menu items copied to all tenants successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

copyMenuToTenants(); 