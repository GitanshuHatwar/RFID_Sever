import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DeviceModal from "../components/DeviceModal";
export default function Devices(){
 const [devices,setDevices]=useState([]);const [search,setSearch]=useState("");const [open,setOpen]=useState(false);const navigate=useNavigate();
 const load=()=>api.get("/api/devices",{params:{search}}).then(r=>setDevices(r.data));
 useEffect(()=>{load()},[]);
 return <div><div className="mb-5 flex items-center justify-between"><h1 className="text-2xl font-bold">Devices</h1><button className="btn-primary" onClick={()=>setOpen(true)}>Add Device</button></div>
 <div className="card mb-5 flex gap-3"><input className="input" placeholder="Search devices, UID, serial, or location" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/><button className="btn-secondary" onClick={load}>Search</button></div>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{devices.map(d=><button key={d.id} onClick={()=>navigate(`/devices/${d.id}`)} className="card text-left transition hover:-translate-y-0.5 hover:shadow-md">
 {d.photo_url?<img src={d.photo_url} className="mb-3 h-40 w-full rounded-lg object-cover" alt={d.name}/>:<div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-slate-100 text-slate-400">No photo</div>}
 <p className="font-bold">{d.name}</p><p className="text-sm text-slate-500">{d.device_type}</p><p className="mt-2 font-mono text-xs">{d.rfid_uid}</p><span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs">{d.status}</span>
 </button>)}</div><DeviceModal open={open} onClose={()=>setOpen(false)} onSaved={d=>{setOpen(false);navigate(`/devices/${d.id}`);}}/></div>;
}
