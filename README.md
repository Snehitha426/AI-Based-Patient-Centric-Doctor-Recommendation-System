# 🩺 AI-Based Patient-Centric Doctor Recommendation System

An intelligent, full-stack web application that uses **AI (LangChain + Groq LLM)** to recommend the best-matched doctors based on patient preferences such as location, specialization, experience, rating, budget, and more. The system also features a complete **appointment booking flow**, separate **patient and doctor portals**, and a conversational AI chat assistant.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Project](#-running-the-project)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Screenshots](#-screenshots)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🤖 AI-Powered Doctor Recommendations
- Uses **LangChain** with **Groq's LLaMA 3.3-70B** model to generate personalized doctor recommendations
- Accepts patient preferences (location, specialization, experience, rating, education, budget)
- Returns 5–6 AI-curated doctor profiles with personalized reasoning

### 💬 Dual Search Modes
1. **Conversational AI Chat** — Step-by-step guided chat with DocAI assistant, complete with quick-reply buttons, typing indicators, and a rating slider
2. **Quick Form** — Multi-step structured form with progress tracking (3 steps: Basic Info → Preferences → Contact)

### 📅 Appointment Booking System
- **Real-time slot generation** based on doctor schedules (day-wise availability, break times, slot duration)
- **Anti-double-booking** — prevents conflicts when two patients try to book the same slot
- **Past-slot filtering** — automatically hides past time slots for today's date
- Book directly from AI recommendation results via inline modal

### 👤 Patient Portal (`booking.html`)
- Patient registration & login (SHA-256 hashed passwords)
- Browse all doctors with **search**, **specialization filter**, and **sorting** (rating, experience, fee)
- View detailed doctor profiles with bio, stats, and availability
- Book appointments with date picker & time slot selection
- **My Appointments** tab to view/cancel upcoming appointments

### 👨‍⚕️ Doctor Portal (`doctor-portal.html`)
- Doctor registration & login with specialization, experience, and fee
- **Dashboard** — overview stats: today's appointments, upcoming, completed, total
- **Schedule Manager** — toggle days on/off, set working hours, break times, and slot durations for each day of the week
- **Appointments** tab — view all appointments with status/date filters; mark as completed or cancel
- **Profile Editor** — update name, specialization, experience, fee, avatar, and bio

### 🎨 UI/UX
- **Dark/Light theme toggle** with localStorage persistence
- **Responsive design** — works on desktop, tablet, and mobile
- Beautiful gradient hero section with floating animated cards
- Toast notifications, loading animations, and smooth transitions
- Google Fonts (Nunito + Inter) and Font Awesome icons

### 📧 Contact Form
- Contact support form with EmailJS integration (configurable)
- File attachment support (PDF, JPG, PNG, DOC)

### 🌐 Multi-language Support
- Language selector in navbar (English, Hindi, Telugu — UI-ready)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **AI/LLM** | LangChain.js, Groq Cloud (LLaMA 3.3-70B) |
| **Data Storage** | localStorage (browser-side persistence) |
| **Styling** | Custom CSS with CSS Variables, Glassmorphism |
| **Icons** | Font Awesome 6.5 |
| **Fonts** | Google Fonts (Nunito, Inter) |
| **Email** | EmailJS (optional) |

---

## 🏗 Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                   │
│                                                         │
│  index.html ──── Main Page (Hero, Chat, Form, Results)  │
│  booking.html ── Patient Portal (Browse, Book, Appts)   │
│  doctor-portal.html ── Doctor Portal (Dashboard, Sched) │
│                                                         │
│  js/storage.js ── Data Layer (localStorage CRUD)        │
│  js/webhook.js ── API Client (calls backend)            │
│  js/chat.js ───── Conversational Chat Module            │
│  js/form.js ───── Multi-step Form Module                │
│  js/main.js ───── Main Orchestrator & Auth              │
│  js/booking.js ── Patient Portal Logic                  │
│  js/doctor-portal.js ── Doctor Portal Logic             │
│  js/email.js ──── EmailJS Contact Form                  │
│                                                         │
│  css/style.css ── Main Page Styles                      │
│  css/booking.css ── Portal Styles (Patient & Doctor)    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP POST /api/recommend
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   NODE.JS SERVER (Backend)               │
│                                                         │
│  server.js                                              │
│  ├── Express.js (static file serving + API)             │
│  ├── LangChain ChatPromptTemplate                       │
│  ├── ChatGroq (LLaMA 3.3-70B via Groq Cloud)           │
│  └── StringOutputParser → JSON response                 │
│                                                         │
│  .env ── GROQ_API_KEY                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│              GROQ CLOUD API (External)                  │
│         LLaMA 3.3-70B Versatile Model                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
doct_recommendation/
├── index.html              # Main landing page (AI recommendations)
├── booking.html            # Patient portal (browse & book doctors)
├── doctor-portal.html      # Doctor portal (dashboard & management)
├── server.js               # Node.js Express backend (LangChain + Groq)
├── package.json            # Node.js dependencies & scripts
├── package-lock.json       # Dependency lock file
├── .env                    # Environment variables (GROQ_API_KEY)
├── .gitignore              # Git ignore rules
├── README.md               # This file
│
├── css/
│   ├── style.css           # Main page styles (hero, form, chat, results)
│   └── booking.css         # Portal styles (patient & doctor portals)
│
├── js/
│   ├── storage.js          # Data layer — Auth, Doctors, Schedules, Appointments, SlotEngine
│   ├── webhook.js          # API client — sends requests to LangChain backend
│   ├── chat.js             # Conversational AI chat module
│   ├── form.js             # Multi-step form module
│   ├── main.js             # Main orchestrator — auth, section nav, results rendering
│   ├── booking.js          # Patient portal logic — browse, profile, booking, appointments
│   ├── doctor-portal.js    # Doctor portal logic — dashboard, schedule, appointments, profile
│   └── email.js            # EmailJS contact form handler
│
└── assets/                 # Static assets (images, etc.)
```

---

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v18 or later recommended)
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Groq API Key** (Free)
   - Sign up at [https://console.groq.com](https://console.groq.com)
   - Generate an API key from the dashboard

3. **A modern web browser** (Chrome, Edge, Firefox, Safari)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Snehitha426/AI-Based-Patient-Centric-Doctor-Recommendation-System.git
cd AI-Based-Patient-Centric-Doctor-Recommendation-System
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `express` — Web server framework
- `cors` — Cross-Origin Resource Sharing middleware
- `dotenv` — Environment variable loader
- `@langchain/groq` — LangChain integration with Groq
- `@langchain/core` — LangChain core utilities (prompts, parsers)

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (or edit the existing one):

```env
# Get your FREE Groq API key at: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here
```

> ⚠️ **Important:** Never commit your `.env` file to version control. It is already listed in `.gitignore`.

### Step 4: (Optional) Configure EmailJS

If you want the contact form to send real emails, edit `js/email.js`:

```javascript
const EMAILJS_PUBLIC_KEY = 'your_emailjs_public_key';
const EMAILJS_SERVICE_ID = 'your_service_id';
const EMAILJS_TEMPLATE_ID = 'your_template_id';
```

Sign up at [https://www.emailjs.com/](https://www.emailjs.com/) to get these credentials. The contact form works in demo mode (simulated success) without configuration.

---

## ▶️ Running the Project

### Start the Server

```bash
npm start
```

This runs `node server.js` which:
1. Loads the Groq API key from `.env`
2. Initializes the LangChain LLM pipeline
3. Serves all static frontend files (HTML, CSS, JS)
4. Starts the API endpoint at `POST /api/recommend`

### Access the Application

Once the server is running, you'll see:

```
✅ SmartDoc LangChain server running on http://localhost:3000
   POST http://localhost:3000/api/recommend
```

Open your browser and navigate to:

| Page | URL | Description |
|------|-----|-------------|
| **Home / AI Finder** | [http://localhost:3000](http://localhost:3000) | Main landing page with AI recommendations |
| **Patient Portal** | [http://localhost:3000/booking.html](http://localhost:3000/booking.html) | Browse doctors & book appointments |
| **Doctor Portal** | [http://localhost:3000/doctor-portal.html](http://localhost:3000/doctor-portal.html) | Doctor dashboard & schedule management |

### Stopping the Server

Press `Ctrl + C` in the terminal to stop the server.

---

## 📖 Usage Guide

### 1. Finding Doctors (AI Recommendations)

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **"Find a Doctor"** on the hero section
3. You'll be prompted to **login or register** as a patient
4. Choose your search mode:
   - **💬 Chat with AI Assistant** — Answer questions step by step
   - **📝 Fill Quick Form** — Fill a 3-step form
5. The system sends your preferences to the LangChain AI backend
6. View AI-recommended doctors with ratings, fees, experience, and reasons
7. Click **"Book Appointment"** on any doctor card to book directly

### 2. Patient Portal — Booking Appointments

1. Navigate to [http://localhost:3000/booking.html](http://localhost:3000/booking.html)
2. Login or register as a patient
3. **Browse Doctors** — search by name/specialization, filter, and sort
4. Click on a doctor card to view their full profile
5. Select a **date** → available **time slots** appear
6. Pick a slot → review the **booking summary** → **Confirm**
7. Switch to **"My Appointments"** tab to view/cancel bookings

### 3. Doctor Portal — Managing Practice

1. Navigate to [http://localhost:3000/doctor-portal.html](http://localhost:3000/doctor-portal.html)
2. Register as a new doctor (name, specialization, experience, fee, email, password)
3. **Dashboard** — see today's appointments and summary statistics
4. **My Schedule** — toggle days on/off, set start/end times, break periods, and slot durations
5. **Appointments** — view all appointments, filter by status or date, mark as completed or cancel
6. **My Profile** — update your display name, specialization, experience, fee, avatar, and bio

### 4. Theme Toggle

- Click the **moon/sun icon** in the navbar to switch between light and dark themes
- Your preference is saved in localStorage

---

## 📡 API Reference

### `POST /api/recommend`

Generates AI-powered doctor recommendations.

**Request Body (JSON):**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "location": "Hyderabad",
  "specialization": "Cardiologist",
  "appointmentType": "Both",
  "experience": "5",
  "rating": "4",
  "education": "MD",
  "budget": "500-1000"
}
```

**Response (JSON):**

```json
{
  "doctors": [
    {
      "name": "Dr. Priya Sharma",
      "hospital": "Apollo Hospitals",
      "specialization": "Cardiologist",
      "experience": "14 years",
      "rating": 4.9,
      "education": "MD, AIIMS Delhi",
      "fee": "₹800",
      "reason": "Top-rated cardiologist with stellar patient outcomes.",
      "emoji": "👩‍⚕️"
    }
  ],
  "success": true
}
```

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "powered_by": "LangChain + Groq"
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq Cloud API key for LLM access |

### Server Configuration

In `server.js`:
- **Port**: Default `3000` (change `const PORT = 3000;`)
- **LLM Model**: `llama-3.3-70b-versatile` (change in `ChatGroq` config)
- **Temperature**: `0.7` (controls response creativity/randomness)
- **Timeout**: `30000ms` (API request timeout in `webhook.js`)

### Fallback Mode

If the LangChain backend is unreachable or returns an error, the system automatically falls back to **demo doctor data** so the UI remains functional. A status banner indicates whether results are from AI or demo data.

---

## 🧩 Key Modules Explained

### `storage.js` — Data Layer
The entire data layer runs on **localStorage**, providing:
- **Auth** — User registration (patient/doctor roles), login with SHA-256 password hashing, session management
- **Doctors** — CRUD operations, demo seeding, auto-creation for AI-recommended doctors
- **Schedules** — Per-doctor weekly schedule with day toggling, time ranges, break periods
- **SlotEngine** — Generates available time slots by computing schedule minus breaks minus booked slots minus past times
- **Appointments** — Booking with anti-double-booking, status management (booked/completed/cancelled)

### `webhook.js` — API Client
- Wraps `fetch()` with a configurable timeout
- Sends patient preferences to the LangChain backend
- Handles error fallback to demo data
- Strips accidental markdown from LLM responses

### `server.js` — Backend
- Express server serving static files and the `/api/recommend` endpoint
- LangChain pipeline: `ChatPromptTemplate → ChatGroq → StringOutputParser`
- Cleans and parses LLM JSON output
- Health check endpoint at `/health`

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm start` fails | Ensure Node.js v18+ is installed. Run `npm install` first. |
| "LangChain server did not respond" | Make sure `npm start` is running in a terminal. Check if port 3000 is free. |
| AI returns demo data instead of real | Check your `GROQ_API_KEY` in `.env`. Verify at [console.groq.com](https://console.groq.com). |
| Port 3000 already in use | Kill the existing process or change `const PORT = 3000;` in `server.js`. |
| "punycode" deprecation warning | This is a harmless Node.js warning. It doesn't affect functionality. |
| Appointments aren't persisting | Data is stored in browser localStorage. Clearing browser data will erase it. |
| Doctor schedule shows no slots | Make sure the doctor has set a schedule via the Doctor Portal. |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👩‍💻 Author

**Snehitha** — [GitHub Profile](https://github.com/Snehitha426)

---

<p align="center">
  Built with ❤️ for better healthcare | Powered by LangChain + Groq AI
</p>
