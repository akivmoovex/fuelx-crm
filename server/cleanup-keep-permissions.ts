import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupKeepPermissions() {
  console.log('Starting database cleanup (keeping permissions)...');

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

      console.log('Deleting all users...');
      await tx.user.deleteMany({});

      console.log('Deleting all business units...');
      await tx.businessUnit.deleteMany({});

      console.log('Deleting all tenants...');
      await tx.tenant.deleteMany({});

      console.log('Database cleanup completed successfully!');
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
cleanupKeepPermissions()
  .then(() => {
    console.log('Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database cleanup failed:', error);
    process.exit(1);
  }); 