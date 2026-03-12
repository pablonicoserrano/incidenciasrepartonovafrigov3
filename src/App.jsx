import { useState, useRef, useCallback, useEffect } from "react";

// ─── EMAILJS CONFIG ──────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_3pe61x5";
const EMAILJS_TEMPLATE_ID = "template_pf9rt3rP";
const EMAILJS_PUBLIC_KEY = "PUi9uhHEJu7dc55Zd";
const NOTIFY_EMAIL = "p.serrano-jaimes@groupe-pomona.fr";

async function sendIncidentEmail(incident, client) {
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: NOTIFY_EMAIL,
          repartidor: incident.repartidor || "Repartidor App",
          cliente: client.name,
          codigo: incident.code,
          tipo: getCodeLabel(incident.dept, incident.code),
          articulos: incident.articulos?.join(", ") || "—",
          descripcion: incident.desc || "Sin observaciones",
          fecha: new Date().toLocaleString("es-ES"),
          comercial: client.comercial,
        }
      })
    });
    return res.status === 200;
  } catch (e) {
    console.error("EmailJS error:", e);
    return false;
  }
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const INCIDENT_CODES = {
  A: {
    label: "Almacén", color: "#f59e0b", bg: "#fef3c7",
    codes: {
      A1: "Falta Almacén", A2: "Sobra Almacén", A3: "Rotura en almacén",
      A4: "Error peso", A5: "Producto Caducado"
    }
  },
  C: {
    label: "Cliente", color: "#8b5cf6", bg: "#ede9fe",
    codes: {
      C1: "Cliente cerrado", C2: "No lo quiere", C3: "Cámara rota",
      C4: "No tiene dinero"
    }
  },
  V: {
    label: "Ventas / Comercial", color: "#3b82f6", bg: "#dbeafe",
    codes: {
      V1: "Error precio", V2: "Pedido duplicado", V3: "Mal grabado",
      V4: "Cliente no lo ha pedido", V5: "Cliente cerrado por fuera de ruta"
    }
  },
  D: {
    label: "Distribución / Reparto", color: "#10b981", bg: "#d1fae5",
    codes: {
      D1: "Falta Reparto", D2: "Sobra Reparto", D3: "Cerrado por retardo",
      D4: "Rotura de caja en reparto"
    }
  },
  Q: {
    label: "Calidad", color: "#ef4444", bg: "#fee2e2",
    codes: { Q1: "Producto mal aspecto" }
  }
};

const MOCK_CLIENTS = {
  "1001": {
    name: "Bar El Rincón", address: "C/ Mayor 12, Madrid",
    comercial: "Carlos López", email: "comercial1@empresa.com",
    pedido: [
      { ref: "LEC001", desc: "Leche Entera 1L", qty: 24, precio: 1.20 },
      { ref: "QUE002", desc: "Queso Manchego 500g", qty: 6, precio: 4.50 },
      { ref: "YOG003", desc: "Yogur Natural Pack 8", qty: 12, precio: 2.30 },
      { ref: "MAN004", desc: "Mantequilla 250g", qty: 8, precio: 1.80 },
    ]
  },
  "1002": {
    name: "Restaurante La Plaza", address: "Av. Libertad 45, Sevilla",
    comercial: "María García", email: "comercial2@empresa.com",
    pedido: [
      { ref: "ACE001", desc: "Aceite Oliva 5L", qty: 10, precio: 12.00 },
      { ref: "HAR002", desc: "Harina T65 25kg", qty: 4, precio: 18.00 },
      { ref: "SAL003", desc: "Sal Gruesa 1kg", qty: 20, precio: 0.90 },
    ]
  },
  "1003": {
    name: "Supermercado Familiar", address: "C/ Comercio 8, Valencia",
    comercial: "Pedro Martínez", email: "comercial3@empresa.com",
    pedido: [
      { ref: "CER001", desc: "Cerveza 33cl Pack 24", qty: 30, precio: 15.00 },
      { ref: "AGU002", desc: "Agua 1.5L Pack 6", qty: 50, precio: 3.20 },
      { ref: "REF003", desc: "Refresco Cola 2L", qty: 24, precio: 2.10 },
      { ref: "ZUM004", desc: "Zumo Naranja 1L", qty: 18, precio: 2.80 },
      { ref: "VIN005", desc: "Vino Tinto 75cl", qty: 12, precio: 5.50 },
    ]
  }
};

