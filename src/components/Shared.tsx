import {useEffect,useId,useRef,type KeyboardEvent,type ReactNode} from 'react';
import {Button} from './ui/button';

export function PageTitle({eyebrow='WORKSPACE',title,description,action}:{eyebrow?:string;title:string;description:string;action?:ReactNode}){
 return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export type BadgeTone='neutral'|'info'|'success'|'warning'|'danger';
const badgeToneClass:Record<BadgeTone,string>={neutral:'badge-neutral',info:'badge-info',success:'badge-success operational',warning:'badge-warning warning',danger:'badge-danger critical'};
export function Badge({children,tone,className=''}:{children:ReactNode;tone?:BadgeTone;className?:string}){
 const legacyClass=String(children).replaceAll(' ','-');
 return <span className={['badge',tone?badgeToneClass[tone]:legacyClass,className].filter(Boolean).join(' ')}>{children}</span>;
}

const focusableSelector='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const titleId=useId();
 const dialogRef=useRef<HTMLElement>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 const capturedOpenerRef=useRef(false);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;

 useEffect(()=>{
  if(!capturedOpenerRef.current){
   openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
   capturedOpenerRef.current=true;
  }
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const frame=window.requestAnimationFrame(()=>{
   const dialog=dialogRef.current;
   dialog?.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),a[href]')?.focus();
   if(dialog&&!dialog.contains(document.activeElement))dialog.focus();
  });
  const onKeyDown=(event:globalThis.KeyboardEvent)=>{
   if(event.key==='Escape'){
    event.preventDefault();
    closeRef.current();
   }
  };
  document.addEventListener('keydown',onKeyDown);
  return ()=>{
   window.cancelAnimationFrame(frame);
   document.removeEventListener('keydown',onKeyDown);
   document.body.style.overflow=previousOverflow;
   openerRef.current?.focus();
  };
 },[]);

 function trapFocus(event:KeyboardEvent<HTMLElement>){
  if(event.key!=='Tab')return;
  const dialog=dialogRef.current;
  if(!dialog)return;
  const items=Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
  const first=items[0],last=items.at(-1);
  if(!first||!last){event.preventDefault();dialog.focus();return;}
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){
   event.preventDefault();
   last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){
   event.preventDefault();
   first.focus();
  }
 }

 return <div className="modal-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)closeRef.current();}}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal" tabIndex={-1} onKeyDown={trapFocus}><div className="section-head"><h2 id={titleId}>{title}</h2><Button type="button" variant="ghost" onClick={()=>closeRef.current()} aria-label="Close dialog">×</Button></div>{children}</section></div>;
}

export function Field({label,children}:{label:string;children:ReactNode}){
 return <label className="field"><span>{label}</span>{children}</label>;
}
