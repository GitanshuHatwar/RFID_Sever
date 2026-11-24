from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..auth import get_current_technician
from ..database import get_db
from ..models import Device, Technician, Ticket, TicketUpdate
from ..schemas import TicketCreate, TicketUpdate as TicketUpdateSchema, TicketUpdateCreate, CloseTicket

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def ticket_dict(ticket: Ticket, db: Session = None, include_updates: bool = False):
    data = {
        "id": str(ticket.id), "ticket_number": ticket.ticket_number,
        "device_id": str(ticket.device_id), "device_name": ticket.device.name if ticket.device else None,
        "title": ticket.title, "description": ticket.description, "priority": ticket.priority,
        "status": ticket.status, "assigned_to": str(ticket.assigned_to) if ticket.assigned_to else None,
        "assigned_to_name": ticket.assignee.full_name if ticket.assignee else None,
        "created_by": str(ticket.created_by) if ticket.created_by else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
        "resolution_notes": ticket.resolution_notes,
    }
    if include_updates and db:
        updates = db.query(TicketUpdate).filter(TicketUpdate.ticket_id == ticket.id).order_by(TicketUpdate.created_at.asc()).all()
        data["updates"] = [{
            "id": str(u.id), "technician_name": u.technician.full_name if u.technician else None,
            "note": u.note, "old_status": u.old_status, "new_status": u.new_status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        } for u in updates]
    return data


@router.get("")
def list_tickets(status: str = None, mine: bool = False, db: Session = Depends(get_db),
                 technician: Technician = Depends(get_current_technician)):
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if mine:
        query = query.filter(Ticket.assigned_to == technician.id)
    return [ticket_dict(t, db) for t in query.order_by(Ticket.created_at.desc()).all()]


@router.get("/{ticket_id}")
def get_ticket(ticket_id: UUID, db: Session = Depends(get_db), _: Technician = Depends(get_current_technician)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket_dict(ticket, db, True)


@router.post("")
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db),
                  technician: Technician = Depends(get_current_technician)):
    if not db.query(Device).filter(Device.id == payload.device_id).first():
        raise HTTPException(status_code=404, detail="Device not found")
    if payload.priority not in ("LOW","MEDIUM","HIGH","CRITICAL"):
        raise HTTPException(status_code=422, detail="Invalid priority")
    number = db.execute(text("select 'TK-' || lpad(nextval('ticket_number_seq')::text, 6, '0')")).scalar()
    ticket = Ticket(ticket_number=number, device_id=payload.device_id, title=payload.title,
                    description=payload.description, priority=payload.priority, status="OPEN",
                    assigned_to=payload.assigned_to or technician.id, created_by=technician.id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {"success": True, "message": "Ticket created", "data": ticket_dict(ticket, db)}


@router.put("/{ticket_id}")
def edit_ticket(ticket_id: UUID, payload: TicketUpdateSchema, db: Session = Depends(get_db),
                _: Technician = Depends(get_current_technician)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).with_for_update().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status == "CLOSED":
        raise HTTPException(status_code=409, detail="Closed ticket cannot be edited")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
    db.commit()
    db.refresh(ticket)
    return {"success": True, "message": "Ticket updated", "data": ticket_dict(ticket, db)}


@router.post("/{ticket_id}/updates")
def add_update(ticket_id: UUID, payload: TicketUpdateCreate, db: Session = Depends(get_db),
               technician: Technician = Depends(get_current_technician)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).with_for_update().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status == "CLOSED":
        raise HTTPException(status_code=409, detail="Closed ticket cannot be edited")
    old = ticket.status
    if payload.new_status:
        allowed = {
            ("OPEN","IN_PROGRESS"), ("IN_PROGRESS","CLOSED"), ("OPEN","CLOSED")
        }
        if payload.new_status != old and (old, payload.new_status) not in allowed:
            raise HTTPException(status_code=409, detail="Invalid status transition")
        ticket.status = payload.new_status
        if payload.new_status == "CLOSED":
            raise HTTPException(status_code=409, detail="Use the close endpoint")
    update = TicketUpdate(ticket_id=ticket.id, technician_id=technician.id, note=payload.note,
                          old_status=old, new_status=ticket.status)
    db.add(update)
    db.commit()
    db.refresh(ticket)
    return {"success": True, "message": "Update added", "data": ticket_dict(ticket, db, True)}


@router.post("/{ticket_id}/close")
def close_ticket(ticket_id: UUID, payload: CloseTicket, db: Session = Depends(get_db),
                 technician: Technician = Depends(get_current_technician)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).with_for_update().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status == "CLOSED":
        raise HTTPException(status_code=409, detail="Ticket is already closed")
    if ticket.status not in ("OPEN","IN_PROGRESS"):
        raise HTTPException(status_code=409, detail="Invalid ticket status")
    old = ticket.status
    ticket.status = "CLOSED"
    ticket.resolution_notes = payload.resolution_notes
    ticket.closed_at = datetime.now(timezone.utc)
    update = TicketUpdate(ticket_id=ticket.id, technician_id=technician.id,
                          note="Ticket closed", old_status=old, new_status="CLOSED")
    db.add(update)
    db.commit()
    db.refresh(ticket)
    return {"success": True, "message": "Ticket closed", "data": ticket_dict(ticket, db, True)}
