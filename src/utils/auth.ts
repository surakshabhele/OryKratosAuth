import type {
  LoginFlow,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  SuccessfulNativeRegistration,
  VerificationFlow,
} from "@ory/client";
import { getHiddenValue } from "./flow";
import ory from "./ory";

type LoginParams = {
  email: string;
  password: string;
  flow: LoginFlow;
};

type RegisterParams = {
  fullName: string;
  email: string;
  password: string;
  flow: RegistrationFlow;
};

type RecoveryParams = {
  email: string;
  flow: RecoveryFlow;
};

type VerificationParams = {
  email: string;
  flow: VerificationFlow;
};

type ResetPasswordParams = {
  password: string;
  flow: SettingsFlow;
};

export async function signInWithPassword({
  email,
  password,
  flow,
}: LoginParams): Promise<void> {
  await ory.updateLoginFlow({
    flow: flow.id,
    updateLoginFlowBody: {
      method: "password",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      identifier: email,
      password,
    },
  });
}

export async function registerWithPassword({
  fullName,
  email,
  password,
  flow,
}: RegisterParams): Promise<SuccessfulNativeRegistration> {
  const { data } = await ory.updateRegistrationFlow({
    flow: flow.id,
    updateRegistrationFlowBody: {
      method: "password",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      password,
      traits: {
        email,
        full_name: fullName,
      },
    },
  });

  return data;
}

export async function sendPasswordResetLink({
  email,
  flow,
}: RecoveryParams): Promise<RecoveryFlow> {
  const { data } = await ory.updateRecoveryFlow({
    flow: flow.id,
    updateRecoveryFlowBody: {
      method: "code",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      email,
    },
  });

  return data;
}

export async function sendVerificationCode({
  email,
  flow,
}: VerificationParams): Promise<VerificationFlow> {
  const { data } = await ory.updateVerificationFlow({
    flow: flow.id,
    updateVerificationFlowBody: {
      method: "code",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      email,
    },
  });

  return data;
}

export async function verifyPasswordResetCode({
  code,
  flow,
}: {
  code: string;
  flow: RecoveryFlow;
}): Promise<RecoveryFlow> {
  const { data } = await ory.updateRecoveryFlow({
    flow: flow.id,
    updateRecoveryFlowBody: {
      method: "code",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      code,
    },
  });

  return data;
}

export async function resetPasswordWithSettingsFlow({
  password,
  flow,
}: ResetPasswordParams): Promise<SettingsFlow> {
  const { data } = await ory.updateSettingsFlow({
    flow: flow.id,
    updateSettingsFlowBody: {
      method: "password",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      password,
    },
  });

  return data;
}

export async function submitVerificationCode({
  code,
  flow,
}: {
  code: string;
  flow: VerificationFlow;
}): Promise<VerificationFlow> {
  const { data } = await ory.updateVerificationFlow({
    flow: flow.id,
    updateVerificationFlowBody: {
      method: "code",
      csrf_token: getHiddenValue(flow, "csrf_token"),
      code,
    },
  });

  return data;
}

export async function startLogout(): Promise<string> {
  const { data } = await ory.createBrowserLogoutFlow({
    returnTo: `${window.location.origin}/login`,
  });

  return data.logout_url;
}
