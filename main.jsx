import { useState, useEffect, useCallback, useRef } from "react";

// ─── REPLACE THIS WITH YOUR CLOUDFLARE WORKER URL ────────────
const API_URL = "https://muddy-limit-8453.kennymehta.workers.dev/api/claude";
// ─────────────────────────────────────────────────────────────

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');`;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:       #09090f;
    --ink2:      #181830;
    --ink3:      #2a2a48;
    --smoke:     #f1f0f9;
    --smoke2:    #e9e8f6;
    --smoke3:    #deddf0;
    --accent:    #4f46e5;
    --accent2:   #7c3aed;
    --gold:      #d97706;
    --gold-lt:   #fef3c7;
    --red:       #dc2626;
    --red-lt:    #fef2f2;
    --green:     #059669;
    --green-lt:  #ecfdf5;
    --blue:      #2563eb;
    --blue-lt:   #eff6ff;
    --bd:        rgba(79,70,229,0.13);
    --bd2:       rgba(79,70,229,0.24);
    --sh:        0 1px 3px rgba(10,10,20,0.07),0 6px 20px rgba(79,70,229,0.06);
    --sh2:       0 4px 8px rgba(10,10,20,0.05),0 20px 48px rgba(79,70,229,0.11);
    --r:         10px; --rl: 16px;
    --fh: 'Syne',sans-serif;
    --fm: 'Space Mono',monospace;
    --fb: 'DM Sans',sans-serif;
  }
  html { -webkit-tap-highlight-color: transparent; }
  body { font-family:var(--fb); background:var(--smoke); color:var(--ink); font-size:14px; overscroll-behavior:none; }

  /* APP SHELL */
  .app { min-height:100dvh; display:flex; flex-direction:column;
    background:linear-gradient(140deg,#f1f0f9 0%,#e9e8f6 55%,#f0edff 100%); }

  /* HEADER */
  .hdr { background:var(--ink2); height:56px; padding:0 16px; display:flex;
    align-items:center; justify-content:space-between; flex-shrink:0;
    border-bottom:1px solid rgba(255,255,255,0.05); position:sticky; top:0; z-index:100; }
  .hdr-brand { display:flex; align-items:center; gap:10px; }
  .hdr-logo { width:30px; height:30px; border-radius:7px; flex-shrink:0;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    display:flex; align-items:center; justify-content:center;
    font-family:var(--fh); font-weight:800; color:#fff; font-size:13px; }
  .hdr-name { font-family:var(--fh); font-weight:700; color:#fff; font-size:14px; letter-spacing:-.2px; }
  .hdr-sub  { font-size:10px; color:rgba(255,255,255,0.38); margin-top:1px; }
  .hdr-right { display:flex; align-items:center; gap:10px; }
  .hdr-date  { font-family:var(--fm); font-size:10px; color:rgba(255,255,255,0.38); display:none; }
  @media(min-width:480px){ .hdr-date{display:block;} }

  .fetch-btn {
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    color:#fff; border:none; border-radius:8px; padding:7px 14px;
    font-family:var(--fh); font-weight:600; font-size:12px; letter-spacing:.3px;
    cursor:pointer; display:flex; align-items:center; gap:6px;
    transition:opacity .15s,transform .15s; white-space:nowrap; }
  .fetch-btn:hover  { opacity:.9; transform:translateY(-1px); }
  .fetch-btn:active { transform:translateY(0) scale(.98); }
  .fetch-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .spin { width:12px; height:12px; border:2px solid rgba(255,255,255,.3);
    border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* TABS */
  .tabs { background:var(--ink2); display:flex; overflow-x:auto; flex-shrink:0;
    border-bottom:1px solid rgba(255,255,255,0.05); scrollbar-width:none; }
  .tabs::-webkit-scrollbar { display:none; }
  .tab { padding:0 14px; height:40px; display:flex; align-items:center; gap:6px; flex-shrink:0;
    font-family:var(--fh); font-weight:500; font-size:11px; letter-spacing:.3px;
    color:rgba(255,255,255,0.38); cursor:pointer; border:none; background:none;
    border-bottom:2px solid transparent; transition:color .15s,border-color .15s; }
  .tab:hover  { color:rgba(255,255,255,.65); }
  .tab.active { color:#fff; border-bottom-color:var(--accent); }
  .tbadge { background:rgba(79,70,229,.3); color:#a5b4fc; font-size:9px;
    font-family:var(--fm); padding:1px 5px; border-radius:8px; }
  .tab.active .tbadge { background:var(--accent); color:#fff; }

  /* MAIN */
  .main { padding:16px; flex:1; overflow-y:auto; }
  @media(min-width:640px){ .main { padding:20px 24px; } }

  /* STATUS BANNER */
  .sbanner {
    background:linear-gradient(90deg,var(--ink2),var(--ink3));
    border-radius:var(--r); padding:10px 14px; font-size:11px;
    color:rgba(255,255,255,.6); margin-bottom:16px;
    display:flex; align-items:center; gap:8px;
    border:1px solid rgba(255,255,255,0.06); }
  .sdot { width:7px; height:7px; border-radius:50%; background:var(--green); flex-shrink:0; animation:pulse 2s ease infinite; }
  .sdot.loading { background:var(--gold); animation:spin .8s linear infinite;
    border:2px solid rgba(217,119,6,.3); border-top-color:var(--gold); }
  .sdot.error   { background:var(--red); animation:none; }
  .sdot.idle    { background:#4b5563; animation:none; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  /* LOADING BAR */
  .lbar { position:fixed; top:0; left:0; right:0; height:3px; z-index:999;
    background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent));
    background-size:200% 100%; animation:lbar 1.4s ease infinite; }
  @keyframes lbar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* KPI GRID */
  .kgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
  @media(min-width:640px)  { .kgrid { grid-template-columns:repeat(4,1fr); } }
  @media(min-width:900px)  { .kgrid { grid-template-columns:repeat(6,1fr); } }
  .kpi { background:#fff; border-radius:var(--rl); padding:13px 14px;
    border:1px solid var(--bd); box-shadow:var(--sh); position:relative; overflow:hidden; }
  .kpi::after { content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,var(--accent),var(--accent2)); opacity:0; transition:opacity .3s; }
  .kpi:hover::after { opacity:1; }
  .klbl { font-size:9px; font-weight:500; color:#9ca3af; text-transform:uppercase; letter-spacing:.6px; margin-bottom:5px; }
  .kval { font-family:var(--fh); font-size:22px; font-weight:800; line-height:1; }
  .ksub { font-size:9px; color:#9ca3af; margin-top:3px; }
  .kval.ok    { color:var(--green); }
  .kval.warn  { color:var(--gold); }
  .kval.alert { color:var(--red); }
  .kval.info  { color:var(--accent); }

  /* PROPERTY GRID */
  .pgrid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:18px; }
  @media(min-width:480px){ .pgrid { grid-template-columns:repeat(3,1fr); } }
  @media(min-width:720px){ .pgrid { grid-template-columns:repeat(4,1fr); } }
  @media(min-width:960px){ .pgrid { grid-template-columns:repeat(5,1fr); } }
  .pcard { background:#fff; border-radius:var(--r); padding:11px 13px;
    border:1px solid var(--bd); border-left:3px solid #e5e7eb;
    box-shadow:var(--sh); transition:transform .15s,box-shadow .15s; }
  .pcard:hover  { transform:translateY(-2px); box-shadow:var(--sh2); }
  .pcard.ok     { border-left-color:var(--green); }
  .pcard.warn   { border-left-color:var(--gold); }
  .pcard.miss   { border-left-color:#d1d5db; opacity:.6; }
  .pbrand  { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px; }
  .pname   { font-family:var(--fh); font-size:11px; font-weight:600; margin-bottom:4px; line-height:1.3; }
  .pstatus { font-size:10px; color:#6b7280; line-height:1.4; }
  .pdot { display:inline-block; width:5px; height:5px; border-radius:50%; margin-right:4px; vertical-align:middle; }
  .pdot.ok   { background:var(--green); }
  .pdot.warn { background:var(--gold); }
  .pdot.miss { background:#d1d5db; }

  /* CARDS */
  .card { background:#fff; border-radius:var(--rl); padding:15px 16px;
    border:1px solid var(--bd); box-shadow:var(--sh); margin-bottom:12px; }
  .chdr { display:flex; align-items:center; gap:8px; margin-bottom:12px;
    padding-bottom:10px; border-bottom:1px solid var(--smoke2); }
  .cico { width:26px; height:26px; border-radius:6px; display:flex; align-items:center;
    justify-content:center; font-size:11px; flex-shrink:0; }
  .ctitle { font-family:var(--fh); font-size:12px; font-weight:600; flex:1; }
  .cbadge { font-size:9px; padding:2px 7px; border-radius:12px; font-weight:500; font-family:var(--fm); }
  .cb-red  { background:var(--red-lt);   color:var(--red); }
  .cb-grn  { background:var(--green-lt); color:var(--green); }
  .cb-blu  { background:var(--blue-lt);  color:var(--blue); }
  .cb-gld  { background:var(--gold-lt);  color:var(--gold); }
  .cb-pur  { background:#f5f3ff;         color:var(--accent); }

  /* TWO-COL */
  .two { display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:12px; }
  @media(min-width:700px){ .two { grid-template-columns:1fr 1fr; } }
  .three { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  @media(min-width:700px){ .three { grid-template-columns:1fr 1fr 1fr; } }

  /* ALERT ITEMS */
  .aitem { background:var(--smoke); border-radius:7px; padding:9px 11px;
    margin-bottom:7px; border-left:2px solid transparent; }
  .aitem:last-child { margin-bottom:0; }
  .aitem.red  { border-left-color:var(--red);   background:#fff8f8; }
  .aitem.grn  { border-left-color:var(--green); background:#f7fffb; }
  .aitem.blu  { border-left-color:var(--blue);  background:#f7fbff; }
  .aitem.gld  { border-left-color:var(--gold);  background:#fffbf0; }
  .arow  { display:flex; align-items:flex-start; gap:5px; margin-bottom:2px; }
  .atitle{ font-weight:500; font-size:11px; flex:1; line-height:1.4; }
  .adesc { font-size:10px; color:#6b7280; line-height:1.5; }
  .badge { font-size:9px; padding:2px 6px; border-radius:3px;
    font-weight:600; font-family:var(--fm); flex-shrink:0; }
  .b-red { background:var(--red-lt);   color:var(--red); }
  .b-gld { background:var(--gold-lt);  color:var(--gold); }
  .b-grn { background:var(--green-lt); color:var(--green); }
  .b-blu { background:var(--blue-lt);  color:var(--blue); }

  /* DATA ROWS */
  .drow { display:flex; justify-content:space-between; align-items:center;
    padding:6px 0; border-bottom:1px solid var(--smoke2); font-size:11px; }
  .drow:last-child { border-bottom:none; }
  .dlbl { color:#6b7280; }
  .dval { font-weight:500; font-family:var(--fm); font-size:10px; }

  /* TABLE */
  .twrap { overflow-x:auto; border-radius:var(--r); border:1px solid var(--bd); }
  table  { width:100%; border-collapse:collapse; font-size:11px; min-width:500px; }
  thead tr { background:var(--ink2); }
  thead th { padding:9px 12px; text-align:left; font-family:var(--fh); font-size:9px;
    font-weight:600; color:rgba(255,255,255,.6); letter-spacing:.5px;
    text-transform:uppercase; white-space:nowrap; }
  tbody tr { border-bottom:1px solid var(--smoke2); transition:background .1s; }
  tbody tr:last-child { border-bottom:none; }
  tbody tr:hover { background:var(--smoke); }
  tbody td { padding:8px 12px; vertical-align:middle; }
  .mono { font-family:var(--fm); font-size:10px; }
  .tag  { display:inline-block; padding:2px 6px; border-radius:3px;
    font-size:9px; font-family:var(--fm); font-weight:600; white-space:nowrap; }
  .t-red { background:var(--red-lt);   color:var(--red); }
  .t-gld { background:var(--gold-lt);  color:var(--gold); }
  .t-grn { background:var(--green-lt); color:var(--green); }
  .t-blu { background:var(--blue-lt);  color:var(--blue); }
  .t-pur { background:#f5f3ff;         color:var(--accent); }
  .t-gry { background:#f3f4f6;         color:#6b7280; }

  /* MISSING BANNER */
  .missing { background:#fffbeb; border:1px solid #fde68a; border-radius:var(--r);
    padding:12px 14px; font-size:11px; color:#92400e; margin-bottom:14px;
    display:flex; gap:8px; align-items:flex-start; line-height:1.5; }

  /* EMPTY */
  .empty { text-align:center; padding:48px 16px; color:#9ca3af; font-size:12px; }
  .eico  { font-size:32px; margin-bottom:10px; opacity:.35; }
  .etitle{ font-family:var(--fh); font-size:15px; font-weight:600; color:#d1d5db; margin-bottom:6px; }

  /* SEC HDR */
  .shdr { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
  .stitle{ font-family:var(--fh); font-size:10px; font-weight:600; color:#9ca3af;
    text-transform:uppercase; letter-spacing:.8px; white-space:nowrap; }
  .sline { flex:1; height:1px; background:var(--smoke3); }

  /* SETUP MODAL */
  .overlay { position:fixed; inset:0; background:rgba(9,9,15,.7); z-index:200;
    display:flex; align-items:center; justify-content:center; padding:16px; }
  .modal { background:#fff; border-radius:var(--rl); padding:24px; max-width:480px; width:100%;
    box-shadow:0 24px 64px rgba(0,0,0,.3); }
  .modal-title { font-family:var(--fh); font-size:18px; font-weight:700; margin-bottom:6px; }
  .modal-sub   { font-size:12px; color:#6b7280; margin-bottom:20px; line-height:1.6; }
  .input-label { font-size:11px; font-weight:600; color:#374151; margin-bottom:5px; display:block; font-family:var(--fh); }
  .input-field { width:100%; padding:10px 12px; border:1px solid var(--bd2);
    border-radius:var(--r); font-family:var(--fm); font-size:12px; color:var(--ink);
    outline:none; transition:border-color .15s; margin-bottom:14px; }
  .input-field:focus { border-color:var(--accent); }
  .input-hint { font-size:10px; color:#9ca3af; margin-top:-10px; margin-bottom:14px; line-height:1.5; }
  .save-btn { width:100%; padding:11px; background:linear-gradient(135deg,var(--accent),var(--accent2));
    color:#fff; border:none; border-radius:var(--r); font-family:var(--fh);
    font-weight:600; font-size:13px; cursor:pointer; transition:opacity .15s; }
  .save-btn:hover { opacity:.9; }
  .skip-btn { width:100%; padding:8px; background:none; border:none; color:#9ca3af;
    font-size:11px; cursor:pointer; margin-top:8px; font-family:var(--fb); }
  .skip-btn:hover { color:#6b7280; }

  /* SETTINGS BTN */
  .settings-btn { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.12);
    color:rgba(255,255,255,.6); border-radius:7px; padding:6px 10px; font-size:11px;
    cursor:pointer; font-family:var(--fb); transition:background .15s; }
  .settings-btn:hover { background:rgba(255,255,255,.18); }

  .fade { animation:fade .3s ease; }
  @keyframes fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
`;

// ─── HOTELS ───────────────────────────────────────────────────
const HOTELS = [
  { name:"CW Chambersburg",         brand:"IHG"     },
  { name:"BW Shippensburg",         brand:"BW"      },
  { name:"BW Doswell",              brand:"BW"      },
  { name:"Country Inn Doswell",     brand:"Choice"  },
  { name:"Hotel Indigo HBG-Hershey",brand:"IHG"     },
  { name:"CW Harrisburg",           brand:"IHG"     },
  { name:"HIE Shippensburg",        brand:"IHG"     },
  { name:"SpringHill Chambersburg", brand:"Marriott"},
  { name:"BW New Cumberland",       brand:"BW"      },
  { name:"BW Enola",                brand:"BW"      },
  { name:"Spark by Hilton Carlisle",brand:"Hilton"  },
  { name:"Home2 Suites Mechanicsburg",brand:"Hilton"},
  { name:"Hampton Inn Grantville",  brand:"Hilton"  },
];

const BRAND_CLR = {
  IHG:"#5e35b1", BW:"#1b6ca8", Choice:"#c8860a",
  Marriott:"#943220", Hilton:"#004b87",
};

const TABS_LIST = [
  { id:"dashboard",   label:"Daily Report", icon:"⊞" },
  { id:"adjustments", label:"Adjustments",  icon:"↕" },
  { id:"ooo",         label:"OOO Rooms",    icon:"⊘" },
  { id:"ledger",      label:"Ledger",       icon:"≡" },
  { id:"financial",   label:"Financial",    icon:"$" },
];

const WORKER_SYSTEM_PROMPT = `You are a hotel data extraction assistant for Areya Management's 13-property portfolio in Pennsylvania.
Search Gmail for hotel report emails from the last 2 days and extract all data as structured JSON.

Hotel senders:
- fdcandlewoodsuites231@gmail.com → Candlewood Suites Chambersburg
- bwship@areyamanagement.com → BW Shippensburg
- bw47154@yahoo.com → BW Doswell
- auto_mail_delivery_system@choicehotels.com → Country Inn Doswell
- hotelindigohh@gmail.com / john.reeve1@ihg.com → Hotel Indigo HBG-Hershey
- candlewoodsuites413@gmail.com → CW Harrisburg
- hieshipdesk@gmail.com → HIE Shippensburg
- fosse@hgrsc1.marriott.com / lp@hgrsc1.marriott.com → SpringHill Suites Chambersburg
- bwnc702@gmail.com → BW New Cumberland
- bwenola@gmail.com → BW Enola
- eren.geray@hilton.com / noreply@hilton.com (MDTMP) → Spark by Hilton Carlisle
- noreply@hilton.com (MDTST) → Home2 Suites Mechanicsburg
- higrantville@areyamanagement.com → Hampton Inn Grantville
- Adriana.Gault@Hilton.com → Home2 Suites Mechanicsburg
- accounts@areyamanagement.com / kenny@areyamanagement.com → forwarded (check original sender)

Return ONLY valid JSON with this exact schema (no markdown, no explanation):
{
  "date": "YYYY-MM-DD",
  "totalEmails": 0,
  "properties": [{"name":"","brand":"","status":"reported|missing|warning","reportsReceived":[],"lastReportDate":"","notes":""}],
  "adjustments": [{"hotel":"","date":"","glCode":"","description":"","gross":0,"adjustment":0,"net":0,"type":"REFUND|CREDIT|ADJUSTMENT|COMP","source":""}],
  "oooRooms": [{"hotel":"","date":"","rooms":"","count":0,"reason":""}],
  "ledgerAccounts": [{"hotel":"","date":"","ledgerType":"City|Guest","accountNum":"","accountName":"","currentBalance":0,"creditLimit":0,"overLimit":0,"status":"CURRENT|BALANCE DUE|OVER LIMIT"}],
  "financialAlerts": [{"type":"INVOICE_DUE|PAYMENT_MADE|COLLECTIONS|AUDIT_ERROR|OTHER","hotel":"","description":"","amount":0,"dueDate":"","severity":"high|medium|low"}],
  "revenueHighlights": [{"hotel":"","metric":"","value":"","context":""}],
  "missingProperties": [],
  "summary": ""
}`;

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("dashboard");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState("Ready — tap Fetch Report to load data");
  const [stype, setStype]       = useState("idle");
  const [data, setData]         = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [workerUrl, setWorkerUrl] = useState(() => localStorage.getItem("areya_worker") || "");
  const [gmailToken, setGmailToken] = useState(() => localStorage.getItem("areya_gmail_mcp") || "");
  const inputUrl = useRef(null);
  const inputGmail = useRef(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday:"short", month:"short", day:"numeric", year:"numeric"
  });

  // Show setup on first load if no worker URL
  useEffect(() => {
    if (!workerUrl) setShowSetup(true);
  }, []);

  const saveSettings = () => {
    const url = inputUrl.current?.value?.trim();
    const gml = inputGmail.current?.value?.trim();
    if (url) { localStorage.setItem("areya_worker", url); setWorkerUrl(url); }
    if (gml) { localStorage.setItem("areya_gmail_mcp", gml); setGmailToken(gml); }
    setShowSetup(false);
  };

  const fetchReport = useCallback(async () => {
    const endpoint = workerUrl || API_URL;
    if (!endpoint || endpoint.includes("YOUR-NAME")) {
      setShowSetup(true); return;
    }

    setLoading(true); setStype("loading");
    setStatus("Connecting to Gmail...");

    try {
      // ── CALL 1: Gmail fetch via MCP ──────────────────────
      setStatus("Scanning Gmail for hotel reports...");
      const r1 = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system:     WORKER_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Search Gmail using these two queries and extract all hotel data:
1. Query: "has:attachment newer_than:2d (subject:audit OR subject:flash OR subject:\\"close day\\" OR subject:\\"daily activity\\" OR subject:\\"night audit\\" OR subject:\\"trial balance\\" OR subject:\\"city ledger\\" OR subject:reports OR subject:closing)"
2. Query: "newer_than:2d (invoice OR payment OR collections OR adjustment OR refund)"
Use the gmail_search_messages tool for both searches, then return all data as JSON.`
          }],
          mcp_servers: [{
            type: "url",
            url:  "https://gmail.mcp.claude.com/mcp",
            name: "gmail"
          }]
        })
      });
      if (!r1.ok) throw new Error(`Fetch error ${r1.status}: ${await r1.text()}`);
      const d1 = await r1.json();
      const raw = d1.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";

      // ── CALL 2: Parse to JSON ────────────────────────────
      setStatus("Analyzing data...");
      const r2 = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 6000,
          system:     "Parse hotel email data into JSON. Return ONLY raw valid JSON — no markdown fences, no explanation.",
          messages: [{
            role: "user",
            content: `Parse this hotel email data into the schema and return ONLY the JSON object.\n\nRaw data:\n${raw}\n\nAll 13 hotels: ${HOTELS.map(h=>h.name).join(", ")}\n\nSchema: {"date":"YYYY-MM-DD","totalEmails":0,"properties":[{"name":"","brand":"","status":"reported|missing|warning","reportsReceived":[],"lastReportDate":"","notes":""}],"adjustments":[{"hotel":"","date":"","glCode":"","description":"","gross":0,"adjustment":0,"net":0,"type":"","source":""}],"oooRooms":[{"hotel":"","date":"","rooms":"","count":0,"reason":""}],"ledgerAccounts":[{"hotel":"","date":"","ledgerType":"","accountNum":"","accountName":"","currentBalance":0,"creditLimit":0,"overLimit":0,"status":""}],"financialAlerts":[{"type":"","hotel":"","description":"","amount":0,"dueDate":"","severity":"high|medium|low"}],"revenueHighlights":[{"hotel":"","metric":"","value":"","context":""}],"missingProperties":[],"summary":""}`
          }]
        })
      });
      if (!r2.ok) throw new Error(`Analysis error ${r2.status}`);
      const d2 = await r2.json();
      const txt = d2.content?.filter(b => b.type === "text").map(b => b.text).join("").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const parsed = JSON.parse(txt);

      // Fill in any hotels not returned
      const seen = new Set(parsed.properties?.map(p => p.name) || []);
      HOTELS.forEach(h => {
        if (!seen.has(h.name)) {
          parsed.properties = parsed.properties || [];
          parsed.properties.push({ name:h.name, brand:h.brand, status:"missing", reportsReceived:[], notes:"No email received" });
        }
      });

      setData(parsed);
      setLastFetch(new Date());
      const rep = parsed.properties?.filter(p => p.status === "reported").length || 0;
      setStatus(`✓ Report loaded · ${parsed.totalEmails || 0} emails · ${rep}/13 properties reporting`);
      setStype("ok");

    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      setStype("error");
    } finally {
      setLoading(false);
    }
  }, [workerUrl]);

  // ── Derived counts ───────────────────────────────────────
  const rep     = data?.properties?.filter(p => p.status === "reported").length || 0;
  const miss    = data?.properties?.filter(p => p.status === "missing").length  || 0;
  const adjTotal= data?.adjustments?.reduce((s,a) => s + Math.abs(a.adjustment||0), 0) || 0;
  const refunds = data?.adjustments?.filter(a => (a.adjustment||0) < 0) || [];
  const oooCount= data?.oooRooms?.reduce((s,r) => s + (r.count||1), 0) || 0;
  const hiAlerts= data?.financialAlerts?.filter(a => a.severity === "high").length || 0;
  const counts  = {
    adjustments: data?.adjustments?.length || 0,
    ooo:         data?.oooRooms?.length || 0,
    ledger:      data?.ledgerAccounts?.length || 0,
    financial:   data?.financialAlerts?.length || 0,
  };

  return (
    <>
      <style>{FONTS + CSS}</style>
      {loading && <div className="lbar" />}

      {/* ── SETUP MODAL ── */}
      {showSetup && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-title">⚙ Setup Required</div>
            <div className="modal-sub">
              Enter your Cloudflare Worker URL to securely connect the app to your Anthropic API key and Gmail.
            </div>
            <label className="input-label">Cloudflare Worker URL</label>
            <input ref={inputUrl} className="input-field" type="url"
              placeholder="https://areya-proxy.yourname.workers.dev/api/claude"
              defaultValue={workerUrl} />
            <div className="input-hint">Deploy the worker.js file to Cloudflare Workers, then paste the URL here. Your API key stays on the server — never in the app.</div>
            <button className="save-btn" onClick={saveSettings}>Save & Continue</button>
            <button className="skip-btn" onClick={() => setShowSetup(false)}>Skip for now</button>
          </div>
        </div>
      )}

      <div className="app">
        {/* ── HEADER ── */}
        <header className="hdr">
          <div className="hdr-brand">
            <div className="hdr-logo">A</div>
            <div>
              <div className="hdr-name">Areya Hotel Intelligence</div>
              <div className="hdr-sub">13 properties · Pennsylvania</div>
            </div>
          </div>
          <div className="hdr-right">
            <div className="hdr-date">{today}</div>
            <button className="settings-btn" onClick={() => setShowSetup(true)}>⚙</button>
            <button className="fetch-btn" onClick={fetchReport} disabled={loading}>
              {loading ? <div className="spin" /> : "⟳"}
              {loading ? "Fetching..." : "Fetch Report"}
            </button>
          </div>
        </header>

        {/* ── TABS ── */}
        <nav className="tabs">
          {TABS_LIST.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
              {counts[t.id] > 0 && <span className="tbadge">{counts[t.id]}</span>}
            </button>
          ))}
        </nav>

        {/* ── CONTENT ── */}
        <main className="main">

          {/* Status banner */}
          <div className="sbanner">
            <div className={`sdot ${stype}`} />
            <span style={{flex:1}}>{status}</span>
            {lastFetch && <span style={{fontFamily:"var(--fm)",fontSize:9,opacity:.5}}>{lastFetch.toLocaleTimeString()}</span>}
          </div>

          {/* ══ DASHBOARD TAB ══ */}
          {tab === "dashboard" && (
            <div className="fade">
              {/* KPIs */}
              <div className="kgrid">
                <div className="kpi">
                  <div className="klbl">Reporting</div>
                  <div className={`kval ${rep >= 11 ? "ok" : rep >= 8 ? "warn" : "alert"}`}>{data ? `${rep}/13` : "—"}</div>
                  <div className="ksub">Properties</div>
                </div>
                <div className="kpi">
                  <div className="klbl">Missing</div>
                  <div className={`kval ${miss === 0 ? "ok" : miss <= 2 ? "warn" : "alert"}`}>{data ? miss : "—"}</div>
                  <div className="ksub">No report</div>
                </div>
                <div className="kpi">
                  <div className="klbl">Adjustments</div>
                  <div className={`kval ${adjTotal === 0 ? "ok" : adjTotal < 500 ? "warn" : "alert"}`}>{data ? `$${adjTotal.toFixed(0)}` : "—"}</div>
                  <div className="ksub">{refunds.length} refunds</div>
                </div>
                <div className="kpi">
                  <div className="klbl">OOO Rooms</div>
                  <div className={`kval ${oooCount === 0 ? "ok" : oooCount <= 3 ? "warn" : "alert"}`}>{data ? oooCount : "—"}</div>
                  <div className="ksub">Portfolio-wide</div>
                </div>
                <div className="kpi">
                  <div className="klbl">High Alerts</div>
                  <div className={`kval ${hiAlerts === 0 ? "ok" : "alert"}`}>{data ? hiAlerts : "—"}</div>
                  <div className="ksub">Action needed</div>
                </div>
                <div className="kpi">
                  <div className="klbl">Emails</div>
                  <div className="kval info">{data?.totalEmails || "—"}</div>
                  <div className="ksub">Scanned</div>
                </div>
              </div>

              {/* Missing warning */}
              {data?.missingProperties?.length > 0 && (
                <div className="missing">
                  ⚠ <span><strong>Missing reports:</strong> {data.missingProperties.join(", ")} — no email in 48hrs. Call front desk.</span>
                </div>
              )}

              {/* Summary */}
              {data?.summary && (
                <div className="card">
                  <div style={{fontSize:12,color:"#374151",lineHeight:1.7}}>{data.summary}</div>
                </div>
              )}

              {/* Property grid */}
              <div className="shdr"><div className="stitle">Property Status</div><div className="sline" /></div>
              <div className="pgrid">
                {(data?.properties || HOTELS.map(h => ({...h, status:"missing", reportsReceived:[], notes:"Awaiting data"}))).map((p, i) => (
                  <div key={i} className={`pcard ${p.status}`}>
                    <div className="pbrand" style={{color: BRAND_CLR[p.brand] || "#6b7280"}}>{p.brand}</div>
                    <div className="pname">{p.name}</div>
                    <div className="pstatus">
                      <span className={`pdot ${p.status === "reported" ? "ok" : p.status === "warning" ? "warn" : "miss"}`} />
                      {p.status === "reported"
                        ? (p.reportsReceived?.slice(0,2).join(" · ") || "Reported")
                        : p.status === "warning" ? (p.notes || "Warning")
                        : (p.notes || "No report today")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alerts + Revenue */}
              <div className="two">
                <div className="card">
                  <div className="chdr">
                    <div className="cico" style={{background:"#fef2f2"}}>⚡</div>
                    <div className="ctitle">Action Items</div>
                    {hiAlerts > 0 && <span className="cbadge cb-red">{hiAlerts} HIGH</span>}
                  </div>
                  {data?.financialAlerts?.length > 0
                    ? data.financialAlerts.sort((a,b) => a.severity==="high"?-1:1).slice(0,5).map((a,i) => (
                      <div key={i} className={`aitem ${a.severity==="high"?"red":a.severity==="medium"?"gld":"blu"}`}>
                        <div className="arow">
                          <div className="atitle">{a.description}</div>
                          <span className={`badge b-${a.severity==="high"?"red":a.severity==="medium"?"gld":"blu"}`}>
                            {(a.severity||"low").toUpperCase()}
                          </span>
                        </div>
                        <div className="adesc">{a.hotel}{a.dueDate?` · Due ${a.dueDate}`:""}{a.amount>0?` · $${a.amount.toLocaleString()}`:""}</div>
                      </div>
                    ))
                    : <div style={{color:"#9ca3af",fontSize:11}}>{data?"No alerts today":"Fetch report to load"}</div>
                  }
                </div>
                <div className="card">
                  <div className="chdr">
                    <div className="cico" style={{background:"#ecfdf5"}}>↑</div>
                    <div className="ctitle">Revenue Highlights</div>
                    {data?.revenueHighlights?.length > 0 && <span className="cbadge cb-grn">{data.revenueHighlights.length}</span>}
                  </div>
                  {data?.revenueHighlights?.length > 0
                    ? data.revenueHighlights.map((r,i) => (
                      <div key={i} className="aitem grn">
                        <div className="arow">
                          <div className="atitle">{r.hotel} — {r.metric}</div>
                          <span style={{fontFamily:"var(--fm)",fontSize:11,fontWeight:700,color:"var(--green)"}}>{r.value}</span>
                        </div>
                        {r.context && <div className="adesc">{r.context}</div>}
                      </div>
                    ))
                    : <div style={{color:"#9ca3af",fontSize:11}}>{data?"No revenue data from emails":"Fetch report to load"}</div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ ADJUSTMENTS TAB ══ */}
          {tab === "adjustments" && (
            <div className="fade">
              <div className="three">
                {[
                  {l:"Total Adjustments", v:data?`$${adjTotal.toFixed(2)}`:"—", s:""},
                  {l:"Refunds / Credits", v:data?refunds.length:"—", s:"items", c:"alert"},
                  {l:"Properties Affected", v:data?new Set(data.adjustments?.map(a=>a.hotel)||[]).size:"—", s:""},
                ].map((k,i) => (
                  <div key={i} className="kpi">
                    <div className="klbl">{k.l}</div>
                    <div className={`kval ${k.c||"info"}`}>{k.v}</div>
                    <div className="ksub">{k.s}</div>
                  </div>
                ))}
              </div>
              {data?.adjustments?.length > 0 ? (
                <div className="card">
                  <div className="chdr">
                    <div className="cico" style={{background:"#fef2f2"}}>↕</div>
                    <div className="ctitle">Adjustments & Refunds</div>
                    <span className="cbadge cb-red">{data.adjustments.length}</span>
                  </div>
                  <div className="twrap">
                    <table>
                      <thead><tr><th>Date</th><th>Hotel</th><th>GL</th><th>Description</th><th>Gross</th><th>Adjust</th><th>Net</th><th>Type</th></tr></thead>
                      <tbody>
                        {data.adjustments.map((a,i) => (
                          <tr key={i}>
                            <td className="mono">{a.date}</td>
                            <td style={{fontWeight:500,fontSize:11}}>{a.hotel}</td>
                            <td className="mono">{a.glCode||"—"}</td>
                            <td style={{fontSize:11}}>{a.description}</td>
                            <td className="mono">${(a.gross||0).toFixed(2)}</td>
                            <td className="mono" style={{fontWeight:700,color:(a.adjustment||0)<0?"var(--red)":"var(--green)"}}>
                              {(a.adjustment||0)<0?"-":"+"}${Math.abs(a.adjustment||0).toFixed(2)}
                            </td>
                            <td className="mono">${(a.net||0).toFixed(2)}</td>
                            <td><span className={`tag ${(a.adjustment||0)<0?"t-red":"t-gld"}`}>{a.type||"ADJ"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card"><div className="empty">
                  <div className="eico">↕</div>
                  <div className="etitle">{data?"No adjustments found":"No data loaded"}</div>
                  <div>{data?"Adjustment detail is in PDF attachments — run the Google Apps Script pipeline for full GL data":"Tap Fetch Report to load"}</div>
                </div></div>
              )}
            </div>
          )}

          {/* ══ OOO TAB ══ */}
          {tab === "ooo" && (
            <div className="fade">
              <div className="three">
                {[
                  {l:"OOO Rooms", v:data?oooCount:"—", c:oooCount>4?"alert":oooCount>1?"warn":"ok"},
                  {l:"Hotels Affected", v:data?new Set(data.oooRooms?.map(r=>r.hotel)||[]).size:"—", c:"warn"},
                  {l:"Est. Revenue Lost", v:data&&oooCount>0?`~$${(oooCount*89).toLocaleString()}`:"—", c:"alert"},
                ].map((k,i) => (
                  <div key={i} className="kpi">
                    <div className="klbl">{k.l}</div>
                    <div className={`kval ${k.c}`}>{k.v}</div>
                    <div className="ksub">{k.l==="Est. Revenue Lost"?"~$89 avg ADR":""}</div>
                  </div>
                ))}
              </div>
              {data?.oooRooms?.length > 0 ? (
                <div className="card">
                  <div className="chdr">
                    <div className="cico" style={{background:"#fff8f0"}}>⊘</div>
                    <div className="ctitle">Out of Order Rooms</div>
                    <span className="cbadge cb-gld">{oooCount} rooms</span>
                  </div>
                  <div className="twrap">
                    <table>
                      <thead><tr><th>Date</th><th>Hotel</th><th>Rooms</th><th>Count</th><th>Reason</th></tr></thead>
                      <tbody>
                        {data.oooRooms.map((r,i) => (
                          <tr key={i}>
                            <td className="mono">{r.date}</td>
                            <td style={{fontWeight:500,fontSize:11}}>{r.hotel}</td>
                            <td className="mono" style={{color:"var(--red)",fontWeight:600}}>{r.rooms||"—"}</td>
                            <td><span className={`tag ${(r.count||1)>3?"t-red":(r.count||1)>1?"t-gld":"t-gry"}`}>{r.count||1} rm</span></td>
                            <td style={{color:"#6b7280",fontSize:11}}>{r.reason||"Unknown"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card"><div className="empty">
                  <div className="eico">⊘</div>
                  <div className="etitle">{data?"No OOO rooms extracted":"No data loaded"}</div>
                  <div>{data?"OOO data is in PDF attachments — run Google Apps Script pipeline for full extraction":"Tap Fetch Report to load"}</div>
                </div></div>
              )}
            </div>
          )}

          {/* ══ LEDGER TAB ══ */}
          {tab === "ledger" && (
            <div className="fade">
              {data?.ledgerAccounts?.length > 0 ? (
                <>
                  <div className="two" style={{marginBottom:12}}>
                    <div className="kpi">
                      <div className="klbl">Total Accounts</div>
                      <div className="kval info">{data.ledgerAccounts.length}</div>
                      <div className="ksub">City + Guest ledger</div>
                    </div>
                    <div className="kpi">
                      <div className="klbl">Over Credit Limit</div>
                      <div className={`kval ${data.ledgerAccounts.filter(a=>(a.overLimit||0)>0).length>0?"alert":"ok"}`}>
                        {data.ledgerAccounts.filter(a=>(a.overLimit||0)>0).length}
                      </div>
                      <div className="ksub">Needs action</div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="chdr">
                      <div className="cico" style={{background:"#eff6ff"}}>≡</div>
                      <div className="ctitle">Ledger Account Balances</div>
                      <span className="cbadge cb-blu">{data.ledgerAccounts.length} accounts</span>
                    </div>
                    <div className="twrap">
                      <table>
                        <thead><tr><th>Hotel</th><th>Type</th><th>Acct</th><th>Name</th><th>Balance</th><th>Limit</th><th>Over</th><th>Status</th></tr></thead>
                        <tbody>
                          {data.ledgerAccounts.sort((a,b)=>(b.overLimit||0)-(a.overLimit||0)).map((a,i) => (
                            <tr key={i}>
                              <td style={{fontWeight:500,fontSize:11}}>{a.hotel}</td>
                              <td><span className="tag t-blu">{a.ledgerType}</span></td>
                              <td className="mono">{a.accountNum}</td>
                              <td style={{fontSize:11}}>{a.accountName}</td>
                              <td className="mono" style={{fontWeight:700,color:(a.currentBalance||0)>0?"var(--red)":"var(--green)"}}>
                                ${(a.currentBalance||0).toFixed(2)}
                              </td>
                              <td className="mono">${(a.creditLimit||0).toFixed(2)}</td>
                              <td className="mono" style={{color:(a.overLimit||0)>0?"var(--red)":"inherit",fontWeight:(a.overLimit||0)>0?700:400}}>
                                ${(a.overLimit||0).toFixed(2)}
                              </td>
                              <td><span className={`tag ${a.status==="OVER LIMIT"?"t-red":a.status==="BALANCE DUE"?"t-gld":"t-grn"}`}>{a.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card"><div className="empty">
                  <div className="eico">≡</div>
                  <div className="etitle">{data?"No ledger data extracted":"No data loaded"}</div>
                  <div>{data?"City Ledger balances are in PDF attachments. Run the Google Apps Script pipeline to extract them nightly.":"Tap Fetch Report to load"}</div>
                </div></div>
              )}
            </div>
          )}

          {/* ══ FINANCIAL TAB ══ */}
          {tab === "financial" && (
            <div className="fade">
              {data?.financialAlerts?.length > 0 ? (
                <div className="card">
                  <div className="chdr">
                    <div className="cico" style={{background:"#fef3c7"}}>$</div>
                    <div className="ctitle">Financial Alerts & Payments</div>
                    <span className="cbadge cb-gld">{data.financialAlerts.length} items</span>
                  </div>
                  <div className="twrap">
                    <table>
                      <thead><tr><th>Type</th><th>Hotel</th><th>Description</th><th>Amount</th><th>Due</th><th>Priority</th></tr></thead>
                      <tbody>
                        {data.financialAlerts.sort((a,b)=>a.severity==="high"?-1:1).map((a,i) => (
                          <tr key={i}>
                            <td><span className={`tag ${a.type?.includes("INVOICE")||a.type?.includes("COLLECT")?"t-red":a.type?.includes("PAYMENT")?"t-grn":"t-gld"}`}>
                              {(a.type||"OTHER").replace(/_/g," ")}
                            </span></td>
                            <td style={{fontWeight:500,fontSize:11}}>{a.hotel}</td>
                            <td style={{fontSize:11,maxWidth:220}}>{a.description}</td>
                            <td className="mono" style={{fontWeight:600}}>{a.amount>0?`$${a.amount.toLocaleString()}`:"—"}</td>
                            <td className="mono" style={{color:"var(--red)"}}>{a.dueDate||"—"}</td>
                            <td><span className={`tag ${a.severity==="high"?"t-red":a.severity==="medium"?"t-gld":"t-blu"}`}>{(a.severity||"low").toUpperCase()}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card"><div className="empty">
                  <div className="eico">$</div>
                  <div className="etitle">{data?"No financial alerts":"No data loaded"}</div>
                  <div>{data?"All clear — no invoices or payment items detected":"Tap Fetch Report to load"}</div>
                </div></div>
              )}
            </div>
          )}

        </main>
      </div>
    </>
  );
}
