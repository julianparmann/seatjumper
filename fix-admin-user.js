const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdminUser() {
  console.log('Checking for admin users...');

  // Check all users
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      emailVerified: true,
    }
  });

  console.log('\nAll users in database:');
  allUsers.forEach(user => {
    console.log(`  - ${user.email} (isAdmin: ${user.isAdmin}, verified: ${user.emailVerified ? 'yes' : 'no'})`);
  });

  // Check if admin@seatjumper.com exists
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@seatjumper.com' }
  });

  if (!adminUser) {
    console.log('\n❌ admin@seatjumper.com does not exist');
    console.log('Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@seatjumper.com',
        name: 'Admin User',
        password: hashedPassword,
        isAdmin: true,
        emailVerified: new Date(),
      }
    });

    console.log('✅ Created admin user:', newAdmin.email);
  } else if (!adminUser.isAdmin) {
    console.log('\n⚠️  admin@seatjumper.com exists but isAdmin is false');
    console.log('Updating user to be admin...');

    const updated = await prisma.user.update({
      where: { email: 'admin@seatjumper.com' },
      data: { isAdmin: true }
    });

    console.log('✅ Updated user to admin:', updated.email);
  } else {
    console.log('\n✅ admin@seatjumper.com exists and is admin');
  }

  // Also check julianparmann@gmail.com
  const julianUser = await prisma.user.findUnique({
    where: { email: 'julianparmann@gmail.com' }
  });

  if (julianUser && !julianUser.isAdmin) {
    console.log('\n⚠️  julianparmann@gmail.com exists but isAdmin is false');
    console.log('Updating user to be admin...');

    const updated = await prisma.user.update({
      where: { email: 'julianparmann@gmail.com' },
      data: { isAdmin: true }
    });

    console.log('✅ Updated user to admin:', updated.email);
  } else if (julianUser) {
    console.log('\n✅ julianparmann@gmail.com exists and is admin');
  }

  console.log('\n✅ Admin user check complete!');
}

fixAdminUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
