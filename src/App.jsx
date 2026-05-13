import { useState, useMemo } from "react";

const ORANGE = "#FF673E";
const GREEN = "#39A68E";
const BLUE = "#87A7C1";
const BRONZE = "#EAAF47";
const PARCHMENT = "#F2E9C7";
const BLACK = "#1C1B1B";
const DARK = "#242424";
const BORDER = "#2E2E2E";
const MUTED = "#888";
const DIM = "#555";

const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const QUARTERS = [
  { label: "Q1", months: [0,1,2] },
  { label: "Q2", months: [3,4,5] },
  { label: "Q3", months: [6,7,8] },
  { label: "Q4", months: [9,10,11] },
];
const CONV = { "High": 0.90, "Medium": 0.60, "Low": 0.30, "Very High": 0.95 };

const AKL_BUDGET  = [82700,106800,101600,40547,40547,53747,87822,170100,273200,307100,384200,280400];
const PALMY_BUDGET = [34600,0,0,52173,0,10600,17200,28000,55400,74600,104000,77800];
const AKL_INIT   = [68571,126151,71349,0,0,0,21819,55833,59411,157451,152073,118725];
const PALMY_INIT = [671,687,0,52174,0,0,7900,19377,0,51633,43728,37847];

const fmtN = (n) => (!n || n===0) ? "—" : "$"+Math.round(n).toLocaleString("en-NZ");
const fmtK = (n) => {
  if (!n||n===0) return "$0";
  if (n>=1000000) return "$"+(n/1000000).toFixed(2)+"M";
  return "$"+Math.round(n/1000)+"K";
};
const pct = (a,b) => b>0 ? Math.round((a/b)*100) : 0;
const nowStr = () => new Date().toLocaleDateString("en-NZ",{day:"numeric",month:"short",year:"numeric"});

function Stamp({ label, value, color }) {
  return (
    <div style={{fontSize:10,color:DIM,fontFamily:"monospace",background:DARK,padding:"5px 10px",borderRadius:5,border:`0.5px solid ${BORDER}`}}>
      {label}: <span style={{color: color||MUTED}}>{value||"—"}</span>
    </div>
  );
}

function Card({ label, value, color, sub }) {
  return (
    <div style={{background:DARK,borderRadius:8,padding:"12px 14px",border:`0.5px solid ${BORDER}`}}>
      <div style={{fontSize:10,color:MUTED,fontFamily:"monospace",letterSpacing:"0.08em",marginBottom:4}}>{label.toUpperCase()}</div>
      <div style={{fontSize:20,color:color||PARCHMENT,fontFamily:"monospace"}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:DIM,fontFamily:"monospace",marginTop:3}}>{sub}</div>}
    </div>
  );
}

