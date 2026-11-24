import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [username,setUsername]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const navigate=useNavigate();
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");
    try { const {data}=await api.post("/api/auth/login",{username,password});
      localStorage.setItem("token",data.access_token); localStorage.setItem("technician",JSON.stringify(data.technician)); navigate("/");
    } catch(e){setError(e.response?.data?.detail||"Login failed");} finally{setBusy(false);}
  };
  return <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
    <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
      <h1 className="mb-1 text-2xl font-bold">RFID Technician Portal</h1><p className="mb-6 text-sm text-slate-500">Sign in to continue</p>
      <label><span className="label">Username</span><input className="input" value={username} onChange={e=>setUsername(e.target.value)} required/></label>
      <label className="mt-4 block"><span className="label">Password</span><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      {error&&<p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      <button className="btn-primary mt-6 w-full" disabled={busy}>{busy?"Signing in...":"Sign in"}</button>
    </form>
  </div>;
}
