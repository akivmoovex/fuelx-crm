const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugManagerSpecific() {
  try {
    console.log('=== Detailed Analysis for manager@fuelx.com ===\n');
    
    // Get manager user details
    const manager = await prisma.user.findUnique({
      where: { email: 'manager@fuelx.com' },
      include: {
        tenant: true,
        businessUnit: true
      }
    });
    
    if (!manager) {
      console.log('❌ manager@fuelx.com not found');
      return;
    }
    
    console.log('👤 Manager User Details:');
    console.log(`- Email: ${manager.email}`);
    console.log(`- Role: ${manager.role}`);
    console.log(`- Status: ${manager.status}`);
    console.log(`- Tenant: ${manager.tenant?.name || 'No tenant'} (ID: ${manager.tenantId})`);
    console.log(`- Business Unit: ${manager.businessUnit?.name || 'No business unit'} (ID: ${manager.businessUnitId})`);
    console.log(`- Created: ${manager.createdAt}`);
    console.log(`- Updated: ${manager.updatedAt}`);
    
    // Check if user has tenant assigned
    if (!manager.tenantId) {
      console.log('\n❌ PROBLEM: User has no tenant assigned!');
      return;
    }
    
    // Check menu items for this user's tenant and role
    console.log('\n📋 Menu Items Analysis:');
    
    const menuItems = await prisma.menuItem.findMany({
      where: {
        OR: [
          { tenantId: null }, // Global menu items
          { tenantId: manager.tenantId } // Tenant-specific menu items
        ],
        isActive: true,
        roleMenuItems: {
          some: {
            role: manager.role,
            isVisible: true,
            isEnabled: true
          }
        }
      },
      include: {
        roleMenuItems: {
          where: { role: manager.role }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log(`Found ${menuItems.length} menu items for ${manager.role} role:`);
    menuItems.forEach(item => {
      const roleItem = item.roleMenuItems[0];
      console.log(`- ${item.label || 'unnamed'} (${item.path}) - Visible: ${roleItem?.isVisible}, Enabled: ${roleItem?.isEnabled}, Order: ${roleItem?.order}`);
    });
    
    if (menuItems.length === 0) {
      console.log('\n❌ PROBLEM: No menu items found for this user!');
      
      // Check what menu items exist for this tenant
      const tenantMenuItems = await prisma.menuItem.findMany({
        where: {
          OR: [
            { tenantId: null },
            { tenantId: manager.tenantId }
          ],
          isActive: true
        },
        include: {
          roleMenuItems: {
            where: { role: manager.role }
          }
        }
      });
      
      console.log(`\n📊 Menu items in tenant (${tenantMenuItems.length} total):`);
      tenantMenuItems.forEach(item => {
        const roleItem = item.roleMenuItems[0];
        console.log(`- ${item.label || 'unnamed'} (${item.path}) - Role config: ${roleItem ? `${roleItem.isVisible}/${roleItem.isEnabled}` : 'No role config'}`);
      });
    }
    
    // Check other users for comparison
    console.log('\n👥 Other Users Comparison:');
    const otherUsers = await prisma.user.findMany({
      where: {
        email: { not: 'manager@fuelx.com' },
        role: { not: 'SYSTEM_ADMIN' }
      },
      include: {
        tenant: true,
        businessUnit: true
      }
    });
    
    otherUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Tenant: ${user.tenant?.name}, BU: ${user.businessUnit?.name}`);
    });
    
    // Test the exact query that the menu API would use
    console.log('\n🔍 Testing Menu API Query:');
    const apiQuery = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: null },
          { tenantId: manager.tenantId }
        ],
        roleMenuItems: {
          some: {
            role: manager.role,
            isVisible: true,
            isEnabled: true
          }
        }
      },
      include: {
        roleMenuItems: {
          where: { role: manager.role }
        },
        children: {
          where: {
            isActive: true,
            roleMenuItems: {
              some: {
                role: manager.role,
                isVisible: true,
                isEnabled: true
              }
            }
          },
          include: {
            roleMenuItems: {
              where: { role: manager.role }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log(`API Query Result: ${apiQuery.length} items`);
    apiQuery.forEach(item => {
      console.log(`  - ${item.label || 'unnamed'} (${item.path})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugManagerSpecific(); 