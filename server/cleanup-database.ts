import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
cleanupDatabase()
  .then(() => {
    console.log('Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database cleanup failed:', error);
    process.exit(1);
  }); 