import React, { useMemo, useRef, useState, useEffect } from "react";

/** PM Management App — PERFECTUS (Deps + Arrows + Group Nudge + OB + Master Check + MVP)
 * - Week labels: 1W, 2W, ... (+ solda 1 boş kolon)
 * - Zoom +/- and Fit
 * - Dependency blok hareketi (drag/drop, swap, nudge)
 * - Arrows: source center -> target top-center (gap)
 * - Onboarding: FE/BE/QA base üstüne çıkarsa +6 hafta; kartta üstte "OnB" rozeti ve altta "+ OB"
 * - Master checkbox: sadece ikon (yazı yok) — Timeline, Modules, MVP
 * - MVP tab: yatay wrap’lı kutucuklar; tikler enabled ile senkron
 */

// ====== Seed ======
const seedFromEstimates = [
  { name: 'CRM', duration: 4, fe: 1, be: 1, qa: 1, desc: 'Customer/segment, campaign management, ticketing basic flow' },
  { name: 'GAMIFICATION', duration: 4, fe: 1, be: 1, qa: 1, desc: 'Points, badges, leaderboards, event hooks' },
  { name: 'BONUS MANAGEMENT CASINO', duration: 5, fe: 1, be: 1, qa: 1, desc: 'Free spins, bonus wallet, rollover rules' },
  { name: 'BASIC SPORTSBOOK', duration: 10, fe: 2, be: 3, qa: 2, desc: 'Odds feed, market/settlement, bet slip (basic)' },
  { name: 'BASIC EXCHANGE', duration: 6, fe: 1, be: 2, qa: 1, desc: 'Wallet/currency conversion, limits' },
  { name: 'CUSTOMIZED PLAYER FE', duration: 6, fe: 2, be: 0, qa: 1, desc: 'Personalized player-facing FE (profile, wallet)' },
  { name: 'BASIC BONUS MANAGEMENT SPORTSBOOK', duration: 4, fe: 1, be: 1, qa: 1, desc: 'Bet bonuses, freebets, simple condition engine' },
  { name: 'BASIC RISK CONTROL SPORTSBOOK', duration: 4, fe: 0, be: 2, qa: 1, desc: 'Limit/pattern rules, simple watchlist' },
  { name: 'DEPLOYMENTS', duration: 2, fe: 0, be: 1, qa: 1, desc: 'CI/CD pipeline, staging to production transitions' },
  { name: 'CREATE NEW DEV ENV', duration: 2, fe: 0, be: 1, qa: 0, desc: 'Infrastructure setup, staging environment, basic monitoring' },
  { name: 'RGS', duration: 8, fe: 0, be: 3, qa: 2, desc: 'Remote Game Server: catalog, sessions, RTP reports' },
  { name: 'PAYMENT INTEGRATION', duration: 3, fe: 0, be: 2, qa: 1, desc: '1–2 PSPs, deposit/withdrawal, webhooks' },
  { name: 'CASINO AGGREGATOR INTEGRATION', duration: 4, fe: 0, be: 2, qa: 1, desc: 'Lobby integration, providers, game launch, callbacks' },
  { name: 'SMS MODULE INTEGRATIONS', duration: 1, fe: 0, be: 1, qa: 1, desc: 'Single provider integration, OTP/notification flow' },
  { name: 'AFFILIATE SYSTEM', duration: 5, fe: 1, be: 2, qa: 1, desc: 'Referral links, multi-tier commission, reporting' },
  { name: 'AGENT SYSTEM', duration: 5, fe: 1, be: 2, qa: 1, desc: 'Sub-agent hierarchy, commission handling, reports' },
];

const palette = ['#e67e22','#27ae60','#8e44ad','#2c3e50','#16a085','#2980b9','#d35400','#7f8c8d','#c0392b','#9b59b6','#34495e','#f39c12'];
const sampleModules = seedFromEstimates.map((m, i) => ({
  id: i + 1,
  name: m.name.toUpperCase(),
  duration: m.duration,
  baseDuration: m.duration,
  fe: m.fe, be: m.be, qa: m.qa,
  baseFe: m.fe, baseBe: m.be, baseQa: m.qa,
  color: palette[i % palette.length],
  desc: m.desc,
  deps: [],
}));

// ====== Layout ======
const DEFAULT_COL_W = 40;
const ROW_H = 80;
const BAR_H = 80;
const HDR_H = 48;

