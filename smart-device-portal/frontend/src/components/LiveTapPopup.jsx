import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTapListener from "../hooks/useTapListener";
import Modal from "./Modal";
import DeviceModal from "./DeviceModal";
import api from "../services/api";

export default function LiveTapPopup() {
  const { current, dismiss } = useTapListener(true);
  const navigate = useNavigate();
  const [registerOpen, setRegisterOpen] = useState(false);
  if (!current) return null;
  const device = current.device;
  return (
    <>
      <Modal open={Boolean(current)} title={device ? "Device detected" : "Unregistered tag"} onClose={dismiss} wide>
        {device ? (
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            {device.photo_url ? <img className="h-56 w-full rounded-lg object-cover" src={device.photo_url} alt={device.name}/>
              : <div className="flex h-56 items-center justify-center rounded-lg bg-slate-100 text-slate-400">No photo</div>}
            <div>
              <div className="mb-3 flex items-start justify-between">
                <div><h3 className="text-2xl font-bold">{device.name}</h3><p className="text-slate-500">{device.device_type}</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{device.status}</span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><b>Model:</b> {device.model || "-"}</p><p><b>Serial:</b> {device.serial_number || "-"}</p>
                <p><b>Manufacturer:</b> {device.manufacturer || "-"}</p><p><b>Location:</b> {device.location || "-"}</p>
                <p><b>Warranty:</b> {device.warranty_expiry || "-"}</p><p><b>Open tickets:</b> {device.open_tickets}</p>
                <p><b>Reader:</b> {current.reader_id}</p><p><b>RFID UID:</b> {current.rfid_uid}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button className="btn-primary" onClick={() => {dismiss(); navigate(`/devices/${device.id}`);}}>View Device</button>
              <button className="btn-secondary" onClick={async () => {
                await api.post("/api/tickets",{device_id:device.id,title:`Service request for ${device.name}`,description:"",priority:"MEDIUM"});
                dismiss(); navigate("/tickets/my");
              }}>Create Ticket</button>
              <button className="btn-secondary" onClick={dismiss}>Dismiss</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-slate-500">RFID UID</p>
            <p className="mb-5 text-3xl font-bold tracking-widest">{current.rfid_uid}</p>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => setRegisterOpen(true)}>Register Device</button>
              <button className="btn-secondary" onClick={dismiss}>Dismiss</button>
            </div>
          </div>
        )}
      </Modal>
      <DeviceModal open={registerOpen} uid={current.rfid_uid} onClose={() => {setRegisterOpen(false); dismiss();}}
                   onSaved={(device) => {setRegisterOpen(false); dismiss(); navigate(`/devices/${device.id}`);}}/>
    </>
  );
}
