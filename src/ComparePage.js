import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Award,
  Calculator,
  Check,
  CheckCircle2,
  CircleAlert,
  GitCompareArrows,
  IndianRupee,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Trophy,
  WalletCards,
} from "lucide-react";
import api, { message } from "./api";
import { PageTitle } from "./Features";
import { productCategories, productsForCategory } from "./productCatalog";

const blankOption = () => ({
  name: "",
  category: "ELECTRONICS",
  listPrice: "",
  discountPercentage: 0,
  shippingCost: 0,
  annualMaintenanceCost: 0,
  expectedResaleValue: 0,
  expectedUses: 100,
  lifespanYears: 3,
  warrantyMonths: 12,
  returnWindowDays: 7,
  needRating: 3,
  qualityRating: 3,
  userRating: 3,
  ownsAlternative: false,
});

const scoreMaximums = {
  "Need fit": 25,
  "Quality confidence": 20,
  "Usage potential": 20,
  "Ownership value": 15,
  "Buyer protection": 10,
  Longevity: 10,
};

const pretty = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function ComparePage() {
  const [first, setFirst] = useState(blankOption);
  const [second, setSecond] = useState(blankOption);
  const [budget, setBudget] = useState();
  const [result, setResult] = useState();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/budget")
      .then(({ data }) => setBudget(data))
      .catch(() => setBudget(null));
  }, []);

  async function compare(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/comparisons", {
        first: normalize(first),
        second: normalize(second),
        availableBudget: Number(budget?.remainingBudget || 0),
      });
      setResult(data);
      requestAnimationFrame(() =>
        document
          .querySelector(".comparison-dashboard")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (comparisonError) {
      setError(message(comparisonError));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFirst(blankOption());
    setSecond(blankOption());
    setResult(undefined);
    setError("");
  }

  function swap() {
    setFirst(second);
    setSecond(first);
    setResult(undefined);
  }

  return (
    <>
      <PageTitle
        eyebrow="DECISION LAB"
        title="Compare the complete cost—not just the price"
        copy="Put two products through the same evidence-based test: need, use, quality, protection, longevity, and true ownership cost."
      />

      <section className="compare-toolbar">
        <div>
          <WalletCards />
          <span>
            <small>AVAILABLE MONTHLY BUDGET</small>
            <b>
              {budget?.id ? money(budget.remainingBudget) : "Not configured"}
            </b>
          </span>
        </div>
        <p>
          {budget?.id
            ? "Budget impact will be included in the verdict."
            : "Set a budget to add affordability warnings."}
        </p>
        <button type="button" onClick={swap}>
          <ArrowLeftRight /> Swap products
        </button>
        <button type="button" onClick={reset}>
          <RotateCcw /> Reset
        </button>
      </section>

      <form className="compare-studio" onSubmit={compare}>
        <OptionEditor
          label="OPTION A"
          value={first}
          onChange={setFirst}
          tone="green"
        />
        <div className="compare-divider">
          <span>
            <GitCompareArrows />
          </span>
          <b>VS</b>
        </div>
        <OptionEditor
          label="OPTION B"
          value={second}
          onChange={setSecond}
          tone="coral"
        />

        <div className="compare-action">
          <div>
            <Calculator />
            <span>
              <b>Six-dimension value model</b>
              <small>Transparent scoring with no sponsored ranking</small>
            </span>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={busy}>
            <Sparkles />
            {busy ? "Calculating full value…" : "Generate comparison verdict"}
          </button>
        </div>
      </form>

      {result && (
        <ComparisonDashboard
          result={result}
          showBudgetImpact={Boolean(budget?.id)}
        />
      )}
    </>
  );
}

