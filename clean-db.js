const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDb() {
    console.log('Buscando movimientos con IDs basura...');
    const movements = await prisma.movement.findMany({
        where: {
            description: {
                contains: '[EMP-'
            }
        }
    });

    console.log(`Encontrados ${movements.length} movimientos sucios.`);

    for (const mov of movements) {
        const cleanDesc = mov.description.split(' [EMP-')[0].replace('Retiro desde Emprende', 'Ingreso desde Emprende');
        await prisma.movement.update({
            where: { id: mov.id },
            data: { description: cleanDesc }
        });
        console.log(`Limpiado: ${cleanDesc}`);
    }

    console.log('Limpieza completa.');
}

cleanDb().catch(console.error).finally(() => prisma.$disconnect());
