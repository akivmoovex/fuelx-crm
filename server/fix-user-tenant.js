const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserTenant() {
  try {
    console.log('=== Fixing User Tenant Assignment ===\n');
    
    // Get the Chirundu Tenant
    const chirunduTenant = await prisma.tenant.findFirst({
      where: { name: 'Chirundu Tenant' }
    });
    
    if (!chirunduTenant) {
      console.log('Chirundu Tenant not found');
      return;
    }
    
    console.log(`Found Chirundu Tenant: ${chirunduTenant.name} (ID: ${chirunduTenant.id})`);
    
    // Update the manager user to use the correct tenant
    const updatedManager = await prisma.user.update({
      where: { email: 'manager@fuelx.com' },
      data: {
        tenantId: chirunduTenant.id
      },
      include: {
        tenant: true,
        businessUnit: true
      }
    });
    
    console.log('\n=== Updated Manager User ===');
    console.log(`- Email: ${updatedManager.email}`);
    console.log(`- Role: ${updatedManager.role}`);
    console.log(`- Tenant: ${updatedManager.tenant.name}`);
    console.log(`- Business Unit: ${updatedManager.businessUnit.name}`);
    console.log(`- Tenant ID: ${updatedManager.tenantId}`);
    console.log(`- Business Unit ID: ${updatedManager.businessUnitId}`);
    
    console.log('\n✅ Manager user tenant assignment fixed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserTenant(); 