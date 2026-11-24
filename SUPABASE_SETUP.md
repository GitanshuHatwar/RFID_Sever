# Supabase Setup

1. In Supabase, create a project and choose the region nearest to the technicians. Save the database password securely.
2. Open **SQL Editor**, run `database/schema.sql`, then run `database/seed.sql`. Verify with:
   `select username, full_name from technicians;`
3. Create a private Storage bucket named `device-photos`. The backend uploads with the service-role key and returns one-hour signed URLs. Private is recommended.
4. Open **Project Settings > API** for the Project URL and service-role key. Open **Database > Connection string** for the database URL. Supabase direct host uses port `5432`; use the IPv4-compatible session pooler on `5432` or transaction pooler on `6543` if direct IPv6/IPv4 networking fails. SQLAlchemy format:
   `postgresql+psycopg2://postgres:URL_ENCODED_PASSWORD@pool-host:5432/postgres`
   Encode password characters (`@`, `:`, `/`, `%`, `#`) with percent encoding.
5. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`; fill all variables. Keep `SUPABASE_SERVICE_ROLE_KEY` in the backend only.
6. RLS is enabled on every table with no anon policies. Supabase clients with anon permissions cannot read or write them. The FastAPI backend connects with the privileged PostgreSQL role and is therefore unaffected.
7. Verification: log in with `admin` / `admin123`, upload a photo to a device, tap UID `B392AA56`, and confirm the dashboard tap and live popup. Troubleshooting: connection timeout means try the pooler; password auth failure means verify URL encoding; bucket-not-found means verify the exact bucket name; reader 401 means verify `readers.reader_id` and `is_active`.
