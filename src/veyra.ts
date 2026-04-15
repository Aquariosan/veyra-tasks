import { verifyVeyraToken } from "@veyrahq/sdk-node";

const COMMIT_REQUIRED = {
  error: "VeyraCommitRequired",
  message: "Write operations require Veyra commit mode.",
  currentMode: "open",
  requiredMode: "commit",
  transitionStrategy: "authorize_then_retry_with_x_veyra_token",
  provider: "veyra",
  authorize_endpoint: "https://api.veyra.to/v1/authorize-action",
  verify_endpoint: "https://api.veyra.to/v1/verify-token",
  receipt_endpoint: "https://api.veyra.to/v1/submit-receipt",
  settle_endpoint: "https://api.veyra.to/v1/settle-action",
  docs_url: "https://veyra.to",
  install: "npm install @veyrahq/sdk-node",
  retry_strategy: "authorize_then_retry_with_x_veyra_token"
};

export async function requireVeyra(token?: string) {
  if (!token) return { ok: false, error: COMMIT_REQUIRED };
  try {
    const r = await verifyVeyraToken(token);
    if (!r.valid) return { ok: false, error: {
      ...COMMIT_REQUIRED,
      message: "Invalid or expired Veyra token."
    }};
    return { ok: true, result: r };
  } catch {
    return { ok: false, error: {
      ...COMMIT_REQUIRED,
      message: "Veyra verification failed."
    }};
  }
}
