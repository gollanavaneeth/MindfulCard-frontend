import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Crown,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import api, { message } from "./api";
import { PageTitle } from "./Features";
import "./admin.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const pretty = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
const compact = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
const colors = [
  "#2f7762",
  "#dd8058",
  "#d3a34e",
  "#796aa6",
  "#6b98aa",
  "#ad665f",
];

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null),
    [users, setUsers] = useState([]),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(null),
    [updating, setUpdating] = useState(null);
  async function load() {
    setLoading(true);
    try {
      const [metricsResponse, usersResponse] = await Promise.all([
        api.get("/admin/metrics"),
        api.get("/admin/users"),
      ]);
      setMetrics(metricsResponse.data);
      setUsers(usersResponse.data);
      setNotice(null);
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function changeRole(user) {
    const next = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (
      !window.confirm(
        `${next === "ADMIN" ? "Grant administrator access to" : "Remove administrator access from"} ${user.fullName}?`,
      )
    )
      return;
    setUpdating(user.id);
    try {
      const { data } = await api.put(`/admin/users/${user.id}/role`, {
        role: next,
      });
      setUsers((items) =>
        items.map((item) => (item.id === user.id ? data : item)),
      );
      setNotice({ text: `${data.fullName} is now ${pretty(data.role)}.` });
      const response = await api.get("/admin/metrics");
      setMetrics(response.data);
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setUpdating(null);
    }
  }
  const growth = useMemo(() => {
    const months = new Set([
      ...Object.keys(metrics?.monthlySignups || {}),
      ...Object.keys(metrics?.monthlyEvaluations || {}),
    ]);
    return [...months]
      .sort()
      .slice(-12)
      .map((month) => ({
        month: new Date(`${month}-02`).toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        signups: metrics.monthlySignups?.[month] || 0,
        evaluations: metrics.monthlyEvaluations?.[month] || 0,
      }));
  }, [metrics]);
  const decisions = Object.entries(metrics?.decisions || {}).map(
    ([name, value]) => ({ name: pretty(name), value }),
  );
  const categories = Object.entries(metrics?.categories || {})
    .slice(0, 7)
    .map(([name, value]) => ({ name: pretty(name), value }));
  if (loading)
    return (
      <div className="admin-loading">
        <RefreshCw />
        <h2>Preparing the administration console</h2>
        <p>Aggregating user activity and decision trends…</p>
      </div>
    );
  return (
    <>
      <PageTitle
        eyebrow="ADMINISTRATION"
        title="Product health, without invading privacy"
        copy="Monitor adoption, outcomes, and system activity. Individual questionnaire answers and passwords are never exposed."
        action={
          <button className="secondary" onClick={load}>
            <RefreshCw />
            Refresh
          </button>
        }
      />
      {notice && (
        <div className={`admin-notice ${notice.type || ""}`}>{notice.text}</div>
      )}
      {metrics && (
        <>
          <section className="admin-status">
            <div>
              <span className="status-pulse" />
              <div>
                <small>SYSTEM STATUS</small>
                <b>All core services operational</b>
                <p>
                  Authentication, database, analytics, OCR upload, and protected
                  APIs are responding.
                </p>
              </div>
            </div>
            <span>
              <ShieldCheck />
              Role-protected console
            </span>
          </section>
          <div className="admin-kpis">
            <Kpi
              icon={Users}
              label="Registered users"
              value={compact(metrics.totalUsers)}
              note={`+${metrics.newUsersThisMonth} this month`}
              tone="green"
            />
            <Kpi
              icon={Activity}
              label="Purchase evaluations"
              value={compact(metrics.totalEvaluations)}
              note={`${metrics.evaluationsLast30Days} in 30 days`}
              tone="blue"
            />
            <Kpi
              icon={ShieldCheck}
              label="Avoidance rate"
              value={`${Math.round(metrics.avoidanceRate || 0)}%`}
              note={`${metrics.usersWithEvaluations} engaged users`}
              tone="gold"
            />
            <Kpi
              icon={IndianRupee}
              label="Protected spending"
              value={money(metrics.protectedAmount)}
              note="Marked avoided"
              tone="coral"
            />
          </div>
          <div className="admin-chart-grid">
            <section className="admin-panel admin-growth">
              <header>
                <div>
                  <small>ADOPTION & ENGAGEMENT</small>
                  <h2>Platform activity</h2>
                </div>
                <span>
                  <i className="signups" />
                  Signups <i className="evaluations" />
                  Evaluations
                </span>
              </header>
              {growth.length ? (
                <ResponsiveContainer width="100%" height={275}>
                  <AreaChart data={growth}>
                    <defs>
                      <linearGradient
                        id="admin-evaluations"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2f7762"
                          stopOpacity=".35"
                        />
                        <stop
                          offset="95%"
                          stopColor="#2f7762"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#e8ece9"
                    />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="evaluations"
                      stroke="#2f7762"
                      strokeWidth={3}
                      fill="url(#admin-evaluations)"
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      stroke="#dc8058"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </section>
            <section className="admin-panel admin-decisions">
              <header>
                <div>
                  <small>OUTCOME MIX</small>
                  <h2>Decision outcomes</h2>
                </div>
              </header>
              {decisions.length ? (
                <div className="decision-chart">
                  <ResponsiveContainer width="58%" height={240}>
                    <PieChart>
                      <Pie
                        data={decisions}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {decisions.map((_, index) => (
                          <Cell
                            key={index}
                            fill={colors[index % colors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {decisions.map((item, index) => (
                      <span key={item.name}>
                        <i
                          style={{ background: colors[index % colors.length] }}
                        />
                        <b>{item.name}</b>
                        <em>{item.value}</em>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyChart />
              )}
            </section>
            <section className="admin-panel admin-categories">
              <header>
                <div>
                  <small>PRODUCT INTEREST</small>
                  <h2>Top evaluated categories</h2>
                </div>
              </header>
              {categories.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categories} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="4 4"
                      horizontal={false}
                      stroke="#e8ece9"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={105}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill="#3c806b"
                      radius={[0, 8, 8, 0]}
                      barSize={19}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </section>
            <section className="admin-panel admin-summary">
              <small>BEHAVIOURAL SIGNALS</small>
              <h2>At a glance</h2>
              <div>
                <span>
                  <Activity />
                </span>
                <p>
                  <small>AVERAGE IMPULSE SCORE</small>
                  <b>
                    {metrics.averageImpulseScore}
                    <em>/100</em>
                  </b>
                </p>
              </div>
              <div>
                <span>
                  <ArrowUpRight />
                </span>
                <p>
                  <small>COOLING-OFF ITEMS</small>
                  <b>{metrics.wishlistItems}</b>
                </p>
              </div>
              <div>
                <span>
                  <CheckCircle2 />
                </span>
                <p>
                  <small>PRICE WATCHES</small>
                  <b>{metrics.priceWatches}</b>
                </p>
              </div>
              <p className="privacy-note">
                <ShieldCheck />
                {metrics.privacyNote}
              </p>
            </section>
          </div>
        </>
      )}
      {metrics && (
        <section className="admin-users">
          <header>
            <div>
              <span>ACCESS MANAGEMENT</span>
              <h2>Users and roles</h2>
              <p>
                Administrators can view account-level activity totals and manage
                console access.
              </p>
            </div>
            <em>{users.length} accounts</em>
          </header>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Activity</th>
                  <th>Protected</th>
                  <th>Last evaluation</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-person">
                        <i>{user.fullName?.[0]?.toUpperCase()}</i>
                        <span>
                          <b>{user.fullName}</b>
                          <small>{user.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill ${user.role.toLowerCase()}`}>
                        {user.role === "ADMIN" ? <Crown /> : <Users />}
                        {pretty(user.role)}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <b>{user.evaluationCount}</b>
                      <small>{user.avoidedCount} avoided</small>
                    </td>
                    <td>{money(user.protectedAmount)}</td>
                    <td>
                      {user.lastActivity
                        ? new Date(user.lastActivity).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )
                        : "No activity"}
                    </td>
                    <td>
                      <button
                        className="role-action"
                        disabled={updating === user.id}
                        onClick={() => changeRole(user)}
                      >
                        <UserCog />
                        {updating === user.id
                          ? "Saving…"
                          : user.role === "ADMIN"
                            ? "Make user"
                            : "Make admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Kpi({ icon: Icon, label, value, note, tone }) {
  return (
    <section className={`admin-kpi ${tone}`}>
      <span>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{note}</em>
      </div>
    </section>
  );
}
function EmptyChart() {
  return (
    <div className="admin-empty">
      <Activity />
      <span>
        <b>No activity yet</b>
        <small>Charts will populate as people use the application.</small>
      </span>
    </div>
  );
}
