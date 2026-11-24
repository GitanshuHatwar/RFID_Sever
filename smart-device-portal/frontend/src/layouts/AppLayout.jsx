import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Radio, Ticket, CheckCircle, Monitor, LogOut } from "lucide-react";
import LiveTapPopup from "../components/LiveTapPopup";

export default function AppLayout() {
  const navigate = useNavigate();
  const technician = JSON.parse(localStorage.getItem("technician") || "{}");
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("technician");
    navigate("/login");
  };
  const links = [
    ["/", LayoutDashboard, "Dashboard"], ["/taps", Radio, "Tap Logs"],
    ["/tickets/my", Ticket, "My Tickets"], ["/tickets/closed", CheckCircle, "Closed Tickets"],
    ["/devices", Monitor, "Devices"],
  ];
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-slate-900 text-white md:w-60 md:min-h-screen">
        <div className="border-b border-slate-700 px-5 py-5 text-lg font-bold">RFID Portal</div>
        <nav className="flex gap-1 p-2 md:flex-col">
          {links.map(([path,Icon,label]) => <NavLink key={path} to={path} end={path==="/"}
            className={({isActive})=>`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm md:flex-none ${isActive?"bg-blue-700":"hover:bg-slate-800"}`}>
            <Icon size={18}/><span className="hidden md:inline">{label}</span>
          </NavLink>)}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-end gap-4 border-b bg-white px-5">
          <span className="text-sm font-semibold">{technician.full_name || technician.username}</span>
          <button className="flex items-center gap-2 text-sm text-slate-600" onClick={logout}><LogOut size={16}/> Logout</button>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
      <LiveTapPopup/>
    </div>
  );
}
