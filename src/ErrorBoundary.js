import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("MindfulCart UI error", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fatal-page">
        <section>
          <AlertTriangle />
          <h1>That page needs a fresh start</h1>
          <p>
            The rest of your data is safe. Reload the interface and try the
            action again.
          </p>
          <button onClick={() => window.location.reload()}>
            <RefreshCw />
            Reload MindfulCart
          </button>
          <details>
            <summary>Technical detail</summary>
            {this.state.error.message}
          </details>
        </section>
      </main>
    );
  }
}
