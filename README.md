# Velora — Agile Project Management

> A full-stack Agile Project Management tool built with the MERN Stack. Manage sprints, track issues, collaborate with your team, and ship faster.

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Test Accounts](#test-accounts)
- [Screenshots](#screenshots)

---

## 🚀 About the Project

**Velora** is a Jira-inspired Agile Project Management web application built from scratch using the MERN Stack. It enables development teams to plan sprints, track issues, manage Kanban boards, collaborate in real-time, and analyze team performance through agile reports.

Built as part of the MERN Stack Developer Internship Technical Assessment for **Isaii AI**.

---

## ✨ Features

### 🔐 Authentication
| Feature | Description |
|--------|-------------|
| User Registration | Register with name, email, and password |
| JWT Login | Secure login with JSON Web Tokens |
| Protected Routes | Only authenticated users can access the app |
| Role Based Access | Admin and Member roles with different permissions |

### 📁 Project Management
| Feature | Description |
|--------|-------------|
| Create Projects | Create projects with name, key, and description |
| Project Key | Auto-generated unique project key (e.g. ACME, VEL) |
| Invite Members | Invite team members by email with roles |
| Member Roles | Admin, Member, Viewer role-based access |
| Delete Projects | Project owners can delete their projects |

### 🗂️ Issue Tracking
| Feature | Description |
|--------|-------------|
| Create Issues | Create issues with title, description, type, priority |
| Issue Types | Task, Story, Bug, Epic, Subtask |
| Priority Levels | Low, Medium, High |
| Issue IDs | Auto-generated IDs like ACME-1, ACME-2 |
| Due Dates | Set due dates on issues |
| Story Points | Assign story points for sprint planning |
| Linked Issues | Link related issues (Relates to, Blocks, Blocked by) |
| Comments | Add comments with @mention support |
| Activity Log | Full history of changes on each issue |

### 📋 Project Views
| View | Description |
|------|-------------|
| Summary | Donut chart, priority breakdown, types of work, activity feed |
| List View | Table view with filters by status, priority, type, assignee |
| Active Board | 4-column Kanban (To Do, In Progress, In Review, Done) |
| Timeline/Roadmap | Gantt chart style timeline view |
| Sprints & Backlog | Sprint planning, backlog management |
| Agile Reports | Velocity chart, burndown chart, capacity planner |

### 🏃 Sprint Management
| Feature | Description |
|--------|-------------|
| Create Sprints | Create sprints with name, goal, start and end dates |
| Sprint Status | Planning, Active, Completed |
| Start Sprint | Start a planned sprint |
| Complete Sprint | Complete active sprint with summary |
| Backlog | Tasks not assigned to any sprint |
| Drag to Sprint | Assign backlog issues to sprints |

### 📊 Agile Reports
| Report | Description |
|--------|-------------|
| Velocity Chart | Story points completed per sprint |
| Burndown Chart | Remaining work in active sprint |
| Capacity Planner | Team member capacity per sprint |

### 🔔 Notifications
| Feature | Description |
|--------|-------------|
| Bell Icon | Real-time notification bell in navbar |
| Unread Count | Red badge showing unread notifications |
| Mark as Read | Mark individual notifications as read |
| Auto Polling | Notifications refresh every 30 seconds |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React.js | 18.x | UI Framework |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| Recharts | 2.x | Charts & Graphs |
| React Beautiful DnD | 13.x | Drag and Drop |
| React Router DOM | 6.x | Client Side Routing |
| Axios | 1.x | HTTP Client |
| Lucide React | 0.3x | Icons |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.x | Runtime |
| Express.js | 4.x | Web Framework |
| MongoDB | 8.x | Database |
| Mongoose | 8.x | ODM |
| JSON Web Token | 9.x | Authentication |
| Bcrypt.js | 2.x | Password Hashing |
| CORS | 2.x | Cross Origin Resource Sharing |
| Dotenv | 16.x | Environment Variables |

---

## 📂 Project Structure

```
velora-agile-pm/
├── client/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable Components
│   │   │   ├── NotificationsDropdown.jsx
│   │   │   ├── TaskModal.jsx
│   │   │   └── ...
│   │   ├── context/          # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/            # Page Components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/            # Utility Functions
│   │   │   └── api.js
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                   # Express Backend
│   ├── controllers/          # Route Controllers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── sprintController.js
│   │   ├── dashboardController.js
│   │   └── notificationController.js
│   ├── middleware/           # Custom Middleware
│   │   └── authMiddleware.js
│   ├── models/               # Mongoose Models
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Sprint.js
│   │   └── Notification.js
│   ├── routes/               # API Routes
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── sprintRoutes.js
│   │   └── notificationRoutes.js
│   ├── seed.js               # Database Seeder
│   ├── server.js             # Entry Point
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

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

For any queries: hr@isaii.in

---

*Velora — Agile Project Management*
