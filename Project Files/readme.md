# StudyAI – Smart AI Educate Companion & Quiz Generator

StudyAI is a complete, full-stack web application designed to help students study smarter. By parsing uploaded study documents (PDF, DOCX, TXT, or text snippets), the application uses the Google Gemini AI API to dynamically create customized study aids, flashcards, exams, and weekly planners.

## Technology Stack

- **Frontend**: React.js (built with Vite), React Router, Lucide Icons, responsive glassmorphism CSS UI.
- **Backend**: Python Flask REST API.
- **Cloud Services**: Firebase Authentication, Firestore NoSQL Database, Firebase Storage.
- **AI Engine**: Google Gemini API.

---

## Folder Directory Structure

```
studyai/
├── backend/
│   ├── app.py                   # Main Flask API and endpoints
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Backend environment template
│   ├── firebase_config.py       # Firebase Admin initialization
│   └── services/
│       ├── gemini_service.py    # Gemini prompts and completions
│       └── parser_service.py    # Document text parsing
├── frontend/
│   ├── package.json             # NPM dependencies
│   ├── vite.config.js           # Vite settings
│   ├── index.html               # Main entry HTML
│   ├── .env.example             # Web Firebase client variables
│   └── src/
│       ├── firebase.js          # Client auth configuration
│       ├── api.js               # Backend API services
│       ├── App.jsx              # Main routing hub
│       ├── main.jsx             # Entrypoint
│       ├── index.css            # Custom CSS themes & system
│       ├── components/          # Reusable layouts (Navbar, ProtectedRoute)
│       └── pages/               # Dashboard, Materials, Summaries, Flashcards, Quiz, Schedule, Analytics
└── README.md                    # Setup documentation
```

---

## Prerequisites

1. **Node.js** (v16.0.0 or higher) & **npm**.
2. **Python** (v3.8 or higher) & **pip**.
3. A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
4. A **Firebase Project** from the [Firebase Console](https://console.firebase.google.com/).

---

## Setup Instructions

### 1. Firebase Setup

#### Database & Storage Configuration:
1. Go to Firebase Console and click **Create Project**.
2. Enable **Authentication** and add **Email/Password** and **Google** as providers.
3. Enable **Firestore Database** in Native Mode.
4. Enable **Cloud Storage**.

#### Backend Admin Service Account Key:
1. Go to **Project Settings** > **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Rename the file to `firebase-credentials.json` and save it inside the `backend/` folder.

#### Frontend Web API Configuration:
1. Go to **Project Settings** > **General**.
2. Under "Your apps", select the Web icon `</>` to register a web client app.
3. Copy the configuration credentials object properties (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

---

### 2. Backend Installation

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows (CMD):
   venv\Scripts\activate
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
5. Edit the `.env` file with your **Gemini API Key** and your **Firebase Storage Bucket name** (e.g. `your-project-id.firebasestorage.app`).

6. Start the development server:
   ```bash
   python app.py
   ```
   The Flask API will run on `http://localhost:5000`.

---

### 3. Frontend Installation

1. Open another terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
4. Edit the `.env` file and replace variables with the values from your Firebase Web configuration.
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

---

## Technical Details: Bypassing Firebase Admin locally (Development Mode)
To simplify testing without an active Firebase project setup on both client and server during early mock evaluation, the backend includes a header bypass. If requests send `X-Mock-User-Id: student123` in headers, the system mocks Firestore operations and maps them to a local user ID. However, for a complete demonstration, establishing the Firebase configs is recommended.
