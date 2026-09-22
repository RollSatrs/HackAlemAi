import { parseScenarioForm, ScenarioFormValues } from "./ScenarioForm";

describe("parseScenarioForm", () => {
  it("converts form values into a valid OptimizeRequest", () => {
    const values: ScenarioFormValues = {
      seed: "42",
      duration_sec: "300",
      candidates: "50",
      lambda: "1.0",
      intersections: [
        { id: "A", ns_arrival_rate: "0.4", ew_arrival_rate: "0.3" },
        { id: "B", ns_arrival_rate: "0.2", ew_arrival_rate: "0.5" },
      ],
    };
    const request = parseScenarioForm(values);
    expect(request).toEqual({
      scenario: {
        seed: 42,
        duration_sec: 300,
        intersections: [
          { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
          { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
        ],
      },
      options: { candidates: 50, lambda: 1.0 },
    });
  });
});
