import {lazy,Suspense} from 'react';
import {Route,Routes} from 'react-router-dom';
import {AppLayout} from './layouts/AppLayout';

const Overview=lazy(()=>import('./pages/Overview').then(module=>({default:module.Overview})));
const Facilities=lazy(()=>import('./pages/Facilities').then(module=>({default:module.Facilities})));
const Team=lazy(()=>import('./pages/Team').then(module=>({default:module.Team})));
const Settings=lazy(()=>import('./pages/Settings').then(module=>({default:module.Settings})));
const Assets=lazy(()=>import('./pages/Assets').then(module=>({default:module.Assets})));
const Monitoring=lazy(()=>import('./pages/Monitoring').then(module=>({default:module.Monitoring})));
const Incidents=lazy(()=>import('./pages/Incidents').then(module=>({default:module.Incidents})));
const Maintenance=lazy(()=>import('./pages/Maintenance').then(module=>({default:module.Maintenance})));
const Safety=lazy(()=>import('./pages/Safety').then(module=>({default:module.Safety})));
const Analytics=lazy(()=>import('./pages/Analytics').then(module=>({default:module.Analytics})));
const Planned=lazy(()=>import('./pages/Planned').then(module=>({default:module.Planned})));

function Loading(){return <section className="card planned" role="status">Loading workspace module…</section>;}

export function App(){
 return <Suspense fallback={<Loading/>}><Routes><Route element={<AppLayout/>}><Route index element={<Overview/>}/><Route path="assets" element={<Assets/>}/><Route path="incidents" element={<Incidents/>}/><Route path="facilities" element={<Facilities/>}/><Route path="monitoring" element={<Monitoring/>}/><Route path="maintenance" element={<Maintenance/>}/><Route path="safety" element={<Safety/>}/><Route path="team" element={<Team/>}/><Route path="analytics" element={<Analytics/>}/><Route path="settings" element={<Settings/>}/><Route path="*" element={<Planned/>}/></Route></Routes></Suspense>;
}
