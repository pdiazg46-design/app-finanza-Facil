import { PrismaClient } from '../prisma-emprende/client'

const prismaEmprendeClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.EMPRENDE_DATABASE_URL,
            },
        },
    })
}

declare global {
    var prismaEmprende: undefined | ReturnType<typeof prismaEmprendeClientSingleton>
}

export const prismaEmprende = globalThis.prismaEmprende ?? prismaEmprendeClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaEmprende = prismaEmprende
