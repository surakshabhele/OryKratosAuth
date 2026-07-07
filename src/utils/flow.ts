import type {
  LoginFlow,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  UiNode,
  VerificationFlow,
} from "@ory/client";

type Flow =
  | LoginFlow
  | RecoveryFlow
  | RegistrationFlow
  | SettingsFlow
  | VerificationFlow;

export type SocialProvider = string;
export const SUPPORTED_SOCIAL_PROVIDERS: SocialProvider[] = [
  "google",
  "github",
];

type InputNode = UiNode & {
  attributes: {
    node_type: "input";
    name: string;
    type?: string;
    value?: unknown;
  };
};

function isInputNode(node: UiNode): node is InputNode {
  return node.attributes.node_type === "input";
}

export function getFlowError(
  error: any,
  action: "login" | "registration",
): string {
  const errorData = error?.response?.data?.error;

  if (errorData?.id === "session_already_available") {
    return "You are already signed in.";
  }

  return errorData?.message
    ? `Unable to start ${action}: ${errorData.message}`
    : `Unable to start ${action}. Check Ory server.`;
}

export function getOryUiError(
  error: any,
  fallback: string,
): string {
  const responseData = error?.response?.data;
  const status = error?.response?.status;
  const topLevelMessages = Array.isArray(responseData?.ui?.messages)
    ? responseData.ui.messages
    : [];
  const nodeMessages = Array.isArray(responseData?.ui?.nodes)
    ? responseData.ui.nodes.flatMap((node: any) =>
        Array.isArray(node?.messages) ? node.messages : [],
      )
    : [];
  const messages = [...topLevelMessages, ...nodeMessages]
    .map((message: any) => message?.text)
    .filter((message: unknown): message is string => typeof message === "string" && message.length > 0);

  if (messages.length > 0) {
    return messages.join(" ");
  }

  if (responseData?.error?.reason) {
    return String(responseData.error.reason);
  }

  if (responseData?.error?.message) {
    return String(responseData.error.message);
  }

  if (status === 410) {
    return "This flow expired. Please try again.";
  }

  return fallback;
}

export function getHiddenValue(
  flow: Flow | null,
  name: string,
): string {
  const node = flow?.ui.nodes.find(
    (node): node is InputNode =>
      isInputNode(node) &&
      node.attributes.name === name,
  );

  return String(node?.attributes.value ?? "");
}

function toLocalPath(url: string): string {
  const redirectUrl = new URL(url, window.location.origin);

  return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
}

export function getBrowserRedirectPath(error: unknown): string | null {
  const redirectTo = (error as any)?.response?.data?.redirect_browser_to;

  if (typeof redirectTo !== "string" || !redirectTo) {
    return null;
  }

  return toLocalPath(redirectTo);
}

export function getResetPasswordPathFromRecoveryFlow(flow: RecoveryFlow): string {
  const continueWith = flow.continue_with ?? [];
  const settingsItem = continueWith.find(
    (item) => item.action === "show_settings_ui" && "flow" in item,
  );

  if (settingsItem && "flow" in settingsItem) {
    return `/reset-password?flow=${encodeURIComponent(settingsItem.flow.id)}`;
  }

  const redirectItem = continueWith.find(
    (item) => item.action === "redirect_browser_to" && "redirect_browser_to" in item,
  );

  if (redirectItem && "redirect_browser_to" in redirectItem) {
    return toLocalPath(redirectItem.redirect_browser_to);
  }

  throw new Error("Missing settings flow after recovery code verification.");
}

export function getSocialProviders(flow: Flow | null): SocialProvider[] {
  const providers = flow?.ui.nodes
    .filter(
      (node): node is InputNode =>
        node.group === "oidc" &&
        isInputNode(node) &&
        node.attributes.name === "provider" &&
        typeof node.attributes.value === "string",
    )
    .map((node) => node.attributes.value.trim())
    .filter(Boolean);

  return [...new Set(providers ?? [])];
}

export function getSocialProviderLabel(provider: SocialProvider): string {
  if (provider === "github") {
    return "GitHub";
  }

  return provider
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function submitSocialFlow(
  flow: Flow | null,
  provider: SocialProvider,
) {
  if (!flow) {
    alert("Flow not ready");
    return;
  }

  const form = document.createElement("form");

  form.method = flow.ui.method;
  form.action = flow.ui.action;
  form.style.display = "none";

  flow.ui.nodes.forEach((node) => {
    if (
      !isInputNode(node) ||
      node.attributes.type !== "hidden"
    ) {
      return;
    }

    const input = document.createElement("input");

    input.type = "hidden";
    input.name = node.attributes.name;
    input.value = String(node.attributes.value ?? "");

    form.appendChild(input);
  });

  ["method", "provider"].forEach((name) => {
    const input = document.createElement("input");

    input.type = "hidden";
    input.name = name;
    input.value =
      name === "method" ? "oidc" : provider;

    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
