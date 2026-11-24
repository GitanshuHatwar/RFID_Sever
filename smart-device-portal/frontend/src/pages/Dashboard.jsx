import { useCallback,useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import usePolling from "../hooks/usePolling";

export default function Dashboard(){
  const [data,setData]=useState(null); const navigate=useNavigate();
  const load=useCallback(()=>api.get("/api/dashboard").then(r=>setData(r.data)).catch(()=>{}),[]);
  usePolling(load,5000);
  useEffect(()=>{load()},[load]);
  if(!data)return <div className="py-20 text-center">Loading...</div>;
  const cards=[["Open",data.counts.open],["In progress",data.counts.in_progress],["Closed today",data.counts.closed_today],["Devices",data.counts.devices],["Taps today",data.counts.taps_today]];
  return <div>
    <h1 className="mb-5 text-2xl font-bold">Dashboard</h1>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(([label,value])=><div className="card" key={label}><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="card"><h2 className="mb-3 font-bold">Recent device taps</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th>Time</th><th>Device</th><th>UID</th><th>Reader</th></tr></thead><tbody>
      {data.recent_taps.map(t=><tr key={t.id} className="cursor-pointer border-b hover:bg-slate-50" onClick={()=>t.recognized&&navigate(`/devices/${t.device_id}`)}>
        <td className="py-3">{new Date(t.tapped_at).toLocaleString()}</td><td>{t.recognized?t.device_name:"Unregistered"}</td><td className="font-mono">{t.rfid_uid}</td><td>{t.reader_id}</td>
      </tr>)}</tbody></table></div></section>
      <section className="card"><h2 className="mb-3 font-bold">Currently open tickets</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th>Number</th><th>Device</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead><tbody>
      {data.open_tickets.map(t=><tr key={t.id} className="cursor-pointer border-b hover:bg-slate-50" onClick={()=>navigate(`/tickets/my`)}><td className="py-3 font-semibold">{t.ticket_number}</td><td>{t.device_name}</td><td>{t.title}</td><td>{t.priority}</td><td>{t.status}</td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}
