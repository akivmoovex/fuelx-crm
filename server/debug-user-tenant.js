const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserTenant() {
  try {
    console.log('=== Debugging User Tenant Issue ===\n');
    
    // Check manager user details
    const manager = await prisma.user.findUnique({
      where: { email: 'manager@fuelx.com' },
      include: {
        tenant: true,
        businessUnit: true
      }
    });
    
    if (manager) {
      console.log('Manager User Details:');
      console.log(`- Email: ${manager.email}`);
      console.log(`- Role: ${manager.role}`);
      console.log(`- Tenant ID: ${manager.tenantId}`);
      console.log(`- Business Unit ID: ${manager.businessUnitId}`);
      console.log(`- Tenant Name: ${manager.tenant?.name || 'No tenant'}`);
      console.log(`- Business Unit Name: ${manager.businessUnit?.name || 'No business unit'}`);
    } else {
      console.log('manager@fuelx.com not found');
    }
    
    // Check all tenants
    const tenants = await prisma.tenant.findMany();
    console.log('\n=== All Tenants ===');
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name} (ID: ${tenant.id}, Type: ${tenant.type})`);
    });
    
    // Check all business units
    const businessUnits = await prisma.businessUnit.findMany({
      include: { tenant: true }
    });
    console.log('\n=== All Business Units ===');
    businessUnits.forEach(bu => {
      console.log(`- ${bu.name} (Tenant: ${bu.tenant.name}, ID: ${bu.id})`);
    });
    
    // Check if there's a Chirundu business unit
    const chirunduBU = await prisma.businessUnit.findFirst({
      where: { name: { contains: 'Chirundu', mode: 'insensitive' } },
      include: { tenant: true }
    });
    
    if (chirunduBU) {
      console.log('\n=== Chirundu Business Unit Found ===');
      console.log(`- Name: ${chirunduBU.name}`);
      console.log(`- Tenant: ${chirunduBU.tenant.name}`);
      console.log(`- ID: ${chirunduBU.id}`);
    } else {
      console.log('\n=== No Chirundu Business Unit Found ===');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserTenant(); 