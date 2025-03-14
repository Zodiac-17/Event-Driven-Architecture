import { PrismaClient } from "@prisma/client";

const PrismaClientSinglton = () => {
    return new PrismaClient();
}

type PrismaClientSinglton = ReturnType <typeof PrismaClientSinglton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? PrismaClientSinglton();

export default prisma ;

if( process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;