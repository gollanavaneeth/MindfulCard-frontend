import { useEffect, useState } from "react";
import {
  Archive,
  BarChart3,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import api, { message } from "./api";
import { BudgetPlannerPage } from "./FunctionalPages";
import "./budget-tools.css";

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
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function BudgetWorkspace() {
  const [limits, setLimits] = useState([]),
    [history, setHistory] = useState([]),
    [draft, setDraft] = useState({
      category: "ELECTRONICS",
      monthlyLimit: "",
      warningThreshold: 80,
      active: true,
    }),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [limitsResponse, historyResponse] = await Promise.all([
        api.get("/category-budgets"),
        api.get("/budget-history"),
      ]);
      setLimits(limitsResponse.data);
      setHistory(historyResponse.data);
    } catch (error) {
      setNotice(message(error));
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function add(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post("/category-budgets", {
        ...draft,
        monthlyLimit: Number(draft.monthlyLimit),
        warningThreshold: Number(draft.warningThreshold),
      });
      setDraft({ ...draft, monthlyLimit: "" });
      setNotice("Category boundary added.");
      await load();
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!window.confirm("Remove this category limit?")) return;
    try {
      await api.delete(`/category-budgets/${id}`);
      await load();
    } catch (error) {
      setNotice(message(error));
    }
  }
  async function snapshot() {
    setBusy(true);
    try {
      await api.post("/budget-history/snapshot/current");
      setNotice("This month was saved to budget history.");
      await load();
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <BudgetPlannerPage />
      {notice && <div className="notice budget-tools-notice">{notice}</div>}
      <section className="category-budget-section">
        <div className="budget-tools-heading">
          <div>
            <span>CATEGORY GUARDRAILS</span>
            <h2>Set limits where impulses happen</h2>
            <p>
              Confirmed purchases count as spent; pending decisions remain
              visible as exposure.
            </p>
          </div>
        </div>
        <form className="category-budget-form" onSubmit={add}>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value })
              }
            >
              {categories.map((category) => (
                <option key={category}>{pretty(category)}</option>
              ))}
            </select>
          </label>
          <label>
            Monthly limit
            <input
              required
              min="1"
              type="number"
              placeholder="5000"
              value={draft.monthlyLimit}
              onChange={(event) =>
                setDraft({ ...draft, monthlyLimit: event.target.value })
              }
            />
          </label>
          <label>
            Warn at
            <input
              required
              min="1"
              max="100"
              type="number"
              value={draft.warningThreshold}
              onChange={(event) =>
                setDraft({ ...draft, warningThreshold: event.target.value })
              }
            />
            <span>%</span>
          </label>
          <button className="primary" disabled={busy}>
            <Plus />
            Add limit
          </button>
        </form>
        {limits.length ? (
          <div className="category-budget-grid">
            {limits.map((limit) => (
              <article
                key={limit.id}
                className={`category-limit ${String(limit.status).toLowerCase()}`}
              >
                <header>
                  <span>{pretty(limit.category)}</span>
                  <em>{pretty(limit.status)}</em>
                </header>
                <strong>
                  {money(limit.remaining)}
                  <small> remaining</small>
                </strong>
                <div className="category-track">
                  <i
                    style={{
                      width: `${Math.min(100, Number(limit.usagePercent) || 0)}%`,
                    }}
                  />
                </div>
                <div>
                  <span>
                    Spent <b>{money(limit.spent)}</b>
                  </span>
                  <span>
                    Pending <b>{money(limit.pending)}</b>
                  </span>
                  <span>
                    Limit <b>{money(limit.monthlyLimit)}</b>
                  </span>
                </div>
                <footer>
                  <small>
                    {Math.round(Number(limit.usagePercent) || 0)}% used ·
                    warning at {limit.warningThreshold}%
                  </small>
                  <button
                    aria-label="Delete category budget"
                    onClick={() => remove(limit.id)}
                  >
                    <Trash2 />
                  </button>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="budget-tools-empty">
            <TriangleAlert />
            <span>
              <b>No category limits yet</b>
              <small>
                Add one for categories where overspending is easiest.
              </small>
            </span>
          </div>
        )}
      </section>
      <section className="budget-history-section">
        <div className="budget-tools-heading">
          <div>
            <span>MONTHLY MEMORY</span>
            <h2>Budget history</h2>
            <p>
              Save a monthly snapshot to compare what you planned, bought,
              avoided, and left available.
            </p>
          </div>
          <button className="secondary" disabled={busy} onClick={snapshot}>
            <Save />
            Save this month
          </button>
        </div>
        {history.length ? (
          <div className="snapshot-list">
            {history.map((item) => (
              <article key={item.id}>
                <div>
                  <Archive />
                  <span>
                    <b>{item.monthLabel}</b>
                    <small>
                      {item.purchaseCount} purchased · {item.avoidedCount}{" "}
                      avoided
                    </small>
                  </span>
                </div>
                <div>
                  <span>
                    Purchased <b>{money(item.purchasedAmount)}</b>
                  </span>
                  <span>
                    Avoided <b>{money(item.avoidedAmount)}</b>
                  </span>
                  <span>
                    Remaining <b>{money(item.remainingBudget)}</b>
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="budget-tools-empty">
            <BarChart3 />
            <span>
              <b>No snapshots saved</b>
              <small>
                Save the current month when you want a durable comparison point.
              </small>
            </span>
          </div>
        )}
      </section>
    </>
  );
}
