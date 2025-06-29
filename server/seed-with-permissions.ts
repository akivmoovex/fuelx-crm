import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWithPermissions() {
  console.log('Seeding essential data (keeping existing permissions)...');

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

    // Check existing permissions
    const existingPermissions = await prisma.permission.findMany();
    console.log(`Found ${existingPermissions.length} existing permissions`);

    // Ensure business unit permissions exist with correct naming
    const requiredPermissions = [
      { name: 'business_units:read', description: 'Read business units', resource: 'business_units', action: 'read' },
      { name: 'business_units:write', description: 'Write business units', resource: 'business_units', action: 'write' },
      { name: 'business_units:delete', description: 'Delete business units', resource: 'business_units', action: 'delete' }
    ];

    for (const perm of requiredPermissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm
      });
      console.log(`✓ Ensured permission: ${perm.name}`);
    }

    // Ensure SYSTEM_ADMIN has all permissions
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
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
  } finally {
    await prisma.$disconnect();
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

// Run the seeding
seedWithPermissions()
  .then(() => {
    console.log('Essential data seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Essential data seeding failed:', error);
    process.exit(1);
  }); 