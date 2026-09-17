# VEDA SETU (वेद सेतु)

> **National Digital Platform for AYUSH Academia-Industry Integration, Skill Assessment & Talent Governance**

VEDA SETU connects Ayurvedic academic institutions, students, faculty mentors, industry partners, and regulatory administrators into a unified, secure digital ecosystem.

---

## 🏛 Architecture

VEDA SETU operates on a decoupled full-stack architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│   • App Router with Turbopack, React 19 & TypeScript        │
│   • Server Components, Server Actions & Proxy Routing       │
│   • Tailwind CSS & shadcn/ui Design System                  │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP / REST API (JSON)
                               │  HttpOnly `auth_token` Cookie & Bearer Tokens
┌──────────────────────────────▼──────────────────────────────┐
│           Node.js + Express + TypeScript REST API           │
│   • Authoritative Security & Business Logic Boundary        │
│   • Pure JWT Authentication & Role-Based Access Control     │
│   • Cryptographic Password Reset (SHA-256)                  │
│   • Pluggable Storage Abstraction (Private Local / S3)      │
└──────────────────────────────┬──────────────────────────────┘
                               │  pg (Node-Postgres Connection Pool)
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL Database                      │
│   • Database Name: `veda_setu`                              │
│   • Relational Schema with Multi-Tenant Foreign Keys        │
│   • ACID Transactions & Cascade Deletion Safety             │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Platform Roles & Portals

VEDA SETU enforces role boundaries across 5 core roles:

| Role | Portal Path | Core Features |
|---|---|---|
| **`student`** | `/student/*` | Skill Assessment Engine (26 questions across 13 competencies), Personalized Learning Pathways, Opportunity Discovery & Application Tracker, Same-Institution Mentorship Requests, Internship & Placement Progress Tracking (0–100%), Digital Portfolio with secure signed document streaming. |
| **`faculty`** | `/faculty/*` | Departmental Student Roster, Mentorship Intake Pipeline with Private Guidance Notes, Inter-Institutional Research Collaboration Hub with Statement of Interest Reviews. |
| **`institution`** | `/institution/*` | Campus Academic Dashboard, Cohort Competency Analytics, Student Registry, Faculty Onboarding & Management, Placement Oversight. |
| **`industry`** | `/industry/*` | Clinical & Industrial Opportunity Authoring (Internships, Clinical Research, Jobs), Candidate Application Review State Machine, Internship & Placement Tracking. |
| **`super_admin`** | `/super-admin/*` | Platform Governance, Academic Institution & Industry Partner Verification/Suspension, User Roster & Role Administration, System-wide Analytics. |

---

## 🧠 Skill Assessment & Scoring Model

The student competency engine evaluates candidates through validated assessment templates:
- **Structure:** 1 published assessment template featuring **26 questions total** (13 Multiple Choice Questions + 13 Self-Rating Questions) evaluating **13 core Ayurvedic competencies**.
- **MCQ Scoring:** Correct answer = 100 points, Incorrect answer = 0 points.
- **Self-Rating Scale:** 5-point scale mapped linearly: $1 \rightarrow 20$, $2 \rightarrow 40$, $3 \rightarrow 60$, $4 \rightarrow 80$, $5 \rightarrow 100$.
- **Competency Score Formula:**
  $$\text{Competency Score} = \text{round}(0.8 \times \text{MCQ Score} + 0.2 \times \text{Self-Rating Score})$$
- **Overall Score:** Rounded arithmetic mean of all 13 competency scores.

---

## 🔄 Opportunity & Placement State Machines

### Application Lifecycle
Applications transition through the following states:
```
applied ──► under_review ──► shortlisted ──► selected
   │              │               │             │
   ▼              ▼               ▼             ▼
withdrawn      rejected        rejected     withdrawn
```
- Valid statuses: `applied`, `under_review`, `shortlisted`, `rejected`, `selected`, `withdrawn`.

### Placement & Internship Lifecycle
For candidates in `selected` status, industry partners initiate structured placement tracking:
```
selected ──► offer_accepted ──► joined ──► in_progress ──► completed
   │
   ▼
withdrawn
```
- Valid statuses: `selected`, `offer_accepted`, `joined`, `in_progress`, `completed`, `withdrawn`.
- Progress tracking: Validated numerical percentage between `0` and `100`.

---

## 🔐 Authentication & Security

- **Authoritative Boundary:** The Express backend (`/api/auth/*`) is the single source of truth for identity, authentication, and authorization.
- **Session Tokens:** Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`JWT_SECRET`), transmitted via secure `HttpOnly` `auth_token` cookies and optional `Authorization: Bearer <token>` headers.
- **Password Hashing:** Salted and hashed using `bcrypt` (10 salt rounds). Plaintext passwords and password hashes are never exposed in API responses.
- **Password Reset Engine:** Cryptographically random single-use tokens (32 bytes) stored as SHA-256 hashes in `password_reset_tokens` with 1-hour expiration and replay prevention.
- **Role Enforcement:** Server-side helpers (`requireAuth`, `requireRole`, `requireSuperAdmin`) and Express middleware (`authenticate`, `requireRole`) verify permissions on every request.

---

## 📦 Storage & Digital Portfolio

