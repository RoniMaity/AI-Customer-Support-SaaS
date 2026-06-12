const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

async function uploadDocument(filePath, token) {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'text/plain' });
  formData.append('file', blob, path.basename(filePath));

  const res = await fetch(`${API_BASE}/rag/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upload ${filePath}: ${errorText}`);
  }
  return res.json();
}

async function seed() {
  console.log("🌱 Starting Demo Seeding...");

  // Setup Tenants
  const tenants = [
    {
      company: "SaaSify AI",
      email: "demo1@test.com",
      password: "password123",
      docPath: path.join(__dirname, '../docs/SaaSify-Pricing.txt'),
      conversations: [
        {
          customer: "Alex Developer",
          query: "I keep getting 429 Too Many Requests on the API.",
          messages: [
            { sender: "user", text: "I keep getting 429 Too Many Requests on the API." },
            { sender: "bot", text: "Hello! A 429 error means you have hit your rate limit. Are you on the Starter or Pro plan?" },
            { sender: "user", text: "Starter plan." },
            { sender: "bot", text: "The Starter plan allows 100 requests per minute. You may want to upgrade to Pro for 1000 requests/min." }
          ]
        },
        {
          customer: "Sarah Founder",
          query: "Can I get a refund for my last month?",
          messages: [
            { sender: "user", text: "Can I get a refund for my last month?" },
            { sender: "bot", text: "We offer a 14-day money-back guarantee for new subscriptions. Please contact support@saasify.ai to process this." }
          ]
        }
      ],
      tickets: [
        { summary: "API Webhook not firing in production", priority: "high", status: "open" },
        { summary: "Upgrade to Enterprise plan inquiry", priority: "normal", status: "resolved" }
      ]
    },
    {
      company: "ShopEase",
      email: "demo2@test.com",
      password: "password123",
      docPath: path.join(__dirname, '../docs/ShopEase-Returns.txt'),
      conversations: [
        {
          customer: "John Shopper",
          query: "How much is overnight shipping?",
          messages: [
            { sender: "user", text: "How much is overnight shipping?" },
            { sender: "bot", text: "Overnight shipping (1 business day) is $24.99. Orders placed before 2 PM EST ship the same day." }
          ]
        },
        {
          customer: "Emily Returns",
          query: "My credit card was declined but I see a pending charge.",
          messages: [
            { sender: "user", text: "My credit card was declined but I see a pending charge." },
            { sender: "bot", text: "Don't worry! For pending charges on failed orders, the authorization will drop off your bank statement within 3 business days." },
            { sender: "user", text: "Okay thanks!" }
          ]
        }
      ],
      tickets: [
        { summary: "Customer received wrong dress size", priority: "high", status: "open" },
        { summary: "Where is my package? (Order #12345)", priority: "normal", status: "open" }
      ]
    }
  ];

  for (const t of tenants) {
    console.log(`\nProcessing ${t.company}...`);
    
    // 1. Clean up existing demo user if it exists to avoid unique constraint errors
    const existingAdmin = await prisma.userAdmin.findUnique({ where: { email: t.email } });
    if (existingAdmin) {
      console.log(`Cleaning up old data for ${t.email}...`);
      await prisma.message.deleteMany({ where: { tenant_id: existingAdmin.tenant_id } });
      await prisma.ticket.deleteMany({ where: { tenant_id: existingAdmin.tenant_id } });
      await prisma.conversation.deleteMany({ where: { tenant_id: existingAdmin.tenant_id } });
      await prisma.knowledgeDoc.deleteMany({ where: { tenant_id: existingAdmin.tenant_id } });
      await prisma.botConfig.deleteMany({ where: { tenant_id: existingAdmin.tenant_id } });
      await prisma.userAdmin.delete({ where: { id: existingAdmin.id } });
      await prisma.tenant.delete({ where: { id: existingAdmin.tenant_id } });
    }

    // 2. Register
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: t.company, email: t.email, password: t.password })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Register failed: ${regData.error}`);
    const tenantId = regData.tenantId;

    // 3. Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: t.email, password: t.password })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 4. Upload Docs to Pinecone
    console.log(`Uploading knowledge base for ${t.company}...`);
    await uploadDocument(t.docPath, token);

    // 5. Inject DB Data
    console.log(`Injecting sample conversations and tickets...`);
    for (const c of t.conversations) {
      const conv = await prisma.conversation.create({
        data: {
          tenant_id: tenantId,
          session_id: crypto.randomUUID(),
          customer_name: c.customer
        }
      });

      for (const m of c.messages) {
        await prisma.message.create({
          data: {
            conversation_id: conv.id,
            tenant_id: tenantId,
            sender: m.sender,
            content: m.text
          }
        });
      }
    }

    for (const ticket of t.tickets) {
      const dummyConv = await prisma.conversation.create({
        data: {
          tenant_id: tenantId,
          session_id: crypto.randomUUID(),
          customer_name: "Anonymous User"
        }
      });
      await prisma.ticket.create({
        data: {
          tenant_id: tenantId,
          conversation_id: dummyConv.id,
          query_summary: ticket.summary,
          priority: ticket.priority,
          status: ticket.status
        }
      });
    }

    console.log(`✅ ${t.company} seeded successfully.`);
  }

  console.log("\n🎉 Demo Database Seeding Complete!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
