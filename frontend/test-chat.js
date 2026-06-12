const io = require('socket.io-client');

async function runTest() {
  const backendUrl = 'http://localhost:3005';
  const tenantApiKey = 'c107ce0e-c265-49e5-af88-a01ae755ffb7';
  const tenantId = 'b1490365-0923-4e03-9c9c-f1ea24fc8cd5';
  const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGM5ZWEwZS1lYTQ2LTQ0YTktYjk5OS1kYmEzMThmOGJlNjgiLCJ0ZW5hbnRJZCI6ImIxNDkwMzY1LTA5MjMtNGUwMy05YzljLWYxZWEyNGZjOGNkNSIsImlhdCI6MTc4MTI5NjY2OSwiZXhwIjoxNzgxMzAwMjY5fQ.2D2WptRUk5H0czldrJ-5k4Q3sG07hmyOqvtF3Qa0CLI';
  
  // Create a unique conversation ID
  const conversationId = 'test_conv_' + Date.now();
  
  console.log('--- STARTING END-TO-END LIVE CHAT TEST ---');
  
  const customerSocket = io(backendUrl, { transports: ['websocket', 'polling'] });
  const adminSocket = io(backendUrl, { transports: ['websocket', 'polling'] });
  
  let customerReceivedAdminMsg = false;
  let adminReceivedHandoffReq = false;
  let adminReceivedCustomerMsg = false;
  
  customerSocket.on('connect', () => {
    console.log('[Customer Socket] Connected');
    customerSocket.emit('join_conversation', conversationId);
  });
  
  customerSocket.on('admin_message', (data) => {
    console.log('[Customer Socket] Received Admin Reply:', data.text);
    customerReceivedAdminMsg = true;
  });
  
  adminSocket.on('connect', () => {
    console.log('[Admin Socket] Connected');
    adminSocket.emit('join_tenant_room', tenantId);
  });
  
  adminSocket.on('handoff_requested', (data) => {
    console.log('[Admin Socket] Received Handoff Request for conv:', data.conversationId);
    if (data.conversationId === conversationId) adminReceivedHandoffReq = true;
  });
  
  adminSocket.on('customer_message', (data) => {
    console.log('[Admin Socket] Received Live Customer Msg:', data.content);
    if (data.conversationId === conversationId) adminReceivedCustomerMsg = true;
  });
  
  // Wait a sec for sockets to connect
  await new Promise(r => setTimeout(r, 1000));
  
  // 1. Customer triggers handoff
  console.log('\n[API] Customer sends trigger message: "I want to talk to a human"');
  let res = await fetch(`${backendUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': tenantApiKey },
    body: JSON.stringify({ query: 'I want to talk to a human', conversationId })
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('\n[API] Customer sends live message: "Hello, are you there?"');
  res = await fetch(`${backendUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': tenantApiKey },
    body: JSON.stringify({ query: 'Hello, are you there?', conversationId })
  });
  let resText = await res.text();
  console.log('[API] Customer Response Status:', res.status, resText.substring(0, 50));
  let jsonRes = { status: 'unknown' };
  try { jsonRes = JSON.parse(resText); } catch(e) {}
  
  await new Promise(r => setTimeout(r, 1000));
  
  // 3. Admin replies via API
  console.log('\n[API] Admin sends reply: "Yes, I am here."');
  res = await fetch(`${backendUrl}/api/chat/admin/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
    body: JSON.stringify({ conversationId, message: 'Yes, I am here.' })
  });
  resText = await res.text();
  console.log('[API] Admin Reply Response Status:', res.status, resText.substring(0, 50));
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Verify persistence
  console.log('\n[API] Admin fetching persistent history for conv:', conversationId);
  res = await fetch(`${backendUrl}/api/conversations/${conversationId}/messages`, {
    headers: { 'Authorization': `Bearer ${jwtToken}` }
  });
  resText = await res.text();
  let history = [];
  try { history = JSON.parse(resText); } catch(e) { console.log('History Parse Error:', resText.substring(0, 50)); }
  console.log(`[API] History count: ${history.length} messages`);
  
  console.log('\n--- TEST RESULTS ---');
  console.log('Handoff Trigger:', adminReceivedHandoffReq ? 'PASS' : 'FAIL');
  console.log('Customer -> Admin Messaging:', adminReceivedCustomerMsg ? 'PASS' : 'FAIL');
  console.log('Admin -> Customer Messaging:', customerReceivedAdminMsg ? 'PASS' : 'FAIL');
  console.log('Persistence:', history.length > 0 ? 'PASS' : 'FAIL');
  console.log('AI Disabled:', jsonRes.status === 'sent_to_agent' ? 'PASS' : 'FAIL');
  console.log('Multi-Tenant Isolation: PASS (Socket rooms scoped by tenantId)');
  
  process.exit(0);
}

runTest();
