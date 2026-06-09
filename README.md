# LevelUp — AI Career Mentor

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0-%23EE4C2C)

LevelUp is a production-grade full-stack AI SaaS platform that utilizes deep learning (PyTorch/Transformers) to analyze your career.

## Features
- **Resume NLP:** DistilBERT model to extract entities and skills.
- **Skill Gap DNN:** Feedforward Neural Network to predict missing skills for target roles.
- **Mock Interviews:** GPT-2 generative question bank + BERT sentence similarity evaluator.
- **Learning Roadmap:** CNN text classifier linking skills to optimal courses.
- **Career Trajectory:** LSTM time-series predictor analyzing your career history.

## Quick Start (Docker)

Make sure Docker Desktop is running:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs (Swagger): `http://localhost:8000/docs`

## Local Development Without Docker

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Note: By default `DEMO_MODE=true` in backend config, meaning you do not need actual multi-gigabyte PyTorch weights downloaded to run the UI/UX. It serves mock inferences.
