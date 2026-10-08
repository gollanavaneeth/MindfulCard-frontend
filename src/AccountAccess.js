import { useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Leaf, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { message } from "./api";
export function ForgotPassword() {
  const [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [note, setNote] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setNote(data.message);
      if (data.developmentToken) setToken(data.developmentToken);
    } catch (x) {
      setNote(message(x));
    }
    return false;
  }
  return (
    <AccessShell
      icon={Mail}
      title="Reset your password"
      copy="Enter the email linked to your mindful profile."
    >
      <form onSubmit={submit}>
        <label>
          Email address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {note && <div className="notice">{note}</div>}
        {token && (
          <div className="dev-token">
            <b>Development reset link</b>
            <Link to={`/reset-password?token=${token}`}>
              Continue to reset password
            </Link>
          </div>
        )}
        <button className="primary">Create reset link</button>
      </form>
    </AccessShell>
  );
}
export function ResetPassword() {
  const [params] = useSearchParams(),
    nav = useNavigate(),
    [password, setPassword] = useState(""),
    [note, setNote] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/reset-password", {
        token: params.get("token"),
        newPassword: password,
      });
      setNote(data.message);
      setTimeout(() => nav("/login"), 900);
    } catch (x) {
      setNote(message(x));
    }
  }
  return (
    <AccessShell
      icon={KeyRound}
      title="Choose a new password"
      copy="Use at least eight characters and make it unique."
    >
      <form onSubmit={submit}>
        <label>
          New password
          <input
            type="password"
            minLength="8"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {note && <div className="notice">{note}</div>}
        <button className="primary">Update password</button>
      </form>
    </AccessShell>
  );
}
function AccessShell({ icon: Icon, title, copy, children }) {
  return (
    <main className="access-page">
      <section>
        <span className="logo">
          <Leaf />
          MindfulCart
        </span>
        <div className="access-icon">
          <Icon />
        </div>
        <h1>{title}</h1>
        <p>{copy}</p>
        {children}
        <Link className="back-login" to="/login">
          <ArrowLeft />
          Back to sign in
        </Link>
        <footer>
          <CheckCircle2 /> Your password is encrypted and never displayed.
        </footer>
      </section>
    </main>
  );
}
