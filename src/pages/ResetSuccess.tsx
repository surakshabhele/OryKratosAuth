import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck, IconHelp, IconMoon } from "../components/AuthIcons";
import { startLogout } from "../utils/auth";

export default function ResetSuccess(): ReactElement {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  async function handleBackToSignIn() {
    setIsLeaving(true);

    try {
      const logoutUrl = await startLogout();

      window.location.assign(logoutUrl);
    } catch (error) {
      console.error("Unable to start logout flow", error);
      navigate("/login", { replace: true });
      setIsLeaving(false);
    }
  }

  return (
    <main className="auth-shell auth-detail-shell">
      <span className="auth-brand">flflux.</span>

      <div className="theme-actions" aria-hidden="true">
        <button className="theme-icon" type="button" aria-label="Help">
          <IconHelp />
        </button>
        <button className="theme-icon" type="button" aria-label="Theme">
          <IconMoon />
        </button>
      </div>

      <section className="auth-card detail-card success-card" aria-label="Password reset success">
        <header className="auth-header detail-header success-header">
          <h1>Success!</h1>
          <p>Your password has been updated successfully.</p>
        </header>

        <div className="success-badge" aria-hidden="true">
          <span className="success-icon">
            <IconCheck />
          </span>
        </div>

        <p className="success-copy">You can now sign in with your new password.</p>

        <button
          className="primary-action submit-btn"
          type="button"
          onClick={handleBackToSignIn}
          disabled={isLeaving}
        >
          {isLeaving ? "Opening Sign In..." : "Back to Sign In"}
        </button>
      </section>
    </main>
  );
}