- **Storage Architecture:** Built on a pluggable storage interface (`IStorageService`) with an active local private disk provider (`LocalStorageService`).
- **File Validation:** Enforces strict MIME type whitelisting (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) and a maximum file size limit of 5 MB.
- **Secure Streaming:** Uploaded private documents are stored outside the public web root and served exclusively through authenticated routes or time-limited signed HMAC URLs (`/api/portfolio/documents/stream?token=...`).
- **Atomic Operations:** Document replacements and deletions remove previous disk files and database metadata records atomically without leaving orphaned files.

---

## 📋 Prerequisites

- **Node.js**: `v18.18.0` or higher (Node.js 20+ recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14` or higher (running locally on port `5432`)

---

## ⚙️ Environment Configuration

### Frontend Configuration (`.env.local`)
Create `.env.local` in the project root:

```env
# Backend REST API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend Configuration (`backend/.env`)
Create `backend/.env` with your local PostgreSQL credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# PostgreSQL Database Connection
DATABASE_URL=postgresql://postgres:your_password_here@localhost:5432/veda_setu
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=veda_setu
DB_SSL=false

# Authentication & Security (Minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

---

## 🚀 Local Development Setup

### 1. Database Setup & Migrations
Create the PostgreSQL database and run migrations:

```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE veda_setu;"

# Navigate to backend and run migrations
cd backend
npm install
npm run migrate
```

Database migrations are located in `backend/src/db/migrations/`.

### 2. Start Backend Server

```bash
# In the backend directory:
# Development mode with hot-reload (port 5000)
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

### 3. Start Frontend Web Application

```bash
# In the root directory:
# Install dependencies
npm install

# Start Next.js development server (port 3000)
npm run dev

# Build Next.js for production
npm run build

# Start production server
npm run start
```

Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Verification

VEDA SETU includes automated regression test suites and dedicated live E2E verification suites.

### Backend Module Tests (164 / 164 Tests Passing)
Run from the `backend/` directory:

```bash
cd backend

# Run the complete regression test suite (164 tests)
npm run test:all

# Run individual module suites
npm run test:module1    # Traditional Auth & Password Reset (24 tests)
npm run test:module2    # Competencies & Skill Assessment Engine (19 tests)
npm run test:module3    # Opportunities & Skill Matching (29 tests)
npm run test:module4    # Faculty & Institution Governance (20 tests)
npm run test:module5    # Mentorship & Faculty Collaboration (34 tests)
npm run test:module6    # Placements & Digital Portfolio (38 tests)
```

### Dedicated Live E2E Verification Scripts (against running backend & PostgreSQL)
```bash
# Verify Mentorship & Collaboration + Placement Tracking (36 checks)
node backend/scripts/live-e2e-7c5-7c6.mjs

# Verify Digital Portfolio, Signed Document Streaming & Multi-Tenant Isolation (33 checks)
node backend/scripts/live-e2e-7c7.mjs

# Verify Super Admin Portal Governance & Platform Analytics (67 checks)
node backend/scripts/live-e2e-7c11.mjs
```

---

## 📁 Repository Structure

```
.
├── app/                              # Next.js App Router (Pages, Layouts & Server Actions)
│   ├── auth/                         # Login, Registration, Password Reset & Logout
│   ├── student/                      # Student Portal (Assessment, Opportunities, Portfolio)
│   ├── faculty/                      # Faculty Portal (Mentorship, Collaboration Hub)
│   ├── institution/                  # Institution Portal (Analytics, Faculty & Student Registry)
│   ├── industry/                     # Industry Portal (Opportunities, Applications & Placements)
│   └── super-admin/                  # Super Admin Governance & System Roster
├── components/                       # Reusable UI & Role-Specific Components
│   ├── ui/                           # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── layout/                       # DashboardShell, PageHeader, Sidebar navigation
│   └── [role]/                       # Role-specific widgets, modals & tables
├── lib/                              # Frontend Utilities & API Client
│   ├── api.ts                        # Unified REST API client (`api.get`, `api.post`, etc.)
│   ├── auth.ts                       # Server-side auth helpers (`requireAuth`, `requireRole`)
│   └── utils.ts                      # Class merging & formatting utilities
├── proxy.ts                          # Next.js Middleware for Session & Role Redirection
├── backend/                          # Express.js REST API
│   ├── src/
│   │   ├── config/                   # PostgreSQL Pool & Environment Configuration
│   │   ├── controllers/              # Request Handlers (Auth, Student, Faculty, Industry, etc.)
│   │   ├── db/
│   │   │   ├── migrations/           # PostgreSQL DDL Migrations (001 to 008)
│   │   │   ├── index.ts              # Database Pool & Query Utilities
│   │   │   └── migrate.ts            # Migration Runner Script
│   │   ├── middleware/               # Auth, RBAC, Validation & Error Handling
│   │   ├── routes/                   # Express Route Definitions
│   │   ├── services/                 # Business Logic & Domain Services
│   │   ├── storage/                  # Storage Abstraction & Local Disk Provider
│   │   └── server.ts                 # Express App Initialization & Port Listener
│   ├── scripts/                      # Automated Regression Tests & Live E2E Scripts
│   ├── uploads/                      # Local Private Storage Directory
│   └── package.json                  # Backend Scripts & Dependencies
├── public/                           # Static assets, logos & icons
└── README.md                         # Project Documentation
```

---

## 📄 License
This project is proprietary and maintained for AYUSH academic, industrial, and clinical education systems.
