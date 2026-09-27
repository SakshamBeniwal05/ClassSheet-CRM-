# CallSheet CRM 🚀

> **Enterprise-Grade Client Relationship & Pipeline Management System**  
> Built with modern System Design principles, featuring real-time deal stage tracking, multi-tenant organization hierarchy, role-based access control (RBAC), and high-performance caching.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Core Features](#-core-features)
3. [System Architecture & Design](#-system-architecture--design)
4. [Technology Stack](#-technology-stack)
5. [Database Schema & Data Models](#-database-schema--data-models)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Authentication & Security Flow](#-authentication--security-flow)
8. [Folder Structure](#-folder-structure)
9. [Environment Variables](#-environment-variables)
10. [Local Development & Setup](#-local-development--setup)
11. [Production Deployment](#-production-deployment)

---

## 🌟 Project Overview

**CallSheet CRM** is an end-to-end sales pipeline and customer management platform designed for fast-moving sales, consulting, and enterprise teams. It bridges the gap between high-level executive analytics and day-to-day rep execution with a fluid, dark-mode-first user interface and a resilient, decoupled backend architecture.

### Key Highlights
- **Multi-Tenant Architecture**: Supports isolated organizations with hierarchical roles (`Owner`, `Admin`, `Employee`).
- **Interactive Deal Pipeline**: Native drag-and-drop Kanban board across 5 distinct pipeline stages with viewport-locked, column-isolated scrolling.
- **Deep Deal Insight Analysis**: Rich modal drawer containing rich notes, direct cloud media attachments via ImageKit, and client association.
- **Zero-Trust Security**: Dual-token architecture (Access + HTTP-Only Refresh) with Redis-backed OTP verification and automated token rotation.
- **Microservice-Ready Decoupling**: Standalone Express 5 REST API paired with a high-performance React 19 single-page application.

---

## ✨ Core Features

### 1. 💼 Visual Deals Pipeline & Kanban Board
- **5 Pipeline Stages**:
  - `Consulting` (Discovery & Initial Outreach)
  - `Negotiation` (Proposal Review & Terms)
  - `Under_Process` (Active Contract Execution)
  - `Completed_Win` (Closed & Signed Revenue)
  - `Completed_Loss` (Disqualified or Lost Deals)
- **HTML5 Drag-and-Drop**: Reposition deal cards across stages with optimistic UI updates and persistent backend synchronization.
- **Column-Isolated Scrolling**: Viewport-contained interface preventing page scroll while preserving smooth vertical scrolling inside individual stage boxes.
- **Live Financial Summaries**: Real-time aggregation of active deals count, total pipeline value, won revenue, and stage-specific volume.
- **Search & Filters**: Instant client, deal name, and rep search with quick toggle between "All Deals" and "My Deals".

### 2. 🔍 Deal Insight Analysis Modal
- **Comprehensive Overview**: Inspect monetary deal amounts, currency formats, estimated costs, and scheduled closing dates.
- **Activity Notes**: Rich internal team notes tagged with timestamps and author metadata.
- **Cloud Media Hub**: Direct image/document uploads to ImageKit with preview cards and secure CDN distribution.
- **Direct Client & Rep Association**: Quick links to connected client profiles and deal owners.

### 3. 👥 Multi-Tenant Organization & Team RBAC
- **Organization Onboarding**: Create a new organization as an `Owner` or join an existing organization using a secure invite token.
- **Invite Token Engine**: Generate cryptographically secure invite tokens with configurable expiration timestamps.
- **Role-Based Access Control**:
  - `Owner`: Full administrative privileges, organization billing, and team deletion rights.
  - `Admin`: Manage deals, add clients, generate invite tokens, and manage employee roles.
  - `Employee`: Manage assigned deals, clients, notes, and task reminders.
- **Team Performance Dashboard**: Live tracking of active team members, pipeline contributions, and deal counts.

### 4. 📇 Client Management Directory
- **Unified Client Directory**: Centralized list of client leads, companies, job titles, and emails.
- **Quick Client Creator**: Create new client records on-the-fly directly inside the Deal creation workflow without navigating away.
- **Client Relationship History**: View all deals, scheduled meetings, and reminders tied to any specific client.

### 5. ⏰ Reminders & Follow-Up Scheduler
- **Time-Triggered Reminders**: Schedule upcoming calls, check-ins, contract reviews, and meetings.
- **Contextual Linking**: Connect reminders directly to deals and clients.
- **Status Workflow**: Interactive toggle between `Pending` and `Completed` states with visual indicator badges.

### 6. 🔐 Robust Authentication & Password Recovery
- **Two-Step Registration**: Email validation powered by a 6-digit OTP delivered via Nodemailer / Gmail SMTP, cached in Redis with a 10-minute TTL.
- **Google OAuth 2.0 Integration**: Single-click sign-in and account linking.
- **Dual-Token System**:
  - Short-lived JSON Web Token (Access Token) stored securely in client state.
  - Long-lived HTTP-Only, SameSite cookie (Refresh Token) with rotation.
  - Automatic token refresh via Axios response interceptors (`x-access-token`).
- **Secure Password Reset**: Redis-validated OTP flow preventing unauthorized credential changes.

---

## 🏗️ System Architecture & Design

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|                                                                                       |
|   React 19 SPA   <--->   Zustand Stores   <--->   Axios Interceptor (Bearer + Cookies)|
+---------------------------------------------------------------------------------------+
                                        | (HTTPS / JSON / HTTP-Only Cookies)
                                        v
+---------------------------------------------------------------------------------------+
|                                EXPRESS BACKEND SERVER                                 |
|                                                                                       |
|  [ CORS & CookieParser ] ---> [ Express Routers ] ---> [ Auth & RBAC Middlewares ]    |
|                                                                  |                    |
|                                                                  v                    |
|                                                       [ Feature Controllers ]         |
+---------------------------------------------------------------------------------------+
         |                       |                     |                     |
         v                       v                     v                     v
+-----------------+     +-----------------+   +-----------------+   +-----------------+
|   POSTGRESQL    |     |   REDIS CLOUD   |   |    IMAGEKIT     |   | GMAIL SMTP      |
|  (Prisma ORM)   |     | (10m TTL Store) |   |   (Media CDN)   |   |  (Nodemailer)   |
|                 |     |                 |   |                 |   |                 |
| - Users & Orgs  |     | - Reg Staging   |   | - Deal media    |   | - Reg OTPs      |
| - Deals & Notes |     | - Active OTPs   |   | - Cloud storage |   | - Forgot OTPs   |
| - Clients & Rem |     | - Reset OTPs    |   | - CDN delivery  |   | - Alerts        |
+-----------------+     +-----------------+   +-----------------+   +-----------------+
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8.2](https://vitejs.dev/) with `@tailwindcss/vite`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables design tokens (`Geist Variable` font)
- **Routing**: [React Router DOM 7](https://reactrouter.com/) synchronized with Zustand state
- **Global State Management**: [Zustand 5](https://github.com/pmndrs/zustand)
- **HTTP Client**: [Axios](https://axios-http.com/) with automated bearer injection and silent token renewal
- **Animations**: [Motion](https://motion.dev/) (Framer Motion v12)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Feedback & Alerts**: [React Hot Toast](https://react-hot-toast.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js 5](https://expressjs.com/)
- **Language**: [TypeScript 7](https://www.typescriptlang.org/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM 7.8](https://www.prisma.io/) & `@prisma/adapter-pg`
- **In-Memory Cache & Key-Value Store**: [Redis](https://redis.io/) (`node-redis` 6.2)
- **Media CDN & Asset Storage**: [ImageKit SDK 6.0](https://imagekit.io/)
- **Email Service**: [Nodemailer 9.0](https://nodemailer.com/) with Google OAuth2 / App Password
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/), [bcrypt 6.0](https://github.com/kelektiv/node.bcrypt.js), `cookie-parser`

---

## 🗄️ Database Schema & Data Models

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    ORGANISATION ||--o{ USER : "has members"
    USER ||--o| ORGANISATION : "owns"
    ORGANISATION ||--o{ CLIENT : "manages"
    ORGANISATION ||--o{ DEAL : "contains"
    USER ||--o{ DEAL : "authors"
    CLIENT ||--o{ DEAL : "associated with"
    DEAL ||--o{ NOTE : "has"
    USER ||--o{ NOTE : "authors"
    DEAL ||--o{ MEDIA : "contains"
    NOTE ||--o{ MEDIA : "attached to"
    USER ||--o{ MEDIA : "uploads"
    USER ||--o{ REMINDER : "creates"
    CLIENT ||--o{ REMINDER : "relates to"
    DEAL ||--o{ REMINDER : "relates to"

    ORGANISATION {
        uuid id PK
        string organisation_name
        uuid owner_id FK
        string invite_token
        datetime invite_timestamps
        datetime created_at
    }

    USER {
        uuid id PK
        string name
        string email
        enum role "Owner | Admin | Employee"
        string passwordHash
        uuid organisation_id FK
        string refresh_token
        datetime created_at
        datetime updated_at
    }

    DEAL {
        uuid id PK
        string dealName
        uuid client_id FK
        uuid author_id FK
        uuid deal_organisation FK
        decimal amount
        decimal estimated_cost
        string currency
        enum state_of_deal "Consulting | Negotiation | Under_Process | Completed_Win | Completed_Loss"
        datetime scheduled
    }

    CLIENT {
        uuid id PK
        string name
        string email
        string role
        uuid author_id FK
        uuid deal_handling_organisation_id FK
    }

    NOTE {
        uuid id PK
        string title
        text body
        uuid author_id FK
        uuid deal_id FK
        string status
        datetime created_at
    }

    MEDIA {
        uuid id PK
        text media_url
        string file_name
        uuid deal_id FK
        uuid note_id FK
        uuid uploader_id FK
        datetime created_at
    }

    REMINDER {
        uuid id PK
        string title
        text description
        datetime scheduled_trigger_at
        string status
        uuid user_id FK
        uuid client_id FK
        uuid deal_id FK
        datetime created_at
        datetime updated_at
    }
```

---

## 📡 API Endpoints Reference

All routes (except `/api/auth/register` and `/api/auth/login`) require authentication via Bearer Token (`Authorization: Bearer <token>`) or valid HTTP-Only Cookie.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Stage registration & trigger 6-digit OTP | Public |
| `POST` | `/api/auth/registerWithNewOrg` | Verify OTP & create new organization + Owner | Public |
| `POST` | `/api/auth/newUserRegistration` | Verify OTP & join existing organization via token | Public |
| `POST` | `/api/auth/login` | Authenticate user; returns access token & cookie | Public |
| `POST` | `/api/auth/logout` | Revoke refresh token and clear cookies | Authenticated |
| `GET` | `/api/auth/refresh` | Silently issue new access token using refresh cookie | Authenticated |
| `POST` | `/api/auth/forgotPassword` | Send password reset OTP to email | Public |
| `POST` | `/api/auth/resetPassword` | Verify OTP & update user password hash | Public |

### Deals (`/api/deals`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/deals` | List all deals belonging to user's organization | Authenticated |
| `POST` | `/api/deals` | Create a new pipeline deal | Authenticated |
| `GET` | `/api/deals/:id` | Fetch detailed single deal with notes, media & client | Authenticated |
| `PUT` | `/api/deals/:id` | Update deal details or drag-and-drop pipeline stage | Authenticated |
| `DELETE` | `/api/deals/:id` | Delete a deal from the pipeline | Admin / Owner |

### Clients (`/api/clients`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/clients` | List all organization clients | Authenticated |
| `POST` | `/api/clients` | Create new client record | Authenticated |
| `PUT` | `/api/clients/:id` | Update existing client details | Authenticated |
| `DELETE` | `/api/clients/:id` | Remove client | Admin / Owner |

### Organisation & Team (`/api/organisation`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/organisation` | Fetch current organization metadata and metrics | Authenticated |
| `GET` | `/api/organisation/members` | List all members in the organization | Authenticated |
| `POST` | `/api/organisation/invite-token` | Generate a new team invite link/token | Admin / Owner |
| `PATCH` | `/api/organisation/members/:id/:role` | Change team member role (`Admin` / `Employee`) | Owner |
| `DELETE` | `/api/organisation/members/:id` | Remove user from organization | Owner |

### Notes (`/api/notes`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/notes/deal/:dealId` | Fetch all notes tied to a specific deal | Authenticated |
| `POST` | `/api/notes` | Create a note attached to a deal | Authenticated |
| `DELETE` | `/api/notes/:id` | Delete a note | Author / Admin |

### Media (`/api/media`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/media/auth` | Generate ImageKit upload signature & tokens | Authenticated |
| `POST` | `/api/media` | Record uploaded media URL against a deal/note | Authenticated |
| `DELETE` | `/api/media/:id` | Remove media asset | Author / Admin |

### Reminders (`/api/reminders`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reminders` | Fetch all active reminders for current user | Authenticated |
| `POST` | `/api/reminders` | Create reminder with trigger timestamp | Authenticated |
| `PATCH` | `/api/reminders/:id/status` | Toggle reminder status (`Pending` / `Completed`) | Authenticated |
| `DELETE` | `/api/reminders/:id` | Delete reminder | Creator / Admin |

---

## 🔒 Authentication & Security Flow

```
[ User Register / Reset ]
          │
          ▼
Generate 6-digit cryptographic OTP ──► Store payload in Redis (10-minute TTL)
          │
          ▼
Dispatch Email via Nodemailer (Gmail SMTP / Google OAuth2)
          │
          ▼
User submits OTP via Client
          │
   ┌──────┴────────────────────────┐
   ▼                               ▼
[ Valid OTP ]                 [ Invalid / Expired ]
Create User in PostgreSQL     Reject with 400 Bad Request
Delete Key from Redis
Issue Access + Refresh Tokens
```

1. **Access Tokens**: Short-lived (1 day or configurable), sent in JSON body and attached via `Authorization: Bearer <token>` header.
2. **Refresh Tokens**: Long-lived (7 days), stored encrypted in PostgreSQL (`users.refresh_token`) and dispatched via `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
3. **Automated Interceptor**: If the backend detects an expiring token during request lifecycle, it attaches `x-access-token` in response headers, which the Axios response interceptor seamlessly updates in the frontend Zustand store without dropping user state.

---

## 📂 Folder Structure

```
CallSheet/
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma              # Database schema & models
│   ├── src/
│   │   ├── controller/                # Request handlers
│   │   │   ├── auth/                  # Registration, login, OTP & Google
│   │   │   ├── client/                # Client CRUD
│   │   │   ├── deal/                  # Deal pipeline management
│   │   │   ├── media/                 # ImageKit media integration
│   │   │   ├── notes/                 # Deal notes handlers
│   │   │   ├── organisation/          # Team & RBAC management
│   │   │   └── reminder/              # Follow-up scheduler
│   │   ├── routes/                    # Express route definitions
│   │   ├── services/
│   │   │   ├── imagekit/              # Cloud media storage bucket
│   │   │   └── redis/                 # Redis client instance & cache
│   │   ├── utils/                     # ApiError & ApiResponse helpers
│   │   └── main.ts                    # Server bootstrap & middleware
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosApi.ts            # Axios client with interceptors
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── DashboardLayout.tsx# Viewport-locked app shell & sidebar
│   │   │   └── modals/
│   │   │       └── DetailsModals.tsx  # Deal analysis, notes, & media modals
│   │   ├── pages/
│   │   │   ├── Auth/                  # Login, Register, Forgot Password
│   │   │   ├── Clients/               # Client directory view
│   │   │   ├── Dashboard/             # Main metrics & KPI dashboard
│   │   │   ├── Deals/
│   │   │   │   ├── Deals.tsx          # Standard deals grid
│   │   │   │   └── DealManagement.tsx # Drag-and-drop Kanban pipeline
│   │   │   ├── Organisation/          # Team members & invite manager
│   │   │   ├── OTP/                   # OTP verification screen
│   │   │   └── Reminders/             # Task & reminder manager
│   │   ├── store/                     # Zustand state management
│   │   │   ├── clientStore.ts
│   │   │   ├── dealStore.ts
│   │   │   ├── notesStore.ts
│   │   │   ├── reminderStore.ts
│   │   │   └── userStore.ts
│   │   ├── App.tsx                    # Routing sync & protected gates
│   │   ├── index.css                  # Tailwind v4 theme & custom scrollbar
│   │   └── main.tsx                   # React root entry
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── postman/
    └── classSheet.postman_collection.json # Complete API collection
```

---

## ⚙️ Environment Variables

### Backend Configuration (`Backend/.env`)
```ini
# Server
PORT=3000
NODE_ENV=development
CORS_ENV=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/callsheet_db?schema=public"

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=""

# JWT Secrets & Expiry
ACCESS_TOKEN_VALUE=your_super_secret_access_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_VALUE=your_super_secret_refresh_key
REFRESH_TOKEN_EXPIRY=7d

# ImageKit CDN
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Google SMTP / Mailer
GOOGLE_USER=your_email@gmail.com
GOOGLE_APP_PASSWORD=your_gmail_app_password
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_oauth_refresh_token
```

### Frontend Configuration (`Frontend/.env`)
```ini
VITE_BACKEND_URL=http://localhost:3000/api
```

---

## 🚀 Local Development & Setup

### Prerequisites
- **Node.js** (v18+ or v20+ recommended)
- **npm** or **pnpm**
- **PostgreSQL Database** running locally or on cloud (e.g., Supabase / Neon)
- **Redis Server** running locally or via Redis Cloud

### 1. Clone the Repository
```bash
git clone https://github.com/SakshamBeniwal05/ClassSheet-CRM-.git
cd ClassSheet-CRM-
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env # or create .env using the template above

# Run Prisma database migrations & client generation
npx prisma generate
npx prisma db push

# Build TypeScript
npm run build

# Start backend server
npm run dev
```
*Backend runs on `http://localhost:3000`*.

### 3. Frontend Setup
```bash
# Navigate to frontend directory in another terminal
cd ../Frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_BACKEND_URL=http://localhost:3000/api" > .env

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`*.

---

## 🚢 Production Deployment

### Backend
1. Set `NODE_ENV=production`.
2. Run database migrations: `npx prisma migrate deploy`.
3. Compile TypeScript: `npm run build`.
4. Run using process manager like PM2: `pm2 start dist/src/main.js --name callsheet-backend`.

### Frontend
1. Build production static bundle:
```bash
cd Frontend
npm run build
```
2. The optimized production assets will be output in `Frontend/dist/`, ready for hosting on Vercel, Netlify, Cloudflare Pages, or an NGINX reverse proxy.

---

## 📄 License
This project is open-source and licensed under the **ISC License**.
