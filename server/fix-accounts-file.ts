import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixAccountsFile() {
  console.log('Fixing accounts.ts file...');

  try {
    const routesDir = path.join(__dirname, 'src', 'routes');
    const filePath = path.join(routesDir, 'accounts.ts');
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace the problematic lines in the DELETE route
      content = content.replace(
        /include: \{\s*deals: \{ select: \{ id: true, title: true \} \},\s*tasks: \{ select: \{ id: true, title: true \} \}\s*\}/g,
        'include: {\n        deals: { select: { id: true, title: true } },\n        contactPersons: { select: { id: true, firstName: true, lastName: true } }\n      }'
      );
      
      content = content.replace(
        /const hasTasks = existingAccount\.tasks\.length > 0;/g,
        'const hasContactPersons = existingAccount.contactPersons.length > 0;'
      );
      
      content = content.replace(
        /if \(hasDeals \|\| hasTasks\)/g,
        'if (hasDeals || hasContactPersons)'
      );
      
      content = content.replace(
        /if \(hasTasks\) \{\s*errorMessage \+= ` \$\{existingAccount\.tasks\.length\} task\(s\)`;\s*\}/g,
        'if (hasContactPersons) {\n        errorMessage += ` ${existingAccount.contactPersons.length} contact person(s)`;\n      }'
      );
      
      fs.writeFileSync(filePath, content);
      console.log('✓ Fixed accounts.ts');
    } else {
      console.log('❌ accounts.ts file not found');
    }

    console.log('Accounts file fixed!');
  } catch (error) {
    console.error('Error fixing accounts file:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccountsFile(); 