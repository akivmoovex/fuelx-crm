import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create permissions
  const permissions = [
    { name: 'users:read', description: 'Read user information' },
    { name: 'users:write', description: 'Create and update users' },
    { name: 'users:delete', description: 'Delete users' },
    { name: 'customers:read', description: 'Read customer information' },
    { name: 'customers:write', description: 'Create and update customers' },
    { name: 'customers:delete', description: 'Delete customers' },
    { name: 'deals:read', description: 'Read deal information' },
    { name: 'deals:write', description: 'Create and update deals' },
    { name: 'deals:delete', description: 'Delete deals' },
    { name: 'tasks:read', description: 'Read task information' },
    { name: 'tasks:write', description: 'Create and update tasks' },
    { name: 'tasks:delete', description: 'Delete tasks' },
    { name: 'accounts:read', description: 'Read account information' },
    { name: 'accounts:write', description: 'Create and update accounts' },
    { name: 'accounts:delete', description: 'Delete accounts' },
    { name: 'business_units:read', description: 'Read business unit information' },
    { name: 'business_units:write', description: 'Create and update business units' },
    { name: 'business_units:delete', description: 'Delete business units' },
    { name: 'tenants:read', description: 'Read tenant information' },
    { name: 'tenants:write', description: 'Create and update tenants' },
    { name: 'tenants:delete', description: 'Delete tenants' },
    { name: 'reports:read', description: 'Read reports' },
  ];

  console.log('Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }

  // Create role permissions
  const rolePermissions = [
    // SYSTEM_ADMIN - Full access to everything
    { role: 'SYSTEM_ADMIN', permissions: [
      'tenants:read', 'tenants:write', 'tenants:delete',
      'business_units:read', 'business_units:write', 'business_units:delete',
      'accounts:read', 'accounts:write', 'accounts:delete',
      'users:read', 'users:write', 'users:delete',
      'customers:read', 'customers:write', 'customers:delete',
      'deals:read', 'deals:write', 'deals:delete',
      'tasks:read', 'tasks:write', 'tasks:delete',
      'reports:read'
    ]},
    
    // SALES_MANAGER - Can manage accounts in their business unit
    { role: 'SALES_MANAGER', permissions: [
      'accounts:read', 'accounts:write', 'accounts:delete',
      'customers:read', 'customers:write', 'customers:delete',
      'deals:read', 'deals:write', 'deals:delete',
      'tasks:read', 'tasks:write', 'tasks:delete',
      'reports:read'
    ]},
    
    // SALES_REP - Can only read and manage their assigned accounts
    { role: 'SALES_REP', permissions: [
      'accounts:read',
      'customers:read', 'customers:write',
      'deals:read', 'deals:write',
      'tasks:read', 'tasks:write'
    ]},
    
    // HQ_ADMIN - Can manage users and view reports
    { role: 'HQ_ADMIN', permissions: [
      'users:read', 'users:write',
      'customers:read', 'customers:write',
      'deals:read', 'deals:write',
      'tasks:read', 'tasks:write',
      'reports:read'
    ]},
    
    // TENANT_ADMIN - Can manage their tenant
    { role: 'TENANT_ADMIN', permissions: [
      'accounts:read', 'accounts:write',
      'customers:read', 'customers:write',
      'deals:read', 'deals:write',
      'tasks:read', 'tasks:write',
      'reports:read'
    ]},
  ];

  console.log('Creating role permissions...');
  for (const rolePerm of rolePermissions) {
    for (const permissionName of rolePerm.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });
      
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: rolePerm.role,
              permissionId: permission.id
            }
          },
          update: { granted: true },
          create: {
            role: rolePerm.role,
            permissionId: permission.id,
            granted: true
          },
        });
      }
    }
  }

  // Create default tenant
  console.log('Creating default tenant...');
  const defaultTenant = await prisma.tenant.upsert({
    where: { name: 'FuelX HQ' },
    update: {},
    create: {
      name: 'FuelX HQ',
      type: 'HQ',
      status: 'active',
    },
  });

  // Create default business unit
  console.log('Creating default business unit...');
  const defaultBusinessUnit = await prisma.businessUnit.upsert({
    where: { name: 'Main Office' },
    update: {},
    create: {
      name: 'Main Office',
      location: 'Lusaka',
      address: '123 Main Street',
      city: 'Lusaka',
      state: 'Lusaka',
      postalCode: '10101',
      country: 'Zambia',
      phone: '+260 123 456 789',
      email: 'info@fuelx.com',
      status: 'active',
      tenantId: defaultTenant.id,
    },
  });

  // Create default users
  console.log('Creating default users...');
  const users = [
    {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@fuelx.com',
      password: 'admin123',
      role: 'SYSTEM_ADMIN',
      tenantId: defaultTenant.id,
      businessUnitId: defaultBusinessUnit.id,
      status: 'active'
    },
    {
      firstName: 'Sales',
      lastName: 'Manager',
      email: 'sales.manager@fuelx.com',
      password: 'manager123',
      role: 'SALES_MANAGER',
      tenantId: defaultTenant.id,
      businessUnitId: defaultBusinessUnit.id,
      status: 'active'
    },
    {
      firstName: 'Sales',
      lastName: 'Representative',
      email: 'sales.rep@fuelx.com',
      password: 'rep123',
      role: 'SALES_REP',
      tenantId: defaultTenant.id,
      businessUnitId: defaultBusinessUnit.id,
      status: 'active'
    }
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
  }

  // Update business unit manager
  const salesManager = await prisma.user.findUnique({
    where: { email: 'sales.manager@fuelx.com' }
  });

  if (salesManager) {
    await prisma.businessUnit.update({
      where: { id: defaultBusinessUnit.id },
      data: { managerId: salesManager.id }
    });
  }

  console.log('Database seeding completed successfully!');
  console.log('\nAvailable login credentials:');
  console.log('System Admin: admin@fuelx.com / admin123');
  console.log('Sales Manager: sales.manager@fuelx.com / manager123');
  console.log('Sales Rep: sales.rep@fuelx.com / rep123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

