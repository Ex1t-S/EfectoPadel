import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { PADEL_CATEGORIES } from "@efecto/shared";
import { api, clearToken, getToken, setToken } from "./lib";
import "./styles.css";

function App() {
  const [session, setSession] = useState<string | null>(() => getToken());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(event: FormEvent) {
    event.preventDefault();
    try {
      const data = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.token);
      setSession(data.token);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo ingresar");
    }
  }

  if (!session) {
    return (
      <main className="login-shell">
        <form className="login-card" onSubmit={login}>
          <p className="eyebrow">Panel admin</p>
          <h1>Efecto Padel</h1>
          <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button>Ingresar</button>
          <small>El usuario debe tener rol admin u owner en Supabase.</small>
        </form>
      </main>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    api("/admin/dashboard").then(setStats).catch((error) => alert(error.message));
  }, []);

  return (
    <main className="shell">
      <aside>
        <p className="eyebrow">Efecto Padel</p>
        <h1>Control del complejo</h1>
        {["overview", "courts", "reservations", "tournaments", "users"].map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
            {labels[item]}
          </button>
        ))}
        <button className="ghost" onClick={() => { clearToken(); location.reload(); }}>Salir</button>
      </aside>
      <section className="content">
        {tab === "overview" && <Overview stats={stats} />}
        {tab === "courts" && <Courts />}
        {tab === "reservations" && <Reservations />}
        {tab === "tournaments" && <Tournaments />}
        {tab === "users" && <Users />}
      </section>
    </main>
  );
}

const labels: Record<string, string> = {
  overview: "Resumen",
  courts: "Canchas",
  reservations: "Reservas",
  tournaments: "Torneos",
  users: "Usuarios"
};

function Overview({ stats }: { stats: any }) {
  return (
    <>
      <h2>Resumen operativo</h2>
      <div className="grid">
        <Metric label="Reservas" value={stats.reservations ?? 0} />
        <Metric label="Usuarios" value={stats.users ?? 0} />
        <Metric label="Torneos" value={stats.tournaments ?? 0} />
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="card metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function Courts() {
  const [courts, setCourts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slotMinutes: 90, priceCents: 1200000, depositCents: 300000, active: true });

  async function load() {
    setCourts(await api("/courts"));
  }

  useEffect(() => {
    load().catch((error) => alert(error.message));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    await api("/admin/courts", { method: "POST", body: JSON.stringify(form) });
    setForm({ ...form, name: "" });
    await load();
  }

  return (
    <>
      <h2>Canchas</h2>
      <form className="card form-grid" onSubmit={create}>
        <input placeholder="Nombre de cancha" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input type="number" value={form.slotMinutes} onChange={(event) => setForm({ ...form, slotMinutes: Number(event.target.value) })} />
        <input type="number" value={form.priceCents} onChange={(event) => setForm({ ...form, priceCents: Number(event.target.value) })} />
        <input type="number" value={form.depositCents} onChange={(event) => setForm({ ...form, depositCents: Number(event.target.value) })} />
        <button>Agregar cancha</button>
      </form>
      <DataTable rows={courts} columns={["name", "slot_minutes", "price_cents", "deposit_cents", "active"]} />
    </>
  );
}

function Reservations() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>("/admin/reservations").then(setItems).catch((error) => alert(error.message));
  }, []);
  return (
    <>
      <h2>Reservas</h2>
      <DataTable rows={items} columns={["starts_at", "status", "court_id", "user_id"]} />
    </>
  );
}

function Tournaments() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", category: "5ta", startsAt: new Date().toISOString(), maxTeams: 16, description: "" });

  async function load() {
    setItems(await api("/tournaments"));
  }

  useEffect(() => {
    load().catch((error) => alert(error.message));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    await api("/tournaments", { method: "POST", body: JSON.stringify(form) });
    await load();
  }

  async function bracket(id: string) {
    await api(`/tournaments/${id}/generate-bracket`, { method: "POST" });
    alert("Grupos y llaves generados");
  }

  return (
    <>
      <h2>Torneos</h2>
      <form className="card form-grid" onSubmit={create}>
        <input placeholder="Nombre" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
          {PADEL_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input type="datetime-local" onChange={(event) => setForm({ ...form, startsAt: new Date(event.target.value).toISOString() })} />
        <input type="number" value={form.maxTeams} onChange={(event) => setForm({ ...form, maxTeams: Number(event.target.value) })} />
        <textarea placeholder="Descripcion" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <button>Crear torneo</button>
      </form>
      <div className="cards">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.category} | {item.status}</p>
            <button onClick={() => bracket(item.id)}>Generar grupos y llaves</button>
          </article>
        ))}
      </div>
    </>
  );
}

function Users() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>("/admin/users").then(setItems).catch((error) => alert(error.message));
  }, []);
  return (
    <>
      <h2>Usuarios</h2>
      <DataTable rows={items} columns={["first_name", "last_name", "phone", "category", "elo", "role"]} />
    </>
  );
}

function DataTable({ rows, columns }: { rows: any[]; columns: string[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
