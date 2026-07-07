import type { RegistrationFlow } from "@ory/client";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Divider from "../components/Divider";
import {
  IconEye,
  IconEyeOff,
  IconHelp,
  IconLock,
  IconMail,
  IconMoon,
  IconUser,
} from "../components/AuthIcons";
import InputField from "../components/InputField";
import SocialMark from "../components/SocialMark";
import { registerWithPassword } from "../utils/auth";
import {
  getFlowError,
  getSocialProviderLabel,
  getSocialProviders,
  submitSocialFlow,
} from "../utils/flow";
import ory from "../utils/ory";

export default function Register(): ReactElement {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<RegistrationFlow | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          ? await ory.getRegistrationFlow({ id: flowId })
          : await ory.createBrowserRegistrationFlow();

        if (!active) {
          return;
        }

        setFlow(response.data);
        setFlowError("");
      } catch (error) {
        console.error("Unable to create registration flow", error);
        if (!active) {
          return;
        }

        const message = getFlowError(error, "registration");
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

    if (password !== confirmPassword) {
      setFlowError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFlowError("");

    try {
      const result = await registerWithPassword({
        fullName,
        email,
        password,
        flow,
      });

      const verificationStep = result.continue_with?.find(
        (item): item is typeof item & { flow: { id: string } } =>
          item.action === "show_verification_ui" && "flow" in item,
      );

      if (verificationStep) {
        navigate(
          `/verify-email?flow=${encodeURIComponent(verificationStep.flow.id)}&email=${encodeURIComponent(email)}`,
          { replace: true },
        );
        return;
      }

      navigate(result.session ? "/dashboard" : "/login", { replace: true });
    } catch (error) {
      console.error("Unable to create account", error);
      setFlowError("Unable to create account. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell register-shell">
      <span className="auth-brand">flflux.</span>

      <div className="theme-actions" aria-hidden="true">
        <button className="theme-icon" type="button" aria-label="Help">
          <IconHelp />
        </button>
        <button className="theme-icon" type="button" aria-label="Theme">
          <IconMoon />
        </button>
      </div>

      <section className="auth-card register-card" aria-label="Create account form">
        <header className="auth-header">
          <h1>Create Account</h1>
          <p>Sign up to get started with your account.</p>
          {isFlowLoading ? <p>Connecting to Ory...</p> : null}
          {flowError ? <p>{flowError}</p> : null}
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            icon={<IconUser />}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

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
            placeholder="Create a password"
            icon={<IconLock />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailingIcon={showPassword ? <IconEyeOff /> : <IconEye />}
            onTrailingAction={() => setShowPassword((value) => !value)}
          />

          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            icon={<IconLock />}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            trailingIcon={showConfirmPassword ? <IconEyeOff /> : <IconEye />}
            onTrailingAction={() => setShowConfirmPassword((value) => !value)}
          />

          <p className="legal-copy">
            I agree to the <a href="/">Terms of Service</a> and{" "}
            <a href="/">Privacy Policy</a>
          </p>

          <button
            className="primary-action submit-btn"
            type="submit"
            disabled={!flow || isFlowLoading || isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {socialProviders.length > 0 ? (
          <>
            <Divider text="Or Sign Up With" />

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
          Already have an account?{" "}
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault();
              navigate("/login");
            }}
          >
            Sign In
          </a>
        </p>
      </section>
    </main>
  );
}
