import { useEffect, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  IndianRupee,
  LineChart,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  X,
} from "lucide-react";
import api, { message } from "./api";
import { PageTitle } from "./Features";
import "./price-watch.css";

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
const blank = {
  productName: "",
  category: "ELECTRONICS",
  retailer: "",
  productUrl: "",
  targetPrice: "",
  currentPrice: "",
  active: true,
};
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

export default function PriceWatchPage() {
  const [items, setItems] = useState([]),
    [editing, setEditing] = useState(null),
    [observing, setObserving] = useState(null),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true);
  async function load() {
    try {
      const { data } = await api.get("/price-watches");
      setItems(data);
    } catch (error) {
      setNotice(message(error));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function save(event) {
    event.preventDefault();
    try {
      const body = {
        ...editing,
        targetPrice: Number(editing.targetPrice),
        currentPrice:
          editing.currentPrice === "" ? null : Number(editing.currentPrice),
      };
      await api[editing.id ? "put" : "post"](
        `/price-watches${editing.id ? `/${editing.id}` : ""}`,
        body,
      );
      setEditing(null);
      setNotice("Price watch saved.");
      await load();
    } catch (error) {
      setNotice(message(error));
    }
  }
  async function observe(event) {
    event.preventDefault();
    try {
      await api.post(`/price-watches/${observing.id}/observations`, {
        price: Number(observing.newPrice),
        retailer: observing.retailer || null,
      });
      setObserving(null);
      setNotice("Latest price recorded.");
      await load();
    } catch (error) {
      setNotice(message(error));
    }
  }
  async function remove(id) {
    if (!window.confirm("Stop tracking this product?")) return;
    try {
      await api.delete(`/price-watches/${id}`);
      await load();
    } catch (error) {
      setNotice(message(error));
    }
  }
  const reached = items.filter((item) => item.targetReached).length;
  return (
    <>
      <PageTitle
        eyebrow="PRICE PATIENCE"
        title="Track a price without chasing a sale"
        copy="Record price changes, choose a target, and still re-evaluate the need when the target arrives."
      />
      {notice && <div className="notice">{notice}</div>}
      <section className="watch-hero">
        <div>
          <BellRing />
          <span>
            <small>ACTIVE WATCHES</small>
            <strong>{items.filter((item) => item.active).length}</strong>
          </span>
        </div>
        <div>
          <Target />
          <span>
            <small>TARGETS REACHED</small>
            <strong>{reached}</strong>
          </span>
        </div>
        <button className="primary" onClick={() => setEditing({ ...blank })}>
          <Plus />
          Track a product
        </button>
      </section>
      {loading ? (
        <div className="watch-empty">Loading price watches…</div>
      ) : items.length ? (
        <div className="watch-grid">
          {items.map((item) => {
            const progress = item.currentPrice
              ? Math.min(
                  100,
                  (Number(item.targetPrice) / Number(item.currentPrice)) * 100,
                )
              : 0;
            return (
              <article
                className={`watch-card ${item.targetReached ? "reached" : ""}`}
                key={item.id}
              >
                <header>
                  <span>{pretty(item.category)}</span>
                  <em>
                    {item.targetReached ? (
                      <>
                        <CheckCircle2 />
                        Target reached
                      </>
                    ) : (
                      pretty(item.alertStatus)
                    )}
                  </em>
                </header>
                <h2>{item.productName}</h2>
                <p>{item.retailer || "Retailer not specified"}</p>
                <div className="watch-prices">
                  <span>
                    <small>CURRENT</small>
                    <b>
                      {item.currentPrice
                        ? money(item.currentPrice)
                        : "Not recorded"}
                    </b>
                  </span>
                  <span>
                    <small>TARGET</small>
                    <b>{money(item.targetPrice)}</b>
                  </span>
                  <span>
                    <small>BEST SEEN</small>
                    <b>
                      {item.bestObservedPrice
                        ? money(item.bestObservedPrice)
                        : "—"}
                    </b>
                  </span>
                </div>
                <div className="watch-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <footer>
                  <button
                    onClick={() => setObserving({ ...item, newPrice: "" })}
                  >
                    <RefreshCw />
                    Record price
                  </button>
                  <button onClick={() => setEditing({ ...item })}>Edit</button>
                  <button
                    className="remove"
                    aria-label="Delete price watch"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 />
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="watch-empty">
          <LineChart />
          <h2>No products are being tracked</h2>
          <p>
            Add a product and target price. Waiting for value is useful only
            when the purchase still meets a real need.
          </p>
          <button className="primary" onClick={() => setEditing({ ...blank })}>
            Create first watch
          </button>
        </div>
      )}
      {editing && (
        <WatchModal
          value={editing}
          setValue={setEditing}
          close={() => setEditing(null)}
          save={save}
        />
      )}{" "}
      {observing && (
        <div className="overlay">
          <form className="modal observe-modal" onSubmit={observe}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setObserving(null)}
            >
              <X />
            </button>
            <RefreshCw />
            <h2>Record latest price</h2>
            <p>{observing.productName}</p>
            <label>
              Observed price
              <div className="money-input">
                <IndianRupee />
                <input
                  autoFocus
                  required
                  min="1"
                  type="number"
                  value={observing.newPrice}
                  onChange={(event) =>
                    setObserving({ ...observing, newPrice: event.target.value })
                  }
                />
              </div>
            </label>
            <label>
              Retailer
              <input
                value={observing.retailer || ""}
                onChange={(event) =>
                  setObserving({ ...observing, retailer: event.target.value })
                }
              />
            </label>
            <button className="primary">Save observation</button>
          </form>
        </div>
      )}
    </>
  );
}

function WatchModal({ value, setValue, close, save }) {
  return (
    <div className="overlay">
      <form className="modal watch-modal" onSubmit={save}>
        <button type="button" className="modal-close" onClick={close}>
          <X />
        </button>
        <BellRing />
        <h2>{value.id ? "Edit price watch" : "Track a product"}</h2>
        <div className="watch-form-grid">
          <label>
            Product name
            <input
              required
              value={value.productName}
              onChange={(event) =>
                setValue({ ...value, productName: event.target.value })
              }
            />
          </label>
          <label>
            Category
            <select
              value={value.category}
              onChange={(event) =>
                setValue({ ...value, category: event.target.value })
              }
            >
              {categories.map((category) => (
                <option key={category}>{pretty(category)}</option>
              ))}
            </select>
          </label>
          <label>
            Target price
            <input
              required
              min="1"
              type="number"
              value={value.targetPrice}
              onChange={(event) =>
                setValue({ ...value, targetPrice: event.target.value })
              }
            />
          </label>
          <label>
            Current price
            <input
              min="1"
              type="number"
              value={value.currentPrice ?? ""}
              onChange={(event) =>
                setValue({ ...value, currentPrice: event.target.value })
              }
            />
          </label>
          <label>
            Retailer
            <input
              value={value.retailer || ""}
              onChange={(event) =>
                setValue({ ...value, retailer: event.target.value })
              }
            />
          </label>
          <label>
            Product URL
            <input
              type="url"
              placeholder="https://…"
              value={value.productUrl || ""}
              onChange={(event) =>
                setValue({ ...value, productUrl: event.target.value })
              }
            />
          </label>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={close}>
            Cancel
          </button>
          <button className="primary">Save watch</button>
        </div>
      </form>
    </div>
  );
}
