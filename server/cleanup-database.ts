import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('Starting database cleanup...');

  try {
    // Delete all records from tables (in correct order to respect foreign key constraints)
    console.log('Deleting all records from tables...');

    // Delete in reverse order of dependencies
    await prisma.contactPerson.deleteMany({});
    console.log('✓ Deleted all contact persons');

    await prisma.task.deleteMany({});
    console.log('✓ Deleted all tasks');

    await prisma.deal.deleteMany({});
    console.log('✓ Deleted all deals');

    await prisma.account.deleteMany({});
    console.log('✓ Deleted all accounts');

    await prisma.customer.deleteMany({});
    console.log('✓ Deleted all customers');

    await prisma.user.deleteMany({});
    console.log('✓ Deleted all users');

    await prisma.businessUnit.deleteMany({});
    console.log('✓ Deleted all business units');

    await prisma.tenant.deleteMany({});
    console.log('✓ Deleted all tenants');

    // Keep permissions and role_permissions tables intact
    console.log('✓ Kept permissions and role permissions intact');

    console.log('\nDatabase cleanup completed successfully!');
    console.log('Tables cleared:');
    console.log('- tenants');
    console.log('- business_units');
    console.log('- users');
    console.log('- customers');
    console.log('- accounts');
    console.log('- deals');
    console.log('- tasks');
    console.log('- contact_persons');
    console.log('\nTables preserved:');
    console.log('- permissions');
    console.log('- role_permissions');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDatabase()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 