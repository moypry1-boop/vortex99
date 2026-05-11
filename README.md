# 🚀 Vortex Admin Unified - Premium Gaming Store

A state-of-the-art, high-performance gaming store and hosting dashboard built with **React 19**, **Vite 6**, and **Tailwind CSS 4**. Featuring a seamless **Firebase** integration and **Gemini AI** powered support system.

## ✨ Features

- **Premium UI/UX**: Ultra-modern dark theme with Tailwind 4 and Motion.
- **AI Support**: Intelligent ticket response generation using Gemini.
- **Real-time Store**: Live product listings and availability.
- **Admin Command Center**: Complete control over site settings and configurations.
- **Secure Authentication**: Google Login integration via Firebase Auth.
- **Staff System**: Built-in staff applications and management.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend/DB**: [Firebase Firestore](https://firebase.google.com/)
- **Auth**: [Firebase Authentication](https://firebase.google.com/)
- **AI Engine**: [Google Gemini 1.5 Flash](https://aistudio.google.com/)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/vortex-admin.git
cd vortex-admin
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Firebase and Gemini credentials:
```env
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
GEMINI_API_KEY=...
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## 🔒 Security
Ensure your Firestore rules are correctly configured. Use the `firestore.rules` provided in this repository.

## 📄 License
This project is for demonstration purposes. All rights reserved.
