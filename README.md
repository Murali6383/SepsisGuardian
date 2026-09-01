# SepsisGuardian AI — Module 1 Authentication + RBAC

Advanced starter implementation for Admission / Nurse / Doctor / Admin login and role-based dashboards.

## Stack
React + TypeScript + Vite + Tailwind CSS | FastAPI | PostgreSQL | SQLAlchemy | JWT | Argon2 | Docker

## Run
1. `docker compose up -d postgres`
2. Backend: `cd backend && python -m venv .venv && .venv\\Scripts\\activate && pip install -r requirements.txt`
3. Copy `.env.example` to `.env`
4. `python -m app.seed`
5. `uvicorn app.main:app --reload`
6. Frontend: `cd frontend && npm install && npm run dev`
7.file name : sepsisguardian-auth-module

Demo users:
- aC
- admission@sepsisguardian.com / Admission@12345
- nurse@sepsisguardian.com / Nurse@12345
- doctor@sepsisguardian.com/ Doctor@12345

Change demo passwords before deployment. This is a development foundation, not a clinically validated system.
3D Anatomy Assets:
HuBMAP / Human Reference Atlas CCF 3D Reference Object Library
License: CC BY 4.0