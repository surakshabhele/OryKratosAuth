import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import ory from "../lib/ory";
import {
  IconEye,
  IconEyeOff,
  IconHelp,
  IconLock,
  IconMail,
  IconMoon,
  IconUser,
} from "../components/AuthIcons";

type RegisterProps = {
  onSwitchToLogin?: () => void;
};

type InputFieldProps = {
  label: string;
  type: string;
  placeholder: string;
  icon: ReactElement;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  trailingIcon?: ReactElement;
  trailingActionLabel?: string;
  onTrailingAction?: () => void;
};

type handleRegisterProps = {
  flowId: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

type SocialProvider = "google" | "microsoft";

type SocialMarkProps = {
  provider: SocialProvider;
};

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  trailingIcon,
  trailingActionLabel,
  onTrailingAction,
}: InputFieldProps): ReactElement {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <span className="field-icon">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {trailingIcon ? (
          <button
            className="trailing-icon"
            type="button"
            aria-label={trailingActionLabel}
            onClick={onTrailingAction}
          >
            {trailingIcon}
          </button>
        ) : null}
      </div>
    </label>
  );
}

function SocialMark({ provider }: SocialMarkProps): ReactElement {
  if (provider === "microsoft") {
    return (
      <span className="social-mark microsoft" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }

  return (
    <span className="social-mark google" aria-hidden="true">
      G
    </span>
  );
}

const handleRegister = async (
  event: React.FormEvent<HTMLFormElement>,
  password: string,
  confirmPassword: string,
  fullName: string,
  email: string,
  flowId: string,
) => {
  event.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const response = await ory.updateRegistrationFlow({
      flow: flowId,
      updateRegistrationFlowBody: {
        method: "password",
        password,
        traits: {
          email,
          full_name: fullName,
        },
      },
    });

    console.log("User Registered:", response.data);

    alert("Registration successful");
  } catch (error) {
    console.error(error, "axios i think");
    // console.log(error.response?.data);
  }
};

export default function Register({
  onSwitchToLogin,
}: RegisterProps): ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [flowId, setFlowId] = useState("");

  useEffect(() => {
    ory
      .createBrowserRegistrationFlow()
      .then(({ data }) => {
        setFlowId(data.id);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

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

      <section
        className="auth-card register-card"
        aria-label="Create account form"
      >
        <header className="auth-header">
          <h1>Create Account</h1>
          <p>Sign up to get started with your account.</p>
        </header>

        <form
          className="auth-form"
          onSubmit={(e) =>
            handleRegister(
              e,
              password,
              confirmPassword,
              fullName,
              email,
              flowId,
            )
          }
        >
        
          <InputField
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            icon={<IconUser />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon={<IconMail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            icon={<IconLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailingIcon={showPassword ? <IconEyeOff /> : <IconEye />}
            trailingActionLabel={
              showPassword ? "Hide password" : "Show password"
            }
            onTrailingAction={() => setShowPassword((value) => !value)}
          />
          <InputField
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            icon={<IconLock />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            trailingIcon={showConfirmPassword ? <IconEyeOff /> : <IconEye />}
            trailingActionLabel={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            onTrailingAction={() => setShowConfirmPassword((value) => !value)}
          />
          <p className="legal-copy">
            I agree to the <a href="/">Terms of Service</a> and{" "}
            <a href="/">Privacy Policy</a>
          </p>

          <button className="primary-action submit-btn" type="submit">
            Create Account
          </button>
        </form>

        <div className="divider signup-divider">
          <span>Or Sign Up With</span>
        </div>

        <div className="social-row">
          <button className="social-btn" type="button">
            <SocialMark provider="google" />
            Google
          </button>
          <button className="social-btn" type="button">
            <SocialMark provider="microsoft" />
            Microsoft
          </button>
        </div>

        <p className="signup-copy">
          Already have an account?{" "}
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault();
              onSwitchToLogin?.();
            }}
          >
            Sign In
          </a>
        </p>
      </section>
    </main>
  );
}
