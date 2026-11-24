import { useEffect,useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
export default function TapLogs(){
 const [taps,setTaps]=useState([]);const [search,setSearch]=useState("");const [from,setFrom]=useState("");const [to,setTo]=useState("");const [offset,setOffset]=useState(0);const navigate=useNavigate();
 const load=()=>api.get("/api/taps",{params:{limit:25,offset,search,from:from||undefined,to:to||undefined}}).then(r=>setTaps(r.data));
 useEffect(()=>{load()},[offset]);
 return <div><h1 className="mb-5 text-2xl font-bold">Tap Logs</h1><div className="card mb-5 flex flex-wrap gap-3">
 <input className="input max-w-xs" placeholder="Search UID or device" value={search} onChange={e=>setSearch(e.target.value)}/>
 <input className="input max-w-[180px]" type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input className="input max-w-[180px]" type="date" value={to} onChange={e=>setTo(e.target.value)}/>
 <button className="btn-primary" onClick={()=>{setOffset(0);load();}}>Search</button></div>
 <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th>Time</th><th>Device</th><th>UID</th><th>Reader</th><th>Status</th></tr></thead><tbody>
 {taps.map(t=><tr key={t.id} className="cursor-pointer border-b hover:bg-slate-50" onClick={()=>t.device_id&&navigate(`/devices/${t.device_id}`)}><td className="py-3">{new Date(t.tapped_at).toLocaleString()}</td><td>{t.device_name||"—"}</td><td className="font-mono">{t.rfid_uid}</td><td>{t.reader_id}</td><td>{t.recognized?"Recognized":"Unknown"}</td></tr>)}</tbody></table></div>
 <div className="mt-4 flex justify-end gap-2"><button className="btn-secondary" disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-25))}>Previous</button><button className="btn-secondary" disabled={taps.length<25} onClick={()=>setOffset(offset+25)}>Next</button></div></div>;
}
