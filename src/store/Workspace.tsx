import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import type {Data} from '../types';
import {load,save} from '../services/storage';
import {simulateTelemetryTick} from '../services/telemetrySimulator';

export interface UpdateOptions { log?:boolean }
export interface WorkspaceStore {
  data:Data;
  warning:string;
  update:(fn:(data:Data)=>Data,message:string,options?:UpdateOptions)=>void;
  replace:(data:Data,message:string)=>void;
  replaceData:(data:Data,message:string)=>void;
}

const Context=createContext<WorkspaceStore|null>(null);

export function Workspace({children}:{children:ReactNode}){
 const [initial]=useState(load);
 const [data,setData]=useState(initial.data);
 const [warning,setWarning]=useState(initial.warning);
 const dataRef=useRef(initial.data);

 const update=useCallback((fn:(data:Data)=>Data,message:string,options:UpdateOptions={})=>{
  const transformed=fn(dataRef.current);
  const shouldLog=options.log!==false&&message.trim().length>0;
  const next=shouldLog?{
   ...transformed,
   activity:[{id:crypto.randomUUID(),message,timestamp:new Date().toISOString()},...transformed.activity].slice(0,100),
  }:transformed;
  try{
   save(next);
   dataRef.current=next;
   setData(next);
   setWarning('');
  }catch(error){
   setWarning('Storage is unavailable or full. Your change was not saved.');
   throw new Error('Unable to save. Export data and check browser storage.',{cause:error});
  }
 },[]);

 const replace=useCallback((next:Data,message:string)=>update(()=>next,message),[update]);

 useEffect(()=>{
  if(!data.simulation.running)return;
  const timer=window.setInterval(()=>{
   try{update(current=>simulateTelemetryTick(current),'',{log:false});}
   catch{
    window.clearInterval(timer);
    const stopped={...dataRef.current,simulation:{...dataRef.current.simulation,running:false}};
    dataRef.current=stopped;
    setData(stopped);
   }
  },data.simulation.intervalMs);
  return ()=>window.clearInterval(timer);
 },[data.simulation.intervalMs,data.simulation.running,update]);

 return <Context.Provider value={{data,warning,update,replace,replaceData:replace}}>{children}</Context.Provider>;
}
export function useWorkspace(){const c=useContext(Context);if(!c)throw new Error('Workspace provider missing');return c;}
