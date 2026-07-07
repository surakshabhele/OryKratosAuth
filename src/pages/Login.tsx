import type { LoginFlow } from "@ory/client";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Divider from "../components/Divider";
import {
  IconBell,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconMoon,
  IconPasskey,
} from "../components/AuthIcons";
import InputField from "../components/InputField";
import SocialMark from "../components/SocialMark";
import { signInWithPassword } from "../utils/auth";
import {
  getFlowError,
  getSocialProviderLabel,
  getSocialProviders,
  submitSocialFlow,
} from "../utils/flow";
import ory from "../utils/ory";

export default function Login(): ReactElement {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socialProviders = getSocialProviders(flow);

  useEffect(() => {
    let active = true;

    async function loadFlow() {
      try {
        const flowId = new URLSearchParams(window.location.search).get("flow");
        const response = flowId
          ? await ory.getLoginFlow({ id: flowId })
          : await ory.createBrowserLoginFlow();

        if (!active) {
          return;
        }

        setFlow(response.data);
        setFlowError("");
      } catch (error) {
        console.error("Unable to create login flow", error);
        if (!active) {
          return;
        }

        const message = getFlowError(error, "login");
        if (message === "You are already signed in.") {
          navigate("/dashboard", { replace: true });
          return;
        }

        setFlowError(message);
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
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!flow) {
      return;
    }

    setIsSubmitting(true);
    setFlowError("");

    try {
      await signInWithPassword({
        email,
        password,
        flow,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Unable to sign in", error);
      setFlowError("Unable to sign in. Please check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <span className="auth-brand">flflux.</span>

      <div className="theme-actions" aria-hidden="true">
        <button className="theme-icon" type="button" aria-label="Notifications">
          <IconBell />
        </button>
        <button className="theme-icon" type="button" aria-label="Theme">
          <IconMoon />
        </button>
      </div>

      <section className="auth-card" aria-label="Sign in form">
        <header className="auth-header">
          <h1>Sign In</h1>
          <p>Welcome back! Please enter your details.</p>
          {isFlowLoading ? <p>Connecting to Ory...</p> : null}
          {flowError ? <p>{flowError}</p> : null}
        </header>

        <button className="primary-action" type="button" title="Passkey UI only for now">
          <span className="btn-icon">
            <IconPasskey />
          </span>
          Sign in with Passkey
        </button>

        <Divider text="OR CONTINUE WITH EMAIL" />

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

          <InputField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            icon={<IconLock />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailingIcon={showPassword ? <IconEyeOff /> : <IconEye />}
            onTrailingAction={() => setShowPassword((value) => !value)}
          />

          <div className="form-meta">
            <a
              href="/forgot-password"
              onClick={(event) => {
                event.preventDefault();
                navigate("/forgot-password");
              }}
            >
              Forgot password?
            </a>
          </div>

          <button
            className="primary-action submit-btn"
            type="submit"
            disabled={!flow || isFlowLoading || isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {socialProviders.length > 0 ? (
          <>
            <Divider text="Or Login With" />

            <div className="social-row">
              {socialProviders.map((provider) => {
                const providerLabel = getSocialProviderLabel(provider);

                return (
                  <button
                    key={provider}
                    className="social-btn"
                    type="button"
                    onClick={() => submitSocialFlow(flow, provider)}
                    disabled={!flow || isFlowLoading}
                  >
                    <SocialMark provider={provider} />
                    {providerLabel}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        <p className="signup-copy">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            onClick={(event) => {
              event.preventDefault();
              navigate("/register");
            }}
          >
            Sign Up
          </a>
        </p>
      </section>
    </main>
  );
}
