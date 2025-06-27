# Legal Document Analysis System

## Project Overview

The Legal Document Analysis System is a platform to help legal professionals analyze, summarize, and extract key information from legal documents using AI. It supports PDF, DOCX, and TXT files, and provides risk detection, fraud indicators, grammatical issue detection, and plain-English summaries.

---

## Key Features

- Upload and manage legal documents (PDF, DOCX, TXT)
- Automated extraction of key clauses and legal entities
- AI-powered document summarization and risk detection
- Detection of potential risks, fraud indicators, and compliance issues
- Identification of grammatical and formatting issues
- Modern React frontend and serverless Node.js backend
- Deployable to Vercel with a single click

---

## Technology Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js (Express, serverless-ready)
- **Database:** Firebase Firestore (no MongoDB required)
- **AI/NLP:** OpenRouter (LLM API integration)
- **Deployment:** Vercel (monorepo, serverless functions)

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v16 or above)
- npm or yarn
- Firebase project (with Firestore enabled)
- OpenRouter API key

### 1. Clone the repository
```bash
git clone https://github.com/your-username/legal-document-analysis.git
cd legal-document-analysis
```

### 2. Install dependencies for both frontend and backend
```bash
cd frontend1 && npm install
cd ../legal-backend2 && npm install
```

### 3. Firebase Setup
- Go to the [Firebase Console](https://console.firebase.google.com/), create a project, and enable Firestore.
- Go to Project Settings > Service Accounts > Generate new private key.
- Download the `serviceAccountKey.json` and place it in `legal-backend2/`.

### 4. Environment Variables
Create a `.env` file in `legal-backend2/` with:
```
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 5. Start the Backend
```bash
cd legal-backend2
npm run dev
```

### 6. Start the Frontend
```bash
cd ../frontend1
npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/docs

---

## Deploying to Vercel

1. **Push your code to GitHub/GitLab.**
2. **Go to [Vercel](https://vercel.com/), import your repo as a new project.**
3. **Set Environment Variables in Vercel Project Settings:**
   - `OPENROUTER_API_KEY` (your OpenRouter API key)
   - `FIREBASE_SERVICE_ACCOUNT` (paste the entire contents of your `serviceAccountKey.json` as a single value)
4. **Deploy!**

Vercel will build both the frontend and backend automatically using the `vercel.json` config.

---

## Project Structure

```
/legal-backend2      # Node.js backend (Express, serverless-ready)
/frontend1           # React frontend
/vercel.json         # Vercel monorepo configuration
```

---

## API Endpoints

| HTTP Method | Endpoint                      | Description                                 |
| ----------- | ----------------------------- | ------------------------------------------- |
| POST        | `/api/docs/upload`            | Upload a new legal document                 |
| POST        | `/api/docs/analyze/:id`       | Analyze a document for risks/entities       |
| POST        | `/api/docs/summarize/:id`     | Summarize a document with AI                |
| GET         | `/api/docs/`                  | List all documents                          |
| DELETE      | `/api/docs/:id`               | Delete a document                           |

---

## Usage Notes
- All AI features require a valid OpenRouter API key.
- Firestore is used for all document storage and metadata.
- Rate limiting is enabled for AI endpoints (3 requests/minute per IP).
- For production, set all secrets in Vercel's Environment Variables UI.

---

## Contribution Guidelines

Contributions are welcome! Please fork the repo, create a feature branch, and open a pull request.

---

## License
MIT
