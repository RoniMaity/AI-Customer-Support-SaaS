# System Use Cases

This diagram outlines the primary actors and their interactions with the AI Customer Support SaaS Platform.

```mermaid
usecaseDiagram
    actor "SaaS Admin" as Admin
    actor "Customer" as Customer
    actor "External Service (Twilio/Email)" as Webhook

    package "AI Support Platform" {
        usecase "Manage Knowledge Base" as UC1
        usecase "View Dashboard Analytics" as UC2
        usecase "Handle Live Chat Escalations" as UC3
        usecase "Manage Support Tickets" as UC4
        
        usecase "Chat with AI Widget" as UC5
        usecase "Request Human Agent" as UC6
        usecase "Submit Email/WhatsApp Inquiry" as UC7
        
        usecase "Create Support Ticket" as UC8
        usecase "Generate RAG Response" as UC9
    }

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4

    Customer --> UC5
    Customer --> UC6
    Customer --> UC7

    Webhook --> UC8

    %% Includes & Extends
    UC5 ..> UC9 : <<includes>>
    UC6 ..> UC3 : <<triggers>>
    UC7 ..> UC8 : <<triggers>>
```