function normalize(option) {
  return {
    ...option,
    listPrice: Number(option.listPrice),
    discountPercentage: Number(option.discountPercentage),
    shippingCost: Number(option.shippingCost),
    annualMaintenanceCost: Number(option.annualMaintenanceCost),
    expectedResaleValue: Number(option.expectedResaleValue),
    expectedUses: Number(option.expectedUses),
    lifespanYears: Number(option.lifespanYears),
    warrantyMonths: Number(option.warrantyMonths),
    returnWindowDays: Number(option.returnWindowDays),
    needRating: Number(option.needRating),
    qualityRating: Number(option.qualityRating),
    userRating: Number(option.userRating),
  };
}

function OptionEditor({ label, value, onChange, tone }) {
  const [customProduct, setCustomProduct] = useState(false);
  const productOptions = productsForCategory(value.category);
  const usesCustomProduct =
    customProduct ||
    Boolean(value.name && !productOptions.includes(value.name));
  const finalPrice = useMemo(
    () =>
      Number(value.listPrice || 0) *
      (1 - Number(value.discountPercentage || 0) / 100),
    [value.listPrice, value.discountPercentage],
  );

  const update = (key, nextValue) =>
    onChange((current) => ({ ...current, [key]: nextValue }));

  return (
    <section className={`option-editor ${tone}`}>
      <header>
        <span>{label}</span>
        <div>
          <PackageCheck />
          <small>{pretty(value.category)}</small>
          <b>{value.name || "Choose a product"}</b>
        </div>
        {Number(value.discountPercentage) > 0 && (
          <em>{value.discountPercentage}% OFF</em>
        )}
      </header>

      <fieldset>
        <legend>Product and price</legend>
        <div className="compare-form-grid">
          <label>
            Category
            <select
              value={value.category}
              onChange={(event) => {
                onChange((current) => ({
                  ...current,
                  category: event.target.value,
                  name: "",
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
            Product
            <select
              required
              value={usesCustomProduct ? "__CUSTOM__" : value.name}
              onChange={(event) => {
                const selection = event.target.value;
                setCustomProduct(selection === "__CUSTOM__");
                update("name", selection === "__CUSTOM__" ? "" : selection);
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
            <label className="wide-field">
              Custom product name
              <input
                required
                value={value.name}
                placeholder="Enter the exact product name"
                onChange={(event) => update("name", event.target.value)}
              />
            </label>
          )}
          <MoneyField
            label="Listed price"
            value={value.listPrice}
            required
            min="1"
            onChange={(nextValue) => update("listPrice", nextValue)}
          />
          <NumberField
            label="Discount %"
            value={value.discountPercentage}
            min="0"
            max="100"
            onChange={(nextValue) => update("discountPercentage", nextValue)}
          />
        </div>
        <div className="live-price">
          <span>Effective checkout price</span>
          <b>{money(finalPrice)}</b>
          <small>
            {money(Number(value.listPrice || 0) - finalPrice)} saved upfront
          </small>
        </div>
      </fieldset>

      <fieldset>
        <legend>Use and ownership</legend>
        <div className="compare-form-grid">
          <NumberField
            label="Expected lifetime uses"
            value={value.expectedUses}
            min="1"
            onChange={(nextValue) => update("expectedUses", nextValue)}
          />
          <NumberField
            label="Lifespan in years"
            value={value.lifespanYears}
            min="1"
            max="20"
            onChange={(nextValue) => update("lifespanYears", nextValue)}
          />
          <MoneyField
            label="Shipping cost"
            value={value.shippingCost}
            min="0"
            onChange={(nextValue) => update("shippingCost", nextValue)}
          />
          <MoneyField
            label="Annual maintenance"
            value={value.annualMaintenanceCost}
            min="0"
            onChange={(nextValue) => update("annualMaintenanceCost", nextValue)}
          />
          <MoneyField
            label="Expected resale value"
            value={value.expectedResaleValue}
            min="0"
            onChange={(nextValue) => update("expectedResaleValue", nextValue)}
          />
          <NumberField
            label="Warranty months"
            value={value.warrantyMonths}
            min="0"
            max="240"
            onChange={(nextValue) => update("warrantyMonths", nextValue)}
          />
          <NumberField
            label="Return window days"
            value={value.returnWindowDays}
            min="0"
            max="365"
            onChange={(nextValue) => update("returnWindowDays", nextValue)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Decision confidence</legend>
        <Rating
          label="How necessary is it?"
          low="Optional"
          high="Essential"
          value={value.needRating}
          onChange={(nextValue) => update("needRating", nextValue)}
        />
        <Rating
          label="Expected build quality"
          low="Weak"
          high="Excellent"
          value={value.qualityRating}
          onChange={(nextValue) => update("qualityRating", nextValue)}
        />
        <Rating
          label="Public review confidence"
          low="Poor"
          high="Excellent"
          value={value.userRating}
          onChange={(nextValue) => update("userRating", nextValue)}
        />
        <label className="alternative-check">
          <input
            type="checkbox"
            checked={value.ownsAlternative}
            onChange={(event) =>
              update("ownsAlternative", event.target.checked)
            }
          />
          <span>
            <b>I already own something that can do this job</b>
            <small>This lowers the need-fit score.</small>
          </span>
        </label>
      </fieldset>
    </section>
  );
}

function MoneyField({ label, value, onChange, ...inputProps }) {
  return (
    <label>
      {label}
      <div className="money-input">
        <IndianRupee />
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...inputProps}
        />
      </div>
    </label>
  );
}

function NumberField({ label, value, onChange, ...inputProps }) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
    </label>
  );
}

function Rating({ label, low, high, value, onChange }) {
  return (
    <div className="compare-rating">
      <div>
        <b>{label}</b>
        <span>
          {low} → {high}
        </span>
      </div>
      <div>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            type="button"
            className={rating === Number(value) ? "active" : ""}
            onClick={() => onChange(rating)}
            key={rating}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComparisonDashboard({ result, showBudgetImpact }) {
  const options = [result.first, result.second];
  const cheaperUpfront =
    Number(result.first.finalPrice) <= Number(result.second.finalPrice)
      ? result.first.name
      : result.second.name;
  const cheaperToOwn =
    Number(result.first.totalOwnershipCost) <=
    Number(result.second.totalOwnershipCost)
      ? result.first.name
      : result.second.name;

  return (
    <section className="comparison-dashboard">
      <header className="comparison-verdict">
        <span className="winner-icon">
          <Trophy />
        </span>
        <div>
          <small>{pretty(result.verdict)}</small>
          <h2>
            {result.winner === "Tie"
              ? "Neither option clearly wins"
              : `${result.winner} offers stronger overall value`}
          </h2>
          <p>{result.explanation}</p>
        </div>
        <strong>
          {result.scoreGap}
          <small>point gap</small>
        </strong>
      </header>

      <div className="comparison-kpis">
        <Metric
          icon={<TrendingDown />}
          label="Upfront price gap"
          value={money(result.upfrontDifference)}
          note={`${cheaperUpfront} costs less today`}
        />
        <Metric
          icon={<Calculator />}
          label="Ownership-cost gap"
          value={money(result.ownershipDifference)}
          note={`${cheaperToOwn} costs less over time`}
        />
        <Metric
          icon={<Award />}
          label="Best value score"
          value={`${Math.max(result.first.valueScore, result.second.valueScore)}/100`}
          note="Weighted across six dimensions"
        />
        <Metric
          icon={<ShieldCheck />}
          label="Decision confidence"
          value={
            result.verdict === "CLEAR_WINNER"
              ? "High"
              : result.verdict === "CLOSE_CALL"
                ? "Moderate"
                : "Low"
          }
          note="Based on the difference between scores"
        />
      </div>

      <div className="result-options">
        {options.map((option, index) => (
          <ResultCard
            key={`${option.name}-${index}`}
            option={option}
            winner={option.name === result.winner}
            showBudgetImpact={showBudgetImpact}
          />
        ))}
      </div>

      <ComparisonMatrix options={options} showBudgetImpact={showBudgetImpact} />
    </section>
  );
}

function Metric({ icon, label, value, note }) {
  return (
    <article className="comparison-kpi">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <em>{note}</em>
      </div>
    </article>
  );
}

function ResultCard({ option, winner, showBudgetImpact }) {
  return (
    <article className={`result-option ${winner ? "winner-option" : ""}`}>
      <header>
        <div>
          <small>{pretty(option.category)}</small>
          <h3>{option.name}</h3>
        </div>
        {winner && (
          <span>
            <Trophy /> BEST OVERALL
          </span>
        )}
      </header>

      <div className="score-overview">
        <div
          className="score-ring"
          style={{ "--comparison-score": option.valueScore }}
        >
          <span>
            <b>{option.valueScore}</b>
            <small>/100</small>
          </span>
        </div>
        <dl>
          <div>
            <dt>Checkout price</dt>
            <dd>{money(option.finalPrice)}</dd>
          </div>
          <div>
            <dt>Total ownership</dt>
            <dd>{money(option.totalOwnershipCost)}</dd>
          </div>
          <div>
            <dt>Cost per use</dt>
            <dd>{money(option.costPerUse)}</dd>
          </div>
          {showBudgetImpact && (
            <div>
              <dt>Budget impact</dt>
              <dd>{option.budgetImpactPercent}%</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="score-breakdown">
        <h4>Why it received this score</h4>
        {Object.entries(option.breakdown).map(([label, score]) => (
          <div key={label}>
            <span>
              <b>{label}</b>
              <em>
                {score}/{scoreMaximums[label]}
              </em>
            </span>
            <i>
              <span
                style={{ width: `${(score / scoreMaximums[label]) * 100}%` }}
              />
            </i>
          </div>
        ))}
      </div>

      <div className="evidence-columns">
        <section>
          <h4>
            <CheckCircle2 /> Strengths
          </h4>
          {option.strengths.map((strength) => (
            <p key={strength}>{strength}</p>
          ))}
        </section>
        <section className="watchouts">
          <h4>
            <CircleAlert /> Watchouts
          </h4>
          {option.watchouts.map((watchout) => (
            <p key={watchout}>{watchout}</p>
          ))}
        </section>
      </div>
    </article>
  );
}

function ComparisonMatrix({ options, showBudgetImpact }) {
  const rows = [
    ["Value score", "valueScore", (value) => `${value}/100`, "high"],
    ["Checkout price", "finalPrice", money, "low"],
    ["Discount savings", "priceSavings", money, "high"],
    ["Total ownership cost", "totalOwnershipCost", money, "low"],
    ["Cost per use", "costPerUse", money, "low"],
    ...(showBudgetImpact
      ? [
          [
            "Monthly budget used",
            "budgetImpactPercent",
            (value) => `${value}%`,
            "low",
          ],
        ]
      : []),
  ];

  return (
    <section className="comparison-matrix">
      <header>
        <GitCompareArrows />
        <div>
          <h3>Side-by-side evidence</h3>
          <p>The highlighted value is stronger for that measurement.</p>
        </div>
      </header>
      <div className="matrix-table">
        <div className="matrix-row matrix-head">
          <span>Measurement</span>
          <b>{options[0].name}</b>
          <b>{options[1].name}</b>
        </div>
        {rows.map(([label, key, format, preference]) => {
          const firstValue = Number(options[0][key]);
          const secondValue = Number(options[1][key]);
          const firstWins =
            preference === "high"
              ? firstValue >= secondValue
              : firstValue <= secondValue;
          const secondWins =
            preference === "high"
              ? secondValue >= firstValue
              : secondValue <= firstValue;
          return (
            <div className="matrix-row" key={key}>
              <span>{label}</span>
              <b className={firstWins ? "best-cell" : ""}>
                {firstWins && <Check />}
                {format(options[0][key])}
              </b>
              <b className={secondWins ? "best-cell" : ""}>
                {secondWins && <Check />}
                {format(options[1][key])}
              </b>
            </div>
          );
        })}
      </div>
    </section>
  );
}
