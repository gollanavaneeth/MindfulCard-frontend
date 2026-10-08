import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronRight,
  Flag,
  History as HistoryIcon,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import api, { message } from "./api";

const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);
const pretty = (v) =>
  (v || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const riskTone = (r) => (r || "low").toLowerCase();
export const PageTitle = ({ eyebrow, title, copy, action }) => (
  <div className="page-heading">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </div>
    {action}
  </div>
);
const Blank = ({ icon: Icon = Sparkles, title, copy, action }) => (
  <div className="feature-empty">
    <div>
      <Icon />
    </div>
    <h3>{title}</h3>
    <p>{copy}</p>
    {action}
  </div>
);

export function DashboardWelcome({ name, evaluated = 0 }) {
  return (
    <section className="welcome-hero">
      <div className="welcome-copy">
        <span>
          <Sparkles /> MINDFUL MONEY, MADE PERSONAL
        </span>
        <h2>
          {evaluated
            ? `You’ve paused ${evaluated} time${evaluated === 1 ? "" : "s"} before buying.`
            : `Welcome, ${name}. Let’s make your first pause count.`}
        </h2>
        <p>
          {evaluated
            ? "Every reflection reveals a little more about what triggers your spending—and what helps you choose intentionally."
            : "Run a two-minute purchase check before your next checkout. You’ll get a clear risk score, a cooling-off recommendation, and reasons you can act on."}
        </p>
        <a className="hero-button" href="/evaluate">
          Check a purchase <ChevronRight />
        </a>
      </div>
      <div className="hero-visual">
        <div className="pulse-ring">
          <BrainCircuit />
        </div>
        <span className="float-card one">
          <Check /> Evidence-based score
        </span>
        <span className="float-card two">
          <CalendarClock /> Smart cooling-off time
        </span>
        <span className="float-card three">
          <Target /> Goal-linked savings
        </span>
      </div>
    </section>
  );
}

export function HistoryPage() {
  const [items, setItems] = useState([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [selected, setSelected] = useState(),
    [note, setNote] = useState("");
  const load = () =>
    api
      .get("/evaluations")
      .then((r) => setItems(r.data))
      .catch((e) => setNote(message(e)));
  useEffect(() => {
    load();
  }, []);
  const shown = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === "ALL" || x.decision === filter) &&
          `${x.productName} ${x.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, filter, query],
  );
  async function decide(item, decision) {
    try {
      const { data } = await api.put(`/evaluations/${item.id}/decision`, {
        decision,
      });
      setItems(items.map((x) => (x.id === item.id ? data : x)));
      setSelected(data);
      setNote(
        decision === "AVOIDED"
          ? `${money(item.price)} added to your mindful savings.`
          : "Decision updated.",
      );
    } catch (e) {
      setNote(message(e));
    }
  }
  async function remove(id) {
    if (window.confirm("Delete this evaluation permanently?")) {
      await api.delete(`/evaluations/${id}`);
      setSelected();
      load();
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="DECISION JOURNAL"
        title="Evaluation history"
        copy="Review what influenced you, then record what you ultimately decided."
      />
      {note && <div className="notice">{note}</div>}
      <div className="history-toolbar">
        <div className="searchbox">
          <HistoryIcon />
          <input
            placeholder="Search evaluations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {["ALL", "PENDING", "WAITING", "PURCHASED", "AVOIDED"].map((x) => (
            <button
              className={filter === x ? "active" : ""}
              onClick={() => setFilter(x)}
              key={x}
            >
              {pretty(x)}
            </button>
          ))}
        </div>
      </div>
      {shown.length ? (
        <div className="history-list">
          {shown.map((x) => (
            <button
              className="history-row"
              onClick={() => setSelected(x)}
              key={x.id}
            >
              <div className={`history-score ${riskTone(x.riskLevel)}`}>
                {x.impulseScore}
              </div>
              <span>
                <b>{x.productName}</b>
                <small>
                  {pretty(x.category)} ·{" "}
                  {new Date(x.createdAt).toLocaleDateString()}
                </small>
              </span>
              <span className={`decision ${x.decision.toLowerCase()}`}>
                {pretty(x.decision)}
              </span>
              <strong>{money(x.price)}</strong>
              <ChevronRight />
            </button>
          ))}
        </div>
      ) : (
        <Blank
          icon={HistoryIcon}
          title="No matching reflections"
          copy="Your completed purchase evaluations will build a searchable decision journal."
        />
      )}
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected()}>
          <aside className="detail-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected()}>
              ×
            </button>
            <span className={`decision ${selected.decision.toLowerCase()}`}>
              {pretty(selected.decision)}
            </span>
            <h2>{selected.productName}</h2>
            <p className="drawer-meta">
              {pretty(selected.category)} · {money(selected.price)}
            </p>
            <div className="score-band">
              <div className={`history-score ${riskTone(selected.riskLevel)}`}>
                {selected.impulseScore}
              </div>
              <span>
                <b>{pretty(selected.riskLevel)} impulse risk</b>
                <small>Suggested pause: {selected.waitingPeriod}</small>
              </span>
            </div>
            <h3>Your decision signals</h3>
            <ul className="signal-list">
              {selected.reasons.map((r) => (
                <li key={r}>
                  <Check />
                  {r}
                </li>
              ))}
            </ul>
            <div className="coach-note">
              <BrainCircuit />
              <span>
                <b>Recommendation</b>
                {selected.recommendation}
              </span>
            </div>
            <h3>What did you decide?</h3>
            <div className="decision-actions">
              <button onClick={() => decide(selected, "WAITING")}>
                Still waiting
              </button>
              <button onClick={() => decide(selected, "PURCHASED")}>
                Purchased
              </button>
              <button
                className="avoided"
                onClick={() => decide(selected, "AVOIDED")}
              >
                I avoided it
              </button>
            </div>
            <button className="delete-link" onClick={() => remove(selected.id)}>
              <Trash2 /> Delete evaluation
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

export function GoalsPage() {
  const [goals, setGoals] = useState([]),
    [editing, setEditing] = useState(),
    [note, setNote] = useState("");
  const load = () =>
    api
      .get("/goals")
      .then((r) => setGoals(r.data))
      .catch((e) => setNote(message(e)));
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    try {
      await api[editing.id ? "put" : "post"](
        `/goals${editing.id ? "/" + editing.id : ""}`,
        editing,
      );
      setEditing();
      setNote("Your savings goal is updated.");
      load();
    } catch (x) {
      setNote(message(x));
    }
  }
  async function remove(id) {
    if (window.confirm("Remove this goal?")) {
      await api.delete(`/goals/${id}`);
      load();
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="SAVINGS WITH PURPOSE"
        title="Goals that make pausing worthwhile"
        copy="Every avoided impulse can move you closer to something meaningful."
        action={
          <button
            className="primary"
            onClick={() =>
              setEditing({
                title: "",
                targetAmount: "",
                manuallySaved: 0,
                targetDate: "",
              })
            }
          >
            <Plus />
            New goal
          </button>
        }
      />
      {note && <div className="notice">{note}</div>}
      {goals.length ? (
        <div className="goal-grid">
          {goals.map((g) => (
            <section className="goal-card" key={g.id}>
              <div className="goal-icon">
                <Target />
              </div>
              <button className="icon-button" onClick={() => remove(g.id)}>
                <Trash2 />
              </button>
              <span className="goal-date">
                {g.targetDate
                  ? `Target · ${new Date(g.targetDate + "T00:00").toLocaleDateString()}`
                  : "No deadline"}
              </span>
              <h2>{g.title}</h2>
              <div className="goal-numbers">
                <strong>{money(g.totalSaved)}</strong>
                <span>of {money(g.targetAmount)}</span>
              </div>
              <div className="goal-track">
                <i style={{ width: `${g.progress}%` }} />
              </div>
              <div className="goal-breakdown">
                <span>
                  <b>{money(g.manuallySaved)}</b>Added manually
                </span>
                <span>
                  <b>{money(g.impulseSavings)}</b>Impulse savings
                </span>
                <span>
                  <b>{Math.round(g.progress)}%</b>Complete
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => setEditing({ ...g })}
              >
                Update progress <ChevronRight />
              </button>
            </section>
          ))}
        </div>
      ) : (
        <Blank
          icon={Flag}
          title="Give your savings a destination"
          copy="Create a goal for an emergency fund, a trip, a course, or anything more valuable than a passing impulse."
          action={
            <button
              className="primary"
              onClick={() =>
                setEditing({
                  title: "",
                  targetAmount: "",
                  manuallySaved: 0,
                  targetDate: "",
                })
              }
            >
              Create my first goal
            </button>
          }
        />
      )}{" "}
      {editing && (
        <div className="overlay">
          <form className="modal goal-modal" onSubmit={save}>
            <div className="modal-icon">
              <Target />
            </div>
            <h2>{editing.id ? "Update goal" : "Create a savings goal"}</h2>
            <p>Connect mindful decisions to something you genuinely want.</p>
            <label>
              What are you saving for?
              <input
                required
                placeholder="Emergency fund, new laptop…"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <div className="two-fields">
              <label>
                Target amount
                <input
                  required
                  min="1"
                  type="number"
                  value={editing.targetAmount}
                  onChange={(e) =>
                    setEditing({ ...editing, targetAmount: e.target.value })
                  }
                />
              </label>
              <label>
                Already saved
                <input
                  min="0"
                  type="number"
                  value={editing.manuallySaved}
                  onChange={(e) =>
                    setEditing({ ...editing, manuallySaved: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Target date
              <input
                type="date"
                value={editing.targetDate || ""}
                onChange={(e) =>
                  setEditing({ ...editing, targetDate: e.target.value })
                }
              />
            </label>
            <div className="actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing()}
              >
                Cancel
              </button>
              <button className="primary">Save goal</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function AiChat() {
  const [q, setQ] = useState(""),
    [messages, setMessages] = useState([
      {
        role: "coach",
        text: "Tell me about a purchase you are unsure about. I’ll help you slow the decision down.",
      },
    ]),
    [busy, setBusy] = useState(false);
  async function send(e) {
    e.preventDefault();
    if (!q.trim() || busy) return;
    const question = q.trim();
    setMessages((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const { data } = await api.post("/coach/ask", { question });
      setMessages((m) => [
        ...m,
        { role: "coach", text: data.answer, source: data.source },
      ]);
    } catch (x) {
      setMessages((m) => [...m, { role: "coach", text: message(x) }]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ai-chat">
      <div className="ai-chat-head">
        <div className="ai-avatar">
          <BrainCircuit />
        </div>
        <span>
          <b>Ask your mindful advisor</b>
          <small>Personalized to your purchase history</small>
        </span>
        <em>AI + private fallback</em>
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div className={`chat-bubble ${m.role}`} key={i}>
            {m.text}
            {m.source && (
              <small>
                {m.source === "OPENAI"
                  ? "AI-generated guidance"
                  : "Private on-device-style coach"}
              </small>
            )}
          </div>
        ))}
        {busy && (
          <div className="chat-bubble coach typing">
            Thinking through your patterns…
          </div>
        )}
      </div>
      <div className="prompt-chips">
        {[
          "Should I buy something on sale?",
          "How can I stop boredom shopping?",
          "What is my biggest trigger?",
        ].map((x) => (
          <button onClick={() => setQ(x)} key={x}>
            {x}
          </button>
        ))}
      </div>
      <form onSubmit={send}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about a purchase or shopping habit…"
        />
        <button disabled={busy}>
          Ask advisor <ChevronRight />
        </button>
      </form>
    </section>
  );
}

export function CoachPage() {
  const [data, setData] = useState(),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/coach")
      .then((r) => setData(r.data))
      .catch((e) => setError(message(e)));
  }, []);
  if (!data)
    return (
      <>
        <PageTitle
          eyebrow="PERSONAL INSIGHTS"
          title="Mindful coach"
          copy="Patterns, encouragement, and next steps based on your behavior."
        />
        <div className="coach-hero skeleton">
          {error || "Learning from your reflections…"}
        </div>
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow="PERSONAL INSIGHTS"
        title="Your mindful coach"
        copy="Private, explainable guidance generated from your own shopping reflections."
      />
      <section className="coach-hero">
        <div className="orb">
          <BrainCircuit />
        </div>
        <div>
          <span>YOUR INSIGHT THIS WEEK</span>
          <h2>{data.headline}</h2>
          <p>{data.message}</p>
        </div>
        <Sparkles className="hero-spark" />
      </section>
      <div className="coach-metrics">
        <div>
          <CalendarClock />
          <span>
            <b>{data.streak}</b>reflection days
          </span>
        </div>
        <div>
          <Trophy />
          <span>
            <b>{data.avoidedCount}</b>impulses avoided
          </span>
        </div>
        <div>
          <HistoryIcon />
          <span>
            <b>{data.waitingCount}</b>items cooling off
          </span>
        </div>
      </div>
      <div className="coach-layout">
        <section className="challenge-card">
          <span className="card-label">WEEKLY CHALLENGE</span>
          <div className="challenge-icon">
            <Flag />
          </div>
          <h2>{data.weeklyChallenge.title}</h2>
          <p>{data.weeklyChallenge.description}</p>
          <div className="challenge-progress">
            <i
              style={{
                width: `${(data.weeklyChallenge.progress / data.weeklyChallenge.target) * 100}%`,
              }}
            />
          </div>
          <small>
            {data.weeklyChallenge.progress} of {data.weeklyChallenge.target}{" "}
            completed
          </small>
        </section>
        <section className="badge-panel">
          <div className="section-head">
            <div>
              <span className="card-label">MILESTONES</span>
              <h2>Your achievements</h2>
            </div>
            <Award />
          </div>
          <div className="badge-grid">
            {data.badges.map((b, i) => (
              <div
                className={`badge-card ${b.unlocked ? "unlocked" : ""}`}
                key={b.name}
              >
                <div>{b.unlocked ? <Trophy /> : <Award />}</div>
                <span>
                  <b>{b.name}</b>
                  <small>{b.description}</small>
                </span>
                {b.unlocked && <Check />}
              </div>
            ))}
          </div>
        </section>
      </div>
      <AiChat />
      <section className="privacy-note">
        <BrainCircuit />
        <span>
          <b>Explainable by design</b>This coach uses your stored evaluations
          and decisions—not advertising profiles. Guidance is generated by
          transparent behavioral rules, so it works without sending your data to
          a third-party AI service.
        </span>
      </section>
    </>
  );
}
