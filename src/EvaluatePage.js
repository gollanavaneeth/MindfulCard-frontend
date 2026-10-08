import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  BrainCircuit,
  Check,
  Clock3,
  IndianRupee,
  Lightbulb,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";
import api, { message } from "./api";
import { PageTitle } from "./Features";
import { productCategories, productsForCategory } from "./productCatalog";
const moods = [
  ["NORMAL", "Calm"],
  ["HAPPY", "Happy"],
  ["EXCITED", "Excited"],
  ["BORED", "Bored"],
  ["STRESSED", "Stressed"],
  ["SAD", "Sad"],
  ["FRUSTRATED", "Frustrated"],
];
const pretty = (v) =>
  (v || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);
const blank = {
  productName: "",
  category: "ELECTRONICS",
  price: "",
  description: "",
  sourceOfInterest: "SOCIAL_MEDIA",
  discountAvailable: false,
  discountPercentage: 0,
  genuinelyNeeded: null,
  previouslyPlanned: null,
  considerationPeriod: "Today",
  ownsSimilar: null,
  withinBudget: true,
  advertisementTriggered: null,
  discountTriggered: null,
  offerUrgency: null,
  emotionalState: "NORMAL",
  canWait: null,
  frequentlyUsed: null,
  cheaperAlternative: null,
};
function draftedForm() {
  try {
    const raw = sessionStorage.getItem("purchaseDraft");
    if (!raw) return blank;
    sessionStorage.removeItem("purchaseDraft");
    const draft = JSON.parse(raw),
      source = String(draft.sourceOfInterest || "").toLowerCase();
    return {
      ...blank,
      ...draft,
      productName: draft.productName || "",
      price: draft.price ?? "",
      category: draft.category || "OTHER",
      sourceOfInterest:
        source.includes("instagram") ||
        source.includes("facebook") ||
        source.includes("youtube") ||
        source.includes("tiktok")
          ? "SOCIAL_MEDIA"
          : source.includes("store")
            ? "IN_STORE"
            : source.includes("friend")
              ? "FRIEND"
              : source
                ? "ADVERTISEMENT"
                : "OTHER",
      genuinelyNeeded: draft.genuinelyNeeded ?? null,
      previouslyPlanned: draft.previouslyPlanned ?? null,
      advertisementTriggered: draft.advertisementTriggered ?? null,
      discountTriggered: draft.discountTriggered ?? null,
      offerUrgency: draft.offerUrgency ?? null,
      canWait: draft.canWait ?? null,
    };
  } catch {
    return blank;
  }
}
const questions = [
  {
    key: "genuinelyNeeded",
    title: "Does this solve a real need?",
    hint: "Imagine it was full price and unavailable today. Would the need still exist?",
    yes: "Yes, I need it",
    no: "No, it is mainly a want",
  },
  {
    key: "previouslyPlanned",
    title: "Was it planned before today?",
    hint: "A shopping list, calendar note, or saved budget counts as planning.",
    yes: "Yes, it was planned",
    no: "No, the idea is new",
  },
  {
    key: "ownsSimilar",
    title: "Do you already own a substitute?",
    hint: "Include anything you own that solves the same basic problem.",
    yes: "Yes, I own one",
    no: "No substitute",
  },
  {
    key: "withinBudget",
    title: "Can you pay without touching essentials or savings?",
    hint: "Only count money remaining after bills, commitments, and savings.",
    yes: "Yes, comfortably",
    no: "No, it would stretch me",
  },
  {
    key: "advertisementTriggered",
    title: "Did advertising create the urge?",
    hint: "Social posts, creator links, promotional emails, and retargeting count.",
    yes: "Yes, an ad triggered it",
    no: "No, I searched for it",
  },
  {
    key: "discountTriggered",
    title: "Is the sale influencing you?",
    hint: "Ask whether you would want the item without the discount badge.",
    yes: "Yes, the deal matters",
    no: "No, value matters more",
  },
  {
    key: "offerUrgency",
    title: "Are you reacting to urgency?",
    hint: "Countdowns, limited stock, and flash sales are designed to speed decisions.",
    yes: "Yes, I feel rushed",
    no: "No time pressure",
  },
  {
    key: "canWait",
    title: "Could the decision wait?",
    hint: "A genuine need normally survives a short cooling-off period.",
    yes: "Yes, I can pause",
    no: "No, I need it now",
  },
  {
    key: "frequentlyUsed",
    title: "Will it become part of your routine?",
    hint: "Choose yes only when you can name a specific regular use.",
    yes: "Yes, frequent use",
    no: "Probably occasional",
  },
  {
    key: "cheaperAlternative",
    title: "Could a lower-cost option work?",
    hint: "Consider borrowing, repairing, buying used, or choosing another brand.",
    yes: "Yes, alternatives exist",
    no: "No suitable alternative",
  },
];
function Choice({ value, onChange, yes, no }) {
  return (
    <div className="binary-choice">
      <button
        type="button"
        className={value === true ? "active yes" : ""}
        onClick={() => onChange(true)}
      >
        <Check />
        {yes}
      </button>
      <button
        type="button"
        className={value === false ? "active no" : ""}
        onClick={() => onChange(false)}
      >
        <X />
        {no}
      </button>
    </div>
  );
}

