import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const leads = [
  { email: 'kyle.rodriguez19@gmail.com', date: '2025-09-24' },
  { email: 'isobel72@hotmail.com', date: '2025-09-18' },
  { email: 'ghowell00@yahoo.com', date: '2025-09-18' },
  { email: 'makayla0@webmai.co', date: '2025-09-18' },
  { email: 'blakevogdes@gmail.com', date: '2025-09-17' }
];

async function addLeads() {
  try {
    for (const lead of leads) {
      const result = await prisma.lead.create({
        data: {
          email: lead.email,
          source: 'landing',
          status: 'PENDING',
          createdAt: new Date(lead.date)
        }
      });
      console.log(`✅ Added: ${result.email} (${result.id})`);
    }
    
    console.log(`\n🎉 Successfully added ${leads.length} leads!`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLeads();
