import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = 'julianparmann@gmail.com';

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    console.log(`✅ Successfully made ${email} an admin!`);
    console.log(`User ID: ${user.id}`);
    console.log(`Admin status: ${user.isAdmin}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
