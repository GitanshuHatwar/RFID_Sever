# FastAPI Backend

Install dependencies and copy `.env.example` to `.env`.

```powershell
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Create a technician with:

```powershell
python scripts/create_technician.py USERNAME PASSWORD "Full Name"
```

The backend requires a PostgreSQL `DATABASE_URL` and optional-but-required-for-photo Supabase service credentials.
