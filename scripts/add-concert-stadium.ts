import { PrismaClient } from '@prisma/client';
import { allegiantPreciseSections } from '../data/stadiums/allegiant-precise-coordinates';
import { allegiantConcertSections } from '../data/stadiums/allegiant-concert-coordinates';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if Allegiant Stadium (Football) exists
    const existingAllegiant = await prisma.stadium.findFirst({
      where: {
        name: 'allegiant'
      }
    });

    if (existingAllegiant) {
      console.log('Found existing Allegiant Stadium (Football):', existingAllegiant.displayName);
      // Update with proper section config
      await prisma.stadium.update({
        where: { id: existingAllegiant.id },
        data: {
          displayName: 'Allegiant Stadium (Football)',
          sectionConfig: allegiantPreciseSections as any,
          imagePath: '/images/stadiums/allegiant-stadium.jpg',
          imageWidth: 1200,
          imageHeight: 900
        }
      });
      console.log('Updated Allegiant Stadium (Football) with section config');
    } else {
      // Create Allegiant Stadium (Football) if it doesn't exist
      const footballStadium = await prisma.stadium.create({
        data: {
          name: 'allegiant',
          displayName: 'Allegiant Stadium (Football)',
          city: 'Las Vegas',
          state: 'NV',
          imagePath: '/images/stadiums/allegiant-stadium.jpg',
          imageWidth: 1200,
          imageHeight: 900,
          sectionConfig: allegiantPreciseSections as any,
          isActive: true,
        }
      });
      console.log('Created Allegiant Stadium (Football):', footballStadium.displayName);
    }

    // Check if Allegiant Stadium (Concert) exists
    const existingConcert = await prisma.stadium.findFirst({
      where: {
        name: 'allegiant-concert'
      }
    });

    if (existingConcert) {
      console.log('Allegiant Stadium (Concert) already exists');
      // Update it to make sure it's active and has the right config
      await prisma.stadium.update({
        where: { id: existingConcert.id },
        data: {
          displayName: 'Allegiant Stadium (Concert)',
          sectionConfig: allegiantConcertSections as any,
          imagePath: '/images/stadiums/allegiant-stadium.jpg', // Same image, different sections
          imageWidth: 1200,
          imageHeight: 900,
          isActive: true
        }
      });
      console.log('Updated Allegiant Stadium (Concert)');
    } else {
      // Create Allegiant Stadium (Concert)
      const concertStadium = await prisma.stadium.create({
        data: {
          name: 'allegiant-concert',
          displayName: 'Allegiant Stadium (Concert)',
          city: 'Las Vegas',
          state: 'NV',
          imagePath: '/images/stadiums/allegiant-stadium.jpg', // Same image, different sections
          imageWidth: 1200,
          imageHeight: 900,
          sectionConfig: allegiantConcertSections as any,
          isActive: true,
        }
      });
      console.log('Created Allegiant Stadium (Concert):', concertStadium.displayName);
    }

    console.log('✅ Stadium setup complete!');
  } catch (error) {
    console.error('Error setting up stadiums:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();