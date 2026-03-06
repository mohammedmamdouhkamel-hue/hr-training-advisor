import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

// ── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = {
  linkedin:    { name: "LinkedIn Learning", color: "#0A66C2", icon: "in", bg: "#E8F0FE" },
  youtube:     { name: "YouTube",           color: "#FF0000", icon: "▶",  bg: "#FFE8E8" },
  coursera:    { name: "Coursera",          color: "#0056D2", icon: "C",  bg: "#E8F0FF" },
  udemy:       { name: "Udemy",             color: "#A435F0", icon: "U",  bg: "#F3E8FF" },
  pluralsight: { name: "Pluralsight",       color: "#F15B2A", icon: "P",  bg: "#FFF0EB" },
  aim:         { name: "AIM",               color: "#00897B", icon: "A",  bg: "#E0F5F3" },
};

const SAMPLE_DATA = [
  { name: "Sarah Al-Mansoori", role: "Software Engineer",  department: "Technology",      score: 58, competencies: { "Technical Skills": 55, "Communication": 72, "Problem Solving": 60, "Teamwork": 78, "Leadership": 45 } },
  { name: "Omar Khalid",       role: "Product Manager",    department: "Product",         score: 62, competencies: { "Strategic Thinking": 60, "Communication": 85, "Data Analysis": 55, "Stakeholder Mgmt": 70, "Execution": 58 } },
  { name: "Fatima Hassan",     role: "Data Analyst",       department: "Analytics",       score: 71, competencies: { "Data Analysis": 82, "Python/SQL": 65, "Visualization": 70, "Communication": 60, "Business Acumen": 68 } },
  { name: "Ahmed Nasser",      role: "UX Designer",        department: "Design",          score: 54, competencies: { "UI Design": 60, "User Research": 50, "Prototyping": 55, "Collaboration": 75, "Design Thinking": 48 } },
  { name: "Layla Ibrahim",     role: "HR Specialist",      department: "Human Resources", score: 67, competencies: { "Recruitment": 78, "L&D": 62, "Compliance": 70, "HRIS Systems": 55, "Analytics": 50 } },
];

// ── Data parsing ─────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  function splitLine(line) {
    const result = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  }
  const headers = splitLine(lines[0]);
  return lines.slice(1)
    .map(line => {
      const vals = splitLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || "").replace(/^"|"$/g, ""); });
      return obj;
    })
    .filter(r => Object.values(r).some(v => v !== ""));
}

function transformRawData(rows) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);

  const nameKey  = keys.find(k => /^employee.?name$/i.test(k))  || keys.find(k => /\bname\b/i.test(k) && !/comp/i.test(k)) || keys[0];
  const roleKey  = keys.find(k => /role|title|position/i.test(k)) || keys[1];
  const deptKey  = keys.find(k => /dept|department/i.test(k))   || keys[2];
  const overallKey = keys.find(k => /^overall.?score$/i.test(k)) || keys.find(k => /overall/i.test(k));

  // Paired format: "Competency N Name" + "Competency N Score"
  const compNameKeys  = keys.filter(k => /competency \d+ name/i.test(k)).sort();
  const compScoreKeys = keys.filter(k => /competency \d+ score/i.test(k)).sort();
  const isPaired = compNameKeys.length > 0 && compNameKeys.length === compScoreKeys.length;

  const metaRe   = /id|emp|date|year|period|manager|comment|rating|review|overall|competency \d/i;
  const flatKeys = !isPaired
    ? keys.filter(k => k !== nameKey && k !== roleKey && k !== deptKey && k !== overallKey && !metaRe.test(k))
    : [];

  return rows.map(r => {
    const comps = {};
    if (isPaired) {
      compNameKeys.forEach((nk, i) => {
        const n = String(r[nk] || "").trim();
        const v = parseFloat(r[compScoreKeys[i]]);
        if (n && !isNaN(v)) comps[n] = v;
      });
    } else {
      flatKeys.forEach(k => { const v = parseFloat(r[k]); if (!isNaN(v)) comps[k] = v; });
    }
    const scores = Object.values(comps);
    let score = overallKey ? parseFloat(r[overallKey]) : NaN;
    if (isNaN(score)) score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      name:         String(r[nameKey] || "").trim() || "Unknown",
      role:         String(r[roleKey] || "").trim() || "N/A",
      department:   String(r[deptKey] || "").trim() || "N/A",
      score,
      competencies: comps,
    };
  }).filter(e => e.name !== "Unknown" || e.score > 0);
}

