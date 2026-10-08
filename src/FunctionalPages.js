import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  IndianRupee,
  KeyRound,
  LineChart,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import api, { message } from "./api";
import { PageTitle } from "./Features";
const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);
const pretty = (v) =>
  (v || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export function BudgetPlannerPage() {
  const [data, setData] = useState(),
    [form, setForm] = useState({
      monthlyIncome: 0,
      essentialExpenses: 0,
      savingsTarget: 0,
    }),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () => {
    api
      .get("/budget")
      .then((r) => {
        setData(r.data);
        setForm({
          monthlyIncome: r.data.monthlyIncome,
          savingsTarget: r.data.savingsTarget,
          essentialExpenses: r.data.essentialExpenses,
        });
      })
      .catch((e) => setNote(message(e)));
  };
  useEffect(() => {
    load();
  }, []);
  const proposed = Math.max(
    0,
    Number(form.monthlyIncome || 0) -
      Number(form.essentialExpenses || 0) -
      Number(form.savingsTarget || 0),
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: d } = await api.put("/budget", form);
      setData(d);
      setNote("Monthly plan saved. Your purchase checks now use this limit.");
    } catch (x) {
      setNote(message(x));
    } finally {
      setBusy(false);
    }
  }
  const pct = data?.discretionaryBudget
    ? Math.min(
        100,
        (Number(data.purchasedThisMonth) / Number(data.discretionaryBudget)) *
          100,
      )
    : 0;
  return (
    <>
      <PageTitle
        eyebrow="BUDGET CONTROL CENTRE"
        title="Give every rupee a job"
        copy="Confirmed purchases affect your balance. Evaluations and waiting items remain visible as potential exposure."
      />
      {note && <div className="notice">{note}</div>}
      <div className="budget-pro-grid">
        <form className="budget-builder" onSubmit={save}>
          <div className="builder-head">
            <div>
              <WalletCards />
              <span>
                <b>Monthly money plan</b>
                <small>Update anytime</small>
              </span>
            </div>
            <em>{data?.id ? "ACTIVE" : "SETUP"}</em>
          </div>
          <label>
            Monthly take-home income
            <div className="money-input">
              <IndianRupee />
              <input
                type="number"
                min="0"
                required
                value={form.monthlyIncome}
                onChange={(e) =>
                  setForm({ ...form, monthlyIncome: e.target.value })
                }
              />
            </div>
          </label>
          <label>
            Essential expenses
            <div className="money-input">
              <IndianRupee />
              <input
                type="number"
                min="0"
                required
                value={form.essentialExpenses}
                onChange={(e) =>
                  setForm({ ...form, essentialExpenses: e.target.value })
                }
              />
            </div>
            <small>Rent, bills, food, transport, and debt commitments</small>
          </label>
          <label>
            Savings target
            <div className="money-input">
              <IndianRupee />
              <input
                type="number"
                min="0"
                required
                value={form.savingsTarget}
                onChange={(e) =>
                  setForm({ ...form, savingsTarget: e.target.value })
                }
              />
            </div>
          </label>
          <div className="proposed">
            <span>Planned discretionary amount</span>
            <strong>{money(proposed)}</strong>
          </div>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save monthly plan"}
          </button>
        </form>
        <section className="budget-command">
          <div className="available-ring" style={{ "--used": pct }}>
            <span>
              <small>AVAILABLE NOW</small>
              <b>{money(data?.remainingBudget)}</b>
              <em>{Math.round(pct)}% spent</em>
            </span>
          </div>
          <div className="budget-kpis">
            <div>
              <CreditCard />
              <span>
                <small>Confirmed purchases</small>
                <b>{money(data?.purchasedThisMonth)}</b>
              </span>
            </div>
            <div>
              <Clock3 />
              <span>
                <small>Pending exposure</small>
                <b>{money(data?.pendingExposure)}</b>
              </span>
            </div>
            <div>
              <LineChart />
              <span>
                <small>All evaluated</small>
                <b>{money(data?.evaluatedThisMonth)}</b>
              </span>
            </div>
            <div>
              <Target />
              <span>
                <small>Protected savings</small>
                <b>{money(data?.savingsTarget)}</b>
              </span>
            </div>
          </div>
          {data?.alert && (
            <div className="budget-warning">
              <AlertTriangle />
              {data.alert}
            </div>
          )}
        </section>
      </div>
      <section className="budget-explainer">
        <div>
          <ShieldCheck />
          <span>
            <b>Purchases—not thoughts—reduce your balance</b>
            <p>
              An evaluated item only becomes spending after you mark it
              Purchased in your Decision Journal.
            </p>
          </span>
        </div>
        <div>
          <TrendingUp />
          <span>
            <b>Pending exposure stays visible</b>
            <p>
              Waiting and undecided products show how much your remaining budget
              could change.
            </p>
          </span>
        </div>
        <div>
          <RefreshCw />
          <span>
            <b>Resets naturally each month</b>
            <p>
              Monthly totals are calculated from decision dates and evaluation
              history.
            </p>
          </span>
        </div>
      </section>
    </>
  );
}

