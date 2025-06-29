import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('Starting complete database reset...');

  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      console.log('Deleting all data...');
      
      // Delete in order to respect foreign key constraints
      await tx.deal.deleteMany({});
      await tx.task.deleteMany({});
      await tx.contactPerson.deleteMany({});
      await tx.account.deleteMany({});
      await tx.customer.deleteMany({});
      await tx.user.deleteMany({});
      await tx.businessUnit.deleteMany({});
      await tx.tenant.deleteMany({});
      
      // Keep permissions and role permissions
      console.log('Keeping permissions and role permissions...');
    });

    console.log('Database reset completed successfully!');

    // Now seed essential data
    await seedEssentialData();

  } catch (error) {
    console.error('Error during database reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedEssentialData() {
  console.log('Seeding essential data...');

  try {
    // Create default tenant
    console.log('Creating default tenant...');
    const defaultTenant = await prisma.tenant.create({
      data: {
        name: 'FuelX HQ',
        type: 'HQ',
        status: 'active',
        description: 'Main headquarters for FuelX operations'
      }
    });

    // Create default business unit
    console.log('Creating default business unit...');
    const defaultBusinessUnit = await prisma.businessUnit.create({
      data: {
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
      }
    });

    // Create system admin user
    console.log('Creating system admin user...');
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@fuelx.com',
        password: 'admin123',
        role: 'SYSTEM_ADMIN',
        tenantId: defaultTenant.id,
        businessUnitId: defaultBusinessUnit.id,
        status: 'active'
      }
    });

    // Ensure all permissions exist
    const permissions = [
      { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
      { name: 'users:write', description: 'Write users', resource: 'users', action: 'write' },
      { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'tenants:read', description: 'Read tenants', resource: 'tenants', action: 'read' },
      { name: 'tenants:write', description: 'Write tenants', resource: 'tenants', action: 'write' },
      { name: 'tenants:delete', description: 'Delete tenants', resource: 'tenants', action: 'delete' },
      { name: 'business-units:read', description: 'Read business units', resource: 'business-units', action: 'read' },
      { name: 'business-units:write', description: 'Write business units', resource: 'business-units', action: 'write' },
      { name: 'business-units:delete', description: 'Delete business units', resource: 'business-units', action: 'delete' },
      { name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' },
      { name: 'accounts:write', description: 'Write accounts', resource: 'accounts', action: 'write' },
      { name: 'accounts:delete', description: 'Delete accounts', resource: 'accounts', action: 'delete' },
      { name: 'customers:read', description: 'Read customers', resource: 'customers', action: 'read' },
      { name: 'customers:write', description: 'Write customers', resource: 'customers', action: 'write' },
      { name: 'customers:delete', description: 'Delete customers', resource: 'customers', action: 'delete' },
      { name: 'deals:read', description: 'Read deals', resource: 'deals', action: 'read' },
      { name: 'deals:write', description: 'Write deals', resource: 'deals', action: 'write' },
      { name: 'deals:delete', description: 'Delete deals', resource: 'deals', action: 'delete' },
      { name: 'tasks:read', description: 'Read tasks', resource: 'tasks', action: 'read' },
      { name: 'tasks:write', description: 'Write tasks', resource: 'tasks', action: 'write' },
      { name: 'tasks:delete', description: 'Delete tasks', resource: 'tasks', action: 'delete' },
      { name: 'reports:read', description: 'Read reports', resource: 'reports', action: 'read' },
      { name: 'reports:write', description: 'Write reports', resource: 'reports', action: 'write' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }

    // Ensure SYSTEM_ADMIN has all permissions
    const systemAdminPermissions = await prisma.permission.findMany();
    
    for (const permission of systemAdminPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: 'SYSTEM_ADMIN',
            permissionId: permission.id
          }
        },
        update: { granted: true },
        create: {
          role: 'SYSTEM_ADMIN',
          permissionId: permission.id,
          granted: true
        }
      });
    }

    console.log('Essential data seeding completed successfully!');

    // Display final state
    const finalStats = await getDatabaseStats();
    console.log('\nFinal Database State:');
    console.log('=====================');
    console.log(`Tenants: ${finalStats.tenants}`);
    console.log(`Users: ${finalStats.users}`);
    console.log(`Business Units: ${finalStats.businessUnits}`);
    console.log(`Accounts: ${finalStats.accounts}`);
    console.log(`Customers: ${finalStats.customers}`);
    console.log(`Deals: ${finalStats.deals}`);
    console.log(`Tasks: ${finalStats.tasks}`);
    console.log(`Permissions: ${finalStats.permissions}`);
    console.log(`Role Permissions: ${finalStats.rolePermissions}`);

  } catch (error) {
    console.error('Error seeding essential data:', error);
    throw error;
  }
}

async function getDatabaseStats() {
  const [
    tenants,
    users,
    businessUnits,
    accounts,
    customers,
    deals,
    tasks,
    permissions,
    rolePermissions
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.businessUnit.count(),
    prisma.account.count(),
    prisma.customer.count(),
    prisma.deal.count(),
    prisma.task.count(),
    prisma.permission.count(),
    prisma.rolePermission.count()
  ]);

  return {
    tenants,
    users,
    businessUnits,
    accounts,
    customers,
    deals,
    tasks,
    permissions,
    rolePermissions
  };
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('Database reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database reset failed:', error);
    process.exit(1);
  }); 