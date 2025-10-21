import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create or update Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'duncanoyugi2001@gmail.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'duncanoyugi2001@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('✅ Admin created:', admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
