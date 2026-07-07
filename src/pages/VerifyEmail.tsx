import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";
import type { RecoveryFlow, VerificationFlow } from "@ory/client";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconHelp, IconMoon } from "../components/AuthIcons";
import {
  sendVerificationCode,
  sendPasswordResetLink,
  submitVerificationCode,
  verifyPasswordResetCode,
} from "../utils/auth";
import {
  getBrowserRedirectPath,
  getOryUiError,
  getResetPasswordPathFromRecoveryFlow,
} from "../utils/flow";
import ory from "../utils/ory";

const OTP_LENGTH = 6;
type FlowType = "recovery" | "verification";

function getCodeValue(code: string[]): string {
  return code.join("");
}

export default function VerifyEmail(): ReactElement {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const flowId = params.get("flow");
  const flowType: FlowType = params.get("type") === "recovery"
    ? "recovery"
    : "verification";
  const submittedEmail = params.get("email") ?? "";
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [recoveryFlow, setRecoveryFlow] = useState<RecoveryFlow | null>(null);
  const [verificationFlow, setVerificationFlow] = useState<VerificationFlow | null>(null);
  const [flowError, setFlowError] = useState("");
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasSentVerificationCode = useRef(false);

  useEffect(() => {
    let active = true;

    hasSentVerificationCode.current = false;

    async function loadFlow() {
      try {
        if (flowType === "recovery") {
          if (!flowId) {
            navigate("/forgot-password", { replace: true });
            return;
          }

          const response = await ory.getRecoveryFlow({ id: flowId });

          if (!active) {
            return;
          }

          setRecoveryFlow(response.data);
          setVerificationFlow(null);
        } else {
          const response = flowId
            ? await ory.getVerificationFlow({ id: flowId })
            : await ory.createBrowserVerificationFlow();

          if (!active) {
            return;
          }

          setVerificationFlow(response.data);
          setRecoveryFlow(null);
        }

        setFlowError("");
      } catch (error) {
        console.error("Unable to load verification flow", error);
        if (!active) {
          return;
        }

        setFlowError(
          flowType === "recovery"
            ? "Unable to load the reset code screen. Please request a new code."
            : "Unable to load the verification screen. Please try again.",
        );
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
  }, [flowId, flowType, navigate]);

  useEffect(() => {
    if (
      flowType !== "verification" ||
      !verificationFlow ||
      !submittedEmail ||
      hasSentVerificationCode.current
    ) {
      return;
    }

    let active = true;

    hasSentVerificationCode.current = true;
    setIsResending(true);
    setFlowError("");

    void sendVerificationCode({
      email: submittedEmail,
      flow: verificationFlow,
    })
      .then((updatedFlow) => {
        if (!active) {
          return;
        }

        setVerificationFlow(updatedFlow);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      })
      .catch((error) => {
        console.error("Unable to send verification code", error);
        hasSentVerificationCode.current = false;

        if (!active) {
          return;
        }

        setFlowError(
          getOryUiError(
            error,
            "Unable to send the verification code. Please try again.",
          ),
        );
      })
      .finally(() => {
        if (active) {
          setIsResending(false);
        }
      });

    return () => {
      active = false;
    };
  }, [flowType, submittedEmail, verificationFlow]);

  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = nextValue;
    setCode(nextCode);

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const incomingValue = event.target.value.replace(/\D/g, "");

    if (incomingValue.length > 1) {
      const nextCode = [...code];

      incomingValue
        .slice(0, OTP_LENGTH)
        .split("")
        .forEach((digit, offset) => {
          if (index + offset < OTP_LENGTH) {
            nextCode[index + offset] = digit;
          }
        });

      setCode(nextCode);
      inputRefs.current[Math.min(index + incomingValue.length, OTP_LENGTH) - 1]?.focus();
      return;
    }

    updateDigit(index, incomingValue);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullCode = getCodeValue(code);

    if (fullCode.length !== OTP_LENGTH) {
      setFlowError("Please enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setFlowError("");

    try {
      if (flowType === "recovery") {
        if (!recoveryFlow) {
          throw new Error("Recovery flow not ready.");
        }

        const updatedFlow = await verifyPasswordResetCode({
          code: fullCode,
          flow: recoveryFlow,
        });

        navigate(getResetPasswordPathFromRecoveryFlow(updatedFlow), {
          replace: true,
        });
        return;
      }

      if (!verificationFlow) {
        throw new Error("Verification flow not ready.");
      }

      await submitVerificationCode({
        code: fullCode,
        flow: verificationFlow,
      });

      navigate("/login", { replace: true });
    } catch (error) {
      if (flowType === "recovery") {
        const redirectPath = getBrowserRedirectPath(error);

        if (redirectPath) {
          navigate(redirectPath, { replace: true });
          return;
        }
      }

      console.error("Unable to verify code", error);
      setFlowError(
        getOryUiError(
          error,
          flowType === "recovery"
            ? "Invalid or expired reset code. Please try again."
            : "Invalid or expired verification code. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!submittedEmail) {
      return;
    }

    setIsResending(true);
    setFlowError("");

    try {
      if (flowType === "recovery") {
        if (!recoveryFlow) {
          throw new Error("Recovery flow not ready.");
        }

        const updatedFlow = await sendPasswordResetLink({
          email: submittedEmail,
          flow: recoveryFlow,
        });

        setRecoveryFlow(updatedFlow);
      } else {
        if (!verificationFlow) {
          throw new Error("Verification flow not ready.");
        }

        const updatedFlow = await sendVerificationCode({
          email: submittedEmail,
          flow: verificationFlow,
        });

        hasSentVerificationCode.current = true;
        setVerificationFlow(updatedFlow);
      }

      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Unable to resend code", error);
      setFlowError(
        getOryUiError(
          error,
          flowType === "recovery"
            ? "Unable to resend the reset code right now. Please try again."
            : "Unable to resend the verification code right now. Please try again.",
        ),
      );
    } finally {
      setIsResending(false);
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

      <section className="auth-card detail-card verify-card" aria-label="Email verification form">
        <header className="auth-header detail-header">
          <h1>{flowType === "recovery" ? "Verify Reset Code" : "Verify Your Email"}</h1>
          <p>
            {flowType === "recovery"
              ? "Enter the 6-digit code sent to your email to continue resetting your password."
              : "Enter the 6-digit code sent to your email."}
          </p>
          {submittedEmail ? <p>Code sent to {submittedEmail}.</p> : null}
          {isFlowLoading ? <p>Connecting to Ory...</p> : null}
          {flowError ? <p>{flowError}</p> : null}
        </header>

        <form className="auth-form verify-form" onSubmit={handleSubmit}>
          <div className="otp-row" aria-label="Verification code">
            {Array.from({ length: OTP_LENGTH }, (_, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                className="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[index]}
                onChange={(event) => handleChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                aria-label={`Verification code digit ${index + 1}`}
              />
            ))}
          </div>

          {submittedEmail ? (
            <button
              className="resend-link"
              type="button"
              onClick={() => void handleResendCode()}
              disabled={isResending || isFlowLoading}
            >
              {isResending ? "Resending code..." : "Resend code"}
            </button>
          ) : (
            <p className="resend-copy">Enter the most recent code you received.</p>
          )}

          <button
            className="primary-action submit-btn muted-action"
            type="submit"
            disabled={isFlowLoading || isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <button
          className="back-link"
          type="button"
          onClick={() => {
            navigate(flowType === "recovery" ? "/forgot-password" : "/login");
          }}
        >
          {flowType === "recovery" ? "Back to Forgot Password" : "Back to Sign In"}
        </button>
      </section>
    </main>
  );
}
