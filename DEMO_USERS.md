# Demo Users & Role-Based Access Control

This document outlines the seeded demo users available for testing and presentation purposes. Each role has specific permissions and accessible modules.

## Authentication
- **Password**: `password123` (same for all users)
- **Organization**: `Nova AI Global Corp` (nova-ai-corp)

| Role | Login Email | Purpose | Accessible Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@nova.ai` | Global ownership, full system access. | Everything: Admin, Billing, Analytics, Chat, Docs, Settings. |
| **Admin** | `admin@nova.ai` | Operational control and team management. | Admin, Analytics, Chat, Docs, Notifications. |
| **Manager** | `manager@nova.ai` | Team oversight and performance tracking. | Analytics, Chat, Reviews, Notifications. |
| **Team Member** | `teammember@nova.ai` | Everyday execution and query workspace. | Chat, Documents, Personal Notifications. |
| **Customer/User** | `customer@nova.ai` | External access or limited internal access. | Chat (limited), Personal Settings. |

## Demo Users List (3 per role)

### Super Admin (Owner)
1. `superadmin@nova.ai` - Sarah SuperAdmin (CEO)
2. `superadmin2@nova.ai` - Sam SuperAdmin
3. `superadmin3@nova.ai` - Steve SuperAdmin

### Admin
1. `admin@nova.ai` - Alice Admin (SysAdmin)
2. `admin2@nova.ai` - Adam Admin
3. `admin3@nova.ai` - Amy Admin

### Manager
1. `manager@nova.ai` - Mike Manager (Operations)
2. `manager2@nova.ai` - Mandy Manager
3. `manager3@nova.ai` - Mark Manager

### Team Member
1. `teammember@nova.ai` - Tom TeamMember (Developer)
2. `teammember2@nova.ai` - Tina TeamMember
3. `teammember3@nova.ai` - Toby TeamMember

### Customer / External User
1. `customer@nova.ai` - Chris Customer (Partner)
2. `customer2@nova.ai` - Chloe Customer
3. `customer3@nova.ai` - Caleb Customer

## Features to Test
- **Upgrade Flow**: Go to `/dashboard/billing` and click "Upgrade to Pro/Enterprise". The subscription will update dynamically in the database.
- **Dashboard Stats**: Log in as different users to see how the "NovaPilot AI workspace signal" reflects real data from the database.
- **AI Analytics**: Use the Chat interface to query metrics. (Confidence scores and sources are driven by the database).
- **Weekly Reviews**: View generated growth summaries.
- **Role Permissions**: Try accessing `/dashboard/admin` with a `Team Member` vs `Super Admin`.
