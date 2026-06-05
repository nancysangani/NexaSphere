# NexaSphere

> The official tech community platform for GL Bajaj Group of Institutions, Mathura.
> Built by students, for students — featuring events, activities, team management, portfolios, and more.

[![CI](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/Ayushh-Sharmaa/NexaSphere)](LICENSE)

## ✨ Stack

| Layer                  | Technology                                               |
| ---------------------- | -------------------------------------------------------- |
| **Website (Frontend)** | React 18 + Vite 5 + React Router v6                      |
| **Admin Dashboard**    | React 18 + Vite 5                                        |
| **Backend API**        | Node.js 20 + Express 4 (ESM)                             |
| **Database**           | PostgreSQL via Supabase (JSON file fallback for offline) |
| **Real-time**          | Socket.IO                                                |
| **Emails**             | Nodemailer / Resend / SendGrid                           |
| **Auth**               | Session-based admin auth with timing-safe comparison     |
| **Deployment**         | Frontend → Vercel · Backend → Render · Docker supported  |

## 📁 Project Structure

```
NexaSphere/
├── website/              # Main public website (React + Vite)
│   ├── src/
│   │   ├── assets/       # Images, fonts, icons
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── data/         # Static data (events, activities)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route-level page components
│   │   ├── shared/       # Shared UI primitives (Navbar, Footer, etc.)
│   │   ├── styles/       # Global CSS + theme tokens
│   │   └── utils/        # API client, helpers, PWA utils
│   ├── .env.example      # Required environment variables
│   ├── vite.config.js
│   └── vercel.json       # Website-specific Vercel overrides
│
├── admin-dashboard/      # Admin UI (React + Vite, separate deploy)
│   ├── src/
│   ├── .env.example
│   └── vite.config.js
│
├── server/               # Express.js REST API + Socket.IO
│   ├── config/           # DB, socket, and service config
│   ├── controllers/      # Route handler functions
│   ├── middleware/        # Auth, rate limiting, error handling
│   ├── migrations/        # Database migration files
│   ├── models/           # Data models
│   ├── repositories/     # DB access layer (repository pattern)
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Helpers (Sentry, email, etc.)
│   ├── validators/       # Zod schema validators
│   ├── index.js          # Entry point
│   ├── .env.example      # All required environment variables
│   ├── Dockerfile        # Production Docker image
│   └── vercel.json       # Serverless function adapter (optional)
│
├── server-python/        # FastAPI ML/AI microservice (optional)
├── server-java/          # Spring Boot alternative (experimental)
├── google-apps-script/   # Google Sheets / Forms integration scripts
├── docs/                 # Documentation
├── e2e/                  # Playwright end-to-end tests
│
├── vercel.json           # Root Vercel config (deploys website/)
├── render.yaml           # Render config (deploys server/)
├── docker-compose.yml    # Local dev with Docker
├── package.json          # Monorepo root (npm workspaces)
└── .github/workflows/    # CI/CD GitHub Actions
```

## Node Version Management & Environment Setup

Consistent development environments are crucial for the stability, performance, and scaling of NexaSphere. To prevent compatibility issues among contributors, this project strictly enforces Node.js version **v20** (specifically the LTS "Iron" release stream).

### Why Node.js v20 (LTS)?

*   **LTS (Long Term Support) Stability**: Node.js 20 provides long-term security updates and bug fixes, ensuring that the NexaSphere platform is built on a rock-solid foundation.
*   **Modern Runtime Features**: Node.js 20 includes native features such as the stable `fetch` API, a built-in test runner, and refined ESM (ECMAScript Modules) support, which are heavily utilized across our backend services.
*   **Dependency Compatibility**: Our modern toolchain (including React 18, Vite 5, Express 4, and ESLint) is optimized and tested against Node.js 20. Running older or newer versions might result in unexpected compilation or runtime errors.
*   **Production Alignment**: Since our backend is deployed on Render and Docker containers configured for Node 20, using the exact same version locally prevents environment-specific bugs.

---

### Step-by-Step Installation Guide

We recommend using **NVM (Node Version Manager)** to manage Node versions. NVM allows you to switch between different Node versions effortlessly.

#### A. macOS and Linux

1.  **Install NVM**:
    Run the installation script in your terminal using either `curl` or `wget`:

    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```
    *OR*
    ```bash
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```

2.  **Load NVM into the Shell**:
    The installer script should automatically append the loading code to your profile file (such as `~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`). If it doesn't, manually append the following block:

    ```bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && echo "$HOME/.nvm" || echo "$XDG_CONFIG_HOME/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    ```

