import { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line, ComposedChart } from "recharts";
import * as d3 from "d3";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MODELS = ["Altima","Rogue","Sentra","Frontier","Pathfinder","Murano","Kicks","Versa","Armada","Titan","370Z","Maxima","NV200","Leaf"];
const SERVICE_TYPES = [
  { type:"Oil Change & Filter",       cat:"Maintenance", lh:[0.5,0.8], pc:[25,55],   freq:0.28 },
  { type:"Tire Rotation & Balance",   cat:"Maintenance", lh:[0.5,1.0], pc:[0,10],    freq:0.12 },
  { type:"Brake Inspection & Repair", cat:"Repair",      lh:[1.5,3.5], pc:[80,280],  freq:0.10 },
  { type:"Multi-Point Inspection",    cat:"Maintenance", lh:[0.5,1.0], pc:[0,20],    freq:0.09 },
  { type:"Air Filter Replacement",    cat:"Maintenance", lh:[0.3,0.5], pc:[20,45],   freq:0.07 },
  { type:"Transmission Service",      cat:"Repair",      lh:[2.0,4.0], pc:[120,350], freq:0.05 },
  { type:"Battery Replacement",       cat:"Repair",      lh:[0.5,1.0], pc:[100,200], freq:0.06 },
  { type:"Recall Repair",             cat:"Warranty",    lh:[1.0,3.0], pc:[50,400],  freq:0.07 },
  { type:"Coolant Flush",             cat:"Maintenance", lh:[1.0,1.5], pc:[40,80],   freq:0.04 },
  { type:"Wheel Alignment",           cat:"Repair",      lh:[1.0,1.5], pc:[0,30],    freq:0.05 },
  { type:"AC Service",                cat:"Repair",      lh:[1.0,2.5], pc:[60,250],  freq:0.04 },
  { type:"Spark Plug Replacement",    cat:"Maintenance", lh:[1.0,2.0], pc:[40,120],  freq:0.03 },
];
const US_STATES = [
  {code:"CA",name:"California",    d:48,lm:1.25,rm:1.30},{code:"TX",name:"Texas",         d:42,lm:1.05,rm:1.20},
  {code:"FL",name:"Florida",       d:38,lm:1.08,rm:1.15},{code:"NY",name:"New York",       d:28,lm:1.35,rm:1.25},
  {code:"IL",name:"Illinois",      d:22,lm:1.10,rm:1.05},{code:"PA",name:"Pennsylvania",   d:20,lm:1.05,rm:1.00},
  {code:"OH",name:"Ohio",          d:19,lm:1.00,rm:0.98},{code:"GA",name:"Georgia",        d:18,lm:1.02,rm:1.05},
  {code:"NC",name:"North Carolina",d:17,lm:0.98,rm:1.00},{code:"MI",name:"Michigan",       d:16,lm:1.00,rm:0.95},
  {code:"NJ",name:"New Jersey",    d:15,lm:1.30,rm:1.20},{code:"VA",name:"Virginia",       d:15,lm:1.05,rm:1.02},
  {code:"WA",name:"Washington",    d:14,lm:1.20,rm:1.15},{code:"AZ",name:"Arizona",        d:14,lm:1.05,rm:1.08},
  {code:"TN",name:"Tennessee",     d:13,lm:0.95,rm:0.97},{code:"IN",name:"Indiana",        d:12,lm:0.95,rm:0.92},
  {code:"MO",name:"Missouri",      d:12,lm:0.97,rm:0.95},{code:"MD",name:"Maryland",       d:11,lm:1.12,rm:1.08},
  {code:"WI",name:"Wisconsin",     d:11,lm:0.98,rm:0.93},{code:"MN",name:"Minnesota",      d:11,lm:1.00,rm:0.95},
  {code:"CO",name:"Colorado",      d:10,lm:1.10,rm:1.05},{code:"AL",name:"Alabama",        d:10,lm:0.90,rm:0.88},
  {code:"SC",name:"S. Carolina",   d:9, lm:0.93,rm:0.90},{code:"LA",name:"Louisiana",      d:9, lm:0.92,rm:0.90},
  {code:"KY",name:"Kentucky",      d:8, lm:0.93,rm:0.90},{code:"OR",name:"Oregon",         d:8, lm:1.12,rm:1.08},
  {code:"OK",name:"Oklahoma",      d:8, lm:0.92,rm:0.90},{code:"CT",name:"Connecticut",    d:7, lm:1.28,rm:1.18},
  {code:"UT",name:"Utah",          d:7, lm:1.05,rm:1.00},{code:"NV",name:"Nevada",         d:7, lm:1.10,rm:1.05},
  {code:"AR",name:"Arkansas",      d:6, lm:0.88,rm:0.85},{code:"MS",name:"Mississippi",    d:6, lm:0.87,rm:0.83},
  {code:"KS",name:"Kansas",        d:6, lm:0.92,rm:0.88},{code:"NM",name:"New Mexico",     d:5, lm:0.93,rm:0.90},
  {code:"NE",name:"Nebraska",      d:5, lm:0.91,rm:0.87},{code:"ID",name:"Idaho",          d:4, lm:0.96,rm:0.92},
  {code:"HI",name:"Hawaii",        d:4, lm:1.20,rm:1.15},{code:"ME",name:"Maine",          d:3, lm:1.05,rm:0.98},
  {code:"NH",name:"New Hampshire", d:3, lm:1.08,rm:1.00},{code:"RI",name:"Rhode Island",   d:2, lm:1.22,rm:1.10},
  {code:"MT",name:"Montana",       d:2, lm:0.95,rm:0.90},{code:"ND",name:"N. Dakota",      d:2, lm:0.90,rm:0.87},
  {code:"SD",name:"S. Dakota",     d:2, lm:0.89,rm:0.86},{code:"WY",name:"Wyoming",        d:2, lm:0.93,rm:0.88},
  {code:"AK",name:"Alaska",        d:2, lm:1.18,rm:1.10},{code:"VT",name:"Vermont",        d:1, lm:1.05,rm:0.97},
  {code:"DE",name:"Delaware",      d:2, lm:1.15,rm:1.05},{code:"WV",name:"West Virginia",  d:3, lm:0.90,rm:0.85},
  {code:"IA",name:"Iowa",          d:5, lm:0.92,rm:0.88},{code:"MA",name:"Massachusetts",  d:10,lm:1.32,rm:1.22},
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASON = [0.82,0.85,0.95,1.05,1.10,1.12,1.08,1.10,1.05,0.98,0.88,0.80];
const PAY = {Maintenance:"Customer Pay",Repair:"Customer Pay",Warranty:"Warranty"};
const COLORS = ["#c41230","#1a3a5c","#e8a020","#2e7d32","#6a1b9a","#00838f","#e64a19","#546e7a"];
const FIPS = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"};

// ── RNG ───────────────────────────────────────────────────────────────────────
function rng32(seed) {
  return () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
}

// ── BUILD DATASET (50 000 rows) ───────────────────────────────────────────────
function buildDataset() {
  const rng = rng32(42);
  const rand = (a,b)=>a+rng()*(b-a);
  const pick = arr=>arr[Math.floor(rng()*arr.length)];
  const totalW = US_STATES.reduce((a,b)=>a+b.d,0);
  const pickState = ()=>{ let r=rng()*totalW,c=0; for(const s of US_STATES){c+=s.d;if(r<c)return s;} return US_STATES[0]; };

  const rows=[];
  const start=new Date(2020,0,1).getTime();
  const span =new Date(2024,11,31).getTime()-start;

  while(rows.length < 50000) {
    const dt=new Date(start+rng()*span);
    const mo=dt.getMonth();
    if(rng()>SEASON[mo]) continue;
    const svc=(()=>{let r=rng(),c=0;for(const s of SERVICE_TYPES){c+=s.freq;if(r<c)return s;}return SERVICE_TYPES[0];})();
    const st=pickState();
    const lh=rand(...svc.lh), lr=rand(145,175)*st.lm;
    const labor=+(lh*lr).toFixed(2), parts=+(rand(...svc.pc)*st.rm).toFixed(2);
    rows.push({
      id:rows.length+1,
      date:dt.toISOString().slice(0,10),
      year:dt.getFullYear(), month:mo+1, monthName:MONTHS[mo],
      quarter:`Q${Math.ceil((mo+1)/3)}`,
      state:st.code, stateName:st.name,
      model:pick(MODELS), vehicleYear:2015+Math.floor(rng()*10),
      mileage:Math.floor(rand(8000,95000)),
      serviceType:svc.type, serviceCategory:svc.cat,
      payType:PAY[svc.cat],
      laborHours:+lh.toFixed(2), laborRate:+lr.toFixed(2),
      laborRevenue:labor, partsRevenue:parts,
      totalRevenue:+(labor+parts).toFixed(2),
      csatScore:+(3.5+rng()*1.5).toFixed(1),
    });
  }
  return rows.sort((a,b)=>a.date.localeCompare(b.date));
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt$ = v=>"$"+Math.round(v).toLocaleString();
const fmtK = v=>v>=1e6?"$"+(v/1e6).toFixed(1)+"M":v>=1000?"$"+(v/1000).toFixed(0)+"K":fmt$(v);
const fmtM = v=>"$"+(v/1e6).toFixed(2)+"M";

// rolling average helper
function addRolling(arr, key, n=3, outKey) {
  return arr.map((item,i)=>{
    const slice=arr.slice(Math.max(0,i-n+1),i+1);
    const avg=slice.reduce((s,r)=>s+r[key],0)/slice.length;
    return {...item,[outKey||`${key}_ra`]:+avg.toFixed(0)};
  });
}

// ── D3 CHOROPLETH ─────────────────────────────────────────────────────────────
function USChoropleth({ stateMap, mapMetric, filterState, setFilterState, getColor, muted, accent }) {
  const svgRef = useRef(null);
  const [geoData, setGeoData]   = useState(null);
  const [topoLib, setTopoLib]   = useState(null);

  useEffect(()=>{
    if(window.topojson){setTopoLib(window.topojson);}
    else{
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
      s.onload=()=>setTopoLib(window.topojson);
      document.head.appendChild(s);
    }
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(r=>r.json()).then(setGeoData).catch(console.error);
  },[]);

  useEffect(()=>{
    if(!geoData||!topoLib||!svgRef.current) return;
    const el=svgRef.current;
    const W=el.clientWidth||720, H=460;
    const svg=d3.select(el);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${W} ${H}`).style("width","100%").style("height","auto");

    const features=topoLib.feature(geoData,geoData.objects.states).features;
    const proj=d3.geoAlbersUsa().fitSize([W,H-50],topoLib.feature(geoData,geoData.objects.states));
    const path=d3.geoPath().projection(proj);

    const g=svg.append("g");
    g.selectAll("path").data(features).join("path")
      .attr("d",path)
      .attr("fill",d=>{ const c=FIPS[String(d.id).padStart(2,"0")]; return c&&stateMap[c]?getColor(c):"#dde8f0"; })
      .attr("stroke","#fff").attr("stroke-width",0.8)
      .attr("opacity",d=>{ const c=FIPS[String(d.id).padStart(2,"0")]; return filterState&&c!==filterState?0.4:1; })
      .style("cursor","pointer")
      .on("mouseenter",function(e,d){
        const c=FIPS[String(d.id).padStart(2,"0")]; if(!c) return;
        d3.select(this).attr("stroke","#444").attr("stroke-width",1.8).raise();
      })
      .on("mouseleave",function(e,d){
        const c=FIPS[String(d.id).padStart(2,"0")];
        d3.select(this).attr("stroke",c===filterState?"#333":"#fff").attr("stroke-width",c===filterState?2:0.8);
      })
      .on("click",function(e,d){
        const c=FIPS[String(d.id).padStart(2,"0")];
        if(c) setFilterState(p=>p===c?null:c);
      })
      .append("title").text(d=>{
        const c=FIPS[String(d.id).padStart(2,"0")]; const s=stateMap[c];
        if(!s) return c||"";
        return `${s.name}\nRevenue: ${fmtM(s.revenue)}\nROs: ${s.ros.toLocaleString()}\nAvg RO: ${fmt$(s.avgRO)}\nCSAT: ${s.csat}`;
      });

    if(filterState){
      g.selectAll("path").filter(d=>FIPS[String(d.id).padStart(2,"0")]===filterState)
        .attr("stroke","#333").attr("stroke-width",2.2).raise();
    }

    // labels
    features.forEach(d=>{
      const c=FIPS[String(d.id).padStart(2,"0")]; if(!c) return;
      const ct=path.centroid(d); if(!ct||isNaN(ct[0])) return;
      const sd=stateMap[c]; if(!sd) return;
      const vals=Object.values(stateMap).map(s=>mapMetric==="revenue"?s.revenue:mapMetric==="ros"?s.ros:s.avgRO);
      const mx=Math.max(...vals), mn=Math.min(...vals);
      const val=mapMetric==="revenue"?sd.revenue:mapMetric==="ros"?sd.ros:sd.avgRO;
      const t=(val-mn)/(mx-mn||1);
      svg.append("text").attr("x",ct[0]).attr("y",ct[1])
        .attr("text-anchor","middle").attr("dominant-baseline","middle")
        .attr("font-size","7.5").attr("font-weight","700")
        .attr("fill",t>0.45?"#fff":"#1a2236").attr("pointer-events","none")
        .text(c);
    });

    // legend — single-hue gradient (dark → light blue)
    const lgW=180, lgX=W-lgW-16, lgY=H-40;
    const defs=svg.append("defs");
    const grad=defs.append("linearGradient").attr("id","choro-lg").attr("x1","0%").attr("x2","100%");
    grad.append("stop").attr("offset","0%").attr("stop-color","#e8f4fd");
    grad.append("stop").attr("offset","100%").attr("stop-color","#0d3b6e");
    svg.append("rect").attr("x",lgX).attr("y",lgY).attr("width",lgW).attr("height",12).attr("rx",3).attr("fill","url(#choro-lg)").attr("stroke","#ccc").attr("stroke-width",0.5);
    svg.append("text").attr("x",lgX).attr("y",lgY-5).attr("font-size",8).attr("fill",muted).text("Low");
    svg.append("text").attr("x",lgX+lgW).attr("y",lgY-5).attr("text-anchor","end").attr("font-size",8).attr("fill",muted).text("High");
    svg.append("text").attr("x",lgX+lgW/2).attr("y",lgY+24).attr("text-anchor","middle").attr("font-size",8).attr("fill",muted)
      .text(mapMetric==="revenue"?"Total Revenue":mapMetric==="ros"?"Repair Orders":"Avg RO Value");

  },[geoData,topoLib,stateMap,mapMetric,filterState]);

  if(!geoData||!topoLib) return <div style={{height:440,display:"flex",alignItems:"center",justifyContent:"center",color:"#6b7a99",fontSize:13}}>Loading map…</div>;
  return <svg ref={svgRef} style={{width:"100%",display:"block"}}/>;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,         setTab]         = useState("overview");
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterYear,  setFilterYear]  = useState("All");
  const [filterState, setFilterState] = useState(null);
  const [mapMetric,   setMapMetric]   = useState("revenue");

  useEffect(()=>{
    setTimeout(()=>{ setData(buildDataset()); setLoading(false); }, 50);
  },[]);

  const filtered = useMemo(()=>data.filter(r=>filterYear==="All"||r.year===+filterYear),[data,filterYear]);

  const stateData = useMemo(()=>{
    const m={};
    filtered.forEach(r=>{
      if(!m[r.state])m[r.state]={code:r.state,name:r.stateName,revenue:0,ros:0,labor:0,parts:0,csat:0,warranty:0};
      m[r.state].revenue+=r.totalRevenue; m[r.state].ros++;
      m[r.state].labor+=r.laborRevenue; m[r.state].parts+=r.partsRevenue;
      m[r.state].csat+=r.csatScore;
      if(r.payType==="Warranty")m[r.state].warranty+=r.totalRevenue;
    });
    return Object.values(m).map(s=>({...s,revenue:+s.revenue.toFixed(0),labor:+s.labor.toFixed(0),parts:+s.parts.toFixed(0),warranty:+s.warranty.toFixed(0),avgRO:+(s.revenue/s.ros).toFixed(0),csat:+(s.csat/s.ros).toFixed(2)})).sort((a,b)=>b.revenue-a.revenue);
  },[filtered]);

  const stateMap = useMemo(()=>Object.fromEntries(stateData.map(s=>[s.code,s])),[stateData]);

  // single-hue blue choropleth
  const getColor = (code)=>{
    const s=stateMap[code]; if(!s) return "#dde8f0";
    const vals=stateData.map(x=>mapMetric==="revenue"?x.revenue:mapMetric==="ros"?x.ros:x.avgRO);
    const mx=Math.max(...vals), mn=Math.min(...vals);
    const val=mapMetric==="revenue"?s.revenue:mapMetric==="ros"?s.ros:s.avgRO;
    const t=(val-mn)/(mx-mn||1);
    // light blue → dark navy
    const r=Math.round(232-t*219), g=Math.round(244-t*185), bv=Math.round(253-t*144);
    return `rgb(${r},${g},${bv})`;
  };

  const kpis = useMemo(()=>{
    if(!filtered.length)return{};
    const tot=filtered.reduce((s,r)=>s+r.totalRevenue,0);
    return{totalRev:tot,laborRev:filtered.reduce((s,r)=>s+r.laborRevenue,0),partsRev:filtered.reduce((s,r)=>s+r.partsRevenue,0),warranty:filtered.filter(r=>r.payType==="Warranty").reduce((s,r)=>s+r.totalRevenue,0),avgRO:tot/filtered.length,avgCSAT:filtered.reduce((s,r)=>s+r.csatScore,0)/filtered.length,ros:filtered.length};
  },[filtered]);

  // monthly with rolling averages
  const monthlyData = useMemo(()=>{
    const m={};
    filtered.forEach(r=>{
      const k=`${r.year}-${String(r.month).padStart(2,"0")}`;
      if(!m[k])m[k]={key:k,label:`${r.monthName} '${String(r.year).slice(2)}`,ros:0,revenue:0,labor:0,parts:0};
      m[k].ros++;m[k].revenue+=r.totalRevenue;m[k].labor+=r.laborRevenue;m[k].parts+=r.partsRevenue;
    });
    const arr=Object.values(m).sort((a,b)=>a.key.localeCompare(b.key)).map(x=>({...x,revenue:+x.revenue.toFixed(0),labor:+x.labor.toFixed(0),parts:+x.parts.toFixed(0)}));
    return addRolling(addRolling(arr,"revenue","rev_ra"),  "ros", 3, "ros_ra");
  },[filtered]);

  const yearlyTrend = useMemo(()=>{
    const m={};
    filtered.forEach(r=>{if(!m[r.year])m[r.year]={year:r.year,ros:0,revenue:0};m[r.year].ros++;m[r.year].revenue+=r.totalRevenue;});
    return Object.values(m).sort((a,b)=>a.year-b.year).map(y=>({...y,revenue:+y.revenue.toFixed(0)}));
  },[filtered]);

  const svcBreakdown = useMemo(()=>{
    const m={};
    filtered.forEach(r=>{if(!m[r.serviceType])m[r.serviceType]={name:r.serviceType,count:0,revenue:0,category:r.serviceCategory};m[r.serviceType].count++;m[r.serviceType].revenue+=r.totalRevenue;});
    return Object.values(m).sort((a,b)=>b.count-a.count).map(s=>({...s,revenue:+s.revenue.toFixed(0),avgRev:+(s.revenue/s.count).toFixed(0)}));
  },[filtered]);

  const payPie = useMemo(()=>{
    const cp=filtered.filter(r=>r.payType==="Customer Pay").reduce((s,r)=>s+r.totalRevenue,0);
    const wp=filtered.filter(r=>r.payType==="Warranty").reduce((s,r)=>s+r.totalRevenue,0);
    return [{name:"Customer Pay",value:+cp.toFixed(0)},{name:"Warranty",value:+wp.toFixed(0)}];
  },[filtered]);

  const modelMix = useMemo(()=>{
    const m={};filtered.forEach(r=>{if(!m[r.model])m[r.model]={model:r.model,count:0,revenue:0};m[r.model].count++;m[r.model].revenue+=r.totalRevenue;});
    return Object.values(m).sort((a,b)=>b.count-a.count).map(x=>({...x,revenue:+x.revenue.toFixed(0)}));
  },[filtered]);

  const seasonalAvg = useMemo(()=>MONTHS.map((mon,i)=>{
    const rows=filtered.filter(r=>r.month===i+1);
    return{month:mon,ros:rows.length,avgRevenue:rows.length?+(rows.reduce((s,r)=>s+r.totalRevenue,0)/rows.length).toFixed(0):0};
  }),[filtered]);

  // weekly rolling for traffic tab
  const weeklyRolling = useMemo(()=>{
    if(!monthlyData.length) return [];
    return addRolling(monthlyData,"ros",6,"ros_ra6");
  },[monthlyData]);

  const forecast = useMemo(()=>{
    if(yearlyTrend.length<2)return[];
    const last=yearlyTrend[yearlyTrend.length-1],prev=yearlyTrend[yearlyTrend.length-2];
    const gr=Math.min(Math.max((last.revenue-prev.revenue)/prev.revenue,0.03),0.15);
    return[2025,2026,2027].map((yr,i)=>({year:yr,revenue:+((last.revenue*Math.pow(1+gr,i+1))).toFixed(0),ros:Math.round(last.ros*Math.pow(1+gr*0.7,i+1)),forecast:true}));
  },[yearlyTrend]);

  const combinedTrend=[...yearlyTrend,...forecast];
  const selectedState=filterState?stateMap[filterState]:null;

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:14,color:"#6b7a99",flexDirection:"column",gap:12}}><div style={{fontSize:32}}>⚙️</div>Generating 50,000 repair orders…</div>;

  const bg="#f0f2f5",card="#fff",border="#dde2ea",accent="#c41230",text="#1a2236",muted="#6b7a99";

  const KPI=({label,value,sub})=>(
    <div style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:"16px 20px",flex:1,minWidth:130}}>
      <div style={{color:muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>
      <div style={{color:text,fontSize:20,fontWeight:700}}>{value}</div>
      {sub&&<div style={{color:muted,fontSize:11,marginTop:3}}>{sub}</div>}
    </div>
  );

  const ChartCard=({title,children,height})=>(
    <div style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:16}}>
      <div style={{fontWeight:600,marginBottom:12,fontSize:11,color:muted,textTransform:"uppercase",letterSpacing:1}}>{title}</div>
      {children}
    </div>
  );

  const TABS=[{id:"overview",l:"📊 Overview"},{id:"map",l:"🗺️ USA Map"},{id:"traffic",l:"🚗 Traffic"},{id:"revenue",l:"💰 Revenue"},{id:"services",l:"🔧 Services"},{id:"forecast",l:"📈 Forecast"},{id:"data",l:"🗃️ Dataset"}];

  return (
    <div style={{background:bg,minHeight:"100vh",color:text,fontFamily:"'Inter',sans-serif",fontSize:13}}>
      <div style={{background:card,borderBottom:`1px solid ${border}`,padding:"14px 24px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{background:accent,borderRadius:6,padding:"4px 10px",fontWeight:700,fontSize:13,color:"#fff"}}>NISSAN</div>
        <span style={{fontWeight:600,fontSize:15}}>Service Lane Intelligence Platform</span>
        <span style={{color:muted,fontSize:11,marginLeft:"auto"}}>50,000 synthetic ROs · 50 US states · 2020–2024</span>
      </div>

      <div style={{padding:"10px 24px",display:"flex",gap:12,borderBottom:`1px solid ${border}`,background:card,alignItems:"center"}}>
        <span style={{color:muted,fontSize:11}}>YEAR</span>
        <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} style={{background:"#f8f9fb",color:text,border:`1px solid ${border}`,borderRadius:6,padding:"4px 10px",fontSize:12}}>
          <option>All</option>{[2020,2021,2022,2023,2024].map(y=><option key={y}>{y}</option>)}
        </select>
        {filterState&&<><span style={{color:accent,fontSize:11,fontWeight:600}}>📍 {stateMap[filterState]?.name}</span><button onClick={()=>setFilterState(null)} style={{background:"#fff1f2",color:accent,border:`1px solid #fca5a5`,borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11}}>✕ Clear</button></>}
        <span style={{color:muted,fontSize:11,marginLeft:"auto"}}>{filtered.length.toLocaleString()} repair orders</span>
      </div>

      <div style={{display:"flex",gap:0,padding:"0 24px",borderBottom:`1px solid ${border}`,background:card}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 15px",border:"none",background:"transparent",color:tab===t.id?accent:muted,borderBottom:tab===t.id?`2px solid ${accent}`:"2px solid transparent",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?600:400}}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{padding:"20px 24px"}}>

        {/* ── OVERVIEW ── */}
        {tab==="overview"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <KPI label="Total Revenue"    value={fmt$(kpis.totalRev)} sub={`${kpis.ros?.toLocaleString()} repair orders`}/>
              <KPI label="Labor Revenue"    value={fmt$(kpis.laborRev)} sub={`${((kpis.laborRev/kpis.totalRev)*100).toFixed(1)}% of total`}/>
              <KPI label="Parts Revenue"    value={fmt$(kpis.partsRev)} sub={`${((kpis.partsRev/kpis.totalRev)*100).toFixed(1)}% of total`}/>
              <KPI label="Warranty Revenue" value={fmt$(kpis.warranty)} sub={`${((kpis.warranty/kpis.totalRev)*100).toFixed(1)}% of total`}/>
              <KPI label="Avg RO Value"     value={fmt$(kpis.avgRO)}    sub="per repair order"/>
              <KPI label="Avg CSAT"         value={kpis.avgCSAT?.toFixed(2)} sub="out of 5.0"/>
            </div>

            <ChartCard title="Monthly Revenue + 3-Month Rolling Average">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={monthlyData}>
                  <defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accent} stopOpacity={0.2}/><stop offset="95%" stopColor={accent} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/>
                  <XAxis dataKey="label" tick={{fill:muted,fontSize:8}} interval={5}/>
                  <YAxis tick={{fill:muted,fontSize:9}} tickFormatter={fmtK}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Area type="monotone" dataKey="revenue" stroke={accent} fill="url(#rv)" strokeWidth={1.5} name="Monthly Revenue" dot={false}/>
                  <Line type="monotone" dataKey="rev_ra" stroke="#1a3a5c" strokeWidth={2.5} dot={false} name="3-Mo Rolling Avg" strokeDasharray="0"/>
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <ChartCard title="Revenue Mix (Labor vs Parts)">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={[{name:"Labor",value:+kpis.laborRev?.toFixed(0)},{name:"Parts",value:+kpis.partsRev?.toFixed(0)}]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:muted}}><Cell fill={accent}/><Cell fill="#1a3a5c"/></Pie><Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/></PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Top 10 States by Revenue">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stateData.slice(0,10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={border}/>
                    <XAxis type="number" tick={{fill:muted,fontSize:9}} tickFormatter={v=>"$"+(v/1e6).toFixed(1)+"M"}/>
                    <YAxis dataKey="name" type="category" tick={{fill:muted,fontSize:9}} width={105}/>
                    <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/>
                    <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]}>{stateData.slice(0,10).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── MAP ── */}
        {tab==="map"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{color:muted,fontSize:11,fontWeight:600}}>METRIC:</span>
              {[["revenue","💰 Total Revenue"],["ros","🚗 Repair Orders"],["avgRO","📋 Avg RO Value"]].map(([k,l])=>(
                <button key={k} onClick={()=>setMapMetric(k)} style={{padding:"6px 16px",border:`1.5px solid ${mapMetric===k?accent:border}`,borderRadius:20,background:mapMetric===k?accent:"#fff",color:mapMetric===k?"#fff":muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
              <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:16}}>
                <USChoropleth stateMap={stateMap} mapMetric={mapMetric} filterState={filterState} setFilterState={setFilterState} getColor={getColor} muted={muted} accent={accent}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {selectedState?(
                  <div style={{background:"#fff5f5",border:`1.5px solid #fca5a5`,borderRadius:10,padding:16}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:accent}}>📍 {selectedState.name}</div>
                    {[["Total Revenue",fmtM(selectedState.revenue)],["Repair Orders",selectedState.ros.toLocaleString()],["Avg RO Value",fmt$(selectedState.avgRO)],["Labor Revenue",fmtM(selectedState.labor)],["Parts Revenue",fmtM(selectedState.parts)],["Warranty Rev.",fmtM(selectedState.warranty)],["Avg CSAT",selectedState.csat+"/5.0"]].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid #fde8e8`,fontSize:12}}>
                        <span style={{color:muted}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{background:"#f8f9fb",border:`1px solid ${border}`,borderRadius:10,padding:20,fontSize:11,color:muted,textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:8}}>🗺️</div>
                    Hover for tooltip · Click to pin state
                  </div>
                )}
                <div style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:16,flex:1}}>
                  <div style={{fontWeight:600,marginBottom:10,fontSize:11,color:muted,textTransform:"uppercase",letterSpacing:1}}>Top 10 — {mapMetric==="revenue"?"Revenue":mapMetric==="ros"?"ROs":"Avg RO"}</div>
                  {[...stateData].sort((a,b)=>mapMetric==="avgRO"?b.avgRO-a.avgRO:mapMetric==="ros"?b.ros-a.ros:b.revenue-a.revenue).slice(0,10).map((s,i)=>{
                    const val=mapMetric==="avgRO"?s.avgRO:mapMetric==="ros"?s.ros:s.revenue;
                    const topVal=[...stateData].sort((a,b)=>mapMetric==="avgRO"?b.avgRO-a.avgRO:mapMetric==="ros"?b.ros-a.ros:b.revenue-a.revenue)[0];
                    const tv=mapMetric==="avgRO"?topVal.avgRO:mapMetric==="ros"?topVal.ros:topVal.revenue;
                    return(
                      <div key={s.code} onClick={()=>setFilterState(p=>p===s.code?null:s.code)} style={{cursor:"pointer",marginBottom:9}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:11}}>
                          <span style={{color:filterState===s.code?accent:text,fontWeight:filterState===s.code?700:400}}>{i+1}. {s.name}</span>
                          <span style={{color:muted,fontSize:10}}>{mapMetric==="ros"?val.toLocaleString():mapMetric==="avgRO"?fmt$(val):fmtM(val)}</span>
                        </div>
                        <div style={{background:"#e8edf5",borderRadius:3,height:4}}><div style={{background:filterState===s.code?accent:getColor(s.code),height:4,borderRadius:3,width:`${(val/tv)*100}%`}}/></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <ChartCard title={`Top 20 States — ${mapMetric==="revenue"?"Revenue":mapMetric==="ros"?"Repair Orders":"Avg RO Value"}`}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...stateData].sort((a,b)=>mapMetric==="avgRO"?b.avgRO-a.avgRO:mapMetric==="ros"?b.ros-a.ros:b.revenue-a.revenue).slice(0,20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/>
                  <XAxis dataKey="code" tick={{fill:muted,fontSize:9}}/>
                  <YAxis tick={{fill:muted,fontSize:9}} tickFormatter={v=>mapMetric==="ros"?v.toLocaleString():fmtK(v)}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>mapMetric==="ros"?v.toLocaleString():fmt$(v)}/>
                  <Bar dataKey={mapMetric==="avgRO"?"avgRO":mapMetric==="ros"?"ros":"revenue"} name={mapMetric==="revenue"?"Revenue":mapMetric==="ros"?"ROs":"Avg RO"} radius={[3,3,0,0]}>
                    {[...stateData].sort((a,b)=>mapMetric==="avgRO"?b.avgRO-a.avgRO:mapMetric==="ros"?b.ros-a.ros:b.revenue-a.revenue).slice(0,20).map((s,i)=><Cell key={i} fill={getColor(s.code)}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* ── TRAFFIC ── */}
        {tab==="traffic"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[["Total ROs",filtered.length.toLocaleString(),"across all states"],["Avg Daily ROs",(filtered.length/(365*5)).toFixed(1),"per day"],["Peak Month",(()=>{const b=seasonalAvg.reduce((a,b)=>b.ros>a.ros?b:a,seasonalAvg[0]);return b.month;})(),"highest traffic"],["Top State",stateData[0]?.name||"—",`${stateData[0]?.ros?.toLocaleString()||0} ROs`],["Top Model",modelMix[0]?.model||"—",`${modelMix[0]?.count?.toLocaleString()||0} ROs`]].map(([l,v,s])=><KPI key={l} label={l} value={v} sub={s}/>)}
            </div>

            <ChartCard title="Monthly RO Volume + 3-Month & 6-Month Rolling Averages">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={weeklyRolling}>
                  <defs><linearGradient id="ro2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4d7ab5" stopOpacity={0.3}/><stop offset="95%" stopColor="#4d7ab5" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/>
                  <XAxis dataKey="label" tick={{fill:muted,fontSize:8}} interval={5}/>
                  <YAxis tick={{fill:muted,fontSize:9}}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Area type="monotone" dataKey="ros" stroke="#4d7ab5" fill="url(#ro2)" strokeWidth={1} name="Monthly ROs" dot={false}/>
                  <Line type="monotone" dataKey="ros_ra" stroke="#c41230" strokeWidth={2} dot={false} name="3-Mo Rolling Avg"/>
                  <Line type="monotone" dataKey="ros_ra6" stroke="#1a3a5c" strokeWidth={2} dot={false} strokeDasharray="5 3" name="6-Mo Rolling Avg"/>
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <ChartCard title="Seasonal Traffic Pattern (All Years Combined)">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={seasonalAvg}>
                    <CartesianGrid strokeDasharray="3 3" stroke={border}/><XAxis dataKey="month" tick={{fill:muted,fontSize:9}}/><YAxis tick={{fill:muted,fontSize:9}}/>
                    <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}}/>
                    <Bar dataKey="ros" name="ROs" radius={[4,4,0,0]}>{seasonalAvg.map((_,i)=><Cell key={i} fill={i>=4&&i<=7?"#e8a020":"#1a3a5c"}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{fontSize:10,color:muted,marginTop:6}}>🟡 Summer peak months highlighted</div>
              </ChartCard>
              <ChartCard title="ROs by Vehicle Model">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={modelMix} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={border}/><XAxis type="number" tick={{fill:muted,fontSize:9}}/><YAxis dataKey="model" type="category" tick={{fill:muted,fontSize:9}} width={70}/>
                    <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}}/>
                    <Bar dataKey="count" name="ROs" radius={[0,4,4,0]}>{modelMix.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Top 20 States — Repair Order Volume">
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={stateData.slice(0,20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/><XAxis dataKey="code" tick={{fill:muted,fontSize:9}}/><YAxis tick={{fill:muted,fontSize:9}}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}}/>
                  <Bar dataKey="ros" name="Repair Orders" radius={[4,4,0,0]}>{stateData.slice(0,20).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* ── REVENUE ── */}
        {tab==="revenue"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <ChartCard title="Monthly Labor vs Parts + 3-Month Rolling Averages">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthlyData}>
                  <defs>
                    <linearGradient id="lb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accent} stopOpacity={0.3}/><stop offset="95%" stopColor={accent} stopOpacity={0}/></linearGradient>
                    <linearGradient id="pt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a3a5c" stopOpacity={0.3}/><stop offset="95%" stopColor="#1a3a5c" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/>
                  <XAxis dataKey="label" tick={{fill:muted,fontSize:8}} interval={5}/>
                  <YAxis tick={{fill:muted,fontSize:9}} tickFormatter={fmtK}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                  <Area type="monotone" dataKey="labor" stroke={accent} fill="url(#lb)" strokeWidth={1} name="Labor" dot={false}/>
                  <Area type="monotone" dataKey="parts" stroke="#1a3a5c" fill="url(#pt)" strokeWidth={1} name="Parts" dot={false}/>
                  <Line type="monotone" dataKey="rev_ra" stroke="#e8a020" strokeWidth={2.5} dot={false} name="Total 3-Mo RA"/>
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <ChartCard title="Customer Pay vs Warranty">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={payPie} cx="50%" cy="50%" outerRadius={78} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(1)}%`} labelLine={{stroke:muted}}><Cell fill={accent}/><Cell fill="#1a3a5c"/></Pie><Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/></PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Avg RO Value — Top 15 States">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...stateData].sort((a,b)=>b.avgRO-a.avgRO).slice(0,15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={border}/><XAxis dataKey="code" tick={{fill:muted,fontSize:9}}/><YAxis tick={{fill:muted,fontSize:9}} tickFormatter={v=>fmt$(v)}/>
                    <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/>
                    <Bar dataKey="avgRO" name="Avg RO Value" fill="#e8a020" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab==="services"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <ChartCard title="Service Type Frequency">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={svcBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/><XAxis type="number" tick={{fill:muted,fontSize:9}}/><YAxis dataKey="name" type="category" tick={{fill:muted,fontSize:9}} width={165}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}}/>
                  <Bar dataKey="count" name="# of ROs" radius={[0,4,4,0]}>{svcBreakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:16,overflowX:"auto"}}>
              <div style={{fontWeight:600,marginBottom:12,fontSize:11,color:muted,textTransform:"uppercase",letterSpacing:1}}>Service Revenue Summary</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:`1px solid ${border}`}}>{["Service Type","Category","# ROs","Total Revenue","Avg RO Value"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:muted,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                <tbody>{svcBreakdown.map((s,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${border}`,background:i%2===0?"#fff":"#f8f9fb"}}>
                    <td style={{padding:"8px 12px"}}>{s.name}</td>
                    <td style={{padding:"8px 12px"}}><span style={{background:s.category==="Warranty"?"#eff6ff":s.category==="Repair"?"#fff1f2":"#f0fdf4",color:s.category==="Warranty"?"#1d4ed8":s.category==="Repair"?"#be123c":"#15803d",borderRadius:4,padding:"2px 8px",fontSize:10}}>{s.category}</span></td>
                    <td style={{padding:"8px 12px"}}>{s.count.toLocaleString()}</td>
                    <td style={{padding:"8px 12px"}}>{fmt$(s.revenue)}</td>
                    <td style={{padding:"8px 12px",color:"#b45309",fontWeight:600}}>{fmt$(s.avgRev)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FORECAST ── */}
        {tab==="forecast"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"#fff7ed",border:`1px solid #fed7aa`,borderRadius:10,padding:"12px 16px",fontSize:12,color:"#92400e"}}>⚡ Forecast uses trailing CAGR from 2020–2024 with a 0.7x dampening factor on RO volume. Indicative only.</div>
            <ChartCard title="Revenue Forecast 2025–2027">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={combinedTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={border}/><XAxis dataKey="year" tick={{fill:muted,fontSize:11}}/><YAxis tick={{fill:muted,fontSize:9}} tickFormatter={v=>"$"+(v/1e6).toFixed(1)+"M"}/>
                  <Tooltip contentStyle={{background:card,border:`1px solid ${border}`,fontSize:11}} formatter={v=>fmt$(v)}/>
                  <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>{combinedTrend.map((d,i)=><Cell key={i} fill={d.forecast?"#d97706":accent}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:16,marginTop:8,fontSize:11,color:muted}}><span><span style={{color:accent}}>■</span> Actuals</span><span><span style={{color:"#d97706"}}>■</span> Forecast</span></div>
            </ChartCard>
            <div style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:16,overflowX:"auto"}}>
              <div style={{fontWeight:600,marginBottom:12,fontSize:11,color:muted,textTransform:"uppercase",letterSpacing:1}}>Forecast Summary</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:`1px solid ${border}`}}>{["Year","Revenue","ROs","YoY Growth","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:muted,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                <tbody>{combinedTrend.map((d,i)=>{const prev=combinedTrend[i-1];const gr=prev?((d.revenue-prev.revenue)/prev.revenue*100).toFixed(1):"—";return(
                  <tr key={i} style={{borderBottom:`1px solid ${border}`}}>
                    <td style={{padding:"8px 12px",fontWeight:600}}>{d.year}</td>
                    <td style={{padding:"8px 12px",color:d.forecast?"#d97706":text}}>{fmt$(d.revenue)}</td>
                    <td style={{padding:"8px 12px"}}>{d.ros?.toLocaleString()}</td>
                    <td style={{padding:"8px 12px",color:"#15803d"}}>{gr!=="—"?`+${gr}%`:gr}</td>
                    <td style={{padding:"8px 12px"}}><span style={{background:d.forecast?"#fff7ed":"#f0fdf4",color:d.forecast?"#92400e":"#166534",borderRadius:4,padding:"2px 8px",fontSize:10}}>{d.forecast?"Forecast":"Actual"}</span></td>
                  </tr>
                );})}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DATASET ── */}
        {tab==="data"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"#f0fdf4",border:`1px solid #86efac`,borderRadius:10,padding:"12px 16px",fontSize:12,color:"#166534"}}>✅ Showing first 100 of {filtered.length.toLocaleString()} records · 50,000 total ROs · Regional labor rate multipliers applied</div>
            <div style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:16,overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,whiteSpace:"nowrap"}}>
                <thead><tr style={{borderBottom:`1px solid ${border}`}}>{["ID","Date","State","Model","Yr","Miles","Service Type","Category","Pay Type","Labor Hrs","Labor $","Parts $","Total $","CSAT"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 10px",color:muted,fontWeight:600,fontSize:10}}>{h}</th>)}</tr></thead>
                <tbody>{filtered.slice(0,100).map((r,i)=>(
                  <tr key={r.id} style={{borderBottom:`1px solid ${border}`,background:i%2===0?"#fff":"#f8f9fb"}}>
                    <td style={{padding:"5px 10px",color:muted}}>{r.id}</td>
                    <td style={{padding:"5px 10px"}}>{r.date}</td>
                    <td style={{padding:"5px 10px",color:accent,fontWeight:600}}>{r.state}</td>
                    <td style={{padding:"5px 10px"}}>{r.model}</td>
                    <td style={{padding:"5px 10px"}}>{r.vehicleYear}</td>
                    <td style={{padding:"5px 10px"}}>{r.mileage.toLocaleString()}</td>
                    <td style={{padding:"5px 10px"}}>{r.serviceType}</td>
                    <td style={{padding:"5px 10px"}}><span style={{background:r.serviceCategory==="Warranty"?"#eff6ff":r.serviceCategory==="Repair"?"#fff1f2":"#f0fdf4",color:r.serviceCategory==="Warranty"?"#1d4ed8":r.serviceCategory==="Repair"?"#be123c":"#15803d",borderRadius:3,padding:"1px 6px",fontSize:10}}>{r.serviceCategory}</span></td>
                    <td style={{padding:"5px 10px"}}>{r.payType}</td>
                    <td style={{padding:"5px 10px"}}>{r.laborHours}</td>
                    <td style={{padding:"5px 10px"}}>{fmt$(r.laborRevenue)}</td>
                    <td style={{padding:"5px 10px"}}>{fmt$(r.partsRevenue)}</td>
                    <td style={{padding:"5px 10px",color:accent,fontWeight:600}}>{fmt$(r.totalRevenue)}</td>
                    <td style={{padding:"5px 10px",color:r.csatScore>=4.5?"#15803d":r.csatScore>=4?"#b45309":"#be123c"}}>{r.csatScore}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
