import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TapLogs from "./pages/TapLogs";
import Tickets from "./pages/Tickets";
import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";

function Protected({children}) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App(){
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route element={<Protected><AppLayout/></Protected>}>
      <Route index element={<Dashboard/>}/>
      <Route path="taps" element={<TapLogs/>}/>
      <Route path="tickets/my" element={<Tickets/>}/>
      <Route path="tickets/closed" element={<Tickets closed/>}/>
      <Route path="devices" element={<Devices/>}/>
      <Route path="devices/:id" element={<DeviceDetail/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
