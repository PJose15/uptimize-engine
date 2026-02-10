import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
        },
    });

    console.log('✅ Created admin user:', admin.username);

    // Add sample template
    const template = await prisma.template.upsert({
        where: { name: 'Default Lead Input' },
        update: {},
        create: {
            name: 'Default Lead Input',
            content: `1. Sarah Chen, Operations Director at GrowthScale (200-person SaaS)
   - Currently tracks 500+ leads/month in spreadsheets
   - Team uses WhatsApp groups for lead handoffs
   - Mentioned on LinkedIn: "Spending 3 hours daily on manual lead routing"
   
2. Marcus Rodriguez, Head of Sales at FitnessPro Network
   - Manages 50+ influencer partnerships via DMs
   - No CRM - uses Notes app and memory
   - Recently posted: "Missed a major collab because message got buried"`,
        },
    });

    console.log('✅ Created template:', template.name);

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
