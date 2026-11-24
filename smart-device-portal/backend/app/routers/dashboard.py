from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_technician
from ..database import get_db
from ..models import Device, TapLog, Technician, Ticket
from ..storage import signed_or_public_url

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    recent = db.query(TapLog).order_by(TapLog.id.desc()).limit(10).all()
    recent_taps = [{
        "id": t.id, "rfid_uid": t.rfid_uid, "recognized": t.recognized,
        "device_id": str(t.device_id) if t.device_id else None,
        "tapped_at": t.tapped_at.isoformat() if t.tapped_at else None,
        "reader_id": t.reader.reader_id if t.reader else None,
        "device_name": t.device.name if t.device else None,
        "photo_url": signed_or_public_url(t.device.photo_path) if t.device else None,
    } for t in recent]
    open_tickets = db.query(Ticket).filter(Ticket.status != "CLOSED").order_by(Ticket.created_at.desc()).all()
    return {
        "recent_taps": recent_taps,
        "open_tickets": [{
            "id": str(t.id), "ticket_number": t.ticket_number, "device_name": t.device.name,
            "title": t.title, "priority": t.priority, "status": t.status,
            "assignee": t.assignee.full_name if t.assignee else None,
        } for t in open_tickets],
        "counts": {
            "open": db.query(Ticket).filter(Ticket.status == "OPEN").count(),
            "in_progress": db.query(Ticket).filter(Ticket.status == "IN_PROGRESS").count(),
            "closed_today": db.query(Ticket).filter(Ticket.status == "CLOSED", Ticket.closed_at >= today).count(),
            "devices": db.query(Device).count(),
            "taps_today": db.query(TapLog).filter(TapLog.tapped_at >= today).count(),
        },
    }
