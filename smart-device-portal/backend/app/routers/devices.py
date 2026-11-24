from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..auth import get_current_technician
from ..database import get_db
from ..models import Device, Technician, Ticket
from ..schemas import DeviceBase, DeviceUpdate
from ..storage import signed_or_public_url, upload_device_photo

router = APIRouter(prefix="/api/devices", tags=["devices"])


def device_dict(device: Device, db: Session = None):
    data = {
        "id": str(device.id), "rfid_uid": device.rfid_uid, "name": device.name,
        "device_type": device.device_type, "model": device.model, "serial_number": device.serial_number,
        "manufacturer": device.manufacturer, "location": device.location, "status": device.status,
        "purchase_date": device.purchase_date.isoformat() if device.purchase_date else None,
        "warranty_expiry": device.warranty_expiry.isoformat() if device.warranty_expiry else None,
        "notes": device.notes, "photo_path": device.photo_path,
        "photo_url": signed_or_public_url(device.photo_path),
        "created_at": device.created_at.isoformat() if device.created_at else None,
        "updated_at": device.updated_at.isoformat() if device.updated_at else None,
    }
    if db:
        data["recent_tickets"] = [
            {"id": str(t.id), "ticket_number": t.ticket_number, "title": t.title, "priority": t.priority, "status": t.status}
            for t in db.query(Ticket).filter(Ticket.device_id == device.id).order_by(Ticket.created_at.desc()).limit(10).all()
        ]
    return data


@router.get("")
def list_devices(search: str = "", db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    query = db.query(Device)
    if search:
        term = f"%{search}%"
        query = query.filter(Device.name.ilike(term) | Device.rfid_uid.ilike(term) |
                              Device.serial_number.ilike(term) | Device.location.ilike(term))
    return [device_dict(device, db) for device in query.order_by(Device.name).all()]


@router.get("/by-rfid/{uid}")
def by_rfid(uid: str, db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    device = db.query(Device).filter(Device.rfid_uid == uid.strip().upper()).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device_dict(device, db)


@router.post("")
def create_device(payload: DeviceBase, db: Session = Depends(get_db), technician: Technician = Depends(get_current_technician)):
    if db.query(Device).filter(Device.rfid_uid == payload.rfid_uid).first():
        raise HTTPException(status_code=409, detail="RFID UID already exists")
    device = Device(**payload.model_dump(), created_by=technician.id)
    db.add(device)
    db.commit()
    db.refresh(device)
    return {"success": True, "message": "Device created", "data": device_dict(device, db)}


@router.post("/{device_id}/photo")
async def upload_photo(device_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db),
                       _: Technician = Depends(get_current_technician)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    path = await upload_device_photo(str(device.id), file)
    device.photo_path = path
    db.commit()
    db.refresh(device)
    return {"success": True, "message": "Photo uploaded", "data": {"photo_url": signed_or_public_url(path)}}


@router.get("/{device_id}")
def get_device(device_id: UUID, db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device_dict(device, db)


@router.put("/{device_id}")
def update_device(device_id: UUID, payload: DeviceUpdate, db: Session = Depends(get_db),
                  _: Technician = Depends(get_current_technician)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, key, value)
    db.commit()
    db.refresh(device)
    return {"success": True, "message": "Device updated", "data": device_dict(device, db)}
