const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugNatashaUser() {
  try {
    console.log('=== Debugging natasha@fuelx.com User ===\n');
    
    // Get natasha user details
    const natasha = await prisma.user.findUnique({
      where: { email: 'natasha@fuelx.com' },
      include: {
        tenant: true,
        businessUnit: true
      }
    });
    
    if (!natasha) {
      console.log('❌ natasha@fuelx.com not found');
      return;
    }
    
    console.log('👤 Natasha User Details:');
    console.log(`- Email: ${natasha.email}`);
    console.log(`- Role: ${natasha.role}`);
    console.log(`- Status: ${natasha.status}`);
    console.log(`- Tenant ID: ${natasha.tenantId}`);
    console.log(`- Business Unit ID: ${natasha.businessUnitId}`);
    console.log(`- Tenant Name: ${natasha.tenant?.name || 'No tenant'}`);
    console.log(`- Business Unit Name: ${natasha.businessUnit?.name || 'No business unit'}`);
    console.log(`- Created: ${natasha.createdAt}`);
    console.log(`- Updated: ${natasha.updatedAt}`);
    
    // Check if tenant exists
    if (natasha.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: natasha.tenantId }
      });
      console.log(`\n🏢 Tenant Check:`);
      console.log(`- Tenant ID exists: ${!!tenant}`);
      console.log(`- Tenant Name: ${tenant?.name || 'Not found'}`);
    } else {
      console.log(`\n🏢 Tenant Check: No tenant assigned`);
    }
    
    // Check if business unit exists
    if (natasha.businessUnitId) {
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: natasha.businessUnitId }
      });
      console.log(`\n🏢 Business Unit Check:`);
      console.log(`- Business Unit ID exists: ${!!businessUnit}`);
      console.log(`- Business Unit Name: ${businessUnit?.name || 'Not found'}`);
    } else {
      console.log(`\n🏢 Business Unit Check: No business unit assigned`);
    }
    
    // Check all users for comparison
    console.log('\n👥 All Users Comparison:');
    const allUsers = await prisma.user.findMany({
      include: {
        tenant: true,
        businessUnit: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Tenant: ${user.tenant?.name || 'None'}, BU: ${user.businessUnit?.name || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNatashaUser(); 