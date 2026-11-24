from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re


def normalize_uid(value: str) -> str:
    value = (value or "").strip().upper()
    if not re.fullmatch(r"[0-9A-F]{4,20}", value):
        raise ValueError("rfid_uid must be 4–20 hexadecimal characters")
    return value


class LoginRequest(BaseModel):
    username: str
    password: str


class TechnicianOut(BaseModel):
    id: UUID
    username: str
    full_name: str
    model_config = {"from_attributes": True}


class LoginOut(BaseModel):
    access_token: str
    technician: TechnicianOut


class ReaderTap(BaseModel):
    rfid_uid: str
    reader_id: str


class DeviceBase(BaseModel):
    rfid_uid: str
    name: str
    device_type: str
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    location: Optional[str] = None
    status: str = "ACTIVE"
    purchase_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("rfid_uid")
    @classmethod
    def uid_valid(cls, value):
        return normalize_uid(value)


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    purchase_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    notes: Optional[str] = None


class TicketCreate(BaseModel):
    device_id: UUID
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"
    assigned_to: Optional[UUID] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None


class TicketUpdateCreate(BaseModel):
    note: str
    new_status: Optional[str] = None


class CloseTicket(BaseModel):
    resolution_notes: str = Field(min_length=1)
