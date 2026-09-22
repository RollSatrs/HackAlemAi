"use client";

import { useState } from "react";
import { OptimizeRequest } from "@sandbox/shared";

export interface ScenarioFormValues {
  seed: string;
  duration_sec: string;
  candidates: string;
  lambda: string;
  intersections: { id: string; ns_arrival_rate: string; ew_arrival_rate: string }[];
}

export function parseScenarioForm(values: ScenarioFormValues): OptimizeRequest {
  return {
    scenario: {
      seed: Number(values.seed),
      duration_sec: Number(values.duration_sec),
      intersections: values.intersections.map((intersection) => ({
        id: intersection.id,
        ns_arrival_rate: Number(intersection.ns_arrival_rate),
        ew_arrival_rate: Number(intersection.ew_arrival_rate),
      })),
    },
    options: {
      candidates: Number(values.candidates),
      lambda: Number(values.lambda),
    },
  };
}

const DEFAULT_VALUES: ScenarioFormValues = {
  seed: "42",
  duration_sec: "300",
  candidates: "50",
  lambda: "1.0",
  intersections: [
    { id: "A", ns_arrival_rate: "0.4", ew_arrival_rate: "0.3" },
    { id: "B", ns_arrival_rate: "0.2", ew_arrival_rate: "0.5" },
  ],
};

export function ScenarioForm({ onSubmit }: { onSubmit: (req: OptimizeRequest) => void }) {
  const [values, setValues] = useState<ScenarioFormValues>(DEFAULT_VALUES);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseScenarioForm(values));
      }}
    >
      <label>
        Seed
        <input
          value={values.seed}
          onChange={(e) => setValues({ ...values, seed: e.target.value })}
        />
      </label>
      <label>
        Duration (sec)
        <input
          value={values.duration_sec}
          onChange={(e) => setValues({ ...values, duration_sec: e.target.value })}
        />
      </label>
      <label>
        Candidates
        <input
          value={values.candidates}
          onChange={(e) => setValues({ ...values, candidates: e.target.value })}
        />
      </label>
      <label>
        Lambda
        <input
          value={values.lambda}
          onChange={(e) => setValues({ ...values, lambda: e.target.value })}
        />
      </label>
      <button type="submit">Run optimization</button>
    </form>
  );
}
