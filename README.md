<div align="center">
  <h1>🏥 SkinAid</h1>
  <p><b>Cross-modal AI framework for dermatological disease analysis</b></p>
</div>

<p align="center">
  <a href="#-project-description">Project Description</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-hosting--architecture">Architecture</a> •
  <a href="#-setup-guide">Setup Guide</a> •
  <a href="#-contributors">Contributors</a>
</p>

## 📖 Project Description

**SkinAid** is a comprehensive, state-of-the-art AI-powered application designed for dermatological disease analysis. By leveraging multi-modal AI models, SkinAid provides quick, accurate, and insightful analysis of skin conditions from uploaded images and contextual information.

The platform is built with a modern tech stack, ensuring scalability, speed, and a great user experience:
- **Frontend**: A highly responsive, interactive UI built with Next.js 15, React 19, and Tailwind CSS.
- **Backend**: A robust, fast API powered by FastAPI (Python), seamlessly integrating with Hugging Face models and Google GenAI.
- **Database**: Supabase for secure, real-time database management and authentication.

---

## 📸 Screenshots

*(Replace the placeholder URLs with actual paths to your screenshots, e.g., `./public/screenshots/home.png`)*

| Home Page | Analysis Dashboard |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350?text=Home+Page" alt="Home Page"> | <img src="https://via.placeholder.com/600x350?text=Analysis+Dashboard" alt="Dashboard"> |
| **User Profile / Dashboard** | **Mobile Responsive View** |
| <img src="https://via.placeholder.com/600x350?text=Profile" alt="Profile"> | <img src="https://via.placeholder.com/200x350?text=Mobile" alt="Mobile View" width="200"> |

---

## 🚀 Hosting & Architecture

The project is decoupled into two independent repositories/folders to maintain a clean architecture and optimal hosting strategies.

- **Frontend (Next.js Application)**
  - **Hosted on**: [Vercel](https://vercel.com/)
  - **Directory**: `/frontend`
  - Vercel provides edge network capabilities, giving the Next.js application instant load times and CI/CD out of the box.

- **Backend (FastAPI & AI Models)**
  - **Hosted on**: [Hugging Face Spaces](https://huggingface.co/spaces) (Docker SDK)
  - **Directory**: `/backend`
  - Hugging Face Spaces is ideal for our Python backend, as it natively supports machine learning inference, large model weights, and heavy compute requirements.

---

## ⚙️ Setup Guide

Follow these steps to run SkinAid locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.10 or higher)
- [Git](https://git-scm.com/)
- API Keys:
  - [Supabase](https://supabase.com/) Account & Project
  - [Google Gemini API Key](https://aistudio.google.com/)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/SkinAid.git
cd SkinAid
```

### 2. Backend Setup
The backend manages the AI model inference and database connections.

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install required Python dependencies
pip install -r requirements.txt

# Create a .env file based on the environment variables needed
echo "SUPABASE_URL=your_supabase_url" >> .env
echo "SUPABASE_KEY=your_supabase_key" >> .env
echo "GEMINI_API_KEY=your_gemini_api_key" >> .env

# Run the FastAPI development server
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup
The frontend provides the user interface for interacting with the AI.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Create a local environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run the Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser to start using SkinAid!

---

## 🤝 Contributors

SkinAid is made possible by our amazing contributors. 

<!-- CONTRIBUTORS_START -->
<div align="center">
  <a href="https://github.com/diluteoxygen/skinaid/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=diluteoxygen/skinaid" />
  </a>
  <a href="https://github.com/diluteoxygen" style="text-decoration: none; text-align: center;">
    <img src="https://github.com/diluteoxygen.png" width="60px" style="border-radius: 50%;" alt="Vikrant Singh"/>
    <br/>
    <sub style="color: inherit;"><b>Vikrant Singh</b></sub>
  </a>
</div>

Made with [contrib.rocks](https://contrib.rocks).
<!-- CONTRIBUTORS_END -->

---

<div align="center">
  <p>Built with ❤️ for better dermatological care.</p>
</div>
