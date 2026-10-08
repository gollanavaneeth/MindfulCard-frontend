import { useCallback, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import {
  LayoutDashboard,
  ScanSearch,
  Package,
  WalletCards,
  Heart,
  UserRound,
  LogOut,
  Menu,
  Leaf,
  Plus,
  Trash2,
  History,
  Target,
  RefreshCw,
  Bell,
  FileBarChart,
  GitCompareArrows,
  LockKeyhole,
  LineChart,
  Gauge,
} from "lucide-react";
import { HistoryPage, GoalsPage, DashboardWelcome } from "./Features";
import EvaluatePage from "./EvaluatePage";
import ComparePage from "./ComparePage";
import BudgetWorkspace from "./BudgetWorkspace";
import PriceWatchPage from "./PriceWatchPage";
import { CoolingOffPage, SecurityPage } from "./FunctionalPages";
import {
  SubscriptionsPage,
  NotificationsPage,
  ReportsPage,
} from "./AdvancedPages";
import { ForgotPassword, ResetPassword } from "./AccountAccess";
import AdminPage from "./AdminPage";
import api, { message } from "./api";
const categories = [
  "ELECTRONICS",
  "CLOTHING",
  "FOOD",
  "BEAUTY",
  "ENTERTAINMENT",
  "HOME",
  "TRAVEL",
  "GAMING",
  "ACCESSORIES",
  "OTHER",
];
const current = () => JSON.parse(sessionStorage.getItem("user") || "null");
const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);
const pretty = (v) =>
  (v || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
function Auth({ signup = false }) {
  const nav = useNavigate(),
    [f, setF] = useState({ fullName: "", email: "", password: "" }),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post(
        `/auth/${signup ? "register" : "login"}`,
        f,
      );
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data));
      nav("/dashboard");
    } catch (x) {
      setErr(message(x));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth">
      <section>
        <span className="logo">
          <Leaf />
          MindfulCart
        </span>
        <div>
          <span className="kicker">BUY WITH INTENTION</span>
          <h1>
            Pause.
            <br />
            Reflect.
            <br />
            <i>Choose wisely.</i>
          </h1>
          <p>
            A thoughtful companion that helps you understand the urge before you
            spend.
          </p>
        </div>
        <small>Small pauses. Smarter purchases. Stronger savings.</small>
      </section>
      <form onSubmit={submit}>
        <span className="mobile-logo">
          <Leaf /> MindfulCart
        </span>
        <p className="eyebrow">WELCOME</p>
        <h2>{signup ? "Create your mindful account" : "Welcome back"}</h2>
        <p className="muted">
          {signup
            ? "Start building healthier shopping habits."
            : "Continue your journey toward intentional spending."}
        </p>
        {signup && (
          <label>
            Full name
            <input
              required
              value={f.fullName}
              onChange={(e) => setF({ ...f, fullName: e.target.value })}
            />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={signup ? 8 : 6}
            required
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </label>
        {!signup && (
          <Link className="forgot-link" to="/forgot-password">
            Forgot password?
          </Link>
        )}
        {err && <div className="error">{err}</div>}
        <button className="primary" disabled={busy}>
          {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
        </button>
        <p className="center">
          {signup ? "Already a member?" : "New to MindfulCart?"}{" "}
          <Link to={signup ? "/login" : "/register"}>
            {signup ? "Sign in" : "Create account"}
          </Link>
        </p>
      </form>
    </div>
  );
}
function Shell({ children }) {
  const u = current(),
    nav = useNavigate(),
    [open, setOpen] = useState(false);
  const links = [
    [LayoutDashboard, "Dashboard", "/dashboard"],
    [ScanSearch, "Evaluate purchase", "/evaluate"],
    [History, "Decision journal", "/history"],
    [Heart, "Cooling-off lab", "/wishlist"],
    [GitCompareArrows, "Compare products", "/compare"],
    [LineChart, "Price watch", "/price-watch"],
    [Package, "What I own", "/owned-items"],
    [WalletCards, "Budget planner", "/budget"],
    [Target, "Savings goals", "/goals"],
    [RefreshCw, "Subscriptions", "/subscriptions"],
    [FileBarChart, "Reports", "/reports"],
    [Bell, "Notifications", "/notifications"],
    [LockKeyhole, "Security", "/security"],
    [UserRound, "Profile", "/profile"],
  ];
  if (u.role === "ADMIN") links.push([Gauge, "Admin console", "/admin"]);
  return (
    <div className="shell">
      <aside className={open ? "open" : ""}>
        <span className="logo">
          <Leaf />
          MindfulCart
        </span>
        <nav>
          {links.map(([Icon, name, to]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon />
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="aside-foot">
          <span className="avatar">{u.fullName?.[0]}</span>
          <span>
            <b>{u.fullName}</b>
            <small>{u.email}</small>
          </span>
          <button
            aria-label="Log out"
            onClick={() => {
              sessionStorage.clear();
              nav("/login");
            }}
          >
            <LogOut />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <button className="menu" onClick={() => setOpen(!open)}>
            <Menu />
          </button>
          <span>Make space for what matters.</span>
          <div className="mini-avatar">{u.fullName?.[0]}</div>
        </header>
        <article>{children}</article>
      </main>
    </div>
  );
}
function Guard({ children }) {
  return current() ? <Shell>{children}</Shell> : <Navigate to="/login" />;
}
const Title = ({ over, children, action }) => (
  <div className="title">
    <div>
      <p className="eyebrow">{over}</p>
      <h1>{children}</h1>
    </div>
    {action}
  </div>
);
function Notice({ text, error }) {
  return text ? <div className={error ? "error" : "notice"}>{text}</div> : null;
}
function Dashboard() {
  const [s, setS] = useState(null),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setS(r.data))
      .catch((e) => setErr(message(e)));
  }, []);
  if (!s)
    return (
      <>
        <Title over="OVERVIEW">Your mindful spending</Title>
        <Notice text={err || "Loading your insights…"} error={!!err} />
      </>
    );
  const pie = Object.entries(s.decisions).map(([name, value]) => ({
    name,
    value,
  }));
  return (
    <>
      <Title
        over="OVERVIEW"
        action={
          <Link className="primary" to="/evaluate">
            <Plus /> Evaluate purchase
          </Link>
        }
      >
        Good to see you, {current().fullName.split(" ")[0]}.
      </Title>
      <DashboardWelcome
        name={current().fullName.split(" ")[0]}
        evaluated={s.evaluated}
      />
      <div className="stats">
        <div>
          <span>Purchases evaluated</span>
          <strong>{s.evaluated}</strong>
          <small>Thoughtful pauses taken</small>
        </div>
        <div>
          <span>Purchases avoided</span>
          <strong>{s.avoided}</strong>
          <small>Impulses reconsidered</small>
        </div>
        <div>
          <span>Estimated saved</span>
          <strong>{money(s.moneySaved)}</strong>
          <small>From high-risk purchases</small>
        </div>
        <div>
          <span>Average impulse score</span>
          <strong>
            {s.averageScore}
            <em>/100</em>
          </strong>
          <small>Across evaluations</small>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel chart">
          <h2>Impulse score trend</h2>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={s.scoreTrend}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#df784c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#df784c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#df784c"
                strokeWidth={3}
                fill="url(#g)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>
        <section className="panel insights">
          <h2>At a glance</h2>
          <div>
            <span>Main impulse trigger</span>
            <b>{pretty(s.commonTrigger)}</b>
          </div>
          <div>
            <span>Most evaluated category</span>
            <b>{pretty(s.topCategory)}</b>
          </div>
          <h3>Purchase decisions</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={pie} innerRadius={35} outerRadius={55} dataKey="value">
                {pie.map((_, i) => (
                  <Cell key={i} fill={["#2f6e60", "#df784c"][i % 2]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>
      <section className="panel">
        <h2>Recent evaluations</h2>
        {s.recent.length ? (
          s.recent.map((x) => (
            <div className="recent" key={x.id}>
              <span>
                <b>{x.productName}</b>
                <small>
                  {pretty(x.category)} · {money(x.price)}
                </small>
              </span>
              <span className={`risk ${x.riskLevel.toLowerCase()}`}>
                {pretty(x.riskLevel)} · {x.score}/100
              </span>
            </div>
          ))
        ) : (
          <Empty text="Your evaluations will appear here." />
        )}
      </section>
    </>
  );
}
const Field = ({ label, children, wide }) => (
  <label className={wide ? "wide" : ""}>
    {label}
    {children}
  </label>
);
function Empty({ text }) {
  return (
    <div className="empty">
      <Leaf />
      <p>{text}</p>
    </div>
  );
}
function OwnedItems() {
  const [items, setItems] = useState([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [editing, setEditing] = useState(),
    [note, setNote] = useState("");
  const load = useCallback(
    () =>
      api
        .get("/owned-items", { params: { search, category } })
        .then((r) => setItems(r.data))
        .catch((e) => setNote(message(e))),
    [search, category],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function save(e) {
    e.preventDefault();
    try {
      await api[editing.id ? "put" : "post"](
        `/owned-items${editing.id ? "/" + editing.id : ""}`,
        editing,
      );
      setEditing();
      load();
    } catch (x) {
      setNote(message(x));
    }
  }
  async function remove(id) {
    if (window.confirm("Remove this owned item?")) {
      await api.delete(`/owned-items/${id}`);
      load();
    }
  }
  return (
    <>
      <Title
        over="YOUR INVENTORY"
        action={
          <button
            className="primary"
            onClick={() =>
              setEditing({
                productName: "",
                category: "ELECTRONICS",
                purchasePrice: "",
                purchaseDate: "",
                conditionName: "Good",
                usageFrequency: "Weekly",
              })
            }
          >
            <Plus /> Add item
          </button>
        }
      >
        Things you already own
      </Title>
      <div className="filters">
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((x) => (
            <option key={x} value={x}>
              {pretty(x)}
            </option>
          ))}
        </select>
      </div>
      <Notice text={note} />
      <div className="cards">
        {items.map((x) => (
          <section className="item-card" key={x.id}>
            <span className="category">{pretty(x.category)}</span>
            <h3>{x.productName}</h3>
            <p>
              {money(x.purchasePrice)} ·{" "}
              {x.conditionName || "Condition not set"}
            </p>
            <small>
              {x.usageFrequency || "Usage not set"}
              {x.purchaseDate && ` · ${x.purchaseDate}`}
            </small>
            <footer>
              <button onClick={() => setEditing(x)}>Edit</button>
              <button className="danger" onClick={() => remove(x.id)}>
                <Trash2 />
              </button>
            </footer>
          </section>
        ))}
      </div>
      {!items.length && (
        <Empty text="Add what you own to spot similar purchases." />
      )}
      {editing && (
        <Modal
          title={editing.id ? "Edit owned item" : "Add owned item"}
          close={() => setEditing()}
          submit={save}
        >
          <Field label="Product name">
            <input
              required
              value={editing.productName}
              onChange={(e) =>
                setEditing({ ...editing, productName: e.target.value })
              }
            />
          </Field>
          <Field label="Category">
            <select
              value={editing.category}
              onChange={(e) =>
                setEditing({ ...editing, category: e.target.value })
              }
            >
              {categories.map((x) => (
                <option key={x} value={x}>
                  {pretty(x)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purchase price">
            <input
              type="number"
              value={editing.purchasePrice || ""}
              onChange={(e) =>
                setEditing({ ...editing, purchasePrice: e.target.value })
              }
            />
          </Field>
          <Field label="Purchase date">
            <input
              type="date"
              value={editing.purchaseDate || ""}
              onChange={(e) =>
                setEditing({ ...editing, purchaseDate: e.target.value })
              }
            />
          </Field>
          <Field label="Condition">
            <select
              value={editing.conditionName || ""}
              onChange={(e) =>
                setEditing({ ...editing, conditionName: e.target.value })
              }
            >
              <option>New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Needs repair</option>
            </select>
          </Field>
          <Field label="Usage frequency">
            <select
              value={editing.usageFrequency || ""}
              onChange={(e) =>
                setEditing({ ...editing, usageFrequency: e.target.value })
              }
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Rarely</option>
              <option>Never</option>
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}
function Profile() {
  const [p, setP] = useState(),
    [name, setName] = useState(""),
    [note, setNote] = useState("");
  useEffect(() => {
    api.get("/users/profile").then((r) => {
      setP(r.data);
      setName(r.data.fullName);
    });
  }, []);
  async function save(e) {
    e.preventDefault();
    const { data } = await api.put("/users/profile", { fullName: name });
    setP(data);
    const u = { ...current(), fullName: data.fullName };
    sessionStorage.setItem("user", JSON.stringify(u));
    setNote("Profile updated.");
  }
  return (
    <>
      <Title over="ACCOUNT">Your profile</Title>
      <form className="panel profile" onSubmit={save}>
        <div className="profile-avatar">{name?.[0]}</div>
        <h2>{p?.fullName}</h2>
        <p className="muted">
          Member since {p && new Date(p.createdAt).toLocaleDateString()}
        </p>
        <Notice text={note} />
        <Field label="Full name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email address">
          <input disabled value={p?.email || ""} />
        </Field>
        <button className="primary">Save changes</button>
      </form>
    </>
  );
}
function Modal({ title, close, submit, children }) {
  return (
    <div className="overlay">
      <form className="modal" onSubmit={submit}>
        <h2>{title}</h2>
        {children}
        <div className="actions">
          <button type="button" className="secondary" onClick={close}>
            Cancel
          </button>
          <button className="primary">Save</button>
        </div>
      </form>
    </div>
  );
}
export default function App() {
  const pages = [
    ["/dashboard", <Dashboard />],
    ["/evaluate", <EvaluatePage />],
    ["/history", <HistoryPage />],
    ["/wishlist", <CoolingOffPage />],
    ["/compare", <ComparePage />],
    ["/price-watch", <PriceWatchPage />],
    ["/owned-items", <OwnedItems />],
    ["/budget", <BudgetWorkspace />],
    ["/goals", <GoalsPage />],
    ["/subscriptions", <SubscriptionsPage />],
    ["/reports", <ReportsPage />],
    ["/notifications", <NotificationsPage />],
    ["/security", <SecurityPage />],
    ["/profile", <Profile />],
    ["/admin", <AdminPage />],
  ];
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {pages.map(([path, page]) => (
        <Route key={path} path={path} element={<Guard>{page}</Guard>} />
      ))}
      <Route
        path="*"
        element={<Navigate to={current() ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}