const MOCK_INCIDENTS = [
  { id: 1, date: "2025-01-15 09:23", repartidor: "Juan Pérez", clientCode: "1001", clientName: "Bar El Rincón", code: "A1", dept: "A", desc: "Faltan 6 unidades de leche", articulos: ["LEC001"], status: "pendiente", comercial: "Carlos López" },
  { id: 2, date: "2025-01-15 10:45", repartidor: "Ana Ruiz", clientCode: "1002", clientName: "Restaurante La Plaza", code: "V4", dept: "V", desc: "Cliente dice no haber pedido el aceite", articulos: ["ACE001"], status: "en_proceso", comercial: "María García" },
  { id: 3, date: "2025-01-15 11:30", repartidor: "Juan Pérez", clientCode: "1003", clientName: "Supermercado Familiar", code: "D4", dept: "D", desc: "Caja de cerveza rota durante reparto", articulos: ["CER001"], status: "resuelto", comercial: "Pedro Martínez" },
  { id: 4, date: "2025-01-14 14:20", repartidor: "Luis Sánchez", clientCode: "1001", clientName: "Bar El Rincón", code: "C1", dept: "C", desc: "Cliente cerrado, no pudimos entregar", articulos: [], status: "pendiente", comercial: "Carlos López" },
  { id: 5, date: "2025-01-14 16:00", repartidor: "Ana Ruiz", clientCode: "1002", clientName: "Restaurante La Plaza", code: "Q1", dept: "Q", desc: "Queso en mal estado, descongelado", articulos: ["QUE002"], status: "en_proceso", comercial: "María García" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getDeptInfo = (dept) => INCIDENT_CODES[dept] || { label: dept, color: "#6b7280", bg: "#f3f4f6" };
const getCodeLabel = (dept, code) => INCIDENT_CODES[dept]?.codes[code] || code;
const statusConfig = {
  pendiente: { label: "Pendiente", color: "#ef4444", bg: "#fee2e2" },
  en_proceso: { label: "En proceso", color: "#f59e0b", bg: "#fef3c7" },
  resuelto: { label: "Resuelto", color: "#10b981", bg: "#d1fae5" }
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Badge({ dept, code }) {
  const d = getDeptInfo(dept);
  return (
    <span style={{ background: d.bg, color: d.color, border: `1px solid ${d.color}30`, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
      {code} · {getCodeLabel(dept, code)}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = statusConfig[status] || statusConfig.pendiente;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

// ─── DRIVER VIEW (Mobile) ─────────────────────────────────────────────────────
function DriverView({ onIncidentSubmit }) {
  const [step, setStep] = useState(1); // 1=client, 2=items, 3=incident, 4=success
  const [clientCode, setClientCode] = useState("");
  const [client, setClient] = useState(null);
  const [clientError, setClientError] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef();

  const lookupClient = () => {
    const c = MOCK_CLIENTS[clientCode.trim()];
    if (c) { setClient(c); setClientError(""); setStep(2); }
    else setClientError("Cliente no encontrado. Prueba: 1001, 1002, 1003");
  };

  const toggleItem = (ref) => {
    setSelectedItems(prev => prev.includes(ref) ? prev.filter(r => r !== ref) : [...prev, ref]);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setPhoto(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const [emailSent, setEmailSent] = useState(null); // null | true | false

  const submit = async () => {
    setSending(true);
    const incident = {
      id: Date.now(), date: new Date().toLocaleString("es-ES"),
      repartidor: "Repartidor App", clientCode, clientName: client.name,
      code: selectedCode, dept: selectedDept,
      desc: notes, articulos: selectedItems,
      status: "pendiente", comercial: client.comercial,
      photo
    };
    const ok = await sendIncidentEmail(incident, client);
    setEmailSent(ok);
    onIncidentSubmit(incident);
    setSending(false);
    setStep(4);
  };

  const reset = () => {
    setStep(1); setClientCode(""); setClient(null); setSelectedItems([]);
    setSelectedDept(""); setSelectedCode(""); setNotes(""); setPhoto(null); setEmailSent(null);
  };

  const s = { // mobile styles
    screen: { maxWidth: 420, margin: "0 auto", padding: "0 0 40px 0", minHeight: "100vh", background: "#0f172a", color: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: "#1e293b", padding: "20px 20px 16px", borderBottom: "1px solid #334155" },
    body: { padding: "20px 16px" },
    label: { fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" },
    input: { width: "100%", background: "#1e293b", border: "1.5px solid #334155", borderRadius: 12, padding: "14px 16px", color: "#f8fafc", fontSize: 16, outline: "none", boxSizing: "border-box" },
    btn: { width: "100%", background: "#3b82f6", color: "white", border: "none", borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8 },
    btnSecondary: { background: "#1e293b", border: "1.5px solid #334155", color: "#f8fafc" },
    card: { background: "#1e293b", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1.5px solid #334155" },
    row: { display: "flex", alignItems: "center", gap: 10 },
  };

  if (step === 4) return (
    <div style={s.screen}>
      <div style={{ ...s.body, textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Incidencia enviada</h2>

        {/* Email status */}
        <div style={{ margin: "0 0 24px", padding: "14px 20px", borderRadius: 14, background: emailSent ? "#d1fae5" : "#fee2e2", border: `1.5px solid ${emailSent ? "#6ee7b7" : "#fca5a5"}` }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{emailSent ? "📧" : "⚠️"}</div>
          {emailSent ? (
            <>
              <div style={{ fontWeight: 700, color: "#065f46", fontSize: 15 }}>Email enviado correctamente</div>
              <div style={{ color: "#047857", fontSize: 13, marginTop: 2 }}>p.serrano-jaimes@groupe-pomona.fr</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 15 }}>No se pudo enviar el email</div>
              <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 2 }}>Incidencia guardada. Revisa la configuración EmailJS.</div>
            </>
          )}
        </div>

        <div style={{ background: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>RESUMEN</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{client?.name}</div>
          <Badge dept={selectedDept} code={selectedCode} />
          <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>{selectedItems.length} artículo(s) afectado(s)</div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>Comercial: {client?.comercial}</div>
        </div>
        <button style={s.btn} onClick={reset}>Nueva incidencia</button>
      </div>
    </div>
  );

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Vista Repartidor</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>📦 Nueva Incidencia</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ width: 28, height: 4, borderRadius: 2, background: step >= n ? "#3b82f6" : "#334155" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={s.body}>

        {/* STEP 1 - Client */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Buscar cliente</div>
              <div style={{ color: "#64748b", fontSize: 14 }}>Introduce el código de cliente</div>
            </div>
            <label style={s.label}>Código cliente</label>
            <input style={s.input} value={clientCode} onChange={e => setClientCode(e.target.value)}
              placeholder="ej. 1001" onKeyDown={e => e.key === "Enter" && lookupClient()} />
            {clientError && <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>⚠ {clientError}</div>}
            <button style={s.btn} onClick={lookupClient}>Buscar →</button>
            <div style={{ marginTop: 20, background: "#1e293b", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>CLIENTES DE PRUEBA</div>
              {Object.entries(MOCK_CLIENTS).map(([code, c]) => (
                <div key={code} style={{ ...s.row, marginBottom: 8, cursor: "pointer" }} onClick={() => { setClientCode(code); }}>
                  <div style={{ background: "#0f172a", borderRadius: 8, padding: "4px 8px", fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{code}</div>
                  <div style={{ fontSize: 14 }}>{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 - Select articles */}
        {step === 2 && client && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, marginBottom: 4 }}>CLIENTE ENCONTRADO</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{client.name}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{client.address}</div>
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>Selecciona los artículos con incidencia:</div>
            {client.pedido.map(item => {
              const sel = selectedItems.includes(item.ref);
              return (
                <div key={item.ref} onClick={() => toggleItem(item.ref)}
                  style={{ ...s.card, border: sel ? "1.5px solid #3b82f6" : "1.5px solid #334155", background: sel ? "#1d3557" : "#1e293b", cursor: "pointer" }}>
                  <div style={{ ...s.row, justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.desc}</div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{item.ref} · {item.qty} uds · {item.precio}€/u</div>
                    </div>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: sel ? "#3b82f6" : "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {sel ? "✓" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ ...s.row, marginTop: 12 }}>
              <button style={{ ...s.btn, ...s.btnSecondary, flex: 1 }} onClick={() => setStep(1)}>← Atrás</button>
              <button style={{ ...s.btn, flex: 2, marginTop: 0 }} onClick={() => setStep(3)} disabled={selectedItems.length === 0}
                opacity={selectedItems.length === 0 ? 0.5 : 1}>
                Continuar ({selectedItems.length}) →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - Incident details */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Tipo de incidencia</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{selectedItems.length} artículo(s) seleccionado(s)</div>
            </div>

            {Object.entries(INCIDENT_CODES).map(([dept, info]) => (
              <div key={dept} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: info.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {dept} · {info.label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(info.codes).map(([code, label]) => {
                    const sel = selectedCode === code;
                    return (
                      <button key={code} onClick={() => { setSelectedDept(dept); setSelectedCode(code); }}
                        style={{ background: sel ? info.color : "#1e293b", color: sel ? "white" : "#94a3b8", border: `1.5px solid ${sel ? info.color : "#334155"}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        {code} · {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              <label style={s.label}>Observaciones</label>
              <textarea style={{ ...s.input, height: 90, resize: "none" }} value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="Describe el problema..." />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Foto del producto</label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
              {photo ? (
                <div style={{ position: "relative" }}>
                  <img src={photo} alt="foto" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover" }} />
                  <button onClick={() => setPhoto(null)}
                    style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>
                    ✕
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current.click()}
                  style={{ ...s.card, width: "100%", border: "2px dashed #334155", textAlign: "center", cursor: "pointer", color: "#64748b", fontSize: 15, background: "transparent" }}>
                  📷 Tomar / subir foto
                </button>
              )}
            </div>

            <div style={{ ...s.row, marginTop: 16 }}>
              <button style={{ ...s.btn, ...s.btnSecondary, flex: 1 }} onClick={() => setStep(2)}>← Atrás</button>
              <button style={{ ...s.btn, flex: 2, marginTop: 0, background: selectedCode && !sending ? "#3b82f6" : "#334155" }}
                onClick={submit} disabled={!selectedCode || sending}>
                {sending ? "Enviando..." : "📤 Enviar incidencia"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OFFICE PANEL ─────────────────────────────────────────────────────────────
function OfficePanel({ incidents, onStatusChange }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = incidents.filter(i => {
    if (filter !== "all" && i.status !== filter) return false;
    if (search && !i.clientName.toLowerCase().includes(search.toLowerCase()) &&
        !i.repartidor.toLowerCase().includes(search.toLowerCase()) &&
        !i.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const s = {
    container: { padding: "24px", color: "#0f172a", fontFamily: "'DM Sans', system-ui, sans-serif" },
    card: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 16, marginBottom: 10, cursor: "pointer" },
    badge: (dept) => { const d = getDeptInfo(dept); return { background: d.bg, color: d.color, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }; },
  };

  const exportCSV = () => {
    const rows = [["ID","Fecha","Repartidor","Cliente","Código","Tipo","Descripción","Estado","Comercial"]];
    incidents.forEach(i => rows.push([i.id, i.date, i.repartidor, i.clientName, i.code, getCodeLabel(i.dept, i.code), i.desc, i.status, i.comercial]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "incidencias.csv"; a.click();
  };

  return (
    <div style={s.container}>
      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>← Volver</button>
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>INCIDENCIA #{selected.id}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{selected.clientName}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>{selected.date} · {selected.repartidor}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Badge dept={selected.dept} code={selected.code} />
            </div>
            {selected.desc && <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 16 }}>{selected.desc}</div>}
            {selected.articulos?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>ARTÍCULOS AFECTADOS</div>
                {selected.articulos.map(ref => (
                  <div key={ref} style={{ background: "#fef3c7", borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>📦 {ref}</div>
                ))}
              </div>
            )}
            {selected.photo && <img src={selected.photo} alt="foto" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover", marginBottom: 16 }} />}
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>CAMBIAR ESTADO</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(statusConfig).map(([k, v]) => (
                <button key={k} onClick={() => { onStatusChange(selected.id, k); setSelected({ ...selected, status: k }); }}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${selected.status === k ? v.color : "#e2e8f0"}`, background: selected.status === k ? v.bg : "white", color: selected.status === k ? v.color : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                  {v.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 14, background: "#f0f9ff", borderRadius: 12, border: "1px solid #bae6fd" }}>
              <div style={{ fontSize: 12, color: "#0369a1", fontWeight: 700, marginBottom: 4 }}>COMERCIAL ASIGNADO</div>
              <div style={{ fontWeight: 700 }}>{selected.comercial}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Email notificado al crear incidencia</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente, repartidor, código..."
              style={{ flex: 1, minWidth: 200, background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14 }} />
            <button onClick={exportCSV}
              style={{ background: "#10b981", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              ↓ Exportar CSV
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {[["all", "Todas", "#6b7280"], ...Object.entries(statusConfig).map(([k, v]) => [k, v.label, v.color])].map(([k, label, color]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filter === k ? color : "#e2e8f0"}`, background: filter === k ? color : "white", color: filter === k ? "white" : "#64748b", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No hay incidencias</div>}

          {filtered.map(inc => (
            <div key={inc.id} style={s.card} onClick={() => setSelected(inc)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <Badge dept={inc.dept} code={inc.code} />
                    <StatusBadge status={inc.status} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{inc.clientName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{inc.date} · {inc.repartidor}</div>
                  {inc.desc && <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{inc.desc.substring(0, 60)}...</div>}
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 18 }}>›</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── PIE CHART ────────────────────────────────────────────────────────────────
function PieChart({ incidents }) {
  const [hovered, setHovered] = useState(null); // dept key
  const [tooltip, setTooltip] = useState(null); // {x, y, dept}
  const size = 260;
  const cx = size / 2, cy = size / 2, r = 100, innerR = 58;

  // Build slices by dept
  const depts = Object.keys(INCIDENT_CODES);
  const byDept = {};
  depts.forEach(d => { byDept[d] = incidents.filter(i => i.dept === d).length; });
  const total = incidents.length || 1;

  // Compute arcs
  let cumAngle = -Math.PI / 2;
  const slices = depts.map(dept => {
    const count = byDept[dept] || 0;
    const angle = (count / total) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    return { dept, count, angle, start, end: cumAngle };
  }).filter(s => s.count > 0);

  const polarToXY = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  });

  const arcPath = (start, end, outerR, innerRadius, expand = false) => {
    const exp = expand ? 8 : 0;
    const midAngle = (start + end) / 2;
    const ox = exp * Math.cos(midAngle);
    const oy = exp * Math.sin(midAngle);
    const s1 = polarToXY(start, outerR);
    const e1 = polarToXY(end, outerR);
    const s2 = polarToXY(end, innerRadius);
    const e2 = polarToXY(start, innerRadius);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${s1.x + ox} ${s1.y + oy} A ${outerR} ${outerR} 0 ${large} 1 ${e1.x + ox} ${e1.y + oy} L ${s2.x + ox} ${s2.y + oy} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${e2.x + ox} ${e2.y + oy} Z`;
  };

  const handleMouseMove = (e, dept) => {
    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, dept });
    setHovered(dept);
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div style={{ position: "relative" }}>
        <svg width={size} height={size} style={{ overflow: "visible" }}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}>
          {slices.map(({ dept, start, end }) => {
            const d = getDeptInfo(dept);
            const isHov = hovered === dept;
            return (
              <path key={dept}
                d={arcPath(start, end, r, innerR, isHov)}
                fill={d.color}
                opacity={hovered && !isHov ? 0.35 : 1}
                style={{ cursor: "pointer", transition: "opacity 0.2s, d 0.15s" }}
                onMouseMove={e => handleMouseMove(e, dept)}
                onMouseEnter={() => setHovered(dept)}
              />
            );
          })}
          {/* Center label */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={28} fontWeight={900} fill="#0f172a">{incidents.length}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#94a3b8" fontWeight={600}>TOTAL</text>
        </svg>

        {/* Tooltip */}
        {tooltip && hovered && (() => {
          const d = getDeptInfo(hovered);
          const subcodes = Object.entries(INCIDENT_CODES[hovered]?.codes || {});
          return (
            <div style={{
              position: "absolute", left: tooltip.x + 12, top: tooltip.y - 10,
              background: "white", border: `2px solid ${d.color}`, borderRadius: 12,
              padding: "12px 16px", minWidth: 180, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", zIndex: 10, pointerEvents: "none"
            }}>
              <div style={{ fontWeight: 800, color: d.color, fontSize: 13, marginBottom: 8 }}>
                {hovered} · {d.label} ({byDept[hovered] || 0})
              </div>
              {subcodes.map(([code, label]) => {
                const cnt = incidents.filter(i => i.code === code).length;
                return (
                  <div key={code} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, marginBottom: 4, color: cnt > 0 ? "#0f172a" : "#cbd5e1" }}>
                    <span><b>{code}</b> · {label}</span>
                    <span style={{ fontWeight: 700, color: cnt > 0 ? d.color : "#cbd5e1" }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div style={{ flex: 1, minWidth: 160 }}>
        {slices.map(({ dept, count }) => {
          const d = getDeptInfo(dept);
          const pct = Math.round((count / total) * 100);
          return (
            <div key={dept}
              onMouseEnter={() => setHovered(dept)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "default", opacity: hovered && hovered !== dept ? 0.4 : 1, transition: "opacity 0.2s" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{dept} · {d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{count}</span>
                </div>
                <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 3 }}>
                  <div style={{ height: 4, borderRadius: 2, background: d.color, width: `${pct}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ACTION PANEL ─────────────────────────────────────────────────────────────
function ActionPanel({ incidents, onStatusChange }) {
  const [activeStatus, setActiveStatus] = useState("pendiente");
  const [selectedInc, setSelectedInc] = useState(null);

  const counts = {
    pendiente: incidents.filter(i => i.status === "pendiente").length,
    en_proceso: incidents.filter(i => i.status === "en_proceso").length,
    resuelto: incidents.filter(i => i.status === "resuelto").length,
  };

  const filtered = incidents.filter(i => i.status === activeStatus);

  const handleStatus = (id, newStatus) => {
    onStatusChange(id, newStatus);
    if (selectedInc?.id === id) setSelectedInc({ ...selectedInc, status: newStatus });
  };

  const statusCols = [
    { key: "pendiente", label: "⚡ Pendientes", color: "#ef4444", bg: "#fee2e2", desc: "Requieren atención inmediata" },
    { key: "en_proceso", label: "🔄 En proceso", color: "#f59e0b", bg: "#fef3c7", desc: "Se está gestionando" },
    { key: "resuelto", label: "✅ Resueltas", color: "#10b981", bg: "#d1fae5", desc: "Completadas" },
  ];

  return (
    <div>
      {/* Status selector tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {statusCols.map(({ key, label, color, bg, desc }) => (
          <button key={key} onClick={() => { setActiveStatus(key); setSelectedInc(null); }}
            style={{
              flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 14,
              border: `2px solid ${activeStatus === key ? color : "#e2e8f0"}`,
              background: activeStatus === key ? bg : "white",
              cursor: "pointer", textAlign: "left", transition: "all 0.2s"
            }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, marginBottom: 2 }}>{counts[key]}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: activeStatus === key ? color : "#374151" }}>{label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{desc}</div>
          </button>
        ))}
      </div>

      {/* Split: list + detail */}
      <div style={{ display: "grid", gridTemplateColumns: selectedInc ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* List */}
        <div>
          {filtered.length === 0 && (
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 40, textAlign: "center", color: "#94a3b8" }}>
              No hay incidencias {statusCols.find(s => s.key === activeStatus)?.label.toLowerCase()}
            </div>
          )}
          {filtered.map(inc => {
            const d = getDeptInfo(inc.dept);
            const isSel = selectedInc?.id === inc.id;
            return (
              <div key={inc.id} onClick={() => setSelectedInc(isSel ? null : inc)}
                style={{
                  background: "white", borderRadius: 14, border: `2px solid ${isSel ? d.color : "#e2e8f0"}`,
                  padding: "14px 16px", marginBottom: 8, cursor: "pointer",
                  boxShadow: isSel ? `0 0 0 3px ${d.color}20` : "none", transition: "all 0.15s"
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Badge dept={inc.dept} code={inc.code} />
                    </div>
                    <div style={{ fontWeight: 700 }}>{inc.clientName}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{inc.date} · {inc.repartidor}</div>
                    {inc.desc && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{inc.desc.substring(0, 55)}{inc.desc.length > 55 ? "…" : ""}</div>}
                  </div>
                  <div style={{ fontSize: 18, color: "#cbd5e1", marginLeft: 8 }}>{isSel ? "✕" : "›"}</div>
                </div>
                {/* Quick action buttons */}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {Object.entries(statusConfig).filter(([k]) => k !== activeStatus).map(([k, v]) => (
                    <button key={k} onClick={e => { e.stopPropagation(); handleStatus(inc.id, k); }}
                      style={{ padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${v.color}40`, background: v.bg, color: v.color, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      → {v.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedInc && (
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20, alignSelf: "start", position: "sticky", top: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>DETALLE #{selectedInc.id}</div>
              <StatusBadge status={selectedInc.status} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{selectedInc.clientName}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{selectedInc.date} · {selectedInc.repartidor}</div>
            <Badge dept={selectedInc.dept} code={selectedInc.code} />

            {selectedInc.desc && (
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 13, marginTop: 12, color: "#374151" }}>
                {selectedInc.desc}
              </div>
            )}

            {selectedInc.articulos?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>ARTÍCULOS</div>
                {selectedInc.articulos.map(ref => (
                  <div key={ref} style={{ background: "#fef3c7", borderRadius: 8, padding: "5px 10px", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>📦 {ref}</div>
                ))}
              </div>
            )}

            {selectedInc.photo && (
              <img src={selectedInc.photo} alt="foto" style={{ width: "100%", borderRadius: 10, maxHeight: 160, objectFit: "cover", marginTop: 12 }} />
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>CAMBIAR ESTADO</div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <button key={k} onClick={() => handleStatus(selectedInc.id, k)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 10,
                      border: `2px solid ${selectedInc.status === k ? v.color : "#e2e8f0"}`,
                      background: selectedInc.status === k ? v.bg : "white",
                      color: selectedInc.status === k ? v.color : "#94a3b8",
                      fontWeight: 700, cursor: "pointer", fontSize: 11
                    }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, padding: 12, background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
              <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 700, marginBottom: 2 }}>COMERCIAL</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedInc.comercial}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ incidents, onStatusChange }) {
  const byDriver = {};
  incidents.forEach(i => { byDriver[i.repartidor] = (byDriver[i.repartidor] || 0) + 1; });

  const Card = ({ title, value, sub, color }) => (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20, flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>}
    </div>
  );

  const pendientes = incidents.filter(i => i.status === "pendiente").length;
  const enProceso = incidents.filter(i => i.status === "en_proceso").length;
  const resueltos = incidents.filter(i => i.status === "resuelto").length;

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif", color: "#0f172a" }}>
      {/* KPI row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        <Card title="Total incidencias" value={incidents.length} color="#0f172a" />
        <Card title="Pendientes" value={pendientes} color="#ef4444" sub="Acción requerida" />
        <Card title="En proceso" value={enProceso} color="#f59e0b" />
        <Card title="Resueltas" value={resueltos} color="#10b981" />
      </div>

      {/* Pie + drivers row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Distribución por tipo de incidencia</div>
          <PieChart incidents={incidents} />
          <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            💡 Pasa el ratón sobre cada sector para ver el detalle de subcategorías
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Por repartidor</div>
          {Object.entries(byDriver).sort((a, b) => b[1] - a[1]).map(([driver, count]) => {
            const pct = Math.round((count / incidents.length) * 100);
            return (
              <div key={driver} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {driver.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{driver}</span>
                      <span style={{ fontWeight: 800, color: "#3b82f6" }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 3 }}>
                      <div style={{ height: 4, borderRadius: 2, background: "#3b82f6", width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action panel */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Panel de acciones</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Gestiona las incidencias directamente desde aquí</div>
        <ActionPanel incidents={incidents} onStatusChange={onStatusChange} />
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("driver");
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);

  const handleNewIncident = (inc) => {
    setIncidents(prev => [inc, ...prev]);
  };

  const handleStatusChange = (id, status) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const tabs = [
    { id: "driver", label: "📱 Repartidor", desc: "Vista móvil" },
    { id: "office", label: "🏢 Sucursal", desc: "Panel gestión" },
    { id: "dashboard", label: "📊 Análisis", desc: "Estadísticas" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ padding: "14px 0 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 22 }}>🚚</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>IncidenciasReparto</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Sistema de gestión de devoluciones</div>
            </div>
            <div style={{ marginLeft: "auto", background: "#fee2e2", color: "#ef4444", borderRadius: 99, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
              {incidents.filter(i => i.status === "pendiente").length} pendientes
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setView(t.id)}
                style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, color: view === t.id ? "#3b82f6" : "#64748b", borderBottom: `2px solid ${view === t.id ? "#3b82f6" : "transparent"}`, transition: "all 0.2s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: view === "driver" ? 480 : 900, margin: "0 auto" }}>
        {view === "driver" && <DriverView onIncidentSubmit={handleNewIncident} />}
        {view === "office" && <OfficePanel incidents={incidents} onStatusChange={handleStatusChange} />}
        {view === "dashboard" && <Dashboard incidents={incidents} onStatusChange={handleStatusChange} />}
      </div>
    </div>
  );
}
