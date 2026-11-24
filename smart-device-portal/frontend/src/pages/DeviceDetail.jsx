import { useEffect,useState } from "react";
import { useNavigate,useParams } from "react-router-dom";
import api from "../services/api";
import DeviceModal from "../components/DeviceModal";
export default function DeviceDetail(){
 const {id}=useParams();const [device,setDevice]=useState(null);const [edit,setEdit]=useState(false);const navigate=useNavigate();
 const load=()=>api.get(`/api/devices/${id}`).then(r=>setDevice(r.data));
 useEffect(()=>{load()},[id]);
 if(!device)return <div className="py-20 text-center">Loading...</div>;
 const createTicket=async()=>{await api.post("/api/tickets",{device_id:device.id,title:`Service request for ${device.name}`,description:"",priority:"MEDIUM"});navigate("/tickets/my");};
 return <div><button className="mb-4 text-sm text-blue-700" onClick={()=>navigate("/devices")}>← Devices</button><div className="card">
 <div className="grid gap-5 md:grid-cols-[260px_1fr]">{device.photo_url?<img src={device.photo_url} className="h-64 w-full rounded-lg object-cover" alt={device.name}/>:<div className="flex h-64 items-center justify-center rounded-lg bg-slate-100 text-slate-400">No photo</div>}
 <div><div className="mb-4 flex items-start justify-between"><div><h1 className="text-2xl font-bold">{device.name}</h1><p className="text-slate-500">{device.device_type}</p></div><button className="btn-secondary" onClick={()=>setEdit(true)}>Edit</button></div>
 <div className="grid gap-3 text-sm sm:grid-cols-2">{[["RFID UID",device.rfid_uid],["Model",device.model],["Serial",device.serial_number],["Manufacturer",device.manufacturer],["Location",device.location],["Status",device.status],["Purchase date",device.purchase_date],["Warranty expiry",device.warranty_expiry]].map(([k,v])=><p key={k}><b>{k}: </b>{v||"-"}</p>)}</div>
 <button className="btn-primary mt-5" onClick={createTicket}>Create Ticket</button></div></div></div>
 <section className="card mt-5"><h2 className="mb-3 font-bold">Ticket history</h2>{device.recent_tickets?.length?<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th>Number</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead><tbody>{device.recent_tickets.map(t=><tr key={t.id} className="border-b"><td className="py-3">{t.ticket_number}</td><td>{t.title}</td><td>{t.priority}</td><td>{t.status}</td></tr>)}</tbody></table></div>:<p className="text-sm text-slate-500">No tickets</p>}</section>
 <DeviceModal open={edit} device={device} onClose={()=>setEdit(false)} onSaved={d=>{setEdit(false);setDevice(d);}}/></div>;
}
