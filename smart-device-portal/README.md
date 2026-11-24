# RFID Technician Portal

## Run

```powershell
cd smart-device-portal/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

In a second terminal:

```powershell
cd smart-device-portal/frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. Default seed login: `admin` / `admin123`; also `tech1` / `tech123`.

Create a technician:

```powershell
cd smart-device-portal/backend
python scripts/create_technician.py jane "strong-password" "Jane Technician"
```

## API

| Method | Route | Auth |
|---|---|---|
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Bearer |
| POST | `/api/reader/tap` | Reader ID |
| GET/POST | `/api/devices` | Bearer |
| GET/PUT | `/api/devices/{id}` | Bearer |
| POST | `/api/devices/{id}/photo` | Bearer |
| GET | `/api/taps*` | Bearer |
| GET/POST | `/api/tickets*` | Bearer |
| GET | `/api/dashboard` | Bearer |

## Curl tests

```powershell
curl.exe -X POST http://localhost:8000/api/reader/tap -H "Content-Type: application/json" -d "{\"rfid_uid\":\"B392AA56\",\"reader_id\":\"ESP32_READER_01\"}"
curl.exe -X POST http://localhost:8000/api/reader/tap -H "Content-Type: application/json" -d "{\"rfid_uid\":\"FFFFFFFF\",\"reader_id\":\"ESP32_READER_01\"}"
curl.exe -X POST http://localhost:8000/api/reader/tap -H "Content-Type: application/json" -d "{\"rfid_uid\":\"B392AA56\",\"reader_id\":\"BAD_READER\"}"
```

Login and call protected APIs:

```powershell
$body='{"username":"admin","password":"admin123"}'
$login=curl.exe -s -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d $body | ConvertFrom-Json
curl.exe -H "Authorization: Bearer $($login.access_token)" http://localhost:8000/api/devices
```
