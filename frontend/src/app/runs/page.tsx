"use client";

import { useEffect, useState } from "react";
import { RunSummary } from "@sandbox/shared";
import { RunHistoryTable } from "../../components/RunHistoryTable";
import { HttpApiClient } from "../../lib/api-client";
import { MockApiClient } from "../../lib/mock-client";

const client =
  process.env.NEXT_PUBLIC_USE_MOCK === "false" ? new HttpApiClient() : new MockApiClient();

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    client.listRuns().then(setRuns).catch(() => setRuns([]));
  }, []);

  return (
    <main>
      <h1>Run History</h1>
      <RunHistoryTable runs={runs} />
    </main>
  );
}