export function CoolingOffPage() {
  const [items, setItems] = useState([]),
    [evaluations, setEvaluations] = useState([]),
    [now, setNow] = useState(Date.now()),
    [selected, setSelected] = useState(),
    [note, setNote] = useState("");
  const load = () =>
    Promise.all([api.get("/wishlist"), api.get("/evaluations")])
      .then(([w, e]) => {
        setItems(w.data);
        setEvaluations(e.data);
      })
      .catch((e) => setNote(message(e)));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  function left(date) {
    if (!date) return "No timer";
    let ms = new Date(date).getTime() - now;
    if (ms <= 0) return "Ready to reassess";
    const d = Math.floor(ms / 86400000);
    ms %= 86400000;
    const h = Math.floor(ms / 3600000),
      m = Math.floor((ms % 3600000) / 60000);
    return `${d ? d + "d " : ""}${h}h ${m}m remaining`;
  }
  async function status(x, value) {
    await api.put(`/wishlist/${x.id}`, { ...x, status: value });
    setNote(
      value === "AVOIDED"
        ? `${money(x.price)} impulse avoided.`
        : "Decision updated.",
    );
    load();
  }
  const waiting = items.filter((x) => x.status === "WAITING"),
    resolved = items.filter((x) => x.status !== "WAITING");
  return (
    <>
      <PageTitle
        eyebrow="COOLING-OFF LAB"
        title="Let the urgency expire"
        copy="Time creates distance between a trigger and a decision. Reassess after the countdown—not during it."
      />
      {note && <div className="notice">{note}</div>}
      <div className="cooling-stats">
        <div>
          <Clock3 />
          <span>
            <b>{waiting.length}</b>actively cooling
          </span>
        </div>
        <div>
          <ShoppingBag />
          <span>
            <b>{money(waiting.reduce((s, x) => s + Number(x.price), 0))}</b>on
            pause
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <b>{resolved.filter((x) => x.status === "AVOIDED").length}</b>
            impulses avoided
          </span>
        </div>
      </div>
      {waiting.length ? (
        <div className="cooling-grid">
          {waiting.map((x) => {
            const ready =
              !x.waitingUntil || new Date(x.waitingUntil).getTime() <= now;
            return (
              <article
                className={`cooling-card ${ready ? "ready" : ""}`}
                key={x.id}
              >
                <div className="cooling-clock">
                  <Clock3 />
                  <span>{left(x.waitingUntil)}</span>
                </div>
                <small>{pretty(x.category)}</small>
                <h2>{x.productName}</h2>
                <strong>{money(x.price)}</strong>
                <div className="cool-track">
                  <i style={{ width: ready ? "100%" : "55%" }} />
                </div>
                {ready ? (
                  <>
                    <p>
                      The pause is complete. Do you still want it for the same
                      reasons?
                    </p>
                    <button
                      onClick={() =>
                        setSelected({
                          item: x,
                          evaluation: evaluations.find(
                            (e) =>
                              e.productName.toLowerCase() ===
                              x.productName.toLowerCase(),
                          ),
                        })
                      }
                    >
                      Reassess this decision <ArrowRight />
                    </button>
                  </>
                ) : (
                  <p>
                    Step away from reviews, ads, and price alerts until the
                    timer ends.
                  </p>
                )}
                <footer>
                  <button onClick={() => status(x, "AVOIDED")}>
                    <ShieldCheck />
                    Avoid
                  </button>
                  <button onClick={() => status(x, "PURCHASED")}>
                    <ShoppingBag />
                    Purchased
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="cool-empty">
          <Clock3 />
          <h3>No products are cooling off</h3>
          <p>
            Add uncertain products from an evaluation result instead of buying
            immediately.
          </p>
        </div>
      )}
      {resolved.length > 0 && (
        <section className="resolved-list">
          <h2>Past cooling-off decisions</h2>
          {resolved.map((x) => (
            <div key={x.id}>
              <span>
                <b>{x.productName}</b>
                <small>
                  {money(x.price)} · {pretty(x.category)}
                </small>
              </span>
              <em className={x.status.toLowerCase()}>{pretty(x.status)}</em>
            </div>
          ))}
        </section>
      )}
      {selected && (
        <ReassessModal
          data={selected}
          close={() => setSelected()}
          saved={() => {
            setSelected();
            load();
            setNote("Reassessment saved to your decision history.");
          }}
        />
      )}
    </>
  );
}
function ReassessModal({ data, close, saved }) {
  const [f, setF] = useState({
      stillWantIt: true,
      needChanged: false,
      priceChanged: false,
      foundAlternative: false,
      fitsBudgetNow: true,
      reflection: "",
    }),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!data.evaluation) {
      setError(
        "Complete an evaluation for this product before reassessing it.",
      );
      return;
    }
    try {
      await api.post("/reassessments", {
        ...f,
        evaluationId: data.evaluation.id,
      });
      saved();
    } catch (x) {
      setError(message(x));
    }
  }
  return (
    <div className="overlay">
      <form className="modal reassess-modal" onSubmit={submit}>
        <div className="modal-symbol">
          <RefreshCw />
        </div>
        <h2>Has the pause changed anything?</h2>
        <p>
          {data.item.productName} · {money(data.item.price)}
        </p>
        {[
          ["stillWantIt", "I still want this product"],
          ["needChanged", "My need has changed"],
          ["priceChanged", "The price or offer changed"],
          ["foundAlternative", "I found an alternative"],
          ["fitsBudgetNow", "It fits my budget now"],
        ].map(([k, label]) => (
          <label className="check-row" key={k}>
            <input
              type="checkbox"
              checked={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
        <label>
          What feels different now?
          <textarea
            value={f.reflection}
            onChange={(e) => setF({ ...f, reflection: e.target.value })}
            placeholder="Write a short reflection…"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button type="button" className="secondary" onClick={close}>
            Cancel
          </button>
          <button className="primary">Save reassessment</button>
        </div>
      </form>
    </div>
  );
}

export function SecurityPage() {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [note, setNote] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.put("/account/password", {
        currentPassword: current,
        newPassword: next,
      });
      setNote(data.message);
      setCurrent("");
      setNext("");
    } catch (x) {
      setNote(message(x));
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="ACCOUNT SECURITY"
        title="Protect your mindful profile"
        copy="Manage your password and understand how your personal decision data is protected."
      />
      <div className="security-grid">
        <form className="security-card" onSubmit={submit}>
          <div className="security-icon">
            <KeyRound />
          </div>
          <h2>Change password</h2>
          <p>
            Use at least eight characters and avoid passwords used on shopping
            sites.
          </p>
          <label>
            Current password
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              minLength="8"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </label>
          {note && <div className="notice">{note}</div>}
          <button className="primary">Update password</button>
        </form>
        <section className="security-card privacy">
          <div className="security-icon">
            <Lock />
          </div>
          <h2>Your data boundary</h2>
          <ul>
            <li>
              <Check />
              Passwords are BCrypt hashed.
            </li>
            <li>
              <Check />
              Every record is scoped to your authenticated user ID.
            </li>
            <li>
              <Check />
              AI is optional and has a private fallback.
            </li>
            <li>
              <Check />
              JWT sessions expire automatically.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
