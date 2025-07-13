const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🚨 Cleaning up non-essential data from the database...');

    // 1. Delete all users except system admin
    await prisma.user.deleteMany({
      where: {
        email: { not: 'admin@fuelx.com' }
      }
    });
    console.log('✅ Deleted all users except system admin.');

    // 2. Truncate non-essential tables
    await prisma.account.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.task.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.contactPerson.deleteMany();
    await prisma.userPermission.deleteMany();
    await prisma.rolePermission.deleteMany({ where: { role: { not: 'SYSTEM_ADMIN' } } });
    // (Keep SYSTEM_ADMIN role permissions)

    console.log('✅ Truncated accounts, deals, tasks, customers, contact persons, user permissions, and non-system role permissions.');

    // 3. Optionally, clean up orphaned business units (if any)
    // (Not deleting business units or tenants as requested)

    // 4. Optionally, clean up orphaned menu items (if any)
    // (Not deleting menu items as requested)

    console.log('🎉 Database cleanup complete!');
  } catch (error) {
    console.error('❌ Error cleaning up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase(); 