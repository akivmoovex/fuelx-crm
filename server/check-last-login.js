const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLastLogin() {
  try {
    const systemAdmin = await prisma.user.findUnique({
      where: { email: 'admin@fuelx.com' },
      select: {
        email: true,
        lastLoginAt: true,
        updatedAt: true
      }
    });

    console.log('👤 System Admin Last Login Check:');
    console.log(`   Email: ${systemAdmin.email}`);
    console.log(`   Last Login: ${systemAdmin.lastLoginAt ? new Date(systemAdmin.lastLoginAt).toLocaleString() : 'Never'}`);
    console.log(`   Last Updated: ${new Date(systemAdmin.updatedAt).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error checking last login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLastLogin(); 