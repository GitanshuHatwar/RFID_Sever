import { useEffect,useState } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Tickets({closed=false}){
 const [tickets,setTickets]=useState([]);const [search,setSearch]=useState("");const [selected,setSelected]=useState(null);const [note,setNote]=useState("");const [resolution,setResolution]=useState("");const [confirm,setConfirm]=useState(false);const [error,setError]=useState("");
 const load=()=>api.get("/api/tickets",{params:closed?{status:"CLOSED"}:{mine:true}}).then(r=>setTickets(r.data));
 useEffect(()=>{load()},[closed]);
 const open=async(t)=>{const r=await api.get(`/api/tickets/${t.id}`);setSelected(r.data);setNote("");setResolution("");setError("");};
 const updateStatus=async(status)=>{
  try{await api.post(`/api/tickets/${selected.id}/updates`,{note:note||`Status changed to ${status}`,new_status:status});open(selected);}catch(e){setError(e.response?.data?.detail||"Unable to update ticket");}
 };
 const addNote=async()=>{if(!note.trim())return;try{await api.post(`/api/tickets/${selected.id}/updates`,{note});open(selected);}catch(e){setError(e.response?.data?.detail||"Unable to add note");}};
 const close=async()=>{try{await api.post(`/api/tickets/${selected.id}/close`,{resolution_notes:resolution});setConfirm(false);await open(selected);load();}catch(e){setError(e.response?.data?.detail||"Unable to close ticket");}};
 const visible=tickets.filter(t=>!search||`${t.ticket_number} ${t.title} ${t.device_name}`.toLowerCase().includes(search.toLowerCase()));
 return <div><h1 className="mb-5 text-2xl font-bold">{closed?"Closed Tickets":"My Tickets"}</h1><div className="card mb-5"><input className="input max-w-md" placeholder="Search ticket number, title, or device" value={search} onChange={e=>setSearch(e.target.value)}/></div>
 <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th>Number</th><th>Device</th><th>Title</th><th>Priority</th><th>Status</th><th>Assignee</th></tr></thead><tbody>{visible.map(t=><tr key={t.id} className="cursor-pointer border-b hover:bg-slate-50" onClick={()=>open(t)}><td className="py-3 font-semibold">{t.ticket_number}</td><td>{t.device_name}</td><td>{t.title}</td><td>{t.priority}</td><td>{t.status}</td><td>{t.assigned_to_name||"-"}</td></tr>)}</tbody></table></div>
 <Modal open={Boolean(selected)} title={selected?.ticket_number||"Ticket"} onClose={()=>setSelected(null)} wide>
 {selected&&<div className="grid gap-5 md:grid-cols-[1fr_220px]"><div><p className="mb-1 text-xs uppercase text-slate-500">{selected.device_name}</p><h2 className="text-xl font-bold">{selected.title}</h2><p className="mt-2 text-sm text-slate-600">{selected.description||"No description"}</p>
 <div className="mt-5 border-t pt-4"><h3 className="mb-3 font-bold">Update timeline</h3><div className="space-y-3">{selected.updates?.length?selected.updates.map(u=><div key={u.id} className="rounded-lg bg-slate-50 p-3 text-sm"><p>{u.note}</p><p className="mt-1 text-xs text-slate-500">{u.technician_name} · {new Date(u.created_at).toLocaleString()}</p></div>):<p className="text-sm text-slate-500">No updates</p>}</div></div></div>
 <aside>{closed?<div><p className="label">Resolution notes</p><p className="rounded-lg bg-slate-50 p-3 text-sm">{selected.resolution_notes||"No resolution notes"}</p></div>:<div className="space-y-3">
 <label><span className="label">Add note</span><textarea className="input min-h-24" value={note} onChange={e=>setNote(e.target.value)}/></label>
 <button className="btn-secondary w-full" onClick={addNote}>Add Note</button>
 {selected.status==="OPEN"&&<button className="btn-primary w-full" onClick={()=>updateStatus("IN_PROGRESS")}>Start Work</button>}
 {selected.status==="IN_PROGRESS"&&<button className="btn-primary w-full" onClick={()=>setConfirm(true)}>Close Ticket</button>}
 {selected.status==="OPEN"&&<button className="btn-secondary w-full" onClick={()=>setConfirm(true)}>Close with resolution</button>}
 {selected.status!=="CLOSED"&&<label><span className="label">Resolution notes</span><textarea className="input min-h-20" value={resolution} onChange={e=>setResolution(e.target.value)}/></label>}
 {error&&<p className="text-sm text-red-600">{error}</p>}</div>}</aside></div>}
 </Modal>
 <ConfirmDialog open={confirm} title="Close ticket" message={resolution.trim()?"Close this ticket with the entered resolution notes?":"Resolution notes are required before closing."} onCancel={()=>setConfirm(false)} onConfirm={()=>resolution.trim()?close():setError("Resolution notes are required")}/>
 </div>;
}
