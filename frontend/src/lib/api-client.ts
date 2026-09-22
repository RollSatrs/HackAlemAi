import { OptimizeRequest, OptimizeResponse, RunSummary } from "@sandbox/shared";

export interface ApiClient {
  optimize(req: OptimizeRequest): Promise<OptimizeResponse>;
  listRuns(): Promise<RunSummary[]>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export class HttpApiClient implements ApiClient {
  async optimize(req: OptimizeRequest): Promise<OptimizeResponse> {
    const res = await fetch(`${BASE_URL}/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.error?.message ?? "optimize request failed");
    }
    return res.json();
  }

  async listRuns(): Promise<RunSummary[]> {
    const res = await fetch(`${BASE_URL}/runs`);
    if (!res.ok) throw new Error("failed to list runs");
    return res.json();
  }
}
