import { RunSummary } from "@sandbox/shared";

export function RunHistoryTable({ runs }: { runs: RunSummary[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Run ID</th>
          <th>Created</th>
          <th>Waiting time improvement</th>
          <th>Throughput improvement</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <tr key={run.run_id}>
            <td>{run.run_id}</td>
            <td>{new Date(run.created_at).toLocaleString()}</td>
            <td>{run.improvement.waiting_time_percent.toFixed(1)}%</td>
            <td>{run.improvement.throughput_percent.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
