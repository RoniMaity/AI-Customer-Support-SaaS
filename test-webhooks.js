const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWebhooks() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error("No tenant found");
    const tenantId = tenant.id;

    console.log('Testing WhatsApp Webhook...');
    // Twilio WhatsApp sends urlencoded data
    const waParams = new URLSearchParams();
    waParams.append('From', 'whatsapp:+14155238886');
    waParams.append('Body', 'I want a refund on my last order');
    
    const waRes = await fetch(`https://ai-customer-support-saas-qf3x.onrender.com/api/webhooks/whatsapp/${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: waParams
    });
    console.log('WhatsApp Status:', waRes.status);
    const waText = await waRes.text();
    console.log('WhatsApp Response:', waText);

    console.log('\nTesting Email Webhook...');
    const emailRes = await fetch(`https://ai-customer-support-saas-qf3x.onrender.com/api/webhooks/email?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'customer@example.com',
        subject: 'Order delay',
        text: 'Where is my order? It is 3 days late.',
        to: 'support@saas.com'
      })
    });
    console.log('Email Status:', emailRes.status);
    const emailText = await emailRes.text();
    console.log('Email Response:', emailText);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhooks();
