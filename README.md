# Velora - Agile Project Management Web Application

Velora is a modernized, visually stunning MERN Stack project management application inspired by Atlassian Jira. Designed with dark-theme glassmorphism and responsiveness, it empowers engineering and marketing teams to coordinate, draft tasks, and visualize workflows dynamically on a Kanban board.

## Features

1. **Authentication System (JWT)**:
   - Full register and login forms with error feedback.
   - JWT token storage in `localStorage` with route guards blocking access to workspace pages for unauthenticated visitors.

2. **Project Dashboard Stats Overview**:
   - Aggregated metrics detailing total projects, total tasks, and completion numbers.
   - Dynamic progress and status breakdown representation.
   - Highlight listing showing the 5 most recent tasks across all user boards.

3. **Projects Workspace Management**:
   - Grid layout listing projects you own or are member of.
   - Quick creation dialog for starting new projects.
   - Owner-restricted deletion capability with task cascading cleanup.

4. **Interactive Kanban Board**:
   - Three status columns: **To Do**, **In Progress**, and **Done**.
   - Drag and drop task cards between columns powered by `@hello-pangea/dnd`.
   - Card information badges for priority levels (low, medium, high) and assignee details.

5. **Task details Dialog (Modal)**:
   - Detailed inspection card for viewing task metadata.
   - Inline modifications for Title, Description, Priority, Status, and Board Assignee.
   - Quick delete trigger.

---

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB + Mongoose.
- **Frontend**: React (Vite-powered), Tailwind CSS v3.4, Lucide React Icons.
- **State & Router**: React Context API, Axios, React Router v6.
- **Interactions**: `@hello-pangea/dnd` (for React 18 strict concurrent dragging).

---

## Folder Structure

```
/agile-project-management
  /client
    /src
      /components     # Reusable layout, models, and protected guards
      /pages          # Full layout views: Login, Dashboard, Projects, Kanban board
      /context        # User authorization Context state
      /utils          # Axios interceptors and wrapper
      main.jsx        # Mounting entry point
      App.jsx         # App router setup
      index.css       # Main styles & Tailwind directives
    package.json      # React dependencies
    vite.config.js    # Vite proxy and configuration
    tailwind.config.js# Tailwind parameters
  /server
    /controllers      # Model logical queries
    /models           # User, Project, Task schemas
    /routes           # Express path mappings
    /middleware       # JWT authorization protection
    server.js         # Entry node launch script
    seed.js           # Test workspace data population script
    package.json      # Backend dependencies
  README.md           # Documentation guide
  .env.example        # Reference environment variables
```

---

<<<<<<< HEAD
## Database Schemas

### User
- `name`: String
- `email`: String (Unique)
- `password`: String (Hashed with bcryptjs)
- `createdAt`: Date

### Project
- `name`: String
- `description`: String
- `owner`: User Reference (Owner)
- `members`: User References[]
- `createdAt`: Date

### Task
- `title`: String
- `description`: String
- `priority`: Enum (`'low' | 'medium' | 'high'`)
- `status`: Enum (`'todo' | 'in_progress' | 'done'`)
- `project`: Project Reference
- `assignee`: User Reference
- `createdAt`: Date

---

## Setup & Local Execution Instructions

### Prerequisites
- Node.js installed (v18+ recommended)
- A MongoDB Atlas Account or a running Local MongoDB instance.

### Configuration (`.env`)

1. Create a `.env` file inside the `/server` folder or reference the root template.
2. Provide your values:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/agile-pm
   JWT_SECRET=supersecretkeyforagiledndworkspace
   ```

### Execution Steps

#### 1. Setup Backend Server
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# (Optional) Seed the database with sample data
# Generates 2 test users (admin + regular), 3 projects, and 10 tasks across statuses.
npm run seed

# Run server in development mode
npm run dev
```

*Note on Seed Credentials*:
- Admin: `admin@example.com` / `adminpassword123`
- User: `jane@example.com` / `userpassword123`

#### 2. Setup Frontend Client
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Run React dashboard (Vite dev server)
npm run dev
```

*Your application will run on: `http://localhost:3000`.*
*All backend request paths `/api` are automatically proxied from Vite to `http://localhost:5000` to avoid local cross-origin blocks.*
=======
## ⚙️ Getting Started

### Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18.x or higher | [nodejs.org](https://nodejs.org) |
| npm | 9.x or higher | Comes with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com) |
| MongoDB Atlas Account | Free | [mongodb.com/atlas](https://mongodb.com/atlas) |

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/velora-agile-pm.git
cd velora-agile-pm
```

**2. Install server dependencies**
```bash
cd server
npm install
```

**3. Install client dependencies**
```bash
cd ../client
npm install
```

---

## 🔑 Environment Variables

### Server — create `server/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/velora?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here
```

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `mysecretkey123` |

### Client — create `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## ▶️ Running the App

### Step 1 — Seed the Database
```bash
cd server
npm run seed
```
This creates sample users, projects, and tasks.

### Step 2 — Start the Backend Server
```bash
cd server
npm run start
```
Server runs on: `http://localhost:5000`

### Step 3 — Start the Frontend
```bash
cd client
npm run dev
```
App runs on: `http://localhost:3000`

---

## 👤 Test Accounts

Use these credentials to explore the app:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@example.com` | `adminpassword123` | Full admin access |
| **Member** | `jane@example.com` | `userpassword123` | Standard user access |

---

## 📡 API Endpoints

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Project Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get single project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/invite` | Invite member |

### Task Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:projectId` | Get project tasks |
| POST | `/api/tasks/:projectId` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |
| POST | `/api/tasks/:id/links` | Link issues |

### Sprint Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sprints/:projectId` | Get project sprints |
| POST | `/api/sprints/:projectId` | Create sprint |
| PUT | `/api/sprints/:id` | Update sprint |
| DELETE | `/api/sprints/:id` | Delete sprint |

### Other Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard stats |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

---

## 🎯 Key Highlights

- ✅ Built completely from scratch using MERN Stack
- ✅ JWT based secure authentication
- ✅ Role based access control (Admin, Member, Viewer)
- ✅ Real-time notifications with auto polling
- ✅ Drag and drop Kanban board
- ✅ Sprint management with velocity tracking
- ✅ Burndown chart for active sprints
- ✅ Issue linking and @mention in comments
- ✅ Auto generated issue IDs (ACME-1, ACME-2)
- ✅ Fully responsive UI with Tailwind CSS
- ✅ Clean folder structure with reusable components
- ✅ Meaningful git commit history

---

## 👩‍💻 Developer

Built with ❤️ by **Shikha Sahu**

For any queries: sahushikhauptu@gmail.com

---

*Velora — Agile Project Management*