// ── AI plan generation ───────────────────────────────────────────────────────

async function generateTrainingPlan(employee, apiKey) {
  const weakAreas = Object.entries(employee.competencies)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  const platformPool = ["youtube", "coursera", "udemy", "pluralsight", "aim", "linkedin"];
  let idx = 0;
  const next = () => platformPool[(idx++) % platformPool.length];
  const assigned = weakAreas.map(() => [next(), next()]);
  const assignments = weakAreas.map(([area], i) =>
    `- "${area}": course 1 → platform="${assigned[i][0]}", course 2 → platform="${assigned[i][1]}"`
  ).join("\n");

  const prompt = `You are an expert HR L&D advisor. Create a personalised 90-day training plan.

Employee: ${employee.name}
Role: ${employee.role}
Department: ${employee.department}
Overall Score: ${employee.score}/100

Competency Scores:
${Object.entries(employee.competencies).map(([k, v]) => `- ${k}: ${v}/100`).join("\n")}

Weakest areas:
${weakAreas.map(([k, v]) => `- ${k}: ${v}/100`).join("\n")}

MANDATORY PLATFORM ASSIGNMENTS (follow exactly, no exceptions):
${assignments}
- NEVER repeat a platform across the entire plan
- Use all 6 platforms: youtube, coursera, udemy, pluralsight, aim, linkedin

Respond ONLY with raw JSON (no markdown, no backticks, no preamble):
{
  "summary": "2-3 sentence personalised assessment",
  "priority_areas": ["area1", "area2", "area3"],
  "training_plan": [
    {
      "area": "competency name",
      "current_score": 0,
      "target_score": 0,
      "courses": [
        {
          "title": "specific real course title",
          "platform": "platform_as_assigned",
          "duration": "X hours",
          "level": "Beginner|Intermediate|Advanced",
          "description": "one sentence on why this addresses the gap",
          "search_query": "search query to find this on the platform"
        }
      ]
    }
  ],
  "milestones": [
    {"week": "Week 1-2",  "goal": "specific measurable goal"},
    {"week": "Week 3-6",  "goal": "specific measurable goal"},
    {"week": "Week 7-12", "goal": "specific measurable goal"}
  ],
  "expected_improvement": "Expected score improvement after 90 days"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text  = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/^```(?:json)?\s*|\s*```$/gm, "").trim();
  const plan  = JSON.parse(clean);

  // Enforce platform diversity as safety net
  const all  = ["youtube", "coursera", "udemy", "pluralsight", "aim", "linkedin"];
  const used = new Set();
  plan.training_plan?.forEach(area => {
    area.courses?.forEach(course => {
      if (!all.includes(course.platform)) course.platform = "linkedin";
      if (used.has(course.platform)) {
        const alt = all.find(p => !used.has(p));
        if (alt) course.platform = alt;
      }
      used.add(course.platform);
    });
  });

  return plan;
}

// ── Small UI components ──────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = score >= 80 ? "#10B981" : score >= 65 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Strong" : score >= 65 ? "Developing" : "Needs Focus";
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}40`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

function CompetencyBar({ name, score }) {
  const color = score >= 80 ? "#10B981" : score >= 65 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: "#64748B", fontWeight: 500 }}>{name}</span>
        <span style={{ color, fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function PlatformChip({ platform }) {
  const p = PLATFORMS[platform] || { name: platform, color: "#64748B", icon: "·", bg: "#F8F9FA" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: p.bg, color: p.color, border: `1px solid ${p.color}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      <span>{p.icon}</span>{p.name}
    </span>
  );
}

function CourseCard({ course }) {
  const urls = {
    youtube:     `https://www.youtube.com/results?search_query=${encodeURIComponent(course.search_query)}`,
    linkedin:    `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(course.search_query)}`,
    coursera:    `https://www.coursera.org/search?query=${encodeURIComponent(course.search_query)}`,
    udemy:       `https://www.udemy.com/courses/search/?q=${encodeURIComponent(course.search_query)}`,
    pluralsight: `https://www.pluralsight.com/search?q=${encodeURIComponent(course.search_query)}`,
    aim:         `https://www.google.com/search?q=AIM+training+${encodeURIComponent(course.search_query)}`,
  };
  const url = urls[course.platform] || `https://www.google.com/search?q=${encodeURIComponent(course.title)}`;
  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#1E293B", lineHeight: 1.4 }}>{course.title}</div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ background: "#0F172A", color: "#fff", fontSize: 11, padding: "4px 10px", borderRadius: 6, textDecoration: "none", whiteSpace: "nowrap", fontWeight: 600, flexShrink: 0 }}>
          Find →
        </a>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <PlatformChip platform={course.platform} />
        <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", borderRadius: 20, padding: "3px 10px" }}>{course.duration}</span>
        <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", borderRadius: 20, padding: "3px 10px" }}>{course.level}</span>
      </div>
      <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.5 }}>{course.description}</p>
    </div>
  );
}

