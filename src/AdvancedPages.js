import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  Bell,
  BellRing,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  FileBarChart,
  FileText,
  Gauge,
  IndianRupee,
  Info,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Moon,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import api, { message } from "./api";
import "./advanced.css";

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
const displayDate = (value) =>
  value
    ? new Date(
        `${value}`.length === 10 ? `${value}T00:00:00` : value,
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";
const asList = (data, key) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.[key])
      ? data[key]
      : Array.isArray(data?.content)
        ? data.content
        : [];
const todayMonth = () => new Date().toISOString().slice(0, 7);

function FeatureHeading({ eyebrow, title, copy, action }) {
  return (
    <div className="advanced-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}

function StatusMessage({ value, onClose }) {
  if (!value) return null;
  return (
    <div className={`advanced-toast ${value.type || "success"}`} role="status">
      <span>
        {value.type === "error" ? <AlertCircle /> : <CheckCircle2 />}
        {value.text}
      </span>
      {onClose && (
        <button aria-label="Dismiss" onClick={onClose}>
          <X />
        </button>
      )}
    </div>
  );
}

function PageLoader({ label = "Loading your workspace..." }) {
  return (
    <div className="advanced-loader">
      <LoaderCircle />
      <span>{label}</span>
    </div>
  );
}

function FeatureEmpty({ icon: Icon = Sparkles, title, copy, action }) {
  return (
    <div className="advanced-empty">
      <div>
        <Icon />
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`advanced-switch ${checked ? "on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <i />
      <span>{checked ? "On" : "Off"}</span>
    </button>
  );
}

const ruleTypes = [
  [
    "WAITING_PERIOD",
    "Cooling-off period",
    "Pause a purchase for a set number of days.",
    Clock3,
  ],
  [
    "MAX_PRICE",
    "Price boundary",
    "Flag purchases above an amount you choose.",
    IndianRupee,
  ],
  [
    "EMOTION_BLOCK",
    "Emotion guard",
    "Block decisions during a vulnerable mood.",
    BrainCircuit,
  ],
  [
    "LATE_NIGHT",
    "Late-night lock",
    "Protect a time window when impulse control is lower.",
    Moon,
  ],
  [
    "REQUIRE_COMPARISON",
    "Comparison required",
    "Require alternatives before a costly purchase.",
    Search,
  ],
  [
    "CUSTOM",
    "Personal promise",
    "Create a flexible rule in your own words.",
    Sparkles,
  ],
];
const categories = [
  "ALL",
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
const emotions = [
  "NORMAL",
  "HAPPY",
  "EXCITED",
  "BORED",
  "STRESSED",
  "SAD",
  "FRUSTRATED",
];
const blankRule = {
  name: "",
  description: "",
  ruleType: "WAITING_PERIOD",
  category: "ALL",
  amountThreshold: "",
  waitDays: 1,
  blockedEmotion: "",
  startHour: 22,
  endHour: 6,
  active: true,
};
const ruleIcon = (type) =>
  ruleTypes.find((item) => item[0] === type)?.[3] || ShieldCheck;
const ruleCopy = (rule) => {
  if (rule.ruleType === "WAITING_PERIOD")
    return `${rule.waitDays || 1}-day pause${rule.category && rule.category !== "ALL" ? ` for ${pretty(rule.category)}` : ""}`;
  if (rule.ruleType === "MAX_PRICE")
    return `Check purchases above ${money(rule.amountThreshold)}`;
  if (rule.ruleType === "EMOTION_BLOCK")
    return `Pause when feeling ${pretty(rule.blockedEmotion)}`;
  if (rule.ruleType === "LATE_NIGHT")
    return `Active from ${String(rule.startHour ?? 22).padStart(2, "0")}:00 to ${String(rule.endHour ?? 6).padStart(2, "0")}:00`;
  if (rule.ruleType === "REQUIRE_COMPARISON")
    return `Compare alternatives${rule.amountThreshold ? ` above ${money(rule.amountThreshold)}` : ""}`;
  return rule.description || "A promise to your future self";
};

export function ShoppingRulesPage() {
  const [rules, setRules] = useState([]),
    [editing, setEditing] = useState(null),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(null),
    [checking, setChecking] = useState(false),
    [checkResult, setCheckResult] = useState(null);
  const [check, setCheck] = useState({
    category: "ELECTRONICS",
    price: "",
    emotionalState: "NORMAL",
    planned: false,
    comparedAlternatives: false,
    purchaseHour: new Date().getHours(),
  });
  async function load() {
    try {
      const { data } = await api.get("/rules");
      setRules(asList(data, "rules"));
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let current = true;
    (async () => {
      try {
        const { data } = await api.get("/rules");
        if (current) setRules(asList(data, "rules"));
      } catch (error) {
        if (current) setNotice({ type: "error", text: message(error) });
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, []);
  function payload(rule) {
    return {
      name: rule.name.trim(),
      description: rule.description?.trim() || null,
      ruleType: rule.ruleType,
      category: rule.category === "ALL" ? null : rule.category,
      amountThreshold:
        rule.amountThreshold === "" ? null : Number(rule.amountThreshold),
      waitDays: rule.waitDays === "" ? null : Number(rule.waitDays),
      blockedEmotion: rule.blockedEmotion || null,
      startHour: rule.startHour === "" ? null : Number(rule.startHour),
      endHour: rule.endHour === "" ? null : Number(rule.endHour),
      active: Boolean(rule.active),
    };
  }
  async function save(event) {
    event.preventDefault();
    try {
      const body = payload(editing);
      await api[editing.id ? "put" : "post"](
        `/rules${editing.id ? `/${editing.id}` : ""}`,
        body,
      );
      setEditing(null);
      setNotice({ text: "Your shopping boundary is saved." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function toggle(rule) {
    try {
      await api.put(
        `/rules/${rule.id}`,
        payload({ ...rule, active: !rule.active }),
      );
      setRules((items) =>
        items.map((item) =>
          item.id === rule.id ? { ...item, active: !item.active } : item,
        ),
      );
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function remove(rule) {
    if (!window.confirm(`Delete "${rule.name}"?`)) return;
    try {
      await api.delete(`/rules/${rule.id}`);
      setRules((items) => items.filter((item) => item.id !== rule.id));
      setNotice({ text: "Rule removed." });
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function testRules(event) {
    event.preventDefault();
    setChecking(true);
    setCheckResult(null);
    try {
      const { data } = await api.post("/rules/check", {
        ...check,
        price: Number(check.price),
        purchaseHour: Number(check.purchaseHour),
      });
      setCheckResult(data);
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setChecking(false);
    }
  }
  const activeCount = rules.filter((rule) => rule.active).length;
  return (
    <>
      <FeatureHeading
        eyebrow="PERSONAL GUARDRAILS"
        title="Shopping rules that step in on time"
        copy="Turn your intentions into automatic checks before a tempting purchase becomes a regret."
        action={
          <button
            className="primary"
            onClick={() => setEditing({ ...blankRule })}
          >
            <Plus /> Create a rule
          </button>
        }
      />
      <StatusMessage value={notice} onClose={() => setNotice(null)} />
      <section className="rule-hero">
        <div>
          <span>
            <ShieldCheck /> PROTECTION STATUS
          </span>
          <h2>
            {activeCount
              ? `${activeCount} mindful rule${activeCount === 1 ? " is" : "s are"} watching out for you.`
              : "Build your first shopping boundary."}
          </h2>
          <p>
            Rules stay private to your account and are checked against category,
            price, mood, planning, comparison, and time.
          </p>
        </div>
        <div className="protection-orbit">
          <ShieldCheck />
          <i>{activeCount}</i>
          <small>active</small>
        </div>
      </section>
      {loading ? (
        <PageLoader />
      ) : rules.length ? (
        <div className="rule-grid">
          {rules.map((rule) => {
            const Icon = ruleIcon(rule.ruleType);
            return (
              <section
                className={`rule-card ${rule.active ? "" : "disabled"}`}
                key={rule.id}
              >
                <header>
                  <div className="rule-icon">
                    <Icon />
                  </div>
                  <Toggle
                    checked={rule.active}
                    label={`Toggle ${rule.name}`}
                    onChange={() => toggle(rule)}
                  />
                </header>
                <span className="rule-type">{pretty(rule.ruleType)}</span>
                <h2>{rule.name}</h2>
                <p>{rule.description || ruleCopy(rule)}</p>
                <div className="rule-condition">
                  <Zap />
                  {ruleCopy(rule)}
                </div>
                <footer>
                  <button
                    onClick={() =>
                      setEditing({
                        ...rule,
                        category: rule.category || "ALL",
                        blockedEmotion: rule.blockedEmotion || "",
                      })
                    }
                  >
                    <Edit3 /> Edit
                  </button>
                  <button className="remove" onClick={() => remove(rule)}>
                    <Trash2 /> Remove
                  </button>
                </footer>
              </section>
            );
          })}
        </div>
      ) : (
        <FeatureEmpty
          icon={ShieldCheck}
          title="Make your intentions automatic"
          copy="Start with a 24-hour pause for unplanned purchases, then add boundaries that reflect your own patterns."
          action={
            <button
              className="primary"
              onClick={() => setEditing({ ...blankRule })}
            >
              Create my first rule
            </button>
          }
        />
      )}
      <section className="rule-tester">
        <div className="tester-copy">
          <span className="section-kicker">RULE CHECKER</span>
          <h2>Would your rules catch this purchase?</h2>
          <p>
            Try a real scenario. This preview checks every active rule without
            saving an evaluation.
          </p>
          <div className="tester-tip">
            <Lightbulb />
            <span>
              <b>A useful test</b>Use the price, mood, and hour from your most
              recent impulse.
            </span>
          </div>
        </div>
        <form onSubmit={testRules}>
          <div className="form-pair">
            <label>
              Category
              <select
                value={check.category}
                onChange={(event) =>
                  setCheck({ ...check, category: event.target.value })
                }
              >
                {categories
                  .filter((item) => item !== "ALL")
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                required
                placeholder="e.g. 4999"
                value={check.price}
                onChange={(event) =>
                  setCheck({ ...check, price: event.target.value })
                }
              />
            </label>
          </div>
          <div className="form-pair">
            <label>
              How are you feeling?
              <select
                value={check.emotionalState}
                onChange={(event) =>
                  setCheck({ ...check, emotionalState: event.target.value })
                }
              >
                {emotions.map((item) => (
                  <option key={item}>{pretty(item)}</option>
                ))}
              </select>
            </label>
            <label>
              Purchase hour
              <input
                type="number"
                min="0"
                max="23"
                value={check.purchaseHour}
                onChange={(event) =>
                  setCheck({ ...check, purchaseHour: event.target.value })
                }
              />
            </label>
          </div>
          <div className="check-options">
            <label>
              <input
                type="checkbox"
                checked={check.planned}
                onChange={(event) =>
                  setCheck({ ...check, planned: event.target.checked })
                }
              />
              <span>
                <Check /> Previously planned
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={check.comparedAlternatives}
                onChange={(event) =>
                  setCheck({
                    ...check,
                    comparedAlternatives: event.target.checked,
                  })
                }
              />
              <span>
                <Search /> Compared alternatives
              </span>
            </label>
          </div>
          <button className="primary tester-button" disabled={checking}>
            {checking ? (
              <>
                <LoaderCircle className="spin" /> Checking...
              </>
            ) : (
              <>
                Run rule check <ArrowRight />
              </>
            )}
          </button>
          {checkResult && (
            <div
              className={`check-result ${checkResult.allowed ? "safe" : "caught"}`}
            >
              <header>
                {checkResult.allowed ? <CheckCircle2 /> : <Ban />}
                <span>
                  <b>
                    {checkResult.allowed
                      ? "Clear to reflect"
                      : "A boundary needs attention"}
                  </b>
                  <small>
                    {checkResult.checkedRules || activeCount} rules checked
                  </small>
                </span>
              </header>
              {checkResult.violations?.map((violation, index) => (
                <div className="violation" key={`${violation.ruleId}-${index}`}>
                  <AlertCircle />
                  <span>
                    <b>{violation.ruleName}</b>
                    {violation.message}
                  </span>
                  <em>{pretty(violation.severity)}</em>
                </div>
              ))}
            </div>
          )}
        </form>
      </section>
      {editing && (
        <RuleModal
          rule={editing}
          setRule={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function RuleModal({ rule, setRule, onClose, onSave }) {
  const type =
    ruleTypes.find((item) => item[0] === rule.ruleType) || ruleTypes[0];
  const SelectedIcon = type[3];
  return (
    <div
      className="overlay advanced-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="advanced-modal rule-modal" onSubmit={onSave}>
        <button type="button" className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="modal-heading">
          <div>
            <ShieldCheck />
          </div>
          <span>
            <small>PERSONAL GUARDRAIL</small>
            <h2>{rule.id ? "Edit shopping rule" : "Create a shopping rule"}</h2>
          </span>
        </div>
        <label>
          Rule name
          <input
            required
            maxLength="80"
            placeholder="My 48-hour electronics pause"
            value={rule.name}
            onChange={(event) => setRule({ ...rule, name: event.target.value })}
          />
        </label>
        <label>
          What should this rule do?
          <div className="rule-type-picker">
            {ruleTypes.map(([value, label, , Icon]) => (
              <button
                type="button"
                key={value}
                className={rule.ruleType === value ? "selected" : ""}
                onClick={() => setRule({ ...rule, ruleType: value })}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </label>
        <div className="selected-rule-explainer">
          <SelectedIcon />
          <span>
            <b>{type[1]}</b>
            {type[2]}
          </span>
        </div>
        <div className="form-pair">
          <label>
            Category
            <select
              value={rule.category || "ALL"}
              onChange={(event) =>
                setRule({ ...rule, category: event.target.value })
              }
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {pretty(item)}
                </option>
              ))}
            </select>
          </label>
          {rule.ruleType === "WAITING_PERIOD" && (
            <label>
              Wait days
              <input
                required
                min="1"
                max="90"
                type="number"
                value={rule.waitDays}
                onChange={(event) =>
                  setRule({ ...rule, waitDays: event.target.value })
                }
              />
            </label>
          )}
          {["MAX_PRICE", "REQUIRE_COMPARISON"].includes(rule.ruleType) && (
            <label>
              Amount threshold
              <input
                required
                min="1"
                type="number"
                value={rule.amountThreshold}
                onChange={(event) =>
                  setRule({ ...rule, amountThreshold: event.target.value })
                }
              />
            </label>
          )}
          {rule.ruleType === "EMOTION_BLOCK" && (
            <label>
              Emotion
              <select
                required
                value={rule.blockedEmotion}
                onChange={(event) =>
                  setRule({ ...rule, blockedEmotion: event.target.value })
                }
              >
                <option value="">Choose a mood</option>
                {emotions
                  .filter((item) => item !== "NORMAL")
                  .map((item) => (
                    <option key={item}>{pretty(item)}</option>
                  ))}
              </select>
            </label>
          )}
        </div>
        {rule.ruleType === "LATE_NIGHT" && (
          <div className="form-pair">
            <label>
              Starts at (0-23)
              <input
                required
                min="0"
                max="23"
                type="number"
                value={rule.startHour}
                onChange={(event) =>
                  setRule({ ...rule, startHour: event.target.value })
                }
              />
            </label>
            <label>
              Ends at (0-23)
              <input
                required
                min="0"
                max="23"
                type="number"
                value={rule.endHour}
                onChange={(event) =>
                  setRule({ ...rule, endHour: event.target.value })
                }
              />
            </label>
          </div>
        )}
        <label>
          Personal reminder
          <textarea
            maxLength="300"
            placeholder="Why does this boundary matter to you?"
            value={rule.description || ""}
            onChange={(event) =>
              setRule({ ...rule, description: event.target.value })
            }
          />
        </label>
        <div className="modal-toggle">
          <span>
            <b>Start using this rule now</b>
            <small>You can turn it off at any time.</small>
          </span>
          <Toggle
            checked={rule.active}
            label="Rule active"
            onChange={() => setRule({ ...rule, active: !rule.active })}
          />
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">
            {rule.id ? "Save changes" : "Create rule"}
          </button>
        </div>
      </form>
    </div>
  );
}

const blankSubscription = {
  name: "",
  category: "ENTERTAINMENT",
  amount: "",
  billingCycle: "MONTHLY",
  nextRenewalDate: "",
  lastUsedDate: "",
  autoRenew: true,
  active: true,
  notes: "",
};
const billingCycles = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
const subscriptionCategories = [
  "ENTERTAINMENT",
  "SOFTWARE",
  "FITNESS",
  "EDUCATION",
  "NEWS",
  "GAMING",
  "CLOUD_STORAGE",
  "FOOD",
  "OTHER",
];

export function SubscriptionsPage() {
  const [items, setItems] = useState([]),
    [summary, setSummary] = useState({}),
    [editing, setEditing] = useState(null),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(null),
    [filter, setFilter] = useState("ACTIVE");
  async function load() {
    try {
      const [subscriptions, totals] = await Promise.all([
        api.get("/subscriptions"),
        api.get("/subscriptions/summary"),
      ]);
      setItems(asList(subscriptions.data, "subscriptions"));
      setSummary(totals.data || {});
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let current = true;
    (async () => {
      try {
        const [subscriptions, totals] = await Promise.all([
          api.get("/subscriptions"),
          api.get("/subscriptions/summary"),
        ]);
        if (current) {
          setItems(asList(subscriptions.data, "subscriptions"));
          setSummary(totals.data || {});
        }
      } catch (error) {
        if (current) setNotice({ type: "error", text: message(error) });
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, []);
  function payload(item) {
    return {
      name: item.name.trim(),
      category: item.category,
      amount: Number(item.amount),
      billingCycle: item.billingCycle,
      nextRenewalDate: item.nextRenewalDate || null,
      lastUsedDate: item.lastUsedDate || null,
      autoRenew: Boolean(item.autoRenew),
      active: Boolean(item.active),
      notes: item.notes?.trim() || null,
    };
  }
  async function save(event) {
    event.preventDefault();
    try {
      await api[editing.id ? "put" : "post"](
        `/subscriptions${editing.id ? `/${editing.id}` : ""}`,
        payload(editing),
      );
      setEditing(null);
      setNotice({ text: "Subscription saved." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function update(item, changes) {
    try {
      await api.put(
        `/subscriptions/${item.id}`,
        payload({ ...item, ...changes }),
      );
      await load();
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function remove(item) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await api.delete(`/subscriptions/${item.id}`);
      setNotice({ text: "Subscription removed." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  const shown = useMemo(
    () =>
      items.filter(
        (item) =>
          filter === "ALL" ||
          (filter === "ACTIVE" ? item.active : !item.active),
      ),
    [items, filter],
  );
  return (
    <>
      <FeatureHeading
        eyebrow="RECURRING SPEND"
        title="See what quietly renews"
        copy="Turn subscriptions into visible choices with normalized costs, renewal reminders, and usage signals."
        action={
          <button
            className="primary"
            onClick={() => setEditing({ ...blankSubscription })}
          >
            <Plus /> Add subscription
          </button>
        }
      />
      <StatusMessage value={notice} onClose={() => setNotice(null)} />
      <div className="subscription-stats">
        <section>
          <div className="stat-icon green">
            <WalletCards />
          </div>
          <span>
            <small>MONTHLY COMMITMENT</small>
            <strong>{money(summary.monthlyCost)}</strong>
            <em>{summary.activeCount || 0} active services</em>
          </span>
        </section>
        <section>
          <div className="stat-icon gold">
            <CalendarDays />
          </div>
          <span>
            <small>ANNUALIZED COST</small>
            <strong>{money(summary.annualCost)}</strong>
            <em>Your recurring footprint</em>
          </span>
        </section>
        <section>
          <div className="stat-icon coral">
            <BellRing />
          </div>
          <span>
            <small>RENEWING SOON</small>
            <strong>{summary.renewalSoonCount || 0}</strong>
            <em>Within the next 7 days</em>
          </span>
        </section>
        <section>
          <div className="stat-icon purple">
            <Gauge />
          </div>
          <span>
            <small>POSSIBLY UNUSED</small>
            <strong>{summary.unusedCount || 0}</strong>
            <em>Review before renewal</em>
          </span>
        </section>
      </div>
      <div className="advanced-toolbar">
        <div className="segmented">
          {["ACTIVE", "PAUSED", "ALL"].map((value) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {pretty(value)}
            </button>
          ))}
        </div>
        <span>
          <Info /> Monthly cost normalizes every billing cycle for a fair
          comparison.
        </span>
      </div>
      {loading ? (
        <PageLoader label="Finding recurring charges..." />
      ) : shown.length ? (
        <div className="subscription-list">
          {shown.map((item) => (
            <section
              className={`subscription-card ${item.active ? "" : "paused"}`}
              key={item.id}
            >
              <div className="subscription-brand">
                {item.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="subscription-main">
                <div>
                  <span className="subscription-category">
                    {pretty(item.category)}
                  </span>
                  {item.unused && (
                    <span className="status-pill warning">
                      <AlertCircle /> Possibly unused
                    </span>
                  )}
                  {item.renewalSoon && (
                    <span className="status-pill soon">
                      <Clock3 /> Renews soon
                    </span>
                  )}
                </div>
                <h2>{item.name}</h2>
                <p>{item.notes || `${pretty(item.billingCycle)} membership`}</p>
              </div>
              <div className="subscription-cost">
                <strong>{money(item.amount)}</strong>
                <small>/{pretty(item.billingCycle).toLowerCase()}</small>
                <em>{money(item.monthlyCost)} monthly</em>
              </div>
              <div className="renewal-date">
                <CalendarDays />
                <span>
                  <small>NEXT RENEWAL</small>
                  <b>{displayDate(item.nextRenewalDate)}</b>
                  {Number.isFinite(item.daysUntilRenewal) && (
                    <em>
                      {item.daysUntilRenewal >= 0
                        ? `${item.daysUntilRenewal} days away`
                        : "Renewal date passed"}
                    </em>
                  )}
                </span>
              </div>
              <div className="subscription-actions">
                <button title="Edit" onClick={() => setEditing({ ...item })}>
                  <Edit3 />
                </button>
                <button
                  title={item.active ? "Pause" : "Reactivate"}
                  onClick={() => update(item, { active: !item.active })}
                >
                  {item.active ? <Ban /> : <RefreshCw />}
                </button>
                <button
                  className="remove"
                  title="Delete"
                  onClick={() => remove(item)}
                >
                  <Trash2 />
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <FeatureEmpty
          icon={Receipt}
          title={
            filter === "ACTIVE"
              ? "No active subscriptions yet"
              : "Nothing in this view"
          }
          copy="Add recurring services to reveal their true monthly and yearly cost before they renew."
          action={
            <button
              className="primary"
              onClick={() => setEditing({ ...blankSubscription })}
            >
              Track a subscription
            </button>
          }
        />
      )}
      <section className="subscription-callout">
        <div>
          <Lightbulb />
        </div>
        <span>
          <b>A five-minute subscription reset</b>
          <p>
            Review anything unused for 30 days. Cancelling even one forgotten
            service can fund a meaningful savings goal.
          </p>
        </span>
        <Link to="/goals">
          View savings goals <ChevronRight />
        </Link>
      </section>
      {editing && (
        <SubscriptionModal
          item={editing}
          setItem={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function SubscriptionModal({ item, setItem, onClose, onSave }) {
  return (
    <div
      className="overlay advanced-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="advanced-modal" onSubmit={onSave}>
        <button type="button" className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="modal-heading">
          <div>
            <Receipt />
          </div>
          <span>
            <small>RECURRING PAYMENT</small>
            <h2>{item.id ? "Edit subscription" : "Add a subscription"}</h2>
          </span>
        </div>
        <div className="form-pair">
          <label>
            Service name
            <input
              required
              maxLength="100"
              placeholder="Netflix, gym, cloud storage..."
              value={item.name}
              onChange={(event) =>
                setItem({ ...item, name: event.target.value })
              }
            />
          </label>
          <label>
            Category
            <select
              value={item.category}
              onChange={(event) =>
                setItem({ ...item, category: event.target.value })
              }
            >
              {subscriptionCategories.map((value) => (
                <option key={value}>{pretty(value)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-pair">
          <label>
            Amount
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={item.amount}
              onChange={(event) =>
                setItem({ ...item, amount: event.target.value })
              }
            />
          </label>
          <label>
            Billing cycle
            <select
              value={item.billingCycle}
              onChange={(event) =>
                setItem({ ...item, billingCycle: event.target.value })
              }
            >
              {billingCycles.map((value) => (
                <option key={value}>{pretty(value)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-pair">
          <label>
            Next renewal
            <input
              type="date"
              value={item.nextRenewalDate || ""}
              onChange={(event) =>
                setItem({ ...item, nextRenewalDate: event.target.value })
              }
            />
          </label>
          <label>
            Last used
            <input
              type="date"
              value={item.lastUsedDate || ""}
              onChange={(event) =>
                setItem({ ...item, lastUsedDate: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            maxLength="500"
            placeholder="Plan, cancellation terms, what value it provides..."
            value={item.notes || ""}
            onChange={(event) =>
              setItem({ ...item, notes: event.target.value })
            }
          />
        </label>
        <div className="modal-toggle-grid">
          <div className="modal-toggle">
            <span>
              <b>Auto-renew</b>
              <small>Remind me before it charges.</small>
            </span>
            <Toggle
              checked={item.autoRenew}
              label="Auto renew"
              onChange={() => setItem({ ...item, autoRenew: !item.autoRenew })}
            />
          </div>
          <div className="modal-toggle">
            <span>
              <b>Active</b>
              <small>Include in recurring totals.</small>
            </span>
            <Toggle
              checked={item.active}
              label="Subscription active"
              onChange={() => setItem({ ...item, active: !item.active })}
            />
          </div>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">Save subscription</button>
        </div>
      </form>
    </div>
  );
}

const notificationIcon = (type) =>
  ({
    BUDGET: WalletCards,
    COOLING_OFF: Clock3,
    SUBSCRIPTION: RefreshCw,
    GOAL: Sparkles,
    RULE: ShieldCheck,
    PRICE_DROP: Tags,
  })[type] || Bell;

export function NotificationsPage() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(null),
    [unreadOnly, setUnreadOnly] = useState(false),
    [permission, setPermission] = useState(
      typeof Notification === "undefined"
        ? "unsupported"
        : Notification.permission,
    );
  const [prefs, setPrefs] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("mindful-notification-prefs")) || {
          cooling: true,
          budget: true,
          goals: true,
          subscriptions: true,
        }
      );
    } catch {
      return { cooling: true, budget: true, goals: true, subscriptions: true };
    }
  });
  async function load(filter = unreadOnly) {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", {
        params: filter ? { unreadOnly: true } : {},
      });
      setItems(asList(data, "notifications"));
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let current = true;
    (async () => {
      try {
        const { data } = await api.get("/notifications");
        if (current) setItems(asList(data, "notifications"));
      } catch (error) {
        if (current) setNotice({ type: "error", text: message(error) });
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, []);
  async function changeFilter(value) {
    setUnreadOnly(value);
    await load(value);
  }
  async function markRead(item) {
    if (item.read) return;
    try {
      await api.put(`/notifications/${item.id}/read`);
      setItems((list) =>
        list.map((entry) =>
          entry.id === item.id
            ? { ...entry, read: true, readAt: new Date().toISOString() }
            : entry,
        ),
      );
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function markAll() {
    try {
      await api.put("/notifications/read-all");
      setItems((list) => list.map((item) => ({ ...item, read: true })));
      setNotice({ text: "Everything is marked as read." });
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function clearRead() {
    if (!window.confirm("Clear all read notifications?")) return;
    try {
      await api.delete("/notifications/read");
      setItems((list) => list.filter((item) => !item.read));
      setNotice({ text: "Read notifications cleared." });
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    }
  }
  async function enableBrowser() {
    if (typeof Notification === "undefined") {
      setNotice({
        type: "error",
        text: "This browser does not support desktop notifications.",
      });
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification("MindfulCart reminders are on", {
        body: "You will be able to receive timely mindful-spending nudges.",
      });
      setNotice({ text: "Browser notifications enabled." });
    }
  }
  function updatePref(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem("mindful-notification-prefs", JSON.stringify(next));
  }
  const unread = items.filter((item) => !item.read).length;
  return (
    <>
      <FeatureHeading
        eyebrow="TIMELY NUDGES"
        title="Your notification center"
        copy="See the reminders that deserve attention, without turning mindful shopping into more digital noise."
        action={
          unread > 0 ? (
            <button className="secondary" onClick={markAll}>
              <Check /> Mark all read
            </button>
          ) : null
        }
      />
      <StatusMessage value={notice} onClose={() => setNotice(null)} />
      <div className="notifications-layout">
        <div className="notification-feed">
          <section className="notification-feed-head">
            <div>
              <span className="bell-badge">
                <BellRing />
                {unread > 0 && <i>{unread}</i>}
              </span>
              <span>
                <h2>Inbox</h2>
                <p>
                  {unread
                    ? `${unread} reminder${unread === 1 ? "" : "s"} waiting for you`
                    : "You are all caught up"}
                </p>
              </span>
            </div>
            <div className="segmented">
              <button
                className={!unreadOnly ? "active" : ""}
                onClick={() => changeFilter(false)}
              >
                All
              </button>
              <button
                className={unreadOnly ? "active" : ""}
                onClick={() => changeFilter(true)}
              >
                Unread
              </button>
            </div>
          </section>
          {loading ? (
            <PageLoader label="Loading reminders..." />
          ) : items.length ? (
            <div className="notification-items">
              {items.map((item) => {
                const Icon = notificationIcon(item.type);
                return (
                  <button
                    className={`notification-item ${item.read ? "read" : "unread"}`}
                    key={item.id}
                    onClick={() => markRead(item)}
                  >
                    <span className="notification-type">
                      <Icon />
                    </span>
                    <span className="notification-content">
                      <span>
                        <b>{item.title}</b>
                        {!item.read && <i />}
                      </span>
                      <p>{item.message}</p>
                      <small>
                        {new Date(item.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {pretty(item.type)}
                      </small>
                    </span>
                    {item.actionUrl && (
                      <Link
                        to={item.actionUrl}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Open <ChevronRight />
                      </Link>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <FeatureEmpty
              icon={Bell}
              title="No reminders here"
              copy={
                unreadOnly
                  ? "You have read every notification. Nice and tidy."
                  : "Budget nudges, cooling-off timers, renewals, and milestones will appear here."
              }
            />
          )}
          <footer className="feed-footer">
            <button onClick={clearRead}>
              <Trash2 /> Clear read notifications
            </button>
          </footer>
        </div>
        <aside className="notification-settings">
          <div className="settings-illustration">
            <BellRing />
            <i />
            <i />
            <i />
          </div>
          <h2>Reminder controls</h2>
          <p>Choose the moments when a gentle nudge is genuinely useful.</p>
          <div className="preference-list">
            {[
              [
                "cooling",
                "Cooling-off timers",
                "When an item is ready to reassess",
              ],
              ["budget", "Budget thresholds", "At 75%, 90%, and over budget"],
              ["goals", "Goal milestones", "Celebrate meaningful progress"],
              [
                "subscriptions",
                "Subscription renewals",
                "Before a recurring payment",
              ],
            ].map(([key, title, copy]) => (
              <div key={key}>
                <span>
                  <b>{title}</b>
                  <small>{copy}</small>
                </span>
                <Toggle
                  checked={prefs[key]}
                  label={title}
                  onChange={() => updatePref(key)}
                />
              </div>
            ))}
          </div>
          <div className={`browser-permission ${permission}`}>
            <div>
              <Bell />
              <span>
                <b>Browser notifications</b>
                <small>
                  {permission === "granted"
                    ? "Enabled on this device"
                    : permission === "denied"
                      ? "Blocked in browser settings"
                      : permission === "unsupported"
                        ? "Not supported by this browser"
                        : "Get reminders even when this page is closed"}
                </small>
              </span>
            </div>
            {permission === "default" && (
              <button onClick={enableBrowser}>Enable</button>
            )}
          </div>
          <div className="quiet-note">
            <Moon />
            <span>
              <b>Quiet by default</b>MindfulCart never uses urgency or
              promotional notifications.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function reportEntries(value) {
  if (Array.isArray(value))
    return value.map((item) => [
      item.category || item.label || item.name,
      item.amount ?? item.value ?? item.count,
    ]);
  if (value && typeof value === "object") return Object.entries(value);
  return [];
}

export function ReportsPage() {
  const [month, setMonth] = useState(todayMonth()),
    [report, setReport] = useState(null),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(null),
    [downloading, setDownloading] = useState("");
  useEffect(() => {
    let current = true;
    (async () => {
      try {
        const { data } = await api.get("/insights/monthly", {
          params: { month },
        });
        if (current) setReport(data);
      } catch (error) {
        if (current) setNotice({ type: "error", text: message(error) });
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [month]);
  async function download(kind) {
    setDownloading(kind);
    try {
      const html = kind === "html";
      const response = await api.get(
        html ? "/reports/monthly.html" : "/reports/evaluations.csv",
        { params: { month }, responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = html
        ? `mindfulcart-${month}-report.html`
        : `mindfulcart-${month}-evaluations.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice({
        text: `${html ? "Monthly report" : "Evaluation data"} downloaded.`,
      });
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setDownloading("");
    }
  }
  const categories = reportEntries(
    report?.categoryBreakdown || report?.categories,
  );
  const maxCategory = Math.max(
    1,
    ...categories.map(([, value]) => Number(value) || 0),
  );
  return (
    <>
      <FeatureHeading
        eyebrow="MONTHLY REVIEW"
        title="Turn reflections into a clear story"
        copy="See what you considered, what you chose, and where your future spending can become more intentional."
        action={
          <div className="month-control">
            <CalendarDays />
            <input
              aria-label="Report month"
              type="month"
              max={todayMonth()}
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
        }
      />
      <StatusMessage value={notice} onClose={() => setNotice(null)} />
      <div className="report-actions">
        <div>
          <FileBarChart />
          <span>
            <b>Export your data</b>
            <small>Useful for your own review or project demonstration.</small>
          </span>
        </div>
        <button
          className="secondary"
          disabled={!!downloading}
          onClick={() => download("csv")}
        >
          <Download />{" "}
          {downloading === "csv" ? "Preparing..." : "Evaluation CSV"}
        </button>
        <button
          className="primary"
          disabled={!!downloading}
          onClick={() => download("html")}
        >
          <FileText />{" "}
          {downloading === "html" ? "Preparing..." : "Monthly report"}
        </button>
      </div>
      {loading ? (
        <PageLoader label="Building your monthly story..." />
      ) : report ? (
        <>
          <section className="report-cover">
            <div>
              <span>
                <Sparkles /> MINDFUL MONTH IN REVIEW
              </span>
              <h2>
                {report.headline ||
                  report.summaryHeadline ||
                  "A month of more deliberate decisions"}
              </h2>
              <p>
                {report.summary ||
                  report.insight ||
                  report.narrative ||
                  "Each evaluation is a moment where you created space between wanting and choosing."}
              </p>
            </div>
            <div className="report-month">
              <small>REPORTING PERIOD</small>
              <strong>
                {new Date(`${month}-02`).toLocaleDateString("en-IN", {
                  month: "long",
                })}
              </strong>
              <span>{month.slice(0, 4)}</span>
            </div>
          </section>
          <div className="report-metrics">
            <section>
              <small>EVALUATED</small>
              <strong>
                {report.evaluatedCount ??
                  report.totalEvaluations ??
                  report.evaluated ??
                  0}
              </strong>
              <span>purchase decisions paused</span>
            </section>
            <section>
              <small>AVOIDED</small>
              <strong>{report.avoidedCount ?? report.avoided ?? 0}</strong>
              <span>
                {money(report.avoidedAmount ?? report.moneySaved)} protected
              </span>
            </section>
            <section>
              <small>PURCHASED</small>
              <strong>{report.purchasedCount ?? report.purchased ?? 0}</strong>
              <span>{money(report.purchasedAmount)} confirmed spend</span>
            </section>
            <section>
              <small>AVERAGE SCORE</small>
              <strong>
                {Math.round(
                  Number(
                    report.averageImpulseScore ??
                      report.averageScore ??
                      report.avgScore,
                  ) || 0,
                )}
                <em>/100</em>
              </strong>
              <span>impulse risk</span>
            </section>
          </div>
          <div className="report-grid">
            <section className="report-panel category-report">
              <header>
                <div>
                  <span className="section-kicker">WHERE ATTENTION WENT</span>
                  <h2>Category activity</h2>
                </div>
                <Tags />
              </header>
              {categories.length ? (
                <div className="category-bars">
                  {categories.map(([label, value]) => (
                    <div key={label}>
                      <span>
                        <b>{pretty(label)}</b>
                        <em>
                          {typeof value === "number"
                            ? value
                            : Number(value) || 0}
                        </em>
                      </span>
                      <i>
                        <b
                          style={{
                            width: `${Math.max(4, ((Number(value) || 0) / maxCategory) * 100)}%`,
                          }}
                        />
                      </i>
                    </div>
                  ))}
                </div>
              ) : (
                <FeatureEmpty
                  icon={Tags}
                  title="No category activity"
                  copy="Complete evaluations this month to reveal your spending attention."
                />
              )}
            </section>
            <section className="report-panel report-patterns">
              <span className="section-kicker">PATTERN SNAPSHOT</span>
              <h2>What shaped decisions</h2>
              <div>
                <span>
                  <BrainCircuit />
                </span>
                <p>
                  <small>MOST COMMON TRIGGER</small>
                  <b>
                    {pretty(report.topTrigger || report.commonTrigger) ||
                      "No pattern yet"}
                  </b>
                </p>
              </div>
              <div>
                <span>
                  <Tags />
                </span>
                <p>
                  <small>TOP CATEGORY</small>
                  <b>{pretty(report.topCategory) || "No pattern yet"}</b>
                </p>
              </div>
              <div>
                <span>
                  <Clock3 />
                </span>
                <p>
                  <small>STILL COOLING OFF</small>
                  <b>
                    {report.waitingCount ?? report.waiting ?? 0} purchase
                    decisions
                  </b>
                </p>
              </div>
            </section>
          </div>
          <section className="report-reflection">
            <div>
              <Lightbulb />
            </div>
            <span>
              <small>COACHING REFLECTION</small>
              <h2>
                {report.recommendationTitle || "One change to carry forward"}
              </h2>
              <p>
                {report.recommendation ||
                  report.coachingTip ||
                  report.insights?.[0] ||
                  "Choose one personal rule for your most common trigger and test it during your next purchase evaluation."}
              </p>
            </span>
            <Link to="/rules">
              Create a boundary <ArrowRight />
            </Link>
          </section>
        </>
      ) : (
        <FeatureEmpty
          icon={FileBarChart}
          title="No report is available"
          copy="Complete a purchase evaluation, then return here for your monthly review."
          action={
            <Link className="primary" to="/evaluate">
              Evaluate a purchase
            </Link>
          }
        />
      )}
    </>
  );
}

const samplePrompts = [
  "I found Sony headphones for Rs 8,000 on Instagram at 30% off.",
  "Thinking about a Rs 2,499 jacket because the sale ends tonight.",
  "I am bored and want to order a gaming mouse for Rs 3,200.",
];

export function SmartCapturePage() {
  const [mode, setMode] = useState("text"),
    [text, setText] = useState(""),
    [file, setFile] = useState(null),
    [preview, setPreview] = useState(""),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setPreview(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);
  async function parseText(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post("/tools/parse-purchase", {
        text: text.trim(),
      });
      setResult(data);
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setBusy(false);
    }
  }
  async function extract(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      if (text.trim()) body.append("extractedText", text.trim());
      const { data } = await api.post("/tools/extract-metadata", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(
        data?.draft
          ? {
              ...data.draft,
              extractionStatus: data.extractionStatus,
              ocrText: data.ocrText,
              ocrEngine: data.engine,
              ocrDurationMs: data.durationMs,
              ocrCharacterCount: data.ocrCharacterCount,
            }
          : data,
      );
      setNotice({
        text: "OCR finished. Review the extracted text and suggested fields.",
      });
    } catch (error) {
      setNotice({ type: "error", text: message(error) });
    } finally {
      setBusy(false);
    }
  }
  function continueToEvaluate() {
    const draft = result?.draft || result;
    if (!draft) return;
    sessionStorage.setItem("purchaseDraft", JSON.stringify(draft));
    window.location.assign("/evaluate");
  }
  return (
    <>
      <FeatureHeading
        eyebrow="SMART CAPTURE"
        title="Describe it. We will structure the decision."
        copy="Start with natural language or a receipt screenshot, then review every extracted detail before evaluating."
      />
      <StatusMessage value={notice} onClose={() => setNotice(null)} />
      <section className="capture-shell">
        <div className="capture-input">
          <div className="capture-tabs">
            <button
              className={mode === "text" ? "active" : ""}
              onClick={() => {
                setMode("text");
                setResult(null);
              }}
            >
              <MessageSquareText /> Describe a purchase
            </button>
            <button
              className={mode === "receipt" ? "active" : ""}
              onClick={() => {
                setMode("receipt");
                setResult(null);
              }}
            >
              <Receipt /> Receipt or screenshot
            </button>
          </div>
          {mode === "text" ? (
            <form onSubmit={parseText}>
              <div className="capture-prompt">
                <Sparkles />
                <textarea
                  autoFocus
                  placeholder="Try: I saw a smartwatch for Rs 6,999 in an Instagram ad. It is 40% off and the deal ends tonight..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <span>{text.length}/1000</span>
              </div>
              <div className="example-prompts">
                <small>TRY AN EXAMPLE</small>
                {samplePrompts.map((value) => (
                  <button
                    type="button"
                    onClick={() => setText(value)}
                    key={value}
                  >
                    {value}
                    <ChevronRight />
                  </button>
                ))}
              </div>
              <button
                className="primary capture-submit"
                disabled={busy || !text.trim()}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" /> Understanding purchase...
                  </>
                ) : (
                  <>
                    Extract purchase details <ArrowRight />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={extract}>
              <label className={`upload-zone ${file ? "has-file" : ""}`}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected && selected.size > 8 * 1024 * 1024) {
                      setNotice({
                        type: "error",
                        text: "Choose a file smaller than 8 MB.",
                      });
                      return;
                    }
                    setFile(selected || null);
                  }}
                />
                {preview ? (
                  <img src={preview} alt="Selected receipt preview" />
                ) : (
                  <div>
                    {file ? <FileText /> : <Upload />}
                    <h3>
                      {file
                        ? file.name
                        : "Drop a receipt or shopping screenshot"}
                    </h3>
                    <p>
                      {file
                        ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Click to replace`
                        : "PNG, JPG, WEBP, or PDF · Up to 8 MB"}
                    </p>
                  </div>
                )}
              </label>
              <label className="optional-text">
                Visible text <span>optional, improves accuracy</span>
                <textarea
                  placeholder="Paste the receipt or screenshot text if you have it..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </label>
              <button
                className="primary capture-submit"
                disabled={busy || !file}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" /> Reading file...
                  </>
                ) : (
                  <>
                    Extract purchase details <ArrowRight />
                  </>
                )}
              </button>
              <p className="privacy-copy">
                <LockKeyhole /> Your upload is used only to extract purchase
                details for this decision.
              </p>
            </form>
          )}
        </div>
        <aside className="capture-preview">
          <header>
            <span>
              <BrainCircuit /> STRUCTURED DRAFT
            </span>
            {result?.confidence != null && (
              <em>
                {Math.round(
                  Number(result.confidence) *
                    (Number(result.confidence) <= 1 ? 100 : 1),
                )}
                % confidence
              </em>
            )}
          </header>
          {result ? (
            <div className="extraction-result">
              <div className="extracted-product">
                <div>{result.productName?.[0] || "?"}</div>
                <span>
                  <small>PRODUCT</small>
                  <h2>{result.productName || "Review product name"}</h2>
                  <p>{pretty(result.category) || "Category not detected"}</p>
                </span>
              </div>
              <div className="extracted-fields">
                <div>
                  <small>PRICE</small>
                  <b>
                    {result.price != null
                      ? money(result.price)
                      : "Not detected"}
                  </b>
                </div>
                <div>
                  <small>DISCOUNT</small>
                  <b>
                    {result.discountPercentage != null
                      ? `${result.discountPercentage}%`
                      : "Not detected"}
                  </b>
                </div>
                <div>
                  <small>SOURCE</small>
                  <b>{pretty(result.sourceOfInterest) || "Not detected"}</b>
                </div>
                <div>
                  <small>MOOD</small>
                  <b>{pretty(result.emotionalState) || "Not detected"}</b>
                </div>
              </div>
              {result.detectedFields?.length > 0 && (
                <div className="detected-list">
                  <small>DETECTED SIGNALS</small>
                  {result.detectedFields.map((field) => (
                    <span key={field}>
                      <Check /> {pretty(field)}
                    </span>
                  ))}
                </div>
              )}
              {result.warnings?.length > 0 && (
                <div className="extraction-warnings">
                  {result.warnings.map((warning) => (
                    <span key={warning}>
                      <AlertCircle />
                      {warning}
                    </span>
                  ))}
                </div>
              )}
              <button
                className="primary continue-evaluation"
                onClick={continueToEvaluate}
              >
                Review in purchase evaluation <ArrowRight />
              </button>
              <small className="review-reminder">
                Always confirm extracted details before saving.
              </small>
            </div>
          ) : (
            <div className="capture-placeholder">
              <div>
                <Receipt />
              </div>
              <h3>Your draft will appear here</h3>
              <p>
                We will identify price, discount, category, source, and
                emotional cues when possible.
              </p>
              <ul>
                <li>
                  <Check /> You stay in control of every field
                </li>
                <li>
                  <Check /> Uncertain details are clearly marked
                </li>
                <li>
                  <Check /> Nothing is purchased automatically
                </li>
              </ul>
            </div>
          )}
        </aside>
      </section>
      {result?.extractionStatus && (
        <section className="ocr-proof">
          <div>
            <CheckCircle2 />
            <span>
              <small>
                {result.extractionStatus === "OCR_COMPLETE"
                  ? "OCR COMPLETE"
                  : "TEXT EXTRACTED"}
              </small>
              <b>{result.ocrEngine}</b>
            </span>
            <em>
              {result.ocrCharacterCount || 0} characters ·{" "}
              {result.ocrDurationMs || 0} ms
            </em>
          </div>
          {result.ocrText && (
            <details>
              <summary>View recognized text</summary>
              <pre>{result.ocrText}</pre>
            </details>
          )}
        </section>
      )}
    </>
  );
}
