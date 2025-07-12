import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Command line argument parsing
const command = process.argv[2] || 'help';
const options = process.argv.slice(3);

console.log(`FuelX Database Manager - Command: ${command}`);
console.log('==========================================');

async function main() {
  try {
    switch (command) {
      case 'reset':
        await resetDatabase();
        break;
      case 'cleanup':
        await cleanupDatabase();
        break;
      case 'seed':
        await seedEssentialData();
        break;
      case 'setup':
        await setupDefaultTenant();
        break;
      case 'fix-permissions':
        await fixPermissionMismatch();
        break;
      case 'check-permissions':
        await checkPermissions();
        break;
      case 'check-accounts':
        await checkAccounts();
        break;
      case 'check-business-units':
        await checkBusinessUnitsState();
        break;
      case 'stats':
        await showDatabaseStats();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function showHelp() {
  console.log(`
FuelX Database Manager - Available Commands:

  reset              - Complete database reset (deletes all data and reseeds)
  cleanup            - Clean database (keeps system admin and default tenant)
  seed               - Seed essential data (permissions, roles, etc.)
  setup              - Setup default tenant and system admin user
  fix-permissions    - Fix permission mismatches between client and server
  check-permissions  - Check and display current permissions
  check-accounts     - Check accounts state and issues
  check-business-units - Check business units state
  stats              - Show database statistics
  help               - Show this help message

Examples:
  npm run db reset
  npm run db cleanup
  npm run db setup
  npm run db stats
`);
}

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
  }
}

async function cleanupDatabase() {
  console.log('Starting database cleanup...');

  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      console.log('Deleting all deals...');
      await tx.deal.deleteMany({});

      console.log('Deleting all tasks...');
      await tx.task.deleteMany({});

      console.log('Deleting all contact persons...');
      await tx.contactPerson.deleteMany({});

      console.log('Deleting all accounts...');
      await tx.account.deleteMany({});

      console.log('Deleting all customers...');
      await tx.customer.deleteMany({});

      console.log('Deleting all business units...');
      await tx.businessUnit.deleteMany({});

      console.log('Deleting all non-system-admin users...');
      await tx.user.deleteMany({
        where: {
          role: {
            not: 'SYSTEM_ADMIN'
          }
        }
      });

      console.log('Deleting all tenants except the default one...');
      // Keep only the first tenant (usually the default one)
      const tenants = await tx.tenant.findMany({
        orderBy: { id: 'asc' }
      });

      if (tenants.length > 1) {
        const tenantIdsToDelete = tenants.slice(1).map(t => t.id);
        await tx.tenant.deleteMany({
          where: {
            id: {
              in: tenantIdsToDelete
            }
          }
        });
        console.log(`Deleted ${tenantIdsToDelete.length} extra tenants`);
      }

      // Update remaining users to use the first tenant
      const remainingTenant = await tx.tenant.findFirst();
      if (remainingTenant) {
        await tx.user.updateMany({
          data: {
            tenantId: remainingTenant.id
          }
        });
        console.log('Updated remaining users to use the default tenant');
      }

      console.log('Database cleanup completed successfully!');
    });

    // Display final state
    await showDatabaseStats();

  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
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
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
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
    await showDatabaseStats();

  } catch (error) {
    console.error('Error seeding essential data:', error);
    throw error;
  }
}

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
    await showDatabaseStats();

    // Display login credentials
    console.log('\nLogin Credentials:');
    console.log('==================');
    console.log('Email: admin@fuelx.com');
    console.log('Password: admin123');
    console.log('Role: SYSTEM_ADMIN');

  } catch (error) {
    console.error('Error setting up default tenant:', error);
    throw error;
  }
}

