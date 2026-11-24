import {createSeed} from '../data/seed';
import type {Data} from '../types';
const KEY='hubops:workspace:v1';
export function load():{data:Data;warning:string}{
 try {const raw=localStorage.getItem(KEY);if(!raw)return {data:createSeed(),warning:''}; const parsed=JSON.parse(raw);const keys=Object.keys(createSeed());if(parsed.version!==1||!parsed.data||!keys.every(k=>Array.isArray(parsed.data[k])))throw new Error();return {data:parsed.data as Data,warning:''};}
 catch{return {data:createSeed(),warning:'Saved data could not be read. Demo data is shown; export or reset before making changes.'};}
}
export function save(data:Data){localStorage.setItem(KEY,JSON.stringify({version:1,data}));}
