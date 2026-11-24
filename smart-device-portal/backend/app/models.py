import uuid
from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Technician(Base):
    __tablename__ = "technicians"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Reader(Base):
    __tablename__ = "readers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reader_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    location = Column(String(200))
    is_active = Column(Boolean, default=True, nullable=False)
    last_seen = Column(DateTime(timezone=True))


class Device(Base):
    __tablename__ = "devices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfid_uid = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    device_type = Column(String(100), nullable=False)
    model = Column(String(200))
    serial_number = Column(String(200))
    manufacturer = Column(String(200))
    location = Column(String(200))
    status = Column(String(20), nullable=False, default="ACTIVE")
    purchase_date = Column(Date)
    warranty_expiry = Column(Date)
    notes = Column(Text)
    photo_path = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("technicians.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    creator = relationship("Technician", foreign_keys=[created_by])


class TapLog(Base):
    __tablename__ = "tap_logs"
    id = Column(BigInteger, primary_key=True)
    rfid_uid = Column(String(20), nullable=False)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"))
    reader_id = Column(UUID(as_uuid=True), ForeignKey("readers.id"))
    recognized = Column(Boolean, nullable=False)
    tapped_at = Column(DateTime(timezone=True), server_default=func.now())
    device = relationship("Device")
    reader = relationship("Reader")


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(20), unique=True, nullable=False)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="OPEN")
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("technicians.id"))
    created_by = Column(UUID(as_uuid=True), ForeignKey("technicians.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
    resolution_notes = Column(Text)
    device = relationship("Device")
    assignee = relationship("Technician", foreign_keys=[assigned_to])
    creator = relationship("Technician", foreign_keys=[created_by])


class TicketUpdate(Base):
    __tablename__ = "ticket_updates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id"), nullable=False)
    note = Column(Text, nullable=False)
    old_status = Column(String(20))
    new_status = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    technician = relationship("Technician")
