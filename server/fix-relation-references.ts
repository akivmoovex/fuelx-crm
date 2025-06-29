import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixRelationReferences() {
  console.log('Fixing relation references in route files...');

  try {
    const routesDir = path.join(__dirname, 'src', 'routes');
    const files = ['users.ts', 'accounts.ts'];

    for (const file of files) {
      const filePath = path.join(routesDir, file);
      
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace incorrect relation names with correct ones
        content = content.replace(/managedBusinessUnit/g, 'managedUnits');
        content = content.replace(/select: \{ name: true, location: true \}/g, 'select: { name: true, city: true }');
        
        fs.writeFileSync(filePath, content);
        console.log(`✓ Fixed ${file}`);
      }
    }

    console.log('All relation references fixed!');
  } catch (error) {
    console.error('Error fixing relation references:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRelationReferences(); 