import type { RecoveryFlow } from "@ory/client";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconHelp, IconMail, IconMoon } from "../components/AuthIcons";
import InputField from "../components/InputField";
import { sendPasswordResetLink } from "../utils/auth";
import { getOryUiError } from "../utils/flow";
import ory from "../utils/ory";

export default function ForgotPassword(): ReactElement {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<RecoveryFlow | null>(null);
  const [email, setEmail] = useState("");
  const [flowError, setFlowError] = useState("");
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFlow() {
      try {
        const flowId = new URLSearchParams(window.location.search).get("flow");
        const response = flowId
          ? await ory.getRecoveryFlow({ id: flowId })
          : await ory.createBrowserRecoveryFlow();

        if (!active) {
          return;
        }

        setFlow(response.data);
        setFlowError("");
      } catch (error) {
        console.error("Unable to create recovery flow", error);
        if (!active) {
          return;
        }

        setFlowError("Unable to start password recovery. Please try again.");
      } finally {
        if (active) {
          setIsFlowLoading(false);
        }
      }
    }

    void loadFlow();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!flow) {
      return;
    }

    setIsSubmitting(true);
    setFlowError("");

    try {
      const updatedFlow = await sendPasswordResetLink({
        email,
        flow,
      });

      navigate(
        `/verify-email?flow=${encodeURIComponent(updatedFlow.id)}&type=recovery&email=${encodeURIComponent(email)}`,
      );
    } catch (error) {
      console.error("Unable to send recovery code", error);
      setFlowError(
        getOryUiError(
          error,
          "Unable to send reset code. Please check your email and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
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

      <section className="auth-card detail-card" aria-label="Forgot password form">
        <header className="auth-header detail-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email to receive a password reset code.</p>
          {isFlowLoading ? <p>Connecting to Ory...</p> : null}
          {flowError ? <p>{flowError}</p> : null}
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            icon={<IconMail />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <button
            className="primary-action submit-btn"
            type="submit"
            disabled={!flow || isFlowLoading || isSubmitting}
          >
            {isSubmitting ? "Sending code..." : "Send Reset Code"}
          </button>
        </form>

        <button
          className="back-link"
          type="button"
          onClick={() => {
            navigate("/login");
          }}
        >
          ← Back to Sign In
        </button>
      </section>
    </main>
  );
}
