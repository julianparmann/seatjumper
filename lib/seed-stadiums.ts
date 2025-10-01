import { PrismaClient } from '@prisma/client';
import { allegiantStadiumConfig } from '@/data/stadiums/allegiant-coordinates';

const prisma = new PrismaClient();

export async function seedStadiums() {
  try {
    // Check if Allegiant Stadium already exists
    const existingStadium = await prisma.stadium.findUnique({
      where: { name: allegiantStadiumConfig.name }
    });

    if (existingStadium) {
      console.log('Allegiant Stadium already exists, updating...');

      // Update the existing stadium with new configuration
      const updated = await prisma.stadium.update({
        where: { name: allegiantStadiumConfig.name },
        data: {
          displayName: allegiantStadiumConfig.displayName,
          city: allegiantStadiumConfig.city,
          state: allegiantStadiumConfig.state,
          imagePath: allegiantStadiumConfig.imagePath,
          imageWidth: allegiantStadiumConfig.imageWidth,
          imageHeight: allegiantStadiumConfig.imageHeight,
          sectionConfig: allegiantStadiumConfig.sections as any,
          isActive: true,
        }
      });

      console.log('Updated Allegiant Stadium:', updated.displayName);
    } else {
      // Create new stadium
      const created = await prisma.stadium.create({
        data: {
          name: allegiantStadiumConfig.name,
          displayName: allegiantStadiumConfig.displayName,
          city: allegiantStadiumConfig.city,
          state: allegiantStadiumConfig.state,
          imagePath: allegiantStadiumConfig.imagePath,
          imageWidth: allegiantStadiumConfig.imageWidth,
          imageHeight: allegiantStadiumConfig.imageHeight,
          sectionConfig: allegiantStadiumConfig.sections as any,
          isActive: true,
        }
      });

      console.log('Created Allegiant Stadium:', created.displayName);
    }

    return { success: true };
  } catch (error) {
    console.error('Error seeding stadiums:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedStadiums()
    .then((result) => {
      console.log('Seed completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}