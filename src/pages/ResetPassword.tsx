import type { ReactElement } from "react";
import type { SettingsFlow } from "@ory/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconEye,
  IconEyeOff,
  IconHelp,
  IconLock,
  IconMoon,
} from "../components/AuthIcons";
import { resetPasswordWithSettingsFlow } from "../utils/auth";
import {
  getBrowserRedirectPath,
  getOryUiError,
} from "../utils/flow";
import ory from "../utils/ory";

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggleVisibility,
}: PasswordFieldProps): ReactElement {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <span className="field-icon">
          <IconLock />
        </span>
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="trailing-icon"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={onToggleVisibility}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </label>
  );
}

export default function ResetPassword(): ReactElement {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<SettingsFlow | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFlow() {
      try {
        const flowId = new URLSearchParams(window.location.search).get("flow");
        const response = flowId
          ? await ory.getSettingsFlow({ id: flowId })
          : await ory.createBrowserSettingsFlow();

        if (!active) {
          return;
        }

        setFlow(response.data);
        setFlowError("");
      } catch (error) {
        console.error("Unable to create settings flow", error);
        if (!active) {
          return;
        }

        setFlowError("Unable to load password reset. Please request a new reset code.");
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

    if (password !== confirmPassword) {
      setFlowError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFlowError("");

    try {
      await resetPasswordWithSettingsFlow({
        password,
        flow,
      });

      navigate("/reset-success", { replace: true });
    } catch (error) {
      const redirectPath = getBrowserRedirectPath(error);

      if (redirectPath) {
        navigate("/reset-success", { replace: true });
        return;
      }

      console.error("Unable to reset password", error);
      setFlowError(
        getOryUiError(
          error,
          "Unable to reset password. Please try again.",
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

      <section className="auth-card detail-card reset-card" aria-label="Reset password form">
        <header className="auth-header detail-header">
          <h1>Create New Password</h1>
          <p>Your new password must be different from previous passwords.</p>
          {isFlowLoading ? <p>Connecting to Ory...</p> : null}
          {flowError ? <p>{flowError}</p> : null}
        </header>

        <form className="auth-form reset-form" onSubmit={handleSubmit}>
          <PasswordField
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChange={setPassword}
            visible={showNewPassword}
            onToggleVisibility={() => setShowNewPassword((value) => !value)}
          />

          <PasswordField
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
          />

          <button
            className="primary-action submit-btn"
            type="submit"
            disabled={!flow || isFlowLoading || isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
