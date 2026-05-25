const ORY_URL = "http://127.0.0.1:4433";
function q(name) {
  return new URLSearchParams(location.search).get(name);
}
function esc(v = "") {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
}
function renderNode(node) {
  const a = node.attributes || {};
  const label = node.meta?.label?.text || a.name || "";
  if (a.type === "hidden")
    return `<input type="hidden" name="${esc(a.name)}" value="${esc(a.value || "")}">`;
  if (a.type === "submit" || a.type === "button")
    return `<button type="submit" name="${esc(a.name || "")}" value="${esc(a.value || "")}">${esc(label || a.value || "Continue")}</button>`;
  return `<label>${esc(label)}<input type="${esc(a.type || "text")}" name="${esc(a.name || "")}" value="${esc(a.value || "")}" ${a.required ? "required" : ""}></label>`;
}
async function boot(flowType) {
  const flowId = q("flow");
  if (!flowId) {
    location.href = `${ORY_URL}/self-service/${flowType}/browser`;
    return;
  }
  const res = await fetch(
    `${ORY_URL}/self-service/${flowType}/flows?id=${encodeURIComponent(flowId)}`,
    { credentials: "include" },
  );
  const flow = await res.json();
  const nodes = flow.ui.nodes || [];
  const hidden = nodes
    .filter((n) => n.attributes?.type === "hidden")
    .map(renderNode)
    .join("");
  const oidc = nodes
    .filter((n) => n.attributes?.name === "provider")
    .map(renderNode)
    .join("");
  const main = nodes
    .filter(
      (n) =>
        n.attributes?.type !== "hidden" && n.attributes?.name !== "provider",
    )
    .map(renderNode)
    .join("");
  document.getElementById("oidc").innerHTML =
    `     <form action="${flow.ui.action}" method="${flow.ui.method}">       ${hidden}${oidc}    </form>   `;
  document.getElementById("main").innerHTML =
    `     <form action="${flow.ui.action}" method="${flow.ui.method}">       ${hidden}${main}    </form>   `;
}
