<div align="center">
  <h1>Cross-Modal AI Framework for Dermatological Disease Analysis</h1>
---

## 📖 Project Description

SkinAid is an advanced dermatological analysis tool that leverages artificial intelligence to assist in identifying and understanding skin conditions. By combining computer vision models (OpenCLIP) with Large Language Models (Google GenAI/Gemini), SkinAid provides a comprehensive, cross-modal approach to analyzing skin lesions and conditions.

Users can upload images of skin concerns along with optional profile metadata (age, gender, lesion area, timeline, notes) to receive a preliminary analysis, severity index, and suggested follow-ups, all within an intuitive and visually appealing interface.

**Key Features:**
- 🔍 **Image Analysis**: Powered by OpenCLIP and PyTorch for precise visual inference.
- 🤖 **AI Assistant**: Conversational chat interface utilizing Google Gemini to answer questions about the analysis.
- 🔐 **Secure & Scalable**: Authentication and database management through Supabase.
- 🎨 **Modern Interface**: A sleek, responsive Next.js frontend with Tailwind CSS v4 and Framer Motion animations.

## 🏗️ Architecture & Hosting

SkinAid is built with a decoupled architecture, separating the client interface from the heavy AI inference workloads.

- **Frontend**: Next.js (React 19), Tailwind CSS, Framer Motion.
  - 🚀 **Hosted on**: **Vercel**
- **Backend**: Python, FastAPI, PyTorch, OpenCLIP, Google GenAI.
  - 🚀 **Hosted on**: **Hugging Face Spaces** (Dockerized)
- **Database & Auth**: 
  - 🗄️ **Hosted on**: **Supabase**

## ⚙️ Setup Guide

To run SkinAid locally, you will need to set up both the backend and frontend servers, as well as a Supabase project.

### 1. Prerequisites
- Node.js (v18+ recommended)
- Python (3.9+ recommended)
- A Supabase account and project
- Google Gemini API Key

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

Set up your environment variables. Create a `.env` file in the `backend` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000
```

Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
*The backend will be available at `http://localhost:8000`.*

### 3. Frontend Setup
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Set up your environment variables. Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the Next.js development server:
```bash
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

### 4. Database Setup
Execute the `supabase_schema.sql` file located in the root directory in your Supabase project's SQL Editor to set up the necessary tables and policies.

## 🤝 Contributors

Thanks to everyone who has contributed to this project!

<a href="https://github.com/diluteoxygen/SkinAid/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=diluteoxygen/SkinAid" alt="Contributors" />
</a>
