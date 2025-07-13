const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAllMenuItems() {
  try {
    console.log('=== All Menu Items Analysis ===\n');
    
    // Get all menu items with their tenant and role configurations
    const allMenuItems = await prisma.menuItem.findMany({
      include: {
        tenant: true,
        roleMenuItems: true
      },
      orderBy: { order: 'asc' }
    });
    
    console.log(`Total menu items: ${allMenuItems.length}`);
    
    // Group by tenant
    const menuByTenant = {};
    allMenuItems.forEach(item => {
      const tenantName = item.tenant?.name || 'Global (no tenant)';
      if (!menuByTenant[tenantName]) {
        menuByTenant[tenantName] = [];
      }
      menuByTenant[tenantName].push(item);
    });
    
    Object.keys(menuByTenant).forEach(tenantName => {
      console.log(`\n📋 ${tenantName} (${menuByTenant[tenantName].length} items):`);
      menuByTenant[tenantName].forEach(item => {
        console.log(`  - ${item.label || 'unnamed'} (${item.path})`);
        
        // Show role configurations
        const roleConfigs = item.roleMenuItems.map(rmi => 
          `${rmi.role}: ${rmi.isVisible ? 'V' : 'H'}/${rmi.isEnabled ? 'E' : 'D'}`
        );
        if (roleConfigs.length > 0) {
          console.log(`    Roles: ${roleConfigs.join(', ')}`);
        }
      });
    });
    
    // Check which tenants have menu items
    console.log('\n🏢 Tenants with menu items:');
    Object.keys(menuByTenant).forEach(tenantName => {
      console.log(`- ${tenantName}`);
    });
    
    // Check which tenants exist
    const allTenants = await prisma.tenant.findMany();
    console.log('\n🏢 All tenants in system:');
    allTenants.forEach(tenant => {
      const hasMenu = menuByTenant[tenant.name] && menuByTenant[tenant.name].length > 0;
      console.log(`- ${tenant.name} (${tenant.type}) ${hasMenu ? '✅' : '❌'} has menu items`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAllMenuItems(); 