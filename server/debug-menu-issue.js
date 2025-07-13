const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMenuIssue() {
  try {
    console.log('=== Menu Debug Analysis ===\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        businessUnit: {
          include: { tenant: true }
        }
      }
    });
    
    console.log('👥 All Users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - BU: ${user.businessUnit?.name || 'None'}, Tenant: ${user.businessUnit?.tenant?.name || 'None'}`);
    });
    
    // Get all menu items
    const menuItems = await prisma.menuItem.findMany({
      include: {
        roleMenuItems: true,
        tenant: true
      }
    });
    
    console.log('\n📋 All Menu Items:');
    menuItems.forEach(item => {
      console.log(`- ${item.label} (${item.path}) - Tenant: ${item.tenant?.name || 'Global'}`);
      item.roleMenuItems.forEach(rmi => {
        console.log(`  - ${rmi.role}: Visible=${rmi.isVisible}, Enabled=${rmi.isEnabled}`);
      });
    });
    
    // Test for a specific non-admin user
    const testUser = users.find(u => u.role !== 'SYSTEM_ADMIN');
    if (testUser) {
      console.log(`\n🔍 Testing for user: ${testUser.email} (${testUser.role})`);
      
      let tenantId = null;
      if (testUser.businessUnitId) {
        const businessUnit = await prisma.businessUnit.findUnique({
          where: { id: testUser.businessUnitId },
          select: { tenantId: true }
        });
        tenantId = businessUnit?.tenantId || null;
      }
      
      console.log(`Tenant ID: ${tenantId}`);
      
      const whereClause = {
        isActive: true,
        roleMenuItems: {
          some: {
            role: testUser.role,
            isVisible: true,
            isEnabled: true
          }
        }
      };
      
      if (testUser.role === 'SYSTEM_ADMIN') {
        whereClause.tenantId = null;
      } else {
        whereClause.tenantId = tenantId;
      }
      
      console.log('Where clause:', JSON.stringify(whereClause, null, 2));
      
      const userMenuItems = await prisma.menuItem.findMany({
        where: whereClause,
        include: {
          roleMenuItems: {
            where: { role: testUser.role }
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

debugMenuIssue(); 