3.  **Reload your Profile**:
    Apply the changes by running:
    ```bash
    source ~/.zshrc
    # Or for bash
    source ~/.bashrc
    ```

#### B. Windows

Windows does not natively support the UNIX `nvm` script. Instead, use **nvm-windows**:

1.  **Download the Installer**:
    Go to the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases) and download the latest `nvm-setup.exe` installer.

2.  **Run the Installer**:
    Follow the wizard to complete the installation. Ensure that the installation paths do not contain spaces to prevent issues with Node binaries.

3.  **Verify Installation**:
    Open a new command prompt or PowerShell window and run:
    ```cmd
    nvm version
    ```

---

### Enforcing the Version with `.nvmrc`

NexaSphere includes a `.nvmrc` file in the root directory. When you navigate to the project root, you can configure your shell to automatically switch to the correct version, or you can do it manually.

#### Manual Switch

Run the following commands in the project root:

```bash
# Install the Node.js version specified in .nvmrc (v20)
nvm install 20

# Switch your current terminal session to Node.js v20
nvm use

# Verify that the active version is correct
node -v
```

#### Automatic Version Switching (Optional but Recommended)

You can configure your shell to automatically call `nvm use` whenever you change directories (`cd`) into a folder containing a `.nvmrc` file.

*   **Zsh (~/.zshrc)**:
    Append the following function to your `~/.zshrc` file:
    ```bash
    # Place this at the end of your ~/.zshrc
    autoload -U add-zsh-hook
    load-nvmrc() {
      local nvmrc_path="$(nvm_find_nvmrc)"
      if [ -n "$nvmrc_path" ]; then
        local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
        if [ "$nvmrc_node_version" = "N/A" ]; then
          nvm install
        elif [ "$nvmrc_node_version" != "$(nvm current)" ]; then
          nvm use
        fi
      elif [ "$(nvm current)" != "$(nvm version default)" ]; then
        echo "Reverting to nvm default..."
        nvm use default
      fi
    }
    add-zsh-hook chpwd load-nvmrc
    load-nvmrc
    ```

*   **Bash (~/.bashrc)**:
    Append the following block to your `~/.bashrc`:
    ```bash
    cdnvm() {
      cd "$@" || return
      if [ -f .nvmrc ]; then
        nvm use
      fi
    }
    alias cd="cdnvm"
    ```

---

### Alternative: FNM (Fast Node Manager)

If you find NVM slow during shell startup, you can use **FNM**, a fast, Rust-based alternative:

1.  **Installation**:
    *   macOS (via Homebrew): `brew install fnm`
    *   Linux/macOS (via Curl): `curl -fsSL https://fnm.vercel.app/install | bash`
    *   Windows (via Scoop): `scoop install fnm`

2.  **Shell Integration**:
    Add the following to your shell profile configuration (`~/.zshrc`, `~/.bashrc`, or PowerShell profile):
    ```bash
    eval "$(fnm env --use-on-cd)"
    ```
    This automatically checks for the `.nvmrc` file and switches the version seamlessly whenever you navigate into the project directory.

---

### Troubleshooting & Common Errors

#### 1. `command not found: nvm`
This occurs when NVM is installed, but your shell profile has not been reloaded or does not load NVM automatically.
*   **Fix**: Verify that your profile file (`~/.zshrc` for Zsh or `~/.bash_profile` / `~/.bashrc` for Bash) contains the NVM loading script. Then run `source ~/.zshrc` or `source ~/.bashrc` to reload.

#### 2. `nvm use` fails with "N/A version is not installed"
This happens if you run `nvm use` but haven't installed Node v20 locally.
*   **Fix**: Run `nvm install 20` first, then run `nvm use`.