function EmployeeCard({ emp, onSelect, isSelected, hasPlan }) {
  const scoreColor = emp.score >= 80 ? "#10B981" : emp.score >= 65 ? "#F59E0B" : "#EF4444";
  return (
    <div onClick={() => onSelect(emp)}
      style={{ background: isSelected ? "#0F172A" : "#fff", border: `2px solid ${isSelected ? "#0F172A" : "#E2E8F0"}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.2s", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#fff" : "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: isSelected ? "#94A3B8" : "#64748B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.role} · {emp.department}</div>
        </div>
        <div style={{ textAlign: "right", marginLeft: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? "#60A5FA" : scoreColor }}>{emp.score}</div>
          <div style={{ fontSize: 10, color: "#94A3B8" }}>/ 100</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {!isSelected && <ScoreBadge score={emp.score} />}
        {hasPlan && <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>✓ Plan Ready</span>}
      </div>
    </div>
  );
}

function TrainingPlanView({ plan, employee }) {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 12, color: "#60A5FA", fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>AI-Generated Training Plan</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{employee.name}</div>
        <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>{employee.role} · {employee.department}</div>
        <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>{plan.summary}</p>
        {plan.expected_improvement && (
          <div style={{ marginTop: 16, background: "#ffffff18", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#7DD3FC" }}>
            🎯 {plan.expected_improvement}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["Overview", "Training Plan", "Milestones"].map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: tab === i ? "#0F172A" : "#F1F5F9", color: tab === i ? "#fff" : "#64748B" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Priority Focus Areas</div>
          {plan.priority_areas?.map((area, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
              <span style={{ background: "#F97316", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontWeight: 600, color: "#92400E", fontSize: 13 }}>{area}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Competency Scores</div>
          {Object.entries(employee.competencies).map(([k, v]) => <CompetencyBar key={k} name={k} score={v} />)}
        </div>
      )}

      {tab === 1 && (
        <div>
          {plan.training_plan?.map((area, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B" }}>{area.area}</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  <span style={{ color: "#EF4444", fontWeight: 600 }}>{area.current_score}</span>
                  {" → "}
                  <span style={{ color: "#10B981", fontWeight: 600 }}>{area.target_score}</span>
                </div>
              </div>
              {area.courses?.map((c, j) => <CourseCard key={j} course={c} />)}
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div>
          {plan.milestones?.map((m, i, arr) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />}
              </div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 18px", flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", marginBottom: 4 }}>{m.week}</div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{m.goal}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── API Key Modal ─────────────────────────────────────────────────────────────

function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 480, width: "90%", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>🔑</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center" }}>Enter your Anthropic API Key</h2>
        <p style={{ margin: "0 0 24px", color: "#64748B", fontSize: 14, lineHeight: 1.6, textAlign: "center" }}>
          Your key is stored only in memory for this session — never saved to disk or sent anywhere except Anthropic's API.
        </p>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && key.startsWith("sk-") && onSave(key)}
            placeholder="sk-ant-api03-..."
            style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 14, fontFamily: "monospace", outline: "none", boxSizing: "border-box", color: "#0F172A" }}
          />
          <button onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16 }}>
            {show ? "🙈" : "👁"}
          </button>
        </div>
        <button
          onClick={() => key.startsWith("sk-") && onSave(key)}
          disabled={!key.startsWith("sk-")}
          style={{ width: "100%", background: key.startsWith("sk-") ? "linear-gradient(135deg, #3B82F6, #8B5CF6)" : "#E2E8F0", color: key.startsWith("sk-") ? "#fff" : "#94A3B8", border: "none", padding: "13px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: key.startsWith("sk-") ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
          Start Session →
        </button>
        <p style={{ margin: "16px 0 0", color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
          Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6" }}>console.anthropic.com</a>
        </p>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function HRTrainingAdvisor() {
  const [apiKey, setApiKey]       = useState("");
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [plans, setPlans]         = useState({});
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError]         = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [view, setView]           = useState("upload");
  const generatingRef             = useRef(false);

  // Auto-generate when employee is selected and no plan exists
  useEffect(() => {
    if (!selected || plans[selected.name] || generatingRef.current) return;
    doGenerate(selected);
  }, [selected?.name]);

  const doGenerate = async (emp) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setLoading(true);
    setError("");
    setLoadingMsg(`Analysing ${emp.name}'s performance data...`);
    const t1 = setTimeout(() => setLoadingMsg("Searching LinkedIn, YouTube, Coursera & more..."), 1800);
    const t2 = setTimeout(() => setLoadingMsg("Building personalised 90-day roadmap..."), 3500);
    try {
      const plan = await generateTrainingPlan(emp, apiKey);
      setPlans(prev => ({ ...prev, [emp.name]: plan }));
    } catch (e) {
      setError(e.message);
    } finally {
      clearTimeout(t1); clearTimeout(t2);
      setLoading(false);
      generatingRef.current = false;
    }
  };

  const handleSelect = (emp) => {
    setError("");
    if (selected?.name === emp.name) {
      if (!plans[emp.name] && !generatingRef.current) doGenerate(emp);
      return;
    }
    setSelected(emp);
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError("");
    setUploadedFile(file.name);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let rows;
      if (ext === "csv") {
        rows = parseCSV(await file.text());
      } else if (ext === "xlsx" || ext === "xls") {
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      } else {
        throw new Error("Unsupported format. Please upload .xlsx, .xls, or .csv.");
      }
      if (!rows.length) throw new Error("File appears empty.");
      const data = transformRawData(rows);
      if (!data.length) throw new Error("Could not detect employee rows.");
      if (!data.some(e => Object.keys(e.competencies).length > 0)) {
        throw new Error(`No competency scores found. Columns: ${Object.keys(rows[0]).join(", ")}`);
      }
      setEmployees(data);
      setSelected(null);
      setPlans({});
      setView("dashboard");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const loadSample = () => {
    setEmployees(SAMPLE_DATA);
    setUploadedFile("sample_performance_data.csv");
    setSelected(null); setPlans({}); setError("");
    setView("dashboard");
  };

  const generateAll = async () => {
    if (generatingRef.current) return;
    for (const emp of employees.filter(e => !plans[e.name])) {
      setSelected(emp);
      await new Promise(r => setTimeout(r, 50));
      generatingRef.current = true;
      setLoading(true);
      setLoadingMsg(`Processing ${emp.name} (${employees.indexOf(emp) + 1}/${employees.length})...`);
      try {
        const plan = await generateTrainingPlan(emp, apiKey);
        setPlans(prev => ({ ...prev, [emp.name]: plan }));
      } catch (_) { /* continue */ }
      generatingRef.current = false;
    }
    setLoading(false);
  };

  const needsFocus  = employees.filter(e => e.score < 65);
  const developing  = employees.filter(e => e.score >= 65 && e.score < 80);
  const strong      = employees.filter(e => e.score >= 80);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        .upload-zone:hover { border-color: #3B82F6 !important; background: #EFF6FF !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* API Key gate */}
      {!apiKey && <ApiKeyModal onSave={setApiKey} />}

      {/* Header */}
      <div style={{ background: "#0F172A", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎯</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>HR Training Advisor</div>
            <div style={{ color: "#60A5FA", fontSize: 11, fontWeight: 500 }}>Powered by AI · SuccessFactors Integration</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {view === "dashboard" && (
            <>
              <button onClick={() => { setView("upload"); setSelected(null); }}
                style={{ background: "transparent", border: "1px solid #334155", color: "#94A3B8", padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                ← Upload New
              </button>
              <button onClick={generateAll} disabled={loading}
                style={{ background: loading ? "#334155" : "linear-gradient(135deg, #3B82F6, #8B5CF6)", border: "none", color: "#fff", padding: "7px 16px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                {loading ? "⏳ Generating..." : "⚡ Generate All Plans"}
              </button>
            </>
          )}
          <button onClick={() => setApiKey("")}
            style={{ background: "transparent", border: "1px solid #334155", color: "#94A3B8", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, title: "Change API Key" }}>
            🔑
          </button>
        </div>
      </div>

      {/* Upload view */}
      {view === "upload" && (
        <div style={{ maxWidth: 620, margin: "80px auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", margin: "0 0 12px", letterSpacing: -1 }}>Performance-Driven Training</h1>
            <p style={{ color: "#64748B", fontSize: 16, margin: 0, lineHeight: 1.6 }}>Upload SuccessFactors performance data to generate AI-powered, personalised training roadmaps.</p>
          </div>

          <div className="upload-zone"
            onClick={() => document.getElementById("hrFileInput").click()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
            style={{ border: "2px dashed #CBD5E1", borderRadius: 16, padding: "48px 32px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "#fff" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1E293B", marginBottom: 8 }}>Drop your file here</div>
            <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: 20 }}>Supports .xlsx, .xls and .csv · SAP SuccessFactors export ready</div>
            <div style={{ background: "#0F172A", color: "#fff", display: "inline-block", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Choose File</div>
            <input id="hrFileInput" type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>

          {error && <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: 13 }}>⚠️ {error}</div>}

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ color: "#94A3B8", fontSize: 13 }}>No file yet? </span>
            <button onClick={loadSample} style={{ background: "none", border: "none", color: "#3B82F6", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Load sample data</button>
          </div>

          <div style={{ marginTop: 40, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>Supported Training Platforms</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.keys(PLATFORMS).map(k => <PlatformChip key={k} platform={k} />)}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard view */}
      {view === "dashboard" && (
        <div style={{ display: "flex", height: "calc(100vh - 69px)" }}>
          {/* Sidebar */}
          <div style={{ width: 320, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>📁 {uploadedFile}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{employees.length} Employees</div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                {[["#EF4444", needsFocus.length, "Needs Focus"], ["#F59E0B", developing.length, "Developing"], ["#10B981", strong.length, "Strong"], ["#3B82F6", Object.keys(plans).length, "Plans Ready"]].map(([color, count, label]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {needsFocus.length > 0 && <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚠ Needs Focus</div>
                {needsFocus.map(e => <EmployeeCard key={e.name} emp={e} onSelect={handleSelect} isSelected={selected?.name === e.name} hasPlan={!!plans[e.name]} />)}
              </>}
              {developing.length > 0 && <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 8px" }}>↑ Developing</div>
                {developing.map(e => <EmployeeCard key={e.name} emp={e} onSelect={handleSelect} isSelected={selected?.name === e.name} hasPlan={!!plans[e.name]} />)}
              </>}
              {strong.length > 0 && <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 8px" }}>✓ Strong</div>
                {strong.map(e => <EmployeeCard key={e.name} emp={e} onSelect={handleSelect} isSelected={selected?.name === e.name} hasPlan={!!plans[e.name]} />)}
              </>}
            </div>
          </div>

          {/* Main panel */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            {!selected && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>👈</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#CBD5E1" }}>Select an employee</div>
                <div style={{ fontSize: 13, marginTop: 6, color: "#94A3B8" }}>Click any card to instantly generate their AI training plan</div>
              </div>
            )}
            {selected && loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #E2E8F0", borderTopColor: "#3B82F6", animation: "spin 0.8s linear infinite", marginBottom: 24 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>{loadingMsg}</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>AI is curating courses from 6 platforms</div>
              </div>
            )}
            {selected && !loading && error && (
              <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#BE123C", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Error generating plan</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
                <button onClick={() => doGenerate(selected)}
                  style={{ background: "#BE123C", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  Retry
                </button>
              </div>
            )}
            {selected && !loading && !error && plans[selected.name] && (
              <TrainingPlanView plan={plans[selected.name]} employee={selected} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