// ====== Utils ======
function scaleDuration({ baseDuration, baseFe, baseBe, baseQa, fe, be, qa }) {
  const baseDur = Math.max(1, Number(baseDuration ?? 1) || 1);
  const baseTot = Math.max(1, (Number(baseFe)||0) + (Number(baseBe)||0) + (Number(baseQa)||0));
  const curTot  = Math.max(1, (Number(fe)||0) + (Number(be)||0) + (Number(qa)||0));
  const adjusted = Math.round(baseDur * (baseTot / curTot));
  return Math.max(1, adjusted);
}
function textColorFor(bg){
  try{
    const hex = bg?.replace('#','');
    if (!hex || (hex.length!==6 && hex.length!==3)) return '#fff';
    const h = hex.length===3 ? hex.split('').map(ch=>ch+ch).join('') : hex;
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const yiq = (r*299 + g*587 + b*114)/1000;
    return yiq >= 160 ? '#111827' : '#fff';
  }catch{ return '#fff'; }
}
function formatRes(m){
  return [ m.fe>0 ? `${m.fe} FE` : null,
           m.be>0 ? `${m.be} BE` : null,
           m.qa>0 ? `${m.qa} QA` : null ]
         .filter(Boolean).join(' • ');
}

// --- Onboarding helpers ---
const ONBOARDING_WEEKS = 6;
function hasOnboarding(m){
  return (Number(m.fe) > Number(m.baseFe)) ||
         (Number(m.be) > Number(m.baseBe)) ||
         (Number(m.qa) > Number(m.baseQa));
}

export default function Home() {
    return <DevGantt modules={sampleModules} />;

}
// ====== Self Tests (küçük güvence) ======
function runSelfTests(){
// const tests = [];
 // tests.push({ name: 'Normalization ok', pass: sampleModules.every(m => m.baseDuration && (m.baseFe!==undefined) && (m.baseBe!==undefined) && (m.baseQa!==undefined)), details: '' });
 // tests.push({ name: 'scaleDuration identity', pass: scaleDuration({baseDuration: 6, baseFe:1, baseBe:1, baseQa:1, fe:1, be:1, qa:1}) === 6, details: '' });
 // tests.push({ name: 'scaleDuration double team', pass: scaleDuration({baseDuration: 6, baseFe:1, baseBe:1, baseQa:1, fe:2, be:2, qa:2}) === 3, details: '' });
 // return tests;
}
function SelfTests(){
//  const [results] = useState(runSelfTests());
 // const allPass = results.every(r => r.pass);
 // return (
 //   <div style={{marginTop:8, fontSize:12, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, background: allPass? '#f0fdf4' : '#fff7ed'}}>
 //     <strong>Self-tests:</strong>
 //     <ul style={{margin:'6px 0 0 16px'}}>
  //      {results.map((r,i)=> (
   //       <li key={i} style={{color: r.pass? '#166534' : '#b45309'}}>
    //        {r.pass ? '✓' : '✗'} {r.name}
     //     </li>
     //   ))}
    //  </ul>
   // </div>
 // );
}

