import PrismaPkg from '@prisma/client'

// `@prisma/client` sometimes doesn't export types in environments with different
// module interop settings. Use the runtime export but keep types permissive to
// avoid the "no exported member 'PrismaClient'" error.

const PrismaClient = (PrismaPkg as any).PrismaClient as new () => any

declare global {
  // allow global prisma in development to avoid exhausting connections
  // eslint-disable-next-line no-var
  var prisma: any | undefined
}

const prisma = global.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
