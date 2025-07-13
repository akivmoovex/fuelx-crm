const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMenuIssue() {
  try {
    console.log('=== Debugging Menu Issue ===\n');
    
    // Check menu items
    const menuItems = await prisma.menuItem.findMany({
      include: {
        roleMenuItems: true
      }
    });
    
    console.log('Menu Items:');
    menuItems.forEach(item => {
      console.log(`- ${item.name || 'unnamed'} (${item.path})`);
    });
    
    // Check specific users
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['rep@fuelx.com', 'manager@fuelx.com', 'admin@fuelx.com']
        }
      },
      select: {
        email: true,
        role: true
      }
    });
    
    console.log('\n=== Users ===');
    users.forEach(user => {
      console.log(`${user.email} (${user.role})`);
    });
    
    // Check role permissions
    console.log('\n=== Role Permissions ===');
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          in: ['SALES_MANAGER', 'SALES_REP', 'SYSTEM_ADMIN']
        }
      },
      include: {
        permission: true
      }
    });
    
    const permissionsByRole = {};
    rolePermissions.forEach(rp => {
      if (!permissionsByRole[rp.role]) {
        permissionsByRole[rp.role] = [];
      }
      if (rp.granted) {
        permissionsByRole[rp.role].push(rp.permission.name);
      }
    });
    
    Object.entries(permissionsByRole).forEach(([role, permissions]) => {
      console.log(`${role}: ${permissions.length} permissions`);
    });
    
    // Check menu visibility for specific roles
    console.log('\n=== Menu Visibility by Role ===');
    const roleMenuItems = await prisma.roleMenuItem.findMany({
      where: {
        role: {
          in: ['SALES_MANAGER', 'SALES_REP', 'SYSTEM_ADMIN']
        }
      },
      include: {
        menuItem: true
      }
    });
    
    const menuByRole = {};
    roleMenuItems.forEach(rmi => {
      if (!menuByRole[rmi.role]) {
        menuByRole[rmi.role] = [];
      }
      menuByRole[rmi.role].push({
        name: rmi.menuItem.name || 'unnamed',
        path: rmi.menuItem.path,
        visible: rmi.isVisible
      });
    });
    
    Object.entries(menuByRole).forEach(([role, items]) => {
      console.log(`\n${role}:`);
      items.forEach(item => {
        console.log(`  ${item.name} (${item.path}): ${item.visible ? 'Visible' : 'Hidden'}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMenuIssue(); 