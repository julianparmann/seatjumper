import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });
    console.log(`✅ User ${email} is now an admin`);
    return user;
  } catch (error) {
    console.error(`❌ Failed to make ${email} an admin:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/make-admin.ts <email>');
  console.log('Example: npx tsx scripts/make-admin.ts user@example.com');
  process.exit(1);
}

makeAdmin(email);