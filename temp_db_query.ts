import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const trx = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30
    });
    console.log(JSON.stringify(trx, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
