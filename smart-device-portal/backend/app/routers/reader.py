from datetime import datetime, timedelta, timezone
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Device, Reader, TapLog, Ticket
from ..schemas import ReaderTap

router = APIRouter(prefix="/api/reader", tags=["reader"])


@router.post("/tap")
def tap(payload: ReaderTap, db: Session = Depends(get_db)):
    reader = db.query(Reader).filter(Reader.reader_id == payload.reader_id.strip()).first()
    if not reader or not reader.is_active:
        raise HTTPException(status_code=401, detail="Unknown or inactive reader")
    uid = "".join(payload.rfid_uid.strip().upper().split())
    if not re.fullmatch(r"[0-9A-F]{4,20}", uid):
        raise HTTPException(status_code=422, detail="Invalid RFID UID")
    reader.last_seen = datetime.now(timezone.utc)
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=3)
    existing = (
        db.query(TapLog)
        .filter(TapLog.rfid_uid == uid, TapLog.reader_id == reader.id, TapLog.tapped_at >= cutoff)
        .order_by(TapLog.id.desc())
        .first()
    )
    if existing:
        db.commit()
        if existing.recognized and existing.device_id:
            device = db.query(Device).filter(Device.id == existing.device_id).first()
            count = db.query(Ticket).filter(Ticket.device_id == device.id, Ticket.status != "CLOSED").count()
            return {"success": True, "message": "Device found", "data": {"recognized": True, "device_name": device.name, "open_tickets": count}}
        return {"success": True, "message": "Unknown tag", "data": {"recognized": False}}

    device = db.query(Device).filter(Device.rfid_uid == uid).first()
    tap_log = TapLog(rfid_uid=uid, device_id=device.id if device else None, reader_id=reader.id, recognized=bool(device))
    db.add(tap_log)
    db.commit()
    db.refresh(tap_log)
    if device:
        count = db.query(Ticket).filter(Ticket.device_id == device.id, Ticket.status != "CLOSED").count()
        return {"success": True, "message": "Device found", "data": {"recognized": True, "device_name": device.name, "open_tickets": count}}
    return {"success": True, "message": "Unknown tag", "data": {"recognized": False}}