async function fixPermissionMismatch() {
  console.log('Fixing permission mismatch between client and server...');

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all role permissions first
      console.log('Deleting all role permissions...');
      await tx.rolePermission.deleteMany({});

      // Delete all permissions
      console.log('Deleting all permissions...');
      await tx.permission.deleteMany({});

      // Create permissions with hyphens (matching client expectations)
      console.log('Creating permissions with hyphens...');
      const permissions = [
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
        
        // Business Unit permissions - WITH HYPHENS (matching client)
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

      const createdPermissions = [];
      for (const perm of permissions) {
        const permission = await tx.permission.create({ data: perm });
        createdPermissions.push(permission);
        console.log(`✓ Created permission: ${permission.name}`);
      }

      // Create role permissions
      console.log('Creating role permissions...');
      
      // SYSTEM_ADMIN gets all permissions
      for (const permission of createdPermissions) {
        await tx.rolePermission.create({
          data: {
            role: 'SYSTEM_ADMIN',
            permissionId: permission.id,
            granted: true
          }
        });
      }
      console.log('✓ SYSTEM_ADMIN role permissions created');

      // HQ_ADMIN permissions
      const hqAdminPermissions = [
        'accounts:read', 'accounts:write', 'accounts:delete',
        'customers:read', 'customers:write', 'customers:delete',
        'deals:read', 'deals:write', 'deals:delete',
        'tasks:read', 'tasks:write', 'tasks:delete',
        'reports:read', 'users:read', 'users:write',
        'business-units:read', 'business-units:write'
      ];

      for (const permName of hqAdminPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'HQ_ADMIN',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ HQ_ADMIN role permissions created');

      // SALES_MANAGER permissions
      const salesManagerPermissions = [
        'accounts:read', 'accounts:write',
        'customers:read', 'customers:write',
        'deals:read', 'deals:write',
        'tasks:read', 'tasks:write',
        'reports:read'
      ];

      for (const permName of salesManagerPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'SALES_MANAGER',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ SALES_MANAGER role permissions created');

      // SALES_REP permissions
      const salesRepPermissions = [
        'accounts:read',
        'customers:read', 'customers:write',
        'deals:read', 'deals:write',
        'tasks:read', 'tasks:write'
      ];

      for (const permName of salesRepPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'SALES_REP',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ SALES_REP role permissions created');

      // SUPPORT permissions
      const supportPermissions = [
        'customers:read',
        'tasks:read', 'tasks:write'
      ];

      for (const permName of supportPermissions) {
        const permission = createdPermissions.find(p => p.name === permName);
        if (permission) {
          await tx.rolePermission.create({
            data: {
              role: 'SUPPORT',
              permissionId: permission.id,
              granted: true
            }
          });
        }
      }
      console.log('✓ SUPPORT role permissions created');

      console.log('Permission mismatch fixed successfully!');
    });

    // Display final state
    await showDatabaseStats();

    // List all permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\nAll Permissions:');
    console.log('================');
    allPermissions.forEach(perm => {
      console.log(`- ${perm.name}`);
    });

  } catch (error) {
    console.error('Error fixing permission mismatch:', error);
    throw error;
  }
}

async function checkPermissions() {
  console.log('Checking current permissions...');

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('\nCurrent Permissions:');
    console.log('====================');
    permissions.forEach(perm => {
      console.log(`- ${perm.name} (${perm.resource}:${perm.action})`);
    });

    const rolePermissions = await prisma.rolePermission.findMany({
      include: { permission: true },
      orderBy: { role: 'asc' }
    });

    console.log('\nRole Permissions:');
    console.log('=================');
    const roleMap = new Map();
    rolePermissions.forEach(rp => {
      if (!roleMap.has(rp.role)) {
        roleMap.set(rp.role, []);
      }
      roleMap.get(rp.role).push(rp.permission.name);
    });

    for (const [role, perms] of roleMap) {
      console.log(`\n${role}:`);
      perms.forEach(perm => console.log(`  - ${perm}`));
    }

  } catch (error) {
    console.error('Error checking permissions:', error);
    throw error;
  }
}

async function checkAccounts() {
  console.log('Checking accounts state...');

  try {
    const accounts = await prisma.account.findMany({
      include: {
        tenant: true,
        businessUnit: true,
        customers: true
      }
    });

    console.log(`\nFound ${accounts.length} accounts:`);
    console.log('==============================');

    accounts.forEach(account => {
      console.log(`\nAccount: ${account.name}`);
      console.log(`  ID: ${account.id}`);
      console.log(`  Tenant: ${account.tenant?.name || 'N/A'}`);
      console.log(`  Business Unit: ${account.businessUnit?.name || 'N/A'}`);
      console.log(`  Customers: ${account.customers.length}`);
      console.log(`  Status: ${account.status}`);
    });

  } catch (error) {
    console.error('Error checking accounts:', error);
    throw error;
  }
}

async function checkBusinessUnitsState() {
  console.log('Checking business units state...');

  try {
    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        tenant: true,
        users: true,
        accounts: true
      }
    });

    console.log(`\nFound ${businessUnits.length} business units:`);
    console.log('=====================================');

    businessUnits.forEach(bu => {
      console.log(`\nBusiness Unit: ${bu.name}`);
      console.log(`  ID: ${bu.id}`);
      console.log(`  Tenant: ${bu.tenant?.name || 'N/A'}`);
      console.log(`  Location: ${bu.location || 'N/A'}`);
      console.log(`  Users: ${bu.users.length}`);
      console.log(`  Accounts: ${bu.accounts.length}`);
      console.log(`  Status: ${bu.status}`);
    });

  } catch (error) {
    console.error('Error checking business units:', error);
    throw error;
  }
}

async function showDatabaseStats() {
  console.log('\nDatabase Statistics:');
  console.log('====================');

  try {
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

    console.log(`Tenants: ${tenants}`);
    console.log(`Users: ${users}`);
    console.log(`Business Units: ${businessUnits}`);
    console.log(`Accounts: ${accounts}`);
    console.log(`Customers: ${customers}`);
    console.log(`Deals: ${deals}`);
    console.log(`Tasks: ${tasks}`);
    console.log(`Permissions: ${permissions}`);
    console.log(`Role Permissions: ${rolePermissions}`);

  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\nDatabase manager completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database manager failed:', error);
    process.exit(1);
  }); 