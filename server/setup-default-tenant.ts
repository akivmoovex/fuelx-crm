import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupDefaultTenant() {
  console.log('Setting up default tenant and system admin...');

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Check if default tenant already exists
      let defaultTenant = await tx.tenant.findFirst({
        where: { name: 'FuelX HQ' }
      });

      if (!defaultTenant) {
        console.log('Creating default tenant...');
        defaultTenant = await tx.tenant.create({
          data: {
            name: 'FuelX HQ',
            type: 'HQ',
            status: 'active',
            description: 'Main headquarters for FuelX operations'
          }
        });
        console.log('✓ Default tenant created');
      } else {
        console.log('✓ Default tenant already exists');
      }

      // Check if default business unit exists
      let defaultBusinessUnit = await tx.businessUnit.findFirst({
        where: { 
          name: 'Main Office',
          tenantId: defaultTenant.id
        }
      });

      if (!defaultBusinessUnit) {
        console.log('Creating default business unit...');
        defaultBusinessUnit = await tx.businessUnit.create({
          data: {
            name: 'Main Office',
            address: '123 Main Street',
            city: 'Lusaka',
            state: 'Lusaka',
            postalCode: '10101',
            country: 'Zambia',
            status: 'active',
            tenantId: defaultTenant.id,
          }
        });
        console.log('✓ Default business unit created');
      } else {
        console.log('✓ Default business unit already exists');
      }

      // Check if system admin user exists
      let systemAdmin = await tx.user.findFirst({
        where: { 
          email: 'admin@fuelx.com',
          role: 'SYSTEM_ADMIN'
        }
      });

      if (!systemAdmin) {
        console.log('Creating system admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        systemAdmin = await tx.user.create({
          data: {
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@fuelx.com',
            password: hashedPassword,
            role: 'SYSTEM_ADMIN',
            tenantId: defaultTenant.id,
            businessUnitId: defaultBusinessUnit.id,
            status: 'active'
          }
        });
        console.log('✓ System admin user created');
      } else {
        console.log('✓ System admin user already exists');
      }

      // Ensure all permissions exist
      console.log('Ensuring all permissions exist...');
      const requiredPermissions = [
        // User permissions
        { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
        { name: 'users:write', description: 'Write users', resource: 'users', action: 'write' },
        { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
        
        // Customer permissions
        { name: 'customers:read', description: 'Read customers', resource: 'customers', action: 'read' },
        { name: 'customers:write', description: 'Write customers', resource: 'customers', action: 'write' },
        { name: 'customers:delete', description: 'Delete customers', resource: 'customers', action: 'delete' },
        
        // Deal permissions
        { name: 'deals:read', description: 'Read deals', resource: 'deals', action: 'read' },
        { name: 'deals:write', description: 'Write deals', resource: 'deals', action: 'write' },
        { name: 'deals:delete', description: 'Delete deals', resource: 'deals', action: 'delete' },
        
        // Task permissions
        { name: 'tasks:read', description: 'Read tasks', resource: 'tasks', action: 'read' },
        { name: 'tasks:write', description: 'Write tasks', resource: 'tasks', action: 'write' },
        { name: 'tasks:delete', description: 'Delete tasks', resource: 'tasks', action: 'delete' },
        
        // Account permissions
        { name: 'accounts:read', description: 'Read accounts', resource: 'accounts', action: 'read' },
        { name: 'accounts:write', description: 'Write accounts', resource: 'accounts', action: 'write' },
        { name: 'accounts:delete', description: 'Delete accounts', resource: 'accounts', action: 'delete' },
        
        // Business Unit permissions
        { name: 'business-units:read', description: 'Read business units', resource: 'business-units', action: 'read' },
        { name: 'business-units:write', description: 'Write business units', resource: 'business-units', action: 'write' },
        { name: 'business-units:delete', description: 'Delete business units', resource: 'business-units', action: 'delete' },
        
        // Tenant permissions
        { name: 'tenants:read', description: 'Read tenants', resource: 'tenants', action: 'read' },
        { name: 'tenants:write', description: 'Write tenants', resource: 'tenants', action: 'write' },
        { name: 'tenants:delete', description: 'Delete tenants', resource: 'tenants', action: 'delete' },
        
        // Report permissions
        { name: 'reports:read', description: 'Read reports', resource: 'reports', action: 'read' },
        { name: 'reports:write', description: 'Write reports', resource: 'reports', action: 'write' }
      ];

      for (const perm of requiredPermissions) {
        await tx.permission.upsert({
          where: { name: perm.name },
          update: {},
          create: perm
        });
      }
      console.log('✓ All permissions ensured');

      // Ensure SYSTEM_ADMIN has all permissions
      console.log('Setting up SYSTEM_ADMIN permissions...');
      const allPermissions = await tx.permission.findMany();
      
      for (const permission of allPermissions) {
        await tx.rolePermission.upsert({
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
      console.log('✓ SYSTEM_ADMIN permissions set up');

      console.log('Default tenant setup completed successfully!');
    });

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

    // Display login credentials
    console.log('\nLogin Credentials:');
    console.log('==================');
    console.log('Email: admin@fuelx.com');
    console.log('Password: admin123');
    console.log('Role: SYSTEM_ADMIN');

  } catch (error) {
    console.error('Error setting up default tenant:', error);
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

// Run the setup
setupDefaultTenant()
  .then(() => {
    console.log('Default tenant setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Default tenant setup failed:', error);
    process.exit(1);
  }); 