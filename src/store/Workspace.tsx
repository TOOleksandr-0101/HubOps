import {createContext,useContext,useState,type ReactNode} from 'react';
import type {Data} from '../types';
import {load,save} from '../services/storage';
type Store={data:Data;warning:string;update:(fn:(d:Data)=>Data,message:string)=>void};
const Context=createContext<Store|null>(null);
export function Workspace({children}:{children:ReactNode}){const [initial]=useState(load);const [data,setData]=useState(initial.data);const [warning,setWarning]=useState(initial.warning);
 function update(fn:(d:Data)=>Data,message:string){const next=fn(data);next.activity=[{id:crypto.randomUUID(),message,timestamp:new Date().toISOString()},...next.activity].slice(0,100);try{save(next);setData(next);setWarning('');}catch{setWarning('Storage is unavailable or full. Your change was not saved.');throw new Error('Unable to save. Export data and check browser storage.');}}
 return <Context.Provider value={{data,warning,update}}>{children}</Context.Provider>;
}
export function useWorkspace(){const c=useContext(Context);if(!c)throw new Error('Workspace provider missing');return c;}
