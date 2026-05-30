<div align="center">

# 🌌 NexaSphere

**Connecting students with opportunities across Tech and Non-Tech domains through an integrated digital ecosystem.**

[![GSSoC'26](https://img.shields.io/badge/GSSoC'26-Open%20Source-0e8a16?style=for-the-badge&logo=github)](https://gssoc.girlscript.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-nexasphere--glbajaj.vercel.app-purple?style=for-the-badge&logo=vercel)](https://nexasphere-glbajaj.vercel.app/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](./CONTRIBUTING.md)

</div>

> *Community-first platform · Event management · Real-time collaboration — built for GL Bajaj Group of Institutions*

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/GSSoC-2026-orange?style=flat-square" alt="GSSoC" />
</p>

<div align="center">
  
  ![Stars](https://img.shields.io/github/stars/Ayushh-Sharmaa/NexaSphere?style=social)
  ![Forks](https://img.shields.io/github/forks/Ayushh-Sharmaa/NexaSphere?style=social)
  ![Issues](https://img.shields.io/github/issues/Ayushh-Sharmaa/NexaSphere?style=social)
  ![Contributors](https://img.shields.io/github/contributors/Ayushh-Sharmaa/NexaSphere?style=social)
  ![Last Commit](https://img.shields.io/github/last-commit/Ayushh-Sharmaa/NexaSphere?style=social)

</div>

<p align="center">
  <b>NexaSphere</b> is the premier community and event-management platform for the GL Bajaj Group of Institutions.<br />
  Built on a modern, high-performance web architecture, NexaSphere powers dynamic landing screens, deep event portfolios, form management, certificate generation, and real-time activity logging — all under a premium, cyber-themed design system.
</p>

> [!NOTE]
> NexaSphere is actively maintained and participating in **GSSoC 2026**. Contributions welcome!

---

## 📑 Table of Contents

- [Why NexaSphere?](#-why-nexasphere)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1--clone--install)
  - [Environment Setup](#2--environment-configuration)
  - [Database Setup](#3--database-setup)
  - [Run the App](#4--launch)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Admin Dashboard](#-admin-dashboard)
- [Testing](#-testing)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Contributors](#-contributors)
- [License](#-license)

---

## 💡 Why NexaSphere?

Student communities need more than a static website — they need a living, breathing digital ecosystem. NexaSphere was born to fill that gap:

| Challenge | NexaSphere's Approach |
|---|---|
| Event info scattered across WhatsApp groups | **Centralized event portal** with rich portfolios, galleries, and registration |
| No visibility for club activities | **Activity timeline** with real-time logging and public showcase |
| Manual certificate distribution | **Automated certificate generation** with verification & download |
| Fragmented admin workflows | **Unified admin dashboard** for events, members, and content management |
| Poor mobile experience | **PWA-first** responsive design with offline support |
| No real-time updates | **Socket.IO integration** for live notifications and activity feeds |

---

## ✨ Key Features

### 🏠 Dynamic Landing Page
Premium cyber-themed hero section with smooth animations, event showcases, and community highlights — powered by Framer Motion.

### 📅 Event Management
<table>
<tr>
<td width="60%">

**🎟️ Event Portal**
- Rich event cards with images, descriptions, and schedules
- Interactive calendar view (FullCalendar integration)
- Category filtering and search
- Event registration with form validation

</td>
<td width="40%">

**📊 Analytics & Tracking**
- Real-time attendee counting
- Activity event logging
- Dashboard analytics with Recharts visualizations
- Historical event data

</td>
</tr>
</table>

### 🏆 Certificate System
- Automated certificate generation for event participants
- Unique verification codes
- Print-ready PDF export via `react-to-print`
- Admin bulk-generation tools

### 👥 Core Team & Membership
- Core team profiles with role-based display
- Membership application forms with Turnstile CAPTCHA protection
- Application review and approval workflow

### 🤖 AI-Powered Features
- Google Generative AI integration for intelligent content
- TensorFlow.js for client-side ML capabilities

### 🔔 Real-Time Collaboration
- Socket.IO powered live updates
- Push notifications via Firebase Cloud Messaging
- Activity feed with real-time event streaming

### 🛡️ Security & Monitoring
- Sentry error tracking and performance monitoring
- Cloudflare Turnstile bot protection
- Rate limiting via Upstash Redis
- NextAuth.js authentication

---

## 🏗 Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client — React 18 + TypeScript"]
        UI["Landing Page"]
        EVENTS["Event Portal"]
        CERTS["Certificate System"]
        CALENDAR["Calendar View"]
        NOTIF["Notifications"]
    end

    subgraph FrontendMain["⚡ Frontend — Next.js (App Router)"]
        PAGES["Pages & Layouts"]
        COMPONENTS["Component Library"]
        HOOKS["Custom Hooks"]
        STORE["Zustand State"]
    end

    subgraph AdminApp["🛠️ Admin Dashboard — React + Vite"]
        ADMIN_UI["Dashboard UI"]
        ADMIN_FORMS["Event/Team Forms"]
        ADMIN_CERT["Certificate Manager"]
        ADMIN_MEMBERS["Membership Manager"]
    end

    subgraph Backend["⚙️ Backend — Spring Boot (Java)"]
        REST["REST API Controllers"]
        AUTH["Bearer Token Auth"]
        SERVICES["Business Services"]
        EVENTS_SVC["Event Service"]
        AUDIT["Audit Logging"]
    end

    subgraph ServerlessAPI["☁️ Serverless Functions"]
        CF_FUNC["API Routes (Node.js)"]
        GAS["Google Apps Script"]
    end

    subgraph Data["🗄️ Data Layer"]
        PG["PostgreSQL"]
        REDIS["Upstash Redis"]
        FIREBASE["Firebase"]
    end

    subgraph External["🌐 External Services"]
        SENTRY["Sentry Monitoring"]
        TURNSTILE["Cloudflare Turnstile"]
        GEMINI["Google Generative AI"]
    end

    Client --> FrontendMain
    FrontendMain -->|"API Calls"| Backend
    FrontendMain -->|"Serverless"| ServerlessAPI
    AdminApp -->|"Admin API"| Backend
    Backend --> Data
    ServerlessAPI --> Data
    FrontendMain --> External
    Backend --> AUDIT
    NOTIF -.->|"WebSocket"| FIREBASE
```

---

## 🛠 Tech Stack

<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>Technology</th>
      <th>Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="10"><strong>Frontend</strong></td>
      <td>Next.js (App Router)</td>
      <td>SSR/SSG framework with file-based routing</td>
    </tr>
    <tr>
      <td>React 18 + TypeScript</td>
      <td>UI framework with full type safety</td>
    </tr>
    <tr>
      <td>Tailwind CSS</td>
      <td>Utility-first styling with cyber theme</td>
    </tr>
    <tr>
      <td>Framer Motion</td>
      <td>Premium animations and page transitions</td>
    </tr>
    <tr>
      <td>Zustand</td>
      <td>Lightweight global state management</td>
    </tr>
    <tr>
      <td>FullCalendar</td>
      <td>Interactive event calendar views</td>
    </tr>
    <tr>
      <td>Recharts</td>
      <td>Data visualization and analytics charts</td>
    </tr>
    <tr>
      <td>Lucide React</td>
      <td>Modern, consistent icon library</td>
    </tr>
    <tr>
      <td>React Helmet Async</td>
      <td>Dynamic SEO meta tags</td>
    </tr>
    <tr>
      <td>Socket.IO Client</td>
      <td>Real-time WebSocket communication</td>
    </tr>
    <tr>
      <td rowspan="5"><strong>Backend</strong></td>
      <td>Spring Boot 3 (Java)</td>
      <td>Enterprise-grade REST API server</td>
    </tr>
    <tr>
      <td>Spring Security</td>
      <td>Bearer token auth with role-based access</td>
    </tr>
    <tr>
      <td>Spring Data JPA</td>
      <td>ORM with repository pattern</td>
    </tr>
    <tr>
      <td>PostgreSQL</td>
      <td>Primary relational database</td>
    </tr>
    <tr>
      <td>Swagger / OpenAPI</td>
      <td>Auto-generated API documentation</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>Infrastructure</strong></td>
      <td>Firebase</td>
      <td>Push notifications and cloud messaging</td>
    </tr>
    <tr>
      <td>Upstash Redis</td>
      <td>Rate limiting and KV storage</td>
    </tr>
    <tr>
      <td>Sentry</td>
      <td>Error tracking and performance monitoring</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>AI & ML</strong></td>
      <td>Google Generative AI</td>
      <td>AI-powered content features</td>
    </tr>
    <tr>
      <td>TensorFlow.js</td>
      <td>Client-side machine learning</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>Testing</strong></td>
      <td>Vitest</td>
      <td>Unit and integration testing</td>
    </tr>
    <tr>
      <td>Testing Library</td>
      <td>Component testing utilities</td>
    </tr>
    <tr>
      <td>Playwright</td>
      <td>End-to-end browser testing</td>
    </tr>
    <tr>
      <td rowspan="4"><strong>DevOps</strong></td>
      <td>GitHub Actions</td>
      <td>CI/CD pipelines and automated workflows</td>
    </tr>
    <tr>
      <td>Husky + lint-staged</td>
      <td>Pre-commit hooks for code quality</td>
    </tr>
    <tr>
      <td>ESLint + Prettier</td>
      <td>Code linting and formatting</td>
    </tr>
    <tr>
      <td>Vite PWA Plugin</td>
      <td>Progressive Web App support</td>
    </tr>
  </tbody>
</table>

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Check | Download |
|---|---|---|---|
| Node.js | 20+ LTS | `node -v` | [nodejs.org](https://nodejs.org) |
| npm | 9+ | `npm -v` | bundled with Node |
| PostgreSQL | 14+ | `psql --version` | [postgresql.org](https://postgresql.org) |
| Git | Any | `git --version` | [git-scm.com](https://git-scm.com) |

---

## ⚙️ Installation & Setup

### 1. 📥 Clone & Install

```bash
# Clone the repository
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere

# Install website dependencies
cd website && npm install && cd ..

# Install admin dashboard dependencies
cd admin-dashboard && npm install && cd ..
```

### 2. 🔐 Environment Configuration

**Linux / macOS**
```bash
cp .env.example .env.local
```

**Windows (PowerShell)**
```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` with your configuration values. See the [Environment Variables](#-environment-variables) section for details.

### 3. 🗄 Database Setup

<details>
<summary><strong>🐧 Linux (Ubuntu / Debian)</strong></summary>

```bash
# Install PostgreSQL
sudo apt update && sudo apt install postgresql postgresql-contrib

# Start & enable the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE nexasphere;"
```

</details>

<details>
<summary><strong>🍎 macOS (Homebrew)</strong></summary>

```bash
# Install PostgreSQL
brew install postgresql

# Start the service
brew services start postgresql

# Create database
psql postgres -c "CREATE DATABASE nexasphere;"
```

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

1. Download and install PostgreSQL from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. During installation, note your username, password, and port (default: `5432`)
3. Create a database named `nexasphere` using **pgAdmin** or the PostgreSQL CLI
4. Update your `.env.local` file with the connection string

</details>

### 4. 🚀 Launch

```bash
# Start the website dev server
cd website && npm run dev
# Or from root: npm run dev:website
```

| Service | URL |
|---|---|
| **Website** | http://localhost:5175 |
| **Admin Dashboard** | Run separately — see [Admin Dashboard](#-admin-dashboard) |
| **Java Backend** | See [server-java/README.md](server-java/README.md) |

---

## 📁 Project Structure

```
NexaSphere/
│
├── 📂 website/                    ← NexaSphere public website (React 18 + Vite PWA)
│   ├── 📂 src/                    ← All React source code
│   │   ├── App.jsx                ← Root router and layout shell
│   │   ├── main.jsx               ← Vite entry point
│   │   ├── 📂 components/         ← Reusable UI components (19 feature areas)
│   │   ├── 📂 pages/              ← Route-level pages (18 routes)
│   │   ├── 📂 context/            ← React Context providers
│   │   ├── 📂 hooks/              ← Custom React hooks (18 hooks)
│   │   ├── 📂 services/           ← API client & service layer
│   │   ├── 📂 store/              ← Zustand global stores
│   │   ├── 📂 utils/              ← Pure utility functions
│   │   ├── 📂 styles/             ← Global CSS
│   │   └── 📂 locales/            ← i18n translation files
│   ├── 📂 public/                 ← Static assets (PWA icons, favicon)
│   ├── index.html
│   ├── vite.config.js             ← Vite + PWA + Sentry config
│   ├── package.json               ← Standalone website dependencies
│   └── vercel.json                ← Vercel deployment config
│
├── 📂 admin-dashboard/            ← Standalone admin panel (React + Vite)
│   ├── 📂 src/
│   │   ├── 📂 components/         ← Admin UI components
│   │   ├── 📂 pages/              ← Admin pages (Events, Team, Certs, etc.)
│   │   ├── 📂 hooks/              ← Admin-specific hooks
│   │   └── 📂 services/           ← API client & auth services
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json                ← Standalone Vercel config
│
├── 📂 server/                     ← Node.js / Cloudflare Workers API
│   ├── index.js                   ← Main server entry
│   ├── 📂 controllers/
│   ├── 📂 middleware/
│   ├── 📂 routes/
│   └── package.json
│
├── 📂 server-java/                ← Spring Boot REST API (Java 17)
│   ├── 📂 src/main/java/org/nexasphere/
│   │   ├── 📂 controller/         ← REST controllers
│   │   ├── 📂 model/entity/       ← JPA entities
│   │   ├── 📂 repository/         ← Spring Data repositories
│   │   ├── 📂 service/            ← Business logic
│   │   └── 📂 config/             ← Security, CORS, OpenAPI
│   └── pom.xml
│
├── 📂 server-python/              ← Python microservice (notifications)
├── 📂 google-apps-script/         ← Google Workspace integrations
├── 📂 docs/                       ← Architecture & workflow docs
├── 📂 api/                        ← Serverless API functions
├── 📂 .github/                    ← CI/CD and issue templates
│
├── package.json                   ← Monorepo root (workspace orchestrator)
├── vercel.json                    ← Root Vercel config (points to website/)
└── README.md
```

---


## 📡 API Documentation

The Java backend exposes a comprehensive REST API. Full documentation is auto-generated via **Swagger / OpenAPI**.

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create a new event |
| `PUT` | `/api/events/:id` | Update an existing event |
| `DELETE` | `/api/events/:id` | Delete an event |
| `GET` | `/api/core-team` | List core team members |
| `POST` | `/api/core-team` | Add a core team member |
| `GET` | `/api/activity-events` | List activity events |
| `POST` | `/api/activity-events` | Log a new activity |
| `GET` | `/api/collaborations` | List collaborations |
| `GET` | `/api/dashboard/stats` | Dashboard analytics summary |

> For full API docs with request/response schemas, run the Java backend and visit `/swagger-ui.html`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

---

## 🛠 Admin Dashboard

The admin dashboard is a standalone React + Vite application for managing NexaSphere content.

### Features
- 📊 **Dashboard Home** — Real-time analytics and activity overview
- 📅 **Events Manager** — Create, edit, and delete events with rich forms
- 👥 **Core Team Manager** — Manage team members and roles
- 🏆 **Certificate Manager** — Generate and manage certificates
- 📝 **Membership Manager** — Review and approve membership applications
- 📡 **Activity Events** — Log and track community activities

### Running the Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev   # Runs on http://localhost:5001
```

### 🔐 Admin Login Credentials

> **Organization:** NexaSphere Admin — GL Bajaj Group of Institutions

| Field | Value |
|-------|-------|
| **Email** | `nexasphere@glbajajgroup.org` |
| **Password** | `admin@123` |

> [!IMPORTANT]
> These credentials are configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables on the Java backend.
> For production deployments, set these as secure env vars on your hosting platform (Railway, Render, etc.) — **never commit them to the repository**.

See [admin-dashboard/README.md](admin-dashboard/README.md) for complete setup instructions.

### Deploying on Vercel

Create **two separate Vercel projects**:

| Project | Root Directory | Output |
|---|---|---|
| NexaSphere Website | `website/` | `dist` |
| NexaSphere Admin | `admin-dashboard/` | `dist` |

---

## 🧪 Testing

NexaSphere has a comprehensive testing setup:

### Unit & Integration Tests (Vitest)

```bash
# Run website tests
cd website && npm test

# Run admin tests
cd admin-dashboard && npm test
```

### End-to-End Tests (Playwright)

```bash
# From website directory
cd website && npx playwright test
```

### Linting & Formatting

```bash
# Lint (run from either workspace)
npm run lint
```

---

## 🔑 Environment Variables

Create a `.env.local` file based on `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `UPSTASH_REDIS_URL` | ✅ | Upstash Redis connection URL |
| `UPSTASH_REDIS_TOKEN` | ✅ | Upstash Redis auth token |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js session encryption secret |
| `NEXTAUTH_URL` | ✅ | Application base URL |
| `SENTRY_DSN` | ⬜ | Sentry error tracking DSN |
| `GOOGLE_AI_API_KEY` | ⬜ | Google Generative AI API key |
| `FIREBASE_*` | ⬜ | Firebase configuration for push notifications |
| `TURNSTILE_SITE_KEY` | ⬜ | Cloudflare Turnstile CAPTCHA site key |
| `TURNSTILE_SECRET_KEY` | ⬜ | Cloudflare Turnstile CAPTCHA secret key |

> [!IMPORTANT]
> Never commit `.env.local` files. The `.gitignore` is pre-configured to exclude them.

---

## ❓ Troubleshooting

<details>
<summary><strong>"Cannot connect to database"</strong></summary>

- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Confirm `DATABASE_URL` in `.env` matches your local credentials
- Ensure port `5432` is not blocked by another process
- Check that the `nexasphere` database exists

</details>

<details>
<summary><strong>Node version mismatch</strong></summary>

- NexaSphere requires **Node.js ≥ 20**
- Check the `.nvmrc` file: `cat .nvmrc`
- If using nvm: `nvm use` to switch to the correct version
- Verify: `node -v`

</details>

<details>
<summary><strong>Admin dashboard won't start</strong></summary>

- Ensure you're in the `admin-dashboard/` directory
- Run `npm install` separately for the admin dashboard
- Check that no other process is using port 5174
- Verify `.env` configuration in `admin-dashboard/.env`

</details>

<details>
<summary><strong>Java backend build errors</strong></summary>

- Ensure Java 17+ is installed: `java --version`
- Navigate to `server-java/` and run: `./mvnw clean install`
- Check `application.properties` for correct database configuration
- See [server-java/README.md](server-java/README.md) for detailed setup

</details>

<details>
<summary><strong>PWA not working in development</strong></summary>

- Service workers only activate on `localhost` or HTTPS
- Clear browser cache and service worker registration
- Check `public/manifest.json` and `public/sw.js` for errors
- The PWA is fully functional in production builds: `npm run build && npm run preview`

</details>

---

## 🤝 Contributing

We love contributions! Whether it's a bug fix, a new feature, or improved docs — **every PR makes a difference**.

### Quick Start

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

### Guidelines

- Follow the existing code style (ESLint + Prettier enforced via pre-commit hooks)
- Write tests for new features when applicable
- Use [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
- Fill out the PR template completely

Please read our [**Contributing Guide**](CONTRIBUTING.md) and [**Security Policy**](SECURITY.md) before submitting.

> [!TIP]
> First-time contributor? Look for issues labeled `good first issue` — they're great starting points!

---

## 👥 Contributors

<a href="https://github.com/Ayushh-Sharmaa/NexaSphere/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Ayushh-Sharmaa/NexaSphere" alt="Contributors" />
</a>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License © 2026 NexaSphere — GL Bajaj Group of Institutions, Mathura
```

---

## 👤 Author

[![GitHub](https://img.shields.io/badge/GitHub-Ayushh--Sharmaa-181717?style=flat-square&logo=github)](https://github.com/Ayushh-Sharmaa)

**Ayush Sharma**
*Developer · Community Builder*

---

<div align="center">

*Built with ❤️ for the GL Bajaj student community*

⭐ **Star this repo** if you find it useful — it helps others discover the project!

[Report Bug](https://github.com/Ayushh-Sharmaa/NexaSphere/issues/new?template=bug_report.md) · [Request Feature](https://github.com/Ayushh-Sharmaa/NexaSphere/issues/new?template=feature_request.md) · [Join Discussion](https://github.com/Ayushh-Sharmaa/NexaSphere/discussions)
<!-- CONTRIBUTORS_START -->
<a href="https://github.com/ionfwsrijan"><img src="https://github.com/ionfwsrijan.png" width="50px" alt="ionfwsrijan" title="ionfwsrijan" /></a>
<a href="https://github.com/anshika1179"><img src="https://github.com/anshika1179.png" width="50px" alt="anshika1179" title="anshika1179" /></a>
<a href="https://github.com/atul-upadhyay-7"><img src="https://github.com/atul-upadhyay-7.png" width="50px" alt="atul-upadhyay-7" title="atul-upadhyay-7" /></a>
<a href="https://github.com/OmanshiRaj"><img src="https://github.com/OmanshiRaj.png" width="50px" alt="OmanshiRaj" title="OmanshiRaj" /></a>
<a href="https://github.com/Pratikshya32"><img src="https://github.com/Pratikshya32.png" width="50px" alt="Pratikshya32" title="Pratikshya32" /></a>
<a href="https://github.com/Meenbudha"><img src="https://github.com/Meenbudha.png" width="50px" alt="Meenbudha" title="Meenbudha" /></a>
<a href="https://github.com/pithva007"><img src="https://github.com/pithva007.png" width="50px" alt="pithva007" title="pithva007" /></a>
<a href="https://github.com/advikdivekar"><img src="https://github.com/advikdivekar.png" width="50px" alt="advikdivekar" title="advikdivekar" /></a>
<a href="https://github.com/rajesh-puripanda"><img src="https://github.com/rajesh-puripanda.png" width="50px" alt="rajesh-puripanda" title="rajesh-puripanda" /></a>
<a href="https://github.com/bazik-0"><img src="https://github.com/bazik-0.png" width="50px" alt="bazik-0" title="bazik-0" /></a>
<a href="https://github.com/KRUSHAL2956"><img src="https://github.com/KRUSHAL2956.png" width="50px" alt="KRUSHAL2956" title="KRUSHAL2956" /></a>
<a href="https://github.com/basantnema31"><img src="https://github.com/basantnema31.png" width="50px" alt="basantnema31" title="basantnema31" /></a>
<a href="https://github.com/angelina-2206"><img src="https://github.com/angelina-2206.png" width="50px" alt="angelina-2206" title="angelina-2206" /></a>
<a href="https://github.com/shankumar7"><img src="https://github.com/shankumar7.png" width="50px" alt="shankumar7" title="shankumar7" /></a>
<a href="https://github.com/AMAN194701"><img src="https://github.com/AMAN194701.png" width="50px" alt="AMAN194701" title="AMAN194701" /></a>
<a href="https://github.com/knoxiboy"><img src="https://github.com/knoxiboy.png" width="50px" alt="knoxiboy" title="knoxiboy" /></a>
<a href="https://github.com/DhruvalBhinsara1"><img src="https://github.com/DhruvalBhinsara1.png" width="50px" alt="DhruvalBhinsara1" title="DhruvalBhinsara1" /></a>
<a href="https://github.com/anshul23102"><img src="https://github.com/anshul23102.png" width="50px" alt="anshul23102" title="anshul23102" /></a>
<a href="https://github.com/Dippp10-ally"><img src="https://github.com/Dippp10-ally.png" width="50px" alt="Dippp10-ally" title="Dippp10-ally" /></a>
<a href="https://github.com/Itzzavdheshh"><img src="https://github.com/Itzzavdheshh.png" width="50px" alt="Itzzavdheshh" title="Itzzavdheshh" /></a>
<a href="https://github.com/tamannaa-rath"><img src="https://github.com/tamannaa-rath.png" width="50px" alt="tamannaa-rath" title="tamannaa-rath" /></a>
<a href="https://github.com/parakramgambhir14"><img src="https://github.com/parakramgambhir14.png" width="50px" alt="parakramgambhir14" title="parakramgambhir14" /></a>
<a href="https://github.com/bhumikasudarshani-cmd"><img src="https://github.com/bhumikasudarshani-cmd.png" width="50px" alt="bhumikasudarshani-cmd" title="bhumikasudarshani-cmd" /></a>
<a href="https://github.com/Piyush025s07"><img src="https://github.com/Piyush025s07.png" width="50px" alt="Piyush025s07" title="Piyush025s07" /></a>
<a href="https://github.com/srinidhi-2006-bit"><img src="https://github.com/srinidhi-2006-bit.png" width="50px" alt="srinidhi-2006-bit" title="srinidhi-2006-bit" /></a>
<!-- CONTRIBUTORS_END -->

</div>
