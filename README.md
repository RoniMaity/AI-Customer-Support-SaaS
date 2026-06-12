# AI Customer Support SaaS Platform

A multi-tenant, AI-powered customer support SaaS platform built to help businesses automate support queries using Retrieval-Augmented Generation (RAG) and seamlessly escalate complex issues to human agents.

## 🚀 Live Demo URLs
- **Live Application**: [https://ai-customer-support-saa-s.vercel.app](https://ai-customer-support-saa-s.vercel.app)
- **Admin Dashboard**: [https://ai-customer-support-saa-s.vercel.app/dashboard](https://ai-customer-support-saa-s.vercel.app/dashboard)
- **Widget Demo Storefront**: [https://ai-customer-support-saa-s.vercel.app/demo](https://ai-customer-support-saa-s.vercel.app/demo)

## ✨ Core Features
- **Multi-Tenant SaaS Architecture**: Completely isolated data, embeddings, and chat histories for different businesses.
- **RAG-Powered AI Chat**: Instant, highly-accurate AI responses based on business-specific documents via Pinecone and Groq.
- **Real-Time Human Handoff**: Real-time human handoff using WebSockets (admin can reply live).
- **Embeddable Widget**: A lightweight, standalone script that businesses can drop into any external website.

## 🏆 Bonus Features
- **WhatsApp Integration**: Support tickets created automatically from WhatsApp messages via Twilio Webhooks.
- **Email Ticket Creation**: Converts incoming customer emails directly into support dashboard tickets.
- **Live Dashboard**: Real-time metrics for Total Conversations, Open Tickets, and Escalations.

---

## ⚡ Real-Time Human Handoff (Live Chat)
- The AI autonomously handles all initial queries via RAG.
- When a user asks for a human, the system instantly switches to **live mode**.
- The AI is disabled, and the admin receives a real-time WebSocket event on the dashboard.
- Admins can immediately read the chat history and reply in real-time.
- All messages (AI, Customer, and Admin) are persistently stored.

---

## 🧪 How to Test (For Evaluators)
You can test the entire platform in under 2 minutes. No manual data entry is required.

### 1. 1-Click Login
1. Go to the [Live App](https://ai-customer-support-saa-s.vercel.app).
2. Under "For Evaluators", click **Login as Demo User 1 (SaaSify)** or **Login as Demo User 2 (ShopEase)**.
3. You will be instantly logged in to their respective Admin Dashboard. Notice the data isolation between the two!

### 2. Test the RAG Chat Widget
1. From the dashboard, click **"Test Customer Chat ➔"** to visit the simulated storefront.
2. Click the blue chat bubble (`💬`) in the bottom right corner.
3. Try asking a context-specific question:
   - For **Demo User 1**: *"How much is the Starter plan?"* (Expect: $49/month)
   - For **Demo User 2**: *"What is your return policy?"* (Expect: 30 days)

### 3. Test Human Handoff (Live Chat)
1. In the chat widget, type exactly: **"I want to talk to a human"**.
2. The AI will immediately halt its generation and transfer the chat.
3. Open a new tab back to the dashboard and look at the **Live Handoffs** panel.
4. Click on the active live chat, reply as an admin, and switch back to the widget tab.
5. You will see your reply appear **instantly** in the widget via WebSockets!

---

## 🛠️ Tech Stack
- **Frontend**: Next.js (React), Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **AI & Vector DB**: Groq API (LLaMA-3.3-70b), HuggingFace Embeddings, Pinecone
- **Real-Time**: Socket.io
- **Deployment**: Vercel (Frontend), Render (Backend)
