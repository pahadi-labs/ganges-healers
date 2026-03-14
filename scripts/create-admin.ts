/**
 * Create or promote an admin user.
 *
 * Usage:
 *   pnpm create-admin admin@example.com
 *   pnpm create-admin admin@example.com MyPassword123
 *
 * If no password is provided, a random one is generated and printed.
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email || !email.includes('@')) {
    console.error('Usage: pnpm create-admin <email> [password]')
    process.exit(1)
  }

  const rawPassword = process.argv[3] || crypto.randomBytes(16).toString('hex')
  const hashedPassword = await bcrypt.hash(rawPassword, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', vip: true, password: hashedPassword },
    create: {
      email,
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      vip: true,
      freeSessionCredits: 5,
    },
  })

  console.log(`\n✅ Admin user ready:`)
  console.log(`   ID:    ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role:  ADMIN`)

  if (!process.argv[3]) {
    console.log(`\n🔑 Generated password (save it now): ${rawPassword}`)
  }

  console.log('')
}

main()
  .catch((err) => {
    console.error('Failed to create admin:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
