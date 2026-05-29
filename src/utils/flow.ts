import type { LoginFlow, RegistrationFlow, UiNode } from "@ory/client";

type Flow = LoginFlow | RegistrationFlow;

export type SocialProvider = string;

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
