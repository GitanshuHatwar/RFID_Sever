from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_technician
from ..database import get_db
from ..models import Device, TapLog, Technician, Ticket
from ..storage import signed_or_public_url

router = APIRouter(prefix="/api/taps", tags=["taps"])


def tap_dict(tap: TapLog, db: Session, full: bool = False):
    device = tap.device
    data = {
        "id": tap.id, "rfid_uid": tap.rfid_uid, "recognized": tap.recognized,
        "device_id": str(tap.device_id) if tap.device_id else None,
        "tapped_at": tap.tapped_at.isoformat() if tap.tapped_at else None,
        "reader_id": tap.reader.reader_id if tap.reader else None,
        "device_name": device.name if device else None,
        "photo_url": signed_or_public_url(device.photo_path) if device else None,
    }
    if full and device:
        data["device"] = {
            "id": str(device.id), "rfid_uid": device.rfid_uid, "name": device.name,
            "device_type": device.device_type, "model": device.model, "serial_number": device.serial_number,
            "manufacturer": device.manufacturer, "location": device.location, "status": device.status,
            "warranty_expiry": device.warranty_expiry.isoformat() if device.warranty_expiry else None,
            "photo_url": signed_or_public_url(device.photo_path),
            "open_tickets": db.query(Ticket).filter(Ticket.device_id == device.id, Ticket.status != "CLOSED").count(),
        }
    return data


@router.get("")
def list_taps(limit: int = 50, offset: int = 0, search: str = "", from_: str = Query(None, alias="from"),
              to: str = Query(None, alias="to"), db: Session = Depends(get_db),
              _: Technician = Depends(get_current_technician)):
    query = db.query(TapLog)
    if search:
        term = f"%{search}%"
        query = query.join(Device, TapLog.device_id == Device.id, isouter=True).filter(
            TapLog.rfid_uid.ilike(term) | Device.name.ilike(term)
        )
    if from_:
        query = query.filter(TapLog.tapped_at >= datetime.fromisoformat(from_.replace("Z", "+00:00")))
    if to:
        query = query.filter(TapLog.tapped_at <= datetime.fromisoformat(to.replace("Z", "+00:00")))
    taps = query.order_by(TapLog.id.desc()).offset(offset).limit(min(limit, 500)).all()
    return [tap_dict(t, db) for t in taps]


@router.get("/latest-id")
def latest_id(db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    tap = db.query(TapLog).order_by(TapLog.id.desc()).first()
    return {"latest_id": tap.id if tap else 0}


@router.get("/latest")
def latest(after_id: int = 0, db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    taps = db.query(TapLog).filter(TapLog.id > after_id).order_by(TapLog.id.asc()).all()
    return [tap_dict(t, db, full=True) for t in taps]
