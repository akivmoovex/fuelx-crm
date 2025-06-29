import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupKeepPermissionsCascade() {
  console.log('Starting database cleanup with cascade delete (keeping permissions)...');

  try {
    // Delete everything except permissions in the correct order
    console.log('Deleting all deals...');
    await prisma.deal.deleteMany({});

    console.log('Deleting all tasks...');
    await prisma.task.deleteMany({});

    console.log('Deleting all contact persons...');
    await prisma.contactPerson.deleteMany({});

    console.log('Deleting all accounts...');
    await prisma.account.deleteMany({});

    console.log('Deleting all customers...');
    await prisma.customer.deleteMany({});

    console.log('Deleting all users...');
    await prisma.user.deleteMany({});

    console.log('Deleting all business units...');
    await prisma.businessUnit.deleteMany({});

    console.log('Deleting all tenants...');
    await prisma.tenant.deleteMany({});

    // Keep permissions and role permissions
    console.log('Keeping permissions and role permissions...');

    console.log('Database cleanup completed successfully!');

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
    console.error('Error during database cleanup:', error);
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

// Run the cleanup
cleanupKeepPermissionsCascade()
  .then(() => {
    console.log('Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database cleanup failed:', error);
    process.exit(1);
  }); 