#### 3. Windows PowerShell Execution Policy Error
In PowerShell, running NVM or executing global node scripts may fail due to restricted execution policies.
*   **Fix**: Run PowerShell as an Administrator and execute:
    ```powershell
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

#### 4. Permission Denied (`EACCES` or `EPERM`)
If you find yourself needing to run `sudo npm install`, **stop immediately**. Using `sudo` causes permission mismatches on your project directories.
*   **Fix**: Since NVM installs Node.js and global packages under your user directory (`~/.nvm`), it completely avoids permission issues. Discard the `sudo` command and simply run `npm install` inside the project root with the NVM-managed Node runtime active.

#### 5. Native Module Compilation Failures (node-gyp)
Some dependencies compile native C/C++ code. If compilation fails:
*   **macOS Fix**: Install Xcode Command Line Tools: `xcode-select --install`
*   **Linux Fix**: Install development tools: `sudo apt install build-essential`
*   **Windows Fix**: Run `npm install --global --production windows-build-tools` from an elevated PowerShell command.

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 20.0.0` — [Download](https://nodejs.org/)
- **npm** `>= 9.0.0` (included with Node 20)

### 1. Clone & Install

```bash
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Website
cp website/.env.example website/.env.local

# Admin Dashboard
cp admin-dashboard/.env.example admin-dashboard/.env.local

# Backend API
cp server/.env.example server/.env
```

Then open each `.env` file and fill in your values. At minimum for local dev:

**`website/.env.local`:**

```env
VITE_API_BASE=http://localhost:8787
```

**`server/.env`:**

```env
PORT=8787
NODE_ENV=development
CORS_ORIGIN=http://localhost:5175,http://localhost:5001
ADMIN_USERNAME=your-admin
ADMIN_PASSWORD=YourPass123!
ADMIN_EVENT_PASSWORD=EventPass456!
```

### 3. Run Development Servers

```bash
# Website only (port 5175)
npm run dev:website

# Admin Dashboard only (port 5001)
npm run dev:admin

# Backend API only (port 8787)
npm run dev:server

# All three concurrently (recommended)
npm run dev:all
```

| Service          | URL                          |
| ---------------- | ---------------------------- |
| Website          | http://localhost:5175        |
| Admin Dashboard  | http://localhost:5001        |
| Backend API      | http://localhost:8787        |
| API Health Check | http://localhost:8787/health |

### 4. Running Without a Backend

The website works in **offline mode** when `VITE_API_BASE` is empty. All data comes from localStorage / static JSON files. This is how it runs on Vercel without a backend.

## 🏗️ Building for Production

```bash
# Build website
npm run build:website    # output → website/dist/

# Build admin dashboard
npm run build:admin      # output → admin-dashboard/dist/

# Build both
npm run build:all
```

## 🧪 Testing

```bash
# Website unit tests (Vitest)
npm test

# Server unit tests (Node test runner)
npm run test:server

# End-to-end tests (Playwright)
npx playwright test
```

## 🚢 Deployment

### Frontend → Vercel (Automatic)

The repo is pre-configured for Vercel deployment:

1. Connect the repo to Vercel
2. Vercel auto-detects `vercel.json` at the root
3. Set environment variables in the Vercel dashboard:
   - `VITE_API_BASE` → your Render API URL (e.g. `https://nexasphere-api.onrender.com`)
   - `VITE_ADMIN_DASHBOARD_URL` → your admin dashboard URL
   - `VITE_VAPID_PUBLIC_KEY` → your VAPID key (for push notifications)
4. Deploy! The `website/dist` folder is served with SPA fallback.

### Backend API → Render (via `render.yaml`)

1. Connect the repo to Render
2. Render auto-detects `render.yaml`
3. Set all `sync: false` environment variables in the Render dashboard (see `server/.env.example` for the full list)
4. The `/health` endpoint is used for health checks

### Backend API → Docker

```bash
# Build the image
cd server
docker build -t nexasphere-api .

# Run locally
docker run -p 8787:8787 --env-file .env nexasphere-api
```

### Full Stack with Docker Compose

```bash
# Start all services
docker-compose up --build

# Stop
docker-compose down
```

## 🔑 Environment Variables Reference

| Variable                    | Where                | Description                          |
| --------------------------- | -------------------- | ------------------------------------ |
| `VITE_API_BASE`             | `website/.env.local` | Backend API base URL                 |
| `VITE_ADMIN_DASHBOARD_URL`  | `website/.env.local` | Admin dashboard URL (footer link)    |
| `PORT`                      | `server/.env`        | Server port (default: 8787)          |
| `CORS_ORIGIN`               | `server/.env`        | Comma-separated allowed origins      |
| `DATABASE_URL`              | `server/.env`        | PostgreSQL connection string         |
| `SUPABASE_URL`              | `server/.env`        | Supabase project URL                 |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env`        | Supabase service key                 |
| `ADMIN_USERNAME`            | `server/.env`        | Admin login username                 |
| `ADMIN_PASSWORD`            | `server/.env`        | Admin login password (≥12 chars)     |
| `ADMIN_EVENT_PASSWORD`      | `server/.env`        | Password for posting activity events |

See `server/.env.example` and `website/.env.example` for the complete list.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project is part of **GSSoC 2026** — check the open issues for tasks labelled `good first issue`.

## 📄 License

[MIT](LICENSE) © NexaSphere Core Team
