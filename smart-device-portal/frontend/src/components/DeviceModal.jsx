import { useEffect, useState } from "react";
import api from "../services/api";
import Modal from "./Modal";

const blank = {rfid_uid:"",name:"",device_type:"",model:"",serial_number:"",manufacturer:"",
  location:"",status:"ACTIVE",purchase_date:"",warranty_expiry:"",notes:""};

export default function DeviceModal({open,device=null,uid="",onClose,onSaved}) {
  const [form,setForm] = useState(blank);
  const [photo,setPhoto] = useState(null);
  const [preview,setPreview] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  useEffect(() => {
    setForm(device ? {...blank,...device,purchase_date:device.purchase_date||"",warranty_expiry:device.warranty_expiry||""} : {...blank,rfid_uid:uid});
    setPhoto(null); setPreview(""); setError("");
  }, [open,device,uid]);
  const set = (key,value) => setForm(v=>({...v,[key]:value}));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = {...form};
      for (const key of ["purchase_date","warranty_expiry"]) if (!payload[key]) payload[key]=null;
      const response = device
        ? await api.put(`/api/devices/${device.id}`,payload)
        : await api.post("/api/devices",payload);
      let saved = response.data.data;
      if (photo) {
        const fd = new FormData(); fd.append("file",photo);
        await api.post(`/api/devices/${saved.id}/photo`,fd,{headers:{"Content-Type":"multipart/form-data"}});
        saved = (await api.get(`/api/devices/${saved.id}`)).data;
      }
      onSaved(saved);
    } catch (e) { setError(e.response?.data?.detail || "Unable to save device"); }
    finally { setBusy(false); }
  };
  return <Modal open={open} title={device?"Edit Device":"Add Device"} onClose={onClose} wide>
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      {[
        ["rfid_uid","RFID UID","text"],["name","Name","text"],["device_type","Device Type","text"],
        ["model","Model","text"],["serial_number","Serial Number","text"],["manufacturer","Manufacturer","text"],
        ["location","Location","text"],["purchase_date","Purchase Date","date"],["warranty_expiry","Warranty Expiry","date"]
      ].map(([key,label,type]) => <label key={key}><span className="label">{label}{key==="rfid_uid"?" *":""}</span>
        <input className="input" type={type} required={key==="rfid_uid"||key==="name"||key==="device_type"}
          value={form[key]||""} disabled={Boolean(device && key==="rfid_uid")} onChange={e=>set(key,e.target.value)}/></label>)}
      <label><span className="label">Status</span><select className="input" value={form.status} onChange={e=>set("status",e.target.value)}>
        <option>ACTIVE</option><option>UNDER_REPAIR</option><option>RETIRED</option></select></label>
      <label className="md:col-span-2"><span className="label">Notes</span><textarea className="input min-h-20" value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></label>
      <label className="md:col-span-2"><span className="label">Photo</span><input type="file" accept="image/jpeg,image/png,image/webp"
        onChange={e=>{const file=e.target.files?.[0];setPhoto(file||null);if(file)setPreview(URL.createObjectURL(file));}}/>
        {preview && <img src={preview} alt="Preview" className="mt-3 h-32 w-32 rounded-lg object-cover"/>}</label>
      {error && <p className="text-sm font-semibold text-red-600 md:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 md:col-span-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy?"Saving...":"Save Device"}</button>
      </div>
    </form>
  </Modal>;
}
