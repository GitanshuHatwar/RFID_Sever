import argparse
import sys

sys.path.insert(0, ".")
from app.auth import hash_password
from app.database import SessionLocal
from app.models import Technician


parser = argparse.ArgumentParser(description="Create or activate a technician")
parser.add_argument("username")
parser.add_argument("password")
parser.add_argument("full_name")
args = parser.parse_args()

db = SessionLocal()
technician = db.query(Technician).filter(Technician.username == args.username).first()
if technician:
    technician.password_hash = hash_password(args.password)
    technician.full_name = args.full_name
    technician.is_active = True
else:
    technician = Technician(username=args.username, password_hash=hash_password(args.password),
                            full_name=args.full_name, is_active=True)
    db.add(technician)
db.commit()
print(f"Technician ready: {args.username}")
