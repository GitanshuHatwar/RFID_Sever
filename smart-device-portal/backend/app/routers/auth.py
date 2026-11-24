from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import create_access_token, get_current_technician, verify_password
from ..database import get_db
from ..models import Technician
from ..schemas import LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    technician = db.query(Technician).filter(Technician.username == payload.username, Technician.is_active.is_(True)).first()
    if not technician or not verify_password(payload.password, technician.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "access_token": create_access_token(str(technician.id)),
        "technician": {"id": str(technician.id), "username": technician.username, "full_name": technician.full_name},
    }


@router.get("/me")
def me(technician: Technician = Depends(get_current_technician)):
    return {"id": str(technician.id), "username": technician.username, "full_name": technician.full_name}
