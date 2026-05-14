
<div align="center">
  <img src="https://img.icons8.com/color/96/000000/university.png" alt="University Logo">
  <h1>🎓 University Web Portal</h1>
  <p><strong>A Modern, Full-Stack Educational Platform for Students & Administrators</strong></p>
  
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
  [![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
  [![Groq AI](https://img.shields.io/badge/Groq%20AI-000000?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)
</div>

<br>

## 📖 About the Project

The **University Web Portal** is a comprehensive educational management system built to streamline the academic workflow for both students and faculty. It provides an intuitive, responsive interface for managing courses, tracking assignments, viewing schedules, and interacting with an AI-powered academic assistant.

## ✨ Key Features

- **🔐 Role-Based Authentication:** Secure login for students and administrators using Firebase Auth.
- **📊 Dynamic Dashboards:** Personalized views displaying real-time statistics, registered courses, and pending tasks.
- **📚 Course Management:** Students can browse enrolled courses, while admins can easily upload and organize lectures.
- **📝 Assignments & Grades:** Seamless workflow for uploading assignment files, tracking submissions, and managing student grades.
- **🤖 Agentix AI Chatbot:** An intelligent academic assistant powered by **Groq API (LLaMA 3)** that understands the user's context (grades, schedule, fees) and answers questions instantly.
- **💰 Financial Tracking:** Clear breakdown of tuition fees and payment statuses.
- **📅 Interactive Schedule:** Weekly timetables dynamically fetched from the database.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend as a Service (BaaS):** Firebase (Authentication, Cloud Firestore, Cloud Storage)
- **Build Tool:** Vite ⚡
- **Artificial Intelligence:** Groq API (LLaMA-3)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A [Firebase](https://console.firebase.google.com/) account
- A [Groq](https://console.groq.com/keys) API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/University-Portal.git
   cd University-Portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up API Keys:**
   Open `chatbot.js` and replace the placeholder with your actual Groq API Key:
   ```javascript
   window.GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE";
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   > By default, the portal will be accessible at `http://localhost:5180`.

### Production Build

To build the project for production, run:
```bash
npm run build
```
The optimized files will be generated in the `dist` folder, ready for deployment.

## 📂 Project Structure

```text
📦 University-Portal
 ┣ 📂 dist/                # Production build output
 ┣ 📜 index.html           # Landing page
 ┣ 📜 auth.html            # Login/Registration
 ┣ 📜 dashboard.html       # Student & Admin Dashboard
 ┣ 📜 student_courses.html # Course Management
 ┣ 📜 assignments.html     # Assignment tracking
 ┣ 📜 chatbot.js           # Groq AI Integration
 ┣ 📜 auth.js              # Firebase Authentication logic
 ┣ 📜 global.css           # Global CSS variables & styling
 ┣ 📜 vite.config.mjs      # Vite build configuration
 ┣ 📜 firestore.rules      # Database security rules
 ┗ 📜 package.json         # NPM Dependencies
```

## 🌐 Deployment (Firebase Hosting)

This project is configured for seamless deployment to Firebase Hosting:

```bash
npm run deploy              # Deploys the web app
npm run deploy:firestore    # Deploys Firestore rules and indexes
npm run deploy:storage      # Deploys Storage rules
```

## 🤝 Contribution

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/your-username/University-Portal/issues).

---

<div align="center">
  <sub>Built with ❤️ for a better educational experience.</sub>
</div>
