const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFrontendData() {
  try {
    console.log('=== Debugging Frontend API Data ===\n');
    
    // Get natasha user
    const natasha = await prisma.user.findUnique({
      where: { email: 'natasha@fuelx.com' }
    });
    
    if (!natasha) {
      console.log('❌ natasha@fuelx.com not found');
      return;
    }
    
    console.log('👤 Natasha User:');
    console.log(`- Tenant ID: ${natasha.tenantId}`);
    console.log(`- Business Unit ID: ${natasha.businessUnitId}`);
    
    // Simulate what the business units API would return for this user
    console.log('\n🏢 Business Units API Response:');
    const where = {};
    
    // SYSTEM_ADMIN can see all business units, others are filtered by tenant
    if (natasha.role !== 'SYSTEM_ADMIN') {
      where.tenantId = natasha.tenantId;
    }
    
    const businessUnits = await prisma.businessUnit.findMany({
      where,
      include: {
        tenant: {
          select: { name: true }
        }
      }
    });
    
    console.log(`Found ${businessUnits.length} business units:`);
    businessUnits.forEach(bu => {
      console.log(`- ${bu.name} (ID: ${bu.id}, Tenant: ${bu.tenant?.name || 'Global'})`);
    });
    
    // Check if natasha's business unit is in the list
    const natashaBU = businessUnits.find(bu => bu.id === natasha.businessUnitId);
    console.log(`\n🔍 Natasha's BU in list: ${natashaBU ? '✅ Yes' : '❌ No'}`);
    if (natashaBU) {
      console.log(`- Found: ${natashaBU.name}`);
    }
    
    // Simulate what the tenants API would return for this user
    console.log('\n🏢 Tenants API Response:');
    let tenants;
    if (natasha.role === 'SYSTEM_ADMIN') {
      tenants = await prisma.tenant.findMany();
    } else {
      tenants = await prisma.tenant.findMany({
        where: { id: natasha.tenantId }
      });
    }
    
    console.log(`Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name} (ID: ${tenant.id})`);
    });
    
    // Check if natasha's tenant is in the list
    const natashaTenant = tenants.find(t => t.id === natasha.tenantId);
    console.log(`\n🔍 Natasha's Tenant in list: ${natashaTenant ? '✅ Yes' : '❌ No'}`);
    if (natashaTenant) {
      console.log(`- Found: ${natashaTenant.name}`);
    }
    
    // Test the exact logic from the frontend
    console.log('\n🔍 Frontend Logic Test:');
    const userBusinessUnit = businessUnits.find(bu => bu.id === natasha.businessUnitId);
    const userTenant = tenants.find(t => t.id === natasha.tenantId);
    
    console.log(`Business Unit lookup: ${userBusinessUnit?.name || 'Not found'}`);
    console.log(`Tenant lookup: ${userTenant?.name || 'Not found'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendData(); 