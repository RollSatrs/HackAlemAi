"use client";

import { useState } from "react";
import { OptimizeRequest, OptimizeResponse } from "@sandbox/shared";
import { ScenarioForm } from "../components/ScenarioForm";
import { ComparisonChart } from "../components/ComparisonChart";
import { HttpApiClient } from "../lib/api-client";
import { MockApiClient } from "../lib/mock-client";

const client =
  process.env.NEXT_PUBLIC_USE_MOCK === "false" ? new HttpApiClient() : new MockApiClient();

export default function Home() {
  const [response, setResponse] = useState<OptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(request: OptimizeRequest) {
    setError(null);
    try {
      const result = await client.optimize(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "optimize failed");
    }
  }

  return (
    <main>
      <h1>Traffic Signal Sandbox — Baseline vs Optimized</h1>
      <ScenarioForm onSubmit={handleSubmit} />
      {error && <p role="alert">{error}</p>}
      {response && <ComparisonChart response={response} />}
    </main>
  );
}