function QuestionRow({ number, question, value, onChange }) {
  return (
    <article className={`question-row ${value !== null ? "answered" : ""}`}>
      <span className="question-number">
        {value !== null ? <Check /> : number}
      </span>
      <div className="question-copy">
        <span>REFLECTION {String(number).padStart(2, "0")}</span>
        <h3>{question.title}</h3>
        <p>{question.hint}</p>
      </div>
      <Choice
        value={value}
        onChange={onChange}
        yes={question.yes}
        no={question.no}
      />
    </article>
  );
}

export default function EvaluatePage() {
  const [step, setStep] = useState(0),
    [form, setForm] = useState(draftedForm),
    [budget, setBudget] = useState(),
    [result, setResult] = useState(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [customProduct, setCustomProduct] = useState(false),
    [saved, setSaved] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  useEffect(() => {
    api
      .get("/budget")
      .then((r) => setBudget(r.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (form.price && budget?.remainingBudget !== undefined)
      set("withinBudget", Number(form.price) <= Number(budget.remainingBudget));
  }, [form.price, budget]);
  const productOptions = productsForCategory(form.category);
  const usesCustomProduct =
    customProduct ||
    Boolean(form.productName && !productOptions.includes(form.productName));
  const answered = questions.filter(({ key }) => form[key] !== null).length;
  const priceAfterDiscount = useMemo(
    () =>
      Number(form.price || 0) *
      (1 - Number(form.discountPercentage || 0) / 100),
    [form.price, form.discountPercentage],
  );
  function next() {
    setError("");
    if (step === 0 && (!form.productName.trim() || Number(form.price) <= 0)) {
      setError("Add a product name and a valid price to continue.");
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  }
  async function evaluate() {
    if (answered < questions.length) {
      setError(
        `Answer all reflection questions first (${answered}/${questions.length} complete).`,
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/evaluations", {
        ...form,
        price: Number(form.price),
        discountPercentage: Number(form.discountPercentage || 0),
      });
      setResult(data);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function decision(value) {
    const { data } = await api.put(`/evaluations/${result.id}/decision`, {
      decision: value,
    });
    setResult(data);
  }
  async function wishlist() {
    const hours =
      result.riskLevel === "VERY_HIGH"
        ? 168
        : result.riskLevel === "HIGH"
          ? 48
          : 24;
    await api.post("/wishlist", {
      productName: result.productName,
      category: result.category,
      price: result.price,
      status: "WAITING",
      waitingUntil: new Date(Date.now() + hours * 3600000)
        .toISOString()
        .slice(0, 19),
    });
    await decision("WAITING");
    setSaved(true);
  }
  function reset() {
    setForm(blank);
    setCustomProduct(false);
    setStep(0);
    setResult();
    setSaved(false);
  }
  if (result)
    return (
      <>
        <PageTitle
          eyebrow="YOUR MINDFUL VERDICT"
          title="A clearer decision, before checkout"
          copy="The score is one signal. Your reasons and recommended pause matter more."
        />
        <div className="verdict-layout">
          <section className={`verdict-card ${result.riskLevel.toLowerCase()}`}>
            <div className="verdict-top">
              <div
                className="verdict-gauge"
                style={{ "--score": result.impulseScore }}
              >
                <span>
                  <strong>{result.impulseScore}</strong>/100
                </span>
              </div>
              <div>
                <span className="verdict-label">
                  {pretty(result.riskLevel)} impulse risk
                </span>
                <h2>{result.recommendation}</h2>
                <p>
                  <Clock3 /> Recommended pause: <b>{result.waitingPeriod}</b>
                </p>
              </div>
            </div>
            <div className="purchase-recap">
              <ShoppingBag />
              <span>
                <b>{result.productName}</b>
                <small>{pretty(result.category)}</small>
              </span>
              <strong>{money(result.price)}</strong>
            </div>
            {result.similarItemAlert && (
              <div className="similar-alert">
                <PackageCheck />
                {result.similarItemAlert}
              </div>
            )}
            <h3>What influenced this result</h3>
            <div className="reason-grid">
              {result.reasons.map((r, i) => (
                <div key={r}>
                  <span>{i + 1}</span>
                  {r}
                </div>
              ))}
            </div>
          </section>
          <aside className="next-decision">
            <div className="advisor-orb">
              <BrainCircuit />
            </div>
            <span className="mini-label">CHOOSE YOUR NEXT STEP</span>
            <h2>What will you do now?</h2>
            <p>
              Recording the outcome improves your insights and keeps savings
              totals honest.
            </p>
            <button className="cool-button" disabled={saved} onClick={wishlist}>
              <Clock3 />
              {saved
                ? "Added to cooling-off list"
                : "Start the cooling-off period"}
            </button>
            <button
              className="avoid-button"
              onClick={() => decision("AVOIDED")}
            >
              <ShieldCheck />
              I’ll skip this purchase
            </button>
            <button
              className="bought-button"
              onClick={() => decision("PURCHASED")}
            >
              <ShoppingBag />I decided to buy it
            </button>
            <div className={`recorded ${result.decision.toLowerCase()}`}>
              Current decision: <b>{pretty(result.decision)}</b>
            </div>
            <button className="evaluate-again" onClick={reset}>
              Evaluate another product <ArrowRight />
            </button>
          </aside>
        </div>
      </>
    );
  return (
    <>
      <PageTitle
        eyebrow="IMPULSE CHECK"
        title="Should this go in your cart?"
        copy="A short guided reflection—designed to slow the moment down without judging your choice."
      />
      <div className="evaluate-shell">
        <aside className="evaluate-steps">
          <div className="step-brand">
            <BrainCircuit />
            <span>
              <b>Decision check</b>
              <small>About 2 minutes</small>
            </span>
          </div>
          {[
            ["Product", "What caught your eye"],
            ["Context", "Need, budget & timing"],
            ["Triggers", "Emotion & influence"],
          ].map(([a, b], i) => (
            <button
              type="button"
              className={`${step === i ? "current" : ""} ${step > i ? "done" : ""}`}
              key={a}
              onClick={() => i < step && setStep(i)}
            >
              <span>{step > i ? <Check /> : i + 1}</span>
              <div>
                <b>{a}</b>
                <small>{b}</small>
              </div>
            </button>
          ))}
          <div className="evaluation-tip">
            <Lightbulb />
            <span>
              <b>There are no “good” answers.</b>Honesty gives you a more useful
              result.
            </span>
          </div>
        </aside>
        <main className="evaluate-workspace">
          <div className="mobile-step">
            Step {step + 1} of 3{" "}
            <i>
              <span style={{ width: `${(step + 1) * 33.33}%` }} />
            </i>
          </div>
          {step === 0 && (
            <section className="eval-section">
              <span className="section-icon">
                <ShoppingBag />
              </span>
              <h2>Let’s start with the product</h2>
              <p>
                Capture what you’re considering and where the interest came
                from.
              </p>
              <div className="eval-form-grid">
                <label>
                  Choose a category first
                  <select
                    autoFocus
                    value={form.category}
                    onChange={(event) => {
                      setForm((currentForm) => ({
                        ...currentForm,
                        category: event.target.value,
                        productName: "",
                      }));
                      setCustomProduct(false);
                    }}
                  >
                    {productCategories.map((category) => (
                      <option value={category} key={category}>
                        {pretty(category)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  What do you want to buy?
                  <select
                    required
                    value={usesCustomProduct ? "__CUSTOM__" : form.productName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCustomProduct(value === "__CUSTOM__");
                      set("productName", value === "__CUSTOM__" ? "" : value);
                    }}
                  >
                    <option value="">Select an item</option>
                    {productOptions.map((product) => (
                      <option value={product} key={product}>
                        {product}
                      </option>
                    ))}
                    <option value="__CUSTOM__">Other item / not listed</option>
                  </select>
                </label>
                {usesCustomProduct && (
                  <label className="span-two custom-product-field">
                    Enter the product name
                    <input
                      required
                      placeholder="Type the exact product you are considering"
                      value={form.productName}
                      onChange={(event) =>
                        set("productName", event.target.value)
                      }
                    />
                  </label>
                )}
                <label>
                  Current price
                  <div className="input-icon">
                    <IndianRupee />
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                    />
                  </div>
                </label>
                <label>
                  Where did you discover it?
                  <select
                    value={form.sourceOfInterest}
                    onChange={(e) => set("sourceOfInterest", e.target.value)}
                  >
                    <option value="SOCIAL_MEDIA">Social media</option>
                    <option value="ADVERTISEMENT">Online advertisement</option>
                    <option value="IN_STORE">In a store</option>
                    <option value="FRIEND">Friend or family</option>
                    <option value="SEARCH">I searched for it</option>
                    <option value="OTHER">Somewhere else</option>
                  </select>
                </label>
                <label className="discount-box">
                  <span>
                    <BadgePercent />
                    <b>Is it currently discounted?</b>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.discountAvailable}
                    onChange={(e) => set("discountAvailable", e.target.checked)}
                  />
                </label>
                {form.discountAvailable && (
                  <label>
                    Discount percentage
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discountPercentage}
                      onChange={(e) =>
                        set("discountPercentage", e.target.value)
                      }
                    />
                    <small>
                      You would pay approximately{" "}
                      <b>{money(priceAfterDiscount)}</b>
                    </small>
                  </label>
                )}
                <label className="span-two">
                  Optional note
                  <textarea
                    placeholder="What makes this product appealing right now?"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </label>
              </div>
            </section>
          )}
          {step === 1 && (
            <section className="eval-section">
              <span className="section-icon">
                <Target />
              </span>
              <h2>Need, planning, and affordability</h2>
              <p>
                Separate long-term value from the intensity of the current
                moment.
              </p>
              <div className="question-list">
                {questions.slice(0, 4).map((question, index) => (
                  <QuestionRow
                    key={question.key}
                    number={index + 1}
                    question={question}
                    value={form[question.key]}
                    onChange={(value) => set(question.key, value)}
                  />
                ))}
              </div>
              <label className="consideration">
                How long have you been considering it?
                <div>
                  {[
                    "Today",
                    "A few days",
                    "A week",
                    "Several weeks",
                    "One month or longer",
                  ].map((x) => (
                    <button
                      type="button"
                      className={form.considerationPeriod === x ? "active" : ""}
                      onClick={() => set("considerationPeriod", x)}
                      key={x}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </label>
              {budget?.id ? (
                <div className="budget-context">
                  <ShieldCheck />
                  <span>
                    <b>
                      {money(budget.remainingBudget)} remaining in your
                      awareness budget
                    </b>
                    <small>
                      This purchase is automatically marked{" "}
                      {form.withinBudget ? "within" : "outside"} that amount.
                    </small>
                  </span>
                </div>
              ) : (
                <div className="budget-context missing">
                  <TriangleAlert />
                  <span>
                    <b>No monthly budget set</b>
                    <small>
                      You can continue, but setting a budget makes affordability
                      guidance more accurate.
                    </small>
                  </span>
                  <a href="/budget">Set budget</a>
                </div>
              )}
            </section>
          )}
          {step === 2 && (
            <section className="eval-section">
              <span className="section-icon">
                <Sparkles />
              </span>
              <h2>Notice the triggers around the urge</h2>
              <p>
                Advertising, scarcity, and emotion can quietly change how
                valuable something feels.
              </p>
              <div className="mood-picker">
                <h3>How do you feel right now?</h3>
                <div>
                  {moods.map(([value, label]) => (
                    <button
                      type="button"
                      className={form.emotionalState === value ? "active" : ""}
                      onClick={() => set("emotionalState", value)}
                      key={value}
                    >
                      <span>
                        {value === "HAPPY"
                          ? "😊"
                          : value === "EXCITED"
                            ? "🤩"
                            : value === "BORED"
                              ? "😐"
                              : value === "STRESSED"
                                ? "😣"
                                : value === "SAD"
                                  ? "😔"
                                  : value === "FRUSTRATED"
                                    ? "😤"
                                    : "😌"}
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="question-list compact">
                {questions.slice(4).map((question, index) => (
                  <QuestionRow
                    key={question.key}
                    number={index + 5}
                    question={question}
                    value={form[question.key]}
                    onChange={(value) => set(question.key, value)}
                  />
                ))}
              </div>
            </section>
          )}
          {error && (
            <div className="eval-error">
              <TriangleAlert />
              {error}
            </div>
          )}
          <footer className="evaluate-footer">
            <button
              type="button"
              className="back-button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft />
              Back
            </button>
            <span>
              {step === 2
                ? `${answered}/${questions.length} answered`
                : "Your progress is saved on this screen"}
            </span>
            {step < 2 ? (
              <button type="button" className="continue-button" onClick={next}>
                Continue
                <ArrowRight />
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                className="continue-button analyze"
                onClick={evaluate}
              >
                <BrainCircuit />
                {busy ? "Analyzing…" : "Reveal my decision score"}
              </button>
            )}
          </footer>
        </main>
      </div>
    </>
  );
}
