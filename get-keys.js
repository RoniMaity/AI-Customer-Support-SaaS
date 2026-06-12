const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function main() {
  const adminUser = await prisma.userAdmin.findFirst({
    where: { email: 'demo1@test.com' }
  });
  
  if (!adminUser) {
    console.error('Demo user not found!');
    return;
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: adminUser.tenant_id }
  });
  
  const token = jwt.sign(
    { userId: adminUser.id, tenantId: adminUser.tenant_id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(JSON.stringify({
    apiKey: tenant.api_key,
    tenantId: tenant.id,
    token: token
  }));
}

main().catch(console.error).finally(() => prisma.$disconnect());