function LocationTab({ budget, actuals, setActuals, pipeW, color, xeroUpdated }) {
  const totB = budget.reduce((s,v)=>s+v,0);
  const totA = actuals.reduce((s,v)=>s+v,0);
  const totP = pipeW.reduce((s,v)=>s+v,0);
  const totC = totA+totP;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
        <Card label="Full year budget" value={fmtK(totB)} color={MUTED}/>
        <Card label="Xero actual YTD" value={fmtK(totA)} color={GREEN}/>
        <Card label="Weighted pipeline" value={fmtK(totP)} color={BLUE}/>
        <Card label="Jobs confirmed" value={fmtK(totC)} color={totC>=totB?GREEN:color} sub={`${pct(totC,totB)}% of budget`}/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <Stamp label="Xero last updated" value={xeroUpdated} color={GREEN}/>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${BORDER}`}}>
              {[["MONTH","left"],["BUDGET","right"],["XERO ACTUAL","right"],["PIPELINE","right"],["JOBS CONFIRMED","right"],["VS BUDGET","right"]].map(([h,a])=>(
                <th key={h} style={{textAlign:a,padding:"8px 8px",color:MUTED,fontFamily:"monospace",fontSize:10}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUARTERS.map(q=>{
              const qB=q.months.reduce((s,i)=>s+budget[i],0);
              const qA=q.months.reduce((s,i)=>s+actuals[i],0);
              const qP=q.months.reduce((s,i)=>s+pipeW[i],0);
              const qC=qA+qP; const qV=qC-qB;
              return [
                ...q.months.map(mi=>{
                  const conf=actuals[mi]+pipeW[mi]; const v=conf-budget[mi];
                  return (
                    <tr key={mi} style={{borderBottom:`0.5px solid ${BORDER}`,background:actuals[mi]>0?"#222":"transparent"}}>
                      <td style={{padding:"6px 8px",color:actuals[mi]>0?color:MUTED,fontFamily:"monospace",fontSize:11}}>{MONTHS[mi]}</td>
                      <td style={{padding:"6px 8px",color:DIM,fontFamily:"monospace",textAlign:"right"}}>{fmtN(budget[mi])}</td>
                      <td style={{padding:"4px 8px",textAlign:"right"}}>
                        <input type="number" min={0} value={actuals[mi]||""} placeholder="—"
                          onChange={e=>{const a=[...actuals];a[mi]=parseFloat(e.target.value)||0;setActuals(a);}}
                          style={{background:"#2A2A2A",border:`1px solid ${GREEN}44`,borderRadius:4,color:GREEN,fontFamily:"monospace",fontSize:12,padding:"4px 6px",width:"100%",outline:"none",textAlign:"right"}}/>
                      </td>
                      <td style={{padding:"6px 8px",color:pipeW[mi]>0?BLUE:DIM,fontFamily:"monospace",textAlign:"right"}}>{fmtN(pipeW[mi])}</td>
                      <td style={{padding:"6px 8px",color:conf>0?PARCHMENT:DIM,fontFamily:"monospace",textAlign:"right"}}>{conf>0?fmtN(conf):"—"}</td>
                      <td style={{padding:"6px 8px",fontFamily:"monospace",textAlign:"right",fontSize:11,color:conf===0?DIM:v>=0?GREEN:"#D85A30"}}>{conf===0?"—":(v>=0?"+":"")+fmtN(v)}</td>
                    </tr>
                  );
                }),
                <tr key={`q${q.label}`} style={{background:"#2A2A2A",borderBottom:`1px solid ${BORDER}`}}>
                  <td style={{padding:"8px 8px",color,fontFamily:"monospace",fontSize:11,fontWeight:500}}>{q.label} Total</td>
                  <td style={{padding:"8px 8px",color:MUTED,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{fmtN(qB)}</td>
                  <td style={{padding:"8px 8px",color:GREEN,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qA>0?fmtN(qA):"—"}</td>
                  <td style={{padding:"8px 8px",color:BLUE,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qP>0?fmtN(qP):"—"}</td>
                  <td style={{padding:"8px 8px",color:PARCHMENT,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qC>0?fmtN(qC):"—"}</td>
                  <td style={{padding:"8px 8px",fontFamily:"monospace",textAlign:"right",fontWeight:500,color:qC===0?DIM:qV>=0?GREEN:"#D85A30"}}>{qC===0?"—":(qV>=0?"+":"")+fmtN(qV)}</td>
                </tr>
              ];
            })}
            <tr style={{background:"#333",borderTop:`1px solid ${color}44`}}>
              <td style={{padding:"10px 8px",color,fontFamily:"monospace",fontSize:13,fontWeight:500}}>FULL YEAR</td>
              <td style={{padding:"10px 8px",color:MUTED,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{fmtN(totB)}</td>
              <td style={{padding:"10px 8px",color:GREEN,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{totA>0?fmtN(totA):"—"}</td>
              <td style={{padding:"10px 8px",color:BLUE,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{totP>0?fmtN(totP):"—"}</td>
              <td style={{padding:"10px 8px",color:PARCHMENT,fontFamily:"monospace",textAlign:"right",fontSize:13,fontWeight:500}}>{totC>0?fmtN(totC):"—"}</td>
              <td style={{padding:"10px 8px",fontFamily:"monospace",textAlign:"right",fontSize:13,fontWeight:500,color:totC===0?DIM:(totC-totB)>=0?GREEN:"#D85A30"}}>
                {totC===0?"—":((totC-totB)>=0?"+":"")+fmtN(totC-totB)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineTab({ jobs, setJobs, mtUpdated, setMtUpdated }) {
  const add = () => setJobs(p=>[...p,{id:Date.now(),name:"",location:"akl",month:0,value:0,probability:"Medium"}]);
  const upd = (id,f,v) => setJobs(p=>p.map(j=>j.id===id?{...j,[f]:f==="value"?parseFloat(v)||0:f==="month"?parseInt(v):v}:j));
  const del = (id) => setJobs(p=>p.filter(j=>j.id!==id));

  const importJSON = () => {
    const json = prompt("Paste the JSON from the MarqueeTech extension:");
    if (!json) return;
    try {
      const data = JSON.parse(json);
      const imported = (data.jobs||[])
        .filter(j=>j.month>=0&&j.month<=11)
        .map(j=>({
          id:Date.now()+Math.random(),
          name:j.name||"Imported job",
          location:j.location||"akl",
          month:j.month,
          value:j.value||0,
          probability:j.probability||"Medium",
        }));
      if (imported.length===0){alert("No FY27 jobs found in the JSON.");return;}
      const ok = window.confirm(`This will clear all ${jobs.length} existing pipeline jobs and replace with ${imported.length} jobs from MarqueeTech.\n\nContinue?`);
      if (!ok) return;
      setJobs(imported);
      setMtUpdated(nowStr());
      alert(imported.length+" jobs imported. Pipeline updated.");
    } catch(e){alert("Invalid JSON — copy the full output from the extension and try again.");}
  };

  const totGross = jobs.reduce((s,j)=>s+j.value,0);
  const totW = jobs.reduce((s,j)=>s+j.value*(CONV[j.probability]||0.6),0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
        <Card label="Jobs in pipeline" value={jobs.length} color={MUTED}/>
        <Card label="Gross pipeline value" value={fmtK(totGross)} color={PARCHMENT}/>
        <Card label="Weighted forecast" value={fmtK(totW)} color={BLUE}/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <Stamp label="MarqueeTech last synced" value={mtUpdated} color={mtUpdated?GREEN:DIM}/>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
        {[["High",GREEN,90],["Very High",BLUE,95],["Medium",BRONZE,60],["Low","#D85A30",30]].map(([k,c,p])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:2,background:c}}/>
            <span style={{fontSize:11,color:MUTED,fontFamily:"monospace"}}>{k}: {p}%</span>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 80px 80px 110px 100px 90px 36px",gap:8,padding:"6px 8px",borderBottom:`1px solid ${BORDER}`}}>
        {["JOB NAME","LOCATION","MONTH","GROSS VALUE","WEIGHTED","PROBABILITY",""].map(h=>(
          <div key={h} style={{fontSize:9,color:DIM,fontFamily:"monospace"}}>{h}</div>
        ))}
      </div>
      {jobs.length===0&&(
        <div style={{padding:"32px",textAlign:"center",color:DIM,fontFamily:"monospace",fontSize:12}}>No pipeline jobs yet — import from MarqueeTech or add manually</div>
      )}
      {jobs.map(j=>{
        const w=j.value*(CONV[j.probability]||0.6);
        const pc=j.probability==="High"?GREEN:j.probability==="Very High"?BLUE:j.probability==="Medium"?BRONZE:"#D85A30";
        return (
          <div key={j.id} style={{display:"grid",gridTemplateColumns:"2fr 80px 80px 110px 100px 90px 36px",gap:8,padding:"6px 8px",borderBottom:`0.5px solid ${BORDER}`,alignItems:"center",background:DARK}}>
            <input value={j.name} placeholder="Job name" onChange={e=>upd(j.id,"name",e.target.value)}
              style={{background:"#2A2A2A",border:`1px solid ${BORDER}`,borderRadius:4,color:PARCHMENT,fontFamily:"monospace",fontSize:12,padding:"5px 7px",outline:"none"}}/>
            <select value={j.location} onChange={e=>upd(j.id,"location",e.target.value)}
              style={{background:"#2A2A2A",border:`1px solid ${BORDER}`,borderRadius:4,color:j.location==="akl"?ORANGE:BLUE,fontFamily:"monospace",fontSize:11,padding:"5px 4px",outline:"none"}}>
              <option value="akl">AKL</option>
              <option value="palmy">Palmy</option>
            </select>
            <select value={j.month} onChange={e=>upd(j.id,"month",e.target.value)}
              style={{background:"#2A2A2A",border:`1px solid ${BORDER}`,borderRadius:4,color:PARCHMENT,fontFamily:"monospace",fontSize:11,padding:"5px 4px",outline:"none"}}>
              {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
            <input type="number" min={0} value={j.value||""} placeholder="0" onChange={e=>upd(j.id,"value",e.target.value)}
              style={{background:"#2A2A2A",border:`1px solid ${BORDER}`,borderRadius:4,color:PARCHMENT,fontFamily:"monospace",fontSize:12,padding:"5px 7px",outline:"none",textAlign:"right"}}/>
            <div style={{fontFamily:"monospace",fontSize:12,color:pc,textAlign:"right",padding:"0 4px"}}>{w>0?fmtN(w):"—"}</div>
            <select value={j.probability} onChange={e=>upd(j.id,"probability",e.target.value)}
              style={{background:"#2A2A2A",border:`1px solid ${pc}`,borderRadius:4,color:pc,fontFamily:"monospace",fontSize:11,padding:"5px 4px",outline:"none"}}>
              <option value="Very High">Very High</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button onClick={()=>del(j.id)}
              style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:4,color:DIM,fontFamily:"monospace",fontSize:14,cursor:"pointer",padding:"4px"}}>×</button>
          </div>
        );
      })}
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={add}
          style={{flex:1,padding:"8px",background:"transparent",border:`1px dashed ${BORDER}`,borderRadius:6,color:MUTED,fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>
          + ADD JOB MANUALLY
        </button>
        <button onClick={importJSON}
          style={{flex:1,padding:"8px",background:`${GREEN}22`,border:`1px solid ${GREEN}55`,borderRadius:6,color:GREEN,fontFamily:"monospace",fontSize:11,cursor:"pointer",letterSpacing:"0.06em"}}>
          ↓ IMPORT FROM MARQUEETECH
        </button>
      </div>
    </div>
  );
}

function CombinedTab({ aklA, palmyA, aklP, palmyP, xeroUpdated, mtUpdated }) {
  const combined = AKL_BUDGET.map((v,i)=>v+PALMY_BUDGET[i]);
  const totB = combined.reduce((s,v)=>s+v,0);
  const totAkl = aklA.reduce((s,v)=>s+v,0);
  const totPalmy = palmyA.reduce((s,v)=>s+v,0);
  const totAklP = aklP.reduce((s,v)=>s+v,0);
  const totPalmyP = palmyP.reduce((s,v)=>s+v,0);
  const totC = totAkl+totPalmy+totAklP+totPalmyP;
  const progPct = pct(totC,totB);
  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:11,color:MUTED,fontFamily:"monospace"}}>JOBS CONFIRMED vs BUDGET</span>
          <span style={{fontSize:12,fontFamily:"monospace",color:totC>=totB?GREEN:ORANGE}}>{progPct}% — {fmtK(totC)} of {fmtK(totB)}</span>
        </div>
        <div style={{height:10,background:"#333",borderRadius:5,overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct(totAkl+totPalmy,totB)}%`,background:ORANGE}}/>
          <div style={{position:"absolute",left:`${pct(totAkl+totPalmy,totB)}%`,top:0,height:"100%",width:`${pct(totAklP+totPalmyP,totB)}%`,background:BLUE,opacity:0.7}}/>
        </div>
        <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
          {[{c:ORANGE,l:"Xero actual",v:fmtK(totAkl+totPalmy)},{c:BLUE,l:"Weighted pipeline",v:fmtK(totAklP+totPalmyP)},{c:MUTED,l:"Budget",v:fmtK(totB)}].map(({c,l,v})=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:2,background:c}}/>
              <span style={{fontSize:11,color:MUTED,fontFamily:"monospace"}}>{l}: </span>
              <span style={{fontSize:11,color:"#F9F9FA",fontFamily:"monospace"}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:16}}>
        <Stamp label="Xero" value={xeroUpdated} color={GREEN}/>
        <Stamp label="MarqueeTech" value={mtUpdated||"not synced"} color={mtUpdated?GREEN:DIM}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <Card label="Full year budget" value={fmtK(totB)} color={MUTED}/>
        <Card label="AKL jobs confirmed" value={fmtK(totAkl+totAklP)} color={ORANGE}/>
        <Card label="Palmy jobs confirmed" value={fmtK(totPalmy+totPalmyP)} color={BLUE}/>
        <Card label="Combined" value={fmtK(totC)} color={totC>=totB?GREEN:ORANGE} sub={`${progPct}% of budget`}/>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${BORDER}`}}>
              {[["MONTH","left"],["BUDGET","right"],["AKL ACTUAL","right"],["PALMY ACTUAL","right"],["PIPELINE","right"],["JOBS CONFIRMED","right"],["VS BUDGET","right"]].map(([h,a])=>(
                <th key={h} style={{textAlign:a,padding:"8px 8px",color:MUTED,fontFamily:"monospace",fontSize:10}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUARTERS.map(q=>{
              const qB=q.months.reduce((s,i)=>s+combined[i],0);
              const qAkl=q.months.reduce((s,i)=>s+aklA[i],0);
              const qPalmy=q.months.reduce((s,i)=>s+palmyA[i],0);
              const qPipe=q.months.reduce((s,i)=>s+aklP[i]+palmyP[i],0);
              const qC=qAkl+qPalmy+qPipe; const qV=qC-qB;
              return [
                ...q.months.map(mi=>{
                  const conf=aklA[mi]+palmyA[mi]+aklP[mi]+palmyP[mi]; const v=conf-combined[mi];
                  return (
                    <tr key={mi} style={{borderBottom:`0.5px solid ${BORDER}`}}>
                      <td style={{padding:"6px 8px",color:MUTED,fontFamily:"monospace",fontSize:11}}>{MONTHS[mi]}</td>
                      <td style={{padding:"6px 8px",color:DIM,fontFamily:"monospace",textAlign:"right"}}>{fmtN(combined[mi])}</td>
                      <td style={{padding:"6px 8px",color:aklA[mi]>0?ORANGE:DIM,fontFamily:"monospace",textAlign:"right"}}>{fmtN(aklA[mi])}</td>
                      <td style={{padding:"6px 8px",color:palmyA[mi]>0?BLUE:DIM,fontFamily:"monospace",textAlign:"right"}}>{fmtN(palmyA[mi])}</td>
                      <td style={{padding:"6px 8px",color:(aklP[mi]+palmyP[mi])>0?BLUE:DIM,fontFamily:"monospace",textAlign:"right"}}>{(aklP[mi]+palmyP[mi])>0?fmtN(aklP[mi]+palmyP[mi]):"—"}</td>
                      <td style={{padding:"6px 8px",color:conf>0?PARCHMENT:DIM,fontFamily:"monospace",textAlign:"right"}}>{conf>0?fmtN(conf):"—"}</td>
                      <td style={{padding:"6px 8px",fontFamily:"monospace",textAlign:"right",fontSize:11,color:conf===0?DIM:v>=0?GREEN:"#D85A30"}}>{conf===0?"—":(v>=0?"+":"")+fmtN(v)}</td>
                    </tr>
                  );
                }),
                <tr key={`q${q.label}`} style={{background:"#2A2A2A",borderBottom:`1px solid ${BORDER}`}}>
                  <td style={{padding:"8px 8px",color:BRONZE,fontFamily:"monospace",fontSize:11,fontWeight:500}}>{q.label} Total</td>
                  <td style={{padding:"8px 8px",color:MUTED,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{fmtN(qB)}</td>
                  <td style={{padding:"8px 8px",color:ORANGE,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qAkl>0?fmtN(qAkl):"—"}</td>
                  <td style={{padding:"8px 8px",color:BLUE,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qPalmy>0?fmtN(qPalmy):"—"}</td>
                  <td style={{padding:"8px 8px",color:BLUE,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qPipe>0?fmtN(qPipe):"—"}</td>
                  <td style={{padding:"8px 8px",color:PARCHMENT,fontFamily:"monospace",textAlign:"right",fontWeight:500}}>{qC>0?fmtN(qC):"—"}</td>
                  <td style={{padding:"8px 8px",fontFamily:"monospace",textAlign:"right",fontWeight:500,color:qC===0?DIM:qV>=0?GREEN:"#D85A30"}}>{qC===0?"—":(qV>=0?"+":"")+fmtN(qV)}</td>
                </tr>
              ];
            })}
            <tr style={{background:"#333",borderTop:`1px solid ${BRONZE}44`}}>
              <td style={{padding:"10px 8px",color:BRONZE,fontFamily:"monospace",fontSize:13,fontWeight:500}}>FULL YEAR</td>
              <td style={{padding:"10px 8px",color:MUTED,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{fmtN(totB)}</td>
              <td style={{padding:"10px 8px",color:ORANGE,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{totAkl>0?fmtN(totAkl):"—"}</td>
              <td style={{padding:"10px 8px",color:BLUE,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{totPalmy>0?fmtN(totPalmy):"—"}</td>
              <td style={{padding:"10px 8px",color:BLUE,fontFamily:"monospace",textAlign:"right",fontSize:13}}>{(totAklP+totPalmyP)>0?fmtN(totAklP+totPalmyP):"—"}</td>
              <td style={{padding:"10px 8px",color:PARCHMENT,fontFamily:"monospace",textAlign:"right",fontSize:13,fontWeight:500}}>{totC>0?fmtN(totC):"—"}</td>
              <td style={{padding:"10px 8px",fontFamily:"monospace",textAlign:"right",fontSize:13,fontWeight:500,color:totC===0?DIM:(totC-totB)>=0?GREEN:"#D85A30"}}>
                {totC===0?"—":((totC-totB)>=0?"+":"")+fmtN(totC-totB)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HowToTab() {
  const sections = [
    { title:"Updating Xero actuals", color:GREEN, steps:[
      "At the end of each month, run a P&L in Xero filtered to that month only.",
      "Go to the Auckland or Palmerston North tab in this tracker.",
      "Click the green cell for that month and type in the total trading income from Xero.",
      "Do this separately for AKL and Palmy — they have different lines in Xero.",
      "The Combined tab and timestamps update automatically.",
    ]},
    { title:"Syncing pipeline from MarqueeTech", color:BLUE, steps:[
      "Open MarqueeTech → Sales Pipeline → Kanban view.",
      "Set the date range to cover the full FY27 year.",
      "Click the Lucy's Pipeline Sync extension icon in your Chrome toolbar.",
      "Click Extract from MarqueeTech — it reads all jobs from the Kanban columns.",
      "Click Copy JSON for Tracker.",
      "Go to the Pipeline tab in this tracker and click Import from MarqueeTech.",
      "Paste the JSON and confirm — pipeline updates instantly.",
      "Check any Palmy jobs and flip their location from AKL to Palmy.",
    ]},
    { title:"Reading the numbers", color:ORANGE, steps:[
      "Budget — what was planned at the start of FY27. Does not change.",
      "Xero actual — revenue from jobs delivered and invoiced in Xero for that month.",
      "Pipeline — weighted forecast from jobs in the Pipeline tab.",
      "Jobs confirmed — Xero actual + weighted pipeline combined.",
      "VS Budget — green means ahead, red means behind.",
      "Quarterly totals roll up automatically.",
    ]},
    { title:"Conversion rates", color:BRONZE, steps:[
      "Very High (95%) — deposit paid or contract signed.",
      "High (90%) — verbal confirmed, deposit discussion underway.",
      "Medium (60%) — quote sent, active engagement.",
      "Low (30%) — early enquiry, not yet qualified.",
      "When in doubt, rate conservatively.",
    ]},
  ];
  return (
    <div style={{maxWidth:680}}>
      <div style={{fontSize:11,letterSpacing:"0.12em",color:MUTED,fontFamily:"monospace",marginBottom:20}}>HOW TO USE THIS TRACKER</div>
      {sections.map(({title,color,steps})=>(
        <div key={title} style={{marginBottom:16,background:DARK,borderRadius:8,overflow:"hidden",border:`0.5px solid ${BORDER}`}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:3,height:14,background:color,borderRadius:2}}/>
            <span style={{fontSize:12,fontFamily:"monospace",color,letterSpacing:"0.06em"}}>{title}</span>
          </div>
          <div style={{padding:"10px 14px"}}>
            {steps.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:`${color}22`,border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  <span style={{fontSize:9,color,fontFamily:"monospace"}}>{i+1}</span>
                </div>
                <span style={{fontSize:12,color:"#ccc",lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{background:"#2A2A2A",borderRadius:8,padding:"12px 14px",border:`0.5px solid ${BORDER}`}}>
        <div style={{fontSize:10,color:MUTED,fontFamily:"monospace",letterSpacing:"0.08em",marginBottom:10}}>WEEKLY ROUTINE</div>
        {[
          "Every Monday — sync MarqueeTech pipeline, update probabilities on any manually added jobs.",
          "End of each month — pull Xero P&L for that month, update AKL and Palmy actuals.",
          "Each quarter — review quarterly total vs budget, adjust pipeline focus if needed.",
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{color:ORANGE,fontSize:14,marginTop:1}}>—</span>
            <span style={{fontSize:12,color:"#ccc",lineHeight:1.6}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("combined");
  const [aklActuals, setAklActuals] = useState([...AKL_INIT]);
  const [palmyActuals, setPalmyActuals] = useState([...PALMY_INIT]);
  const [jobs, setJobs] = useState([]);
  const [xeroUpdated, setXeroUpdated] = useState("14 May 2026");
  const [mtUpdated, setMtUpdated] = useState(null);

  const aklPipeW = useMemo(()=>{
    const w=Array(12).fill(0);
    jobs.filter(j=>j.location==="akl").forEach(j=>{w[j.month]+=j.value*(CONV[j.probability]||0.6);});
    return w;
  },[jobs]);

  const palmyPipeW = useMemo(()=>{
    const w=Array(12).fill(0);
    jobs.filter(j=>j.location==="palmy").forEach(j=>{w[j.month]+=j.value*(CONV[j.probability]||0.6);});
    return w;
  },[jobs]);

  const TABS = [
    {key:"combined",label:"Combined",color:BRONZE},
    {key:"akl",label:"Auckland",color:ORANGE},
    {key:"palmy",label:"Palmerston North",color:BLUE},
    {key:"pipeline",label:`Pipeline (${jobs.length})`,color:GREEN},
    {key:"howto",label:"How to use",color:MUTED},
  ];

  const handleSetAklActuals = (v) => { setAklActuals(v); setXeroUpdated(nowStr()); };
  const handleSetPalmyActuals = (v) => { setPalmyActuals(v); setXeroUpdated(nowStr()); };

  return (
    <div style={{fontFamily:"'Georgia', serif",background:BLACK,minHeight:"100vh",color:"#F9F9FA"}}>
      <div style={{background:DARK,borderBottom:`1px solid ${BORDER}`,padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:32,background:ORANGE,borderRadius:2}}/>
            <div>
              <div style={{fontSize:10,letterSpacing:"0.15em",color:MUTED,fontFamily:"monospace"}}>LUCY'S EVENT HIRE</div>
              <div style={{fontSize:18,fontWeight:400}}>FY27 Revenue Tracker</div>
            </div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:11,color:DIM}}>Apr 2026 – Mar 2027</div>
        </div>
        <div style={{display:"flex",gap:6,marginTop:16,flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              padding:"6px 16px",borderRadius:5,
              border:`1px solid ${tab===t.key?t.color:BORDER}`,
              background:tab===t.key?`${t.color}22`:"transparent",
              color:tab===t.key?t.color:MUTED,
              fontFamily:"monospace",fontSize:11,cursor:"pointer",letterSpacing:"0.06em"
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"20px"}}>
        {tab==="combined"&&<CombinedTab aklA={aklActuals} palmyA={palmyActuals} aklP={aklPipeW} palmyP={palmyPipeW} xeroUpdated={xeroUpdated} mtUpdated={mtUpdated}/>}
        {tab==="akl"&&<LocationTab budget={AKL_BUDGET} actuals={aklActuals} setActuals={handleSetAklActuals} pipeW={aklPipeW} color={ORANGE} xeroUpdated={xeroUpdated}/>}
        {tab==="palmy"&&<LocationTab budget={PALMY_BUDGET} actuals={palmyActuals} setActuals={handleSetPalmyActuals} pipeW={palmyPipeW} color={BLUE} xeroUpdated={xeroUpdated}/>}
        {tab==="pipeline"&&<PipelineTab jobs={jobs} setJobs={setJobs} mtUpdated={mtUpdated} setMtUpdated={setMtUpdated}/>}
        {tab==="howto"&&<HowToTab/>}
      </div>
    </div>
  );
}