function DevGantt({ modules: initialModules = [] }){
  const seed = Array.isArray(initialModules) ? initialModules : [];

  const [modules, setModules] = useState(() => seed.map(m => ({
    ...m,
    baseDuration: m.baseDuration ?? m.duration ?? 1,
    baseFe: m.baseFe ?? m.fe ?? 0,
    baseBe: m.baseBe ?? m.be ?? 0,
    baseQa: m.baseQa ?? m.qa ?? 0,
    deps: Array.isArray(m.deps) ? m.deps : [],
  })));
  const [enabled, setEnabled] = useState(() => Object.fromEntries(seed.map(m => [m.id, true])));
  const [order, setOrder] = useState(seed.map(m => m.id));
  const [tab, setTab] = useState('timeline'); // 'timeline' | 'modules' | 'mvp'
  const [offsets, setOffsets] = useState({});
  const [swapId, setSwapId] = useState(null);
  const [colW, setColW] = useState(DEFAULT_COL_W);

  const modulesById = useMemo(() => new Map(modules.map(m => [m.id, m])), [modules]);
  const ordered = useMemo(() => order.map(id => modulesById.get(id)).filter(Boolean), [order, modulesById]);
  const enabledOrdered = useMemo(() => ordered.filter(m => enabled[m.id]), [ordered, enabled]);

  // Build adjacency (undirected for grouping)
  const adjacency = useMemo(() => {
    const adj = new Map(modules.map(m => [m.id, new Set()]));
    modules.forEach(m => {
      (m.deps||[]).forEach(d => { if (adj.has(m.id) && adj.has(d)) { adj.get(m.id).add(d); adj.get(d).add(m.id); } });
    });
    return adj;
  }, [modules]);

  function getConnectedIds(startId){
    const seen = new Set();
    const stack = [startId];
    while(stack.length){
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      const nbrs = adjacency.get(id) || new Set();
      nbrs.forEach(n => { if (!seen.has(n)) stack.push(n); });
    }
    return Array.from(seen);
  }
  function buildComponents(orderArr){
    const visited = new Set();
    const comps = [];
    orderArr.forEach(id => {
      if (visited.has(id)) return;
      const comp = getConnectedIds(id);
      comp.forEach(x => visited.add(x));
      const orderedComp = orderArr.filter(x => comp.includes(x));
      comps.push(orderedComp);
    });
    return comps;
  }
  function componentOfId(orderArr, id){
    const comps = buildComponents(orderArr);
    for (const c of comps) if (c.includes(id)) return c;
    return [id];
  }
  function moveBlock(orderArr, blockIds, toIndex){
    const rest = orderArr.filter(x => !blockIds.includes(x));
    const idx = Math.max(0, Math.min(toIndex, rest.length));
    const head = rest.slice(0, idx);
    const tail = rest.slice(idx);
    return [...head, ...blockIds, ...tail];
  }

  // Duration with OB fix
  const calcDuration = (m) => {
    const scaled = scaleDuration({
      baseDuration: m.baseDuration,
      baseFe: m.baseFe,
      baseBe: m.baseBe,
      baseQa: m.baseQa,
      fe: m.fe, be: m.be, qa: m.qa,
    });
    const core = hasOnboarding(m) ? Math.max(m.baseDuration, scaled) : scaled;
    return core + (hasOnboarding(m) ? ONBOARDING_WEEKS : 0);
  };

  const positioned = useMemo(() => {
    let start = 0;
    let cumulativeShift = 0;
    return enabledOrdered.map(m => {
      const duration = calcDuration(m);
      const ownShift = Number(offsets[m.id] || 0);
      cumulativeShift += ownShift;
      const p = { ...m, start: start + cumulativeShift, duration };
      start += duration;
      return p;
    });
  }, [enabledOrdered, offsets]);

  const totalWeeks = useMemo(() => {
    if (!positioned.length) return 1;
    const maxEnd = positioned.reduce((mx, m) => Math.max(mx, m.start + m.duration), 0);
    return Math.max(1, Math.ceil(maxEnd));
  }, [positioned]);

  // WEEK LABELS: başa boş kolon
  const weekLabels = useMemo(
    () => Array.from({ length: totalWeeks + 1 }, (_, i) => (i === 0 ? '' : `${i}W`)),
    [totalWeeks]
  );

  // Actions
  function updateModule(id, patch){ setModules(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m)); }
  function toggleEnabled(id){ setEnabled(prev => ({ ...prev, [id]: !prev[id] })); }
  function setAllEnabled(val){ setEnabled(Object.fromEntries(modules.map(m => [m.id, !!val]))); }

  function addModule(){
    setModules(prev => {
      const maxId = prev.reduce((mx, x) => Math.max(mx, x.id||0), 0);
      const newId = maxId + 1;
      const color = palette[(prev.length) % palette.length];
      const newM = {
        id: newId,
        name: 'NEW MODULE',
        duration: 2,
        fe: 1, be: 1, qa: 1,
        color,
        desc: 'Describe this module...',
        baseDuration: 2,
        baseFe: 1, baseBe: 1, baseQa: 1,
        deps: [],
      };
      setOrder(o => [...o, newId]);
      setEnabled(en => ({ ...en, [newId]: true }));
      return [...prev, newM];
    });
  }

  function deleteModule(id){
    const m = modulesById.get(id);
    if (!m) return;
    if (typeof window !== 'undefined' && !window.confirm(`Delete module "${m.name}"?`)) return;
    setModules(prev => prev.filter(x => x.id !== id));
    setOrder(prev => prev.filter(x => x !== id));
    setEnabled(prev => { const { [id]: _, ...rest } = prev; return rest; });
    setOffsets(prev => { const { [id]: _, ...rest } = prev; return rest; });
    setSwapId(prev => (prev === id ? null : prev));
  }

  // Reorder & swap (bloklar)
  function swapTwo(aId, bId){
    if (!aId || !bId || aId === bId) return;
    setOrder(prev => {
      const blocks = [];
      const seen = new Set();
      for (let i = 0; i < prev.length; i++){
        const id = prev[i];
        if (seen.has(id)) continue;
        const comp = componentOfId(prev, id);
        comp.forEach(x => seen.add(x));
        blocks.push(comp);
      }
      const ia = blocks.findIndex(b => b.includes(aId));
      const ib = blocks.findIndex(b => b.includes(bId));
      if (ia < 0 || ib < 0 || ia === ib) return prev;
      const nextBlocks = [...blocks];
      [nextBlocks[ia], nextBlocks[ib]] = [nextBlocks[ib], nextBlocks[ia]];
      return nextBlocks.flat();
    });
  }

  const dragIdRef = useRef(null);
  function onDragStart(id){ dragIdRef.current = id; }
  function onDragOver(e){ e.preventDefault(); }
  function onDrop(overId){
    const draggedId = dragIdRef.current;
    dragIdRef.current = null;
    if (!draggedId || draggedId === overId) return;
    setOrder(prev => {
      const draggedBlock = componentOfId(prev, draggedId);
      const overBlock    = componentOfId(prev, overId);
      const rest = prev.filter(x => !draggedBlock.includes(x));
      const insertIdx = rest.indexOf(overBlock[0]);
      return moveBlock(rest, draggedBlock, insertIdx < 0 ? rest.length : insertIdx);
    });
  }

  // Group nudge (←/→)
  function nudgeGroupFrom(id, dw){
    if (!dw) return;
    const ids = getConnectedIds(id);
    setOffsets(prev => {
      const next = { ...prev };
      ids.forEach(k => { next[k] = (next[k]||0) + dw; });
      return next;
    });
  }

  function handleSwapClick(targetId){
    if (!swapId) { setSwapId(targetId); return; }
    if (swapId === targetId) { setSwapId(null); return; }
    swapTwo(swapId, targetId);
    setSwapId(null);
  }

  useEffect(() => {
    function onKey(e){
      if (!swapId) return;
      if (e.key === 'ArrowLeft'){ e.preventDefault(); nudgeGroupFrom(swapId, -1); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); nudgeGroupFrom(swapId, +1); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [swapId, adjacency]);

  // Zoom + Fit
  function zoom(delta){ setColW(w => Math.max(24, Math.min(120, Math.round((w+delta)/2)*2))); }
  function fitToScreen(){
    if (!positioned.length) return;
    const container = document.querySelector('.timeline-container');
    if (!container) return;
    const availableWidth = container.clientWidth;
    const weeks = totalWeeks || 1;
    const newColW = Math.max(24, Math.floor(availableWidth / weeks));
    setColW(newColW);
  }
  function alignDependencies(){
    const visited = new Set();
    const components = [];
    order.forEach(id => {
      if (visited.has(id)) return;
      const comp = getConnectedIds(id);
      comp.forEach(x => visited.add(x));
      const compOrdered = order.filter(x => comp.includes(x));
      components.push(compOrdered);
    });
    const newOrder = components.flat();
    setOrder(newOrder);
  }

  // Master check state (ortak)
  const allChecked = useMemo(() => ordered.every(m => !!enabled[m.id]), [ordered, enabled]);
  const someChecked = useMemo(
    () => ordered.some(m => !!enabled[m.id]) && !allChecked,
    [ordered, enabled, allChecked]
  );

  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial', background: '#fff', color: '#111827', padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <Tab active={tab==='timeline'} onClick={()=>setTab('timeline')}>Timeline</Tab>
        <Tab active={tab==='modules'} onClick={()=>setTab('modules')}>Modules</Tab>
        <Tab active={tab==='mvp'} onClick={()=>setTab('mvp')}>MVP</Tab>
        <div style={{ marginLeft: 'auto', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>zoom(-6)} title="Zoom out" style={iconBtn()}>−</button>
          <button onClick={()=>zoom(+6)} title="Zoom in" style={iconBtn()}>+</button>
          <button onClick={fitToScreen} title="Fit to screen" style={iconBtn()}>⤢</button>
          <button onClick={alignDependencies} title="Align dependencies" style={iconBtn()}>⤳</button>
          <div style={{ fontWeight: 800, marginLeft: 8 }}>Total: {totalWeeks} weeks</div>
        </div>
      </div>

      {tab === 'timeline' ? (
        <TimelineView
          weekLabels={weekLabels}
          ordered={ordered}
          enabled={enabled}
          positioned={positioned}
          swapId={swapId}
          onSwapClick={handleSwapClick}
          onToggle={toggleEnabled}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNudge={nudgeGroupFrom}
          colW={colW}
          onToggleAll={setAllEnabled}
          someChecked={someChecked}
          allChecked={allChecked}
        />
      ) : tab === 'modules' ? (
        <ModulesEditor
          ordered={ordered}
          enabled={enabled}
          swapId={swapId}
          onSwapClick={handleSwapClick}
          onToggle={toggleEnabled}
          onChange={updateModule}
          calcDuration={calcDuration}
          onAdd={addModule}
          onDelete={deleteModule}
          onToggleAll={setAllEnabled}
          someChecked={someChecked}
          allChecked={allChecked}
        />
      ) : (
        <MVPGrid
          ordered={ordered}
          enabled={enabled}
          onToggle={toggleEnabled}
          onToggleAll={setAllEnabled}
          someChecked={someChecked}
          allChecked={allChecked}
        />
      )}

      <SelfTests />
    </div>
  );
}

function TimelineView({ weekLabels, ordered, enabled, positioned, swapId, onSwapClick, onToggle, onDragStart, onDragOver, onDrop, onNudge, colW, onToggleAll, someChecked, allChecked }){
  const sidebarWidth = 180;
  const gridWidth = Math.max(weekLabels.length * colW, colW);
  const gridHeight = positioned.length * ROW_H + HDR_H;

  const draggingRef = useRef(null);
  const [isGrabbing, setIsGrabbing] = useState(false);

  useEffect(() => {
    function onMove(e){ if (!draggingRef.current) return; e.preventDefault(); }
    function onUp(e){
      if (!draggingRef.current) return;
      const { id, startX } = draggingRef.current;
      const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const dx = clientX - startX;
      const dw = Math.round(dx / colW);
      draggingRef.current = null; setIsGrabbing(false);
      if (dw) onNudge?.(id, dw);
    }
    window.addEventListener('mousemove', onMove, { passive:false });
    window.addEventListener('mouseup', onUp, { passive:false });
    window.addEventListener('touchmove', onMove, { passive:false });
    window.addEventListener('touchend', onUp, { passive:false });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onNudge, colW]);

  // Sola kaçmayı engelle
  const clampShift = useMemo(() => {
    if (!positioned.length) return 0;
    const minStart = Math.min(...positioned.map(m => m.start));
    return minStart < 0 ? -minStart : 0;
  }, [positioned]);

  // positions for arrows
  const positionsById = useMemo(() => {
    const map = new Map();
    positioned.forEach((m, rowIdx) => {
      const x = ((m.start + clampShift) * colW) + colW; // gutter
      const y = rowIdx * ROW_H + (ROW_H - BAR_H) / 2 + HDR_H;
      const w = Math.max(1, Number(m.duration) || 1) * colW;
      const h = BAR_H;
      map.set(m.id, { x, y, w, h });
    });
    return map;
  }, [positioned, colW, clampShift]);

  // Master checkbox
  const masterRef = useRef(null);
  useEffect(() => { if (masterRef.current) masterRef.current.indeterminate = someChecked; }, [someChecked]);

  // Arrows
  const Arrows = () => {
    const stroke = '#dc2626';
    const sw = 2.4;
    const markerId = 'arrow-simple-tip';
    const markerW = 8, markerH = 8;
    const gap = 8;

    function simplePath(from, to){
      const sx = from.x + from.w / 2;
      const sy = from.y + from.h / 2;
      const tx = to.x + to.w / 2;
      const ty = to.y - gap;
      const midY = ty - 12;
      const d = [`M ${sx} ${sy}`, `L ${tx} ${sy}`, `L ${tx} ${midY}`, `L ${tx} ${ty}`].join(' ');
      return { d, start:{x:sx,y:sy}, end:{x:tx,y:ty} };
    }

    return (
      <svg width={gridWidth} height={gridHeight} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth={markerW} markerHeight={markerH} orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
          </marker>
          <filter id="arrowGlow2" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#ffffff" floodOpacity="0.85"/>
          </filter>
        </defs>
        {positioned.map(m => (
          (m.deps || []).map(depId => {
            const from = positionsById.get(depId);
            const to   = positionsById.get(m.id);
            if (!from || !to) return null;
            const { d, start, end } = simplePath(from, to);
            return (
              <g key={`${depId}->${m.id}`} filter="url(#arrowGlow2)">
                <circle cx={start.x} cy={start.y} r={2.6} fill={stroke}/>
                <path d={d} stroke={stroke} strokeWidth={sw} fill="none" markerEnd={`url(#${markerId})`} />
                <circle cx={end.x} cy={end.y} r={2.6} fill={stroke}/>
              </g>
            );
          })
        ))}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: sidebarWidth, background: '#fff', borderRight: '1px solid #e5e7eb' }}>
        {/* Master check row (sadece checkbox) */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderBottom:'1px solid #f3f4f6', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <input
            ref={masterRef}
            type="checkbox"
            checked={allChecked}
            onChange={(e)=> onToggleAll?.(e.target.checked)}
            title="Toggle all"
          />
        </div>

        {ordered.map((m) => {
          const tipSide = [m.name, (m.desc||''), formatRes(m)].filter(Boolean).join('\n');
          return (
            <div key={m.id}
                 draggable
                 onDragStart={()=>onDragStart(m.id)}
                 onDragOver={onDragOver}
                 onDrop={()=>onDrop(m.id)}
                 onClick={()=>onSwapClick?.(m.id)}
                 title={tipSide}
                 style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', height: ROW_H, boxSizing: 'border-box', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: swapId===m.id? '#eef2ff' : '#fff' }}>
              <span style={{ fontSize: 14, color: '#9ca3af', paddingTop: 2 }}>⋮⋮</span>
              <input type="checkbox" checked={!!enabled[m.id]} onChange={()=>onToggle(m.id)} />
              <div style={{ display:'flex', flexDirection:'column', gap:4, overflow:'hidden', minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: '12px', opacity: enabled[m.id] ? 1 : 0.6, textDecoration: enabled[m.id] ? 'none' : 'line-through', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.name}</span>
                <span style={{ fontSize: 12, color:'#6b7280', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: sidebarWidth-80 }}>{m.desc || ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="timeline-container" style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
        <div style={{ position: 'relative', width: gridWidth, height: gridHeight, background: '#fff' }}>
          {/* Sticky header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#fff', display: 'flex', borderBottom: '1px solid #eee' }}>
            {weekLabels.map((label, i) => (
              <div key={i} style={{ width: colW, textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '10px 0 6px', borderRight: '1px solid #eef2f7' }}>{label}</div>
            ))}
          </div>

          {/* Grid columns */}
          <div style={{ position: 'absolute', top: HDR_H, left: 0, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none' }}>
            {Array.from({ length: weekLabels.length }).map((_, i) => (<div key={i} style={{ width: colW, borderRight: '1px solid #f3f4f6' }} />))}
          </div>

          {/* Arrows UNDER bars */}
          <Arrows />

          {/* Bars */}
          <div style={{ position: 'absolute', top: HDR_H, left: 0, right: 0 }}>
            {positioned.map((m, rowIdx) => {
              const barW = Math.max(1, Number(m.duration) || 1) * colW;
              const leftPx = ((m.start + clampShift) * colW) + colW; // gutter + clamp
              const titleFont = Math.max(10, Math.min(16, Math.floor(barW / 12)));
              const selected = swapId === m.id;
              const tColor = textColorFor(m.color);
              const resText = formatRes(m);
              const ob = hasOnboarding(m);
              const tip = `${m.name}\n${m.desc ? m.desc + '\n' : ''}${resText ? resText + (ob ? '  + OB' : '') + ' • ' : ''}${m.duration} weeks${ob ? ' • +6 OB' : ''}`;
              return (
                <div key={m.id}
                     onMouseDown={(e)=>{ draggingRef.current = { id: m.id, startX: e.clientX }; setIsGrabbing(true); }}
                     onTouchStart={(e)=>{ const t=e.touches[0]; draggingRef.current = { id: m.id, startX: t.clientX }; setIsGrabbing(true); }}
                     onMouseUp={()=> setIsGrabbing(false)}
                     onClick={()=>onSwapClick?.(m.id)}
                     style={{ position: 'absolute', left: `${leftPx}px`, top: `${rowIdx * ROW_H + (ROW_H - BAR_H) / 2}px`, width: `${barW}px`, height: `${BAR_H}px`, background: m.color || '#3498db', color: tColor, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', boxSizing: 'border-box', boxShadow: selected? '0 0 0 3px rgba(79,70,229,0.7)' : '0 1px 2px rgba(0,0,0,0.06)', textAlign: 'center', lineHeight: 1.1, cursor: isGrabbing ? 'grabbing' : 'grab', userSelect: 'none' }}
                     title={tip}>
                  {/* Üst OnB rozeti */}
                  {ob && (
                    <span style={{
                      position:'absolute', top:6, right:6,
                      padding:'2px 6px', borderRadius:6,
                      background:'rgba(0,0,0,0.55)', color:'#fff',
                      fontSize:10, fontWeight:800, letterSpacing:0.2
                    }}>OnB</span>
                  )}

                  <div style={{ fontWeight: 800, fontSize: titleFont, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', padding: '0 6px', maxHeight: '2.2em' }}>{m.name}</div>

                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '2px 6px', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.36)', color: '#fff', alignSelf: 'center' }}>
                    {(resText + (ob ? '  + OB' : '')) || ' '}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

function ModulesEditor({ ordered, enabled, swapId, onSwapClick, onToggle, onChange, calcDuration, onAdd, onDelete, onToggleAll, someChecked, allChecked }){
  // Master checkbox
  const masterRef = useRef(null);
  useEffect(() => { if (masterRef.current) masterRef.current.indeterminate = someChecked; }, [someChecked]);

  // 🟡 FE/BE/QA artınca popup
  function notifyIfIncrement(prevVal, nextVal){
    if (Number(nextVal) > Number(prevVal)) {
      window.alert("The onboarding periods of the new hires will be automatically added to the feature");
    }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '10px 12px', borderBottom:'1px solid #e5e7eb', background:'#fafafa' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <strong style={{ fontSize: 14 }}>Modules</strong>
          <input
            ref={masterRef}
            type="checkbox"
            checked={allChecked}
            onChange={(e)=> onToggleAll?.(e.target.checked)}
            title="Toggle all"
          />
        </div>
        <button onClick={onAdd} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#111827', color:'#fff', fontWeight:700, cursor:'pointer' }}>+ Add Module</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            {[
              'Enabled',
              'Module Name',
              'Description',
              'Base Duration (Weeks)',
              'FE','BE','QA',
              'Color',
              'Depends On',
              'Computed Duration (Weeks)',
              ''
            ].map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: 12, padding: 10, whiteSpace: 'pre-wrap', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordered.map(m => (
            <tr key={m.id} onClick={()=>onSwapClick?.(m.id)} style={{ background: swapId===m.id? '#eef2ff' : '#fff', cursor: 'pointer' }}>
              <td style={td()}><input type="checkbox" checked={!!enabled[m.id]} onChange={(e)=>{ e.stopPropagation(); onToggle(m.id); }} /></td>
              <td style={td()}><input value={m.name} onClick={e=>e.stopPropagation()} onChange={e=>onChange(m.id,{name: e.target.value})} style={inp(200)} /></td>
              <td style={td()}>
                <textarea value={m.desc || ''} onClick={e=>e.stopPropagation()} onChange={e=>onChange(m.id,{ desc: e.target.value })} style={{ ...inp(280), height: 48, resize: 'vertical' }} />
              </td>
              <td style={td()}>
                <input type="number" min={1} value={m.baseDuration ?? m.duration} onClick={e=>e.stopPropagation()} onChange={e=>onChange(m.id,{ baseDuration: Math.max(1, Number(e.target.value)||1) })} style={inp(56)} />
              </td>
              <td style={td()}>
                <input
                  type="number" min={0} value={m.fe}
                  onClick={e=>e.stopPropagation()}
                  onChange={(e)=>{ const next = Math.max(0, Number(e.target.value)||0); notifyIfIncrement(m.fe, next); onChange(m.id,{ fe: next }); }}
                  style={inp(44)}
                />
              </td>
              <td style={td()}>
                <input
                  type="number" min={0} value={m.be}
                  onClick={e=>e.stopPropagation()}
                  onChange={(e)=>{ const next = Math.max(0, Number(e.target.value)||0); notifyIfIncrement(m.be, next); onChange(m.id,{ be: next }); }}
                  style={inp(44)}
                />
              </td>
              <td style={td()}>
                <input
                  type="number" min={0} value={m.qa}
                  onClick={e=>e.stopPropagation()}
                  onChange={(e)=>{ const next = Math.max(0, Number(e.target.value)||0); notifyIfIncrement(m.qa, next); onChange(m.id,{ qa: next }); }}
                  style={inp(44)}
                />
              </td>
              <td style={td()}>
                <input type="color" value={m.color} onClick={e=>e.stopPropagation()} onChange={(e)=>onChange(m.id,{ color: e.target.value })} style={{ width: 40, height: 28, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
              </td>
              <td style={td()}>
                <DepDropdown
                  value={m.deps || []}
                  options={ordered.filter(x=>x.id!==m.id).map(opt => ({ value: opt.id, label: opt.name }))}
                  onChange={(values)=> onChange(m.id, { deps: values })}
                />
              </td>
              <td style={td()}><strong>{calcDuration(m)}</strong></td>
              <td style={{ ...td(), width: 60 }}>
                <button title="Delete" onClick={(e)=>{ e.stopPropagation(); onDelete?.(m.id); }}
                        style={{ width: 36, height: 28, borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MVPGrid({ ordered, enabled, onToggle, onToggleAll, someChecked, allChecked }){
  // Master checkbox
  const masterRef = useRef(null);
  useEffect(() => { if (masterRef.current) masterRef.current.indeterminate = someChecked; }, [someChecked]);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid #e5e7eb', background:'#fafafa' }}>
        <strong style={{ fontSize: 14 }}>MVP</strong>
        <input
          ref={masterRef}
          type="checkbox"
          checked={allChecked}
          onChange={(e)=> onToggleAll?.(e.target.checked)}
          title="Toggle all"
        />
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:12, padding:12 }}>
        {ordered.map(m => {
          const checked = !!enabled[m.id];
          return (
            <label key={m.id}
                   style={{
                     width: 240, minHeight: 86,
                     border:'1px solid #e5e7eb',
                     borderRadius:12,
                     padding:'10px 12px',
                     display:'flex',
                     gap:10,
                     alignItems:'flex-start',
                     background: checked ? '#f0fdf4' : '#fff',
                     boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                     cursor:'pointer'
                   }}>
              <input type="checkbox"
                     checked={checked}
                     onChange={()=> onToggle(m.id)}
                     style={{ marginTop:2 }} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.desc || ''}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function DepDropdown({ value = [], options = [], onChange }){
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e){ if (!ref.current) return; if (!ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);
  const selectedLabels = options.filter(o=>value.includes(o.value)).map(o=>o.label);
  const title = selectedLabels.length ? `${selectedLabels.length} selected` : 'Select deps…';
  return (
    <div ref={ref} style={{ position:'relative', width: 160 }}>
      <button type="button" onClick={(e)=>{ e.stopPropagation(); setOpen(o=>!o); }}
        style={{ width:'100%', padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', textAlign:'left', fontSize:13 }}>
        {title}
      </button>
      {open && (
        <div style={{ position:'absolute', top:'110%', left:0, zIndex:5, width:'100%', maxHeight:160, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', boxShadow:'0 8px 20px rgba(0,0,0,0.08)' }}>
          {options.map(opt => (
            <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', cursor:'pointer' }}
                   onClick={(e)=> e.stopPropagation()}>
              <input type="checkbox" checked={value.includes(opt.value)} onChange={(e)=>{
                const checked = e.target.checked;
                const next = checked ? Array.from(new Set([...value, opt.value])) : value.filter(v=>v!==opt.value);
                onChange?.(next);
              }} />
              <span style={{ fontSize:12 }}>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== Small UI helpers ======
function Tab({ active, onClick, children }){
  return (
    <button onClick={onClick} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: active ? '#111827' : '#fff', color: active ? '#fff' : '#111827', fontWeight: 700, cursor: 'pointer' }}>{children}</button>
  );
}
function td(){ return { padding: 10, borderBottom: '1px solid #f3f4f6', fontSize: 13, verticalAlign: 'top' }; }
function inp(w=160){ return { width: w, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }; }
function iconBtn(){ return { width: 32, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontWeight:900 }; }