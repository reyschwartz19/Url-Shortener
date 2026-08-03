
import autocannon, { Request, Result } from "autocannon";
import { randomUUID } from "crypto";

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  throw new Error("Set TOKEN env var first: TOKEN=$TOKEN npx tsx ...");
}

function setupRequest(req: Request): Request {
  req.body = JSON.stringify({
    originalUrl: `https://example.com/page-${randomUUID()}`,
  });
  return req;
}

async function main(): Promise<void> {
  const result: Result = await autocannon({
    url: "https://localhost/api/links/createLink",
    method: "POST",
    connections: 1000,
    duration: 30,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    requests: [{ setupRequest }],
  });

  console.log(`Status codes:`, result.statusCodeStats);
  console.log(`Errors: ${result.errors}, Timeouts: ${result.timeouts}`);
  console.log(`Req/sec avg: ${result.requests.average}`);
  console.log(autocannon.printResult(result, { renderResultsTable: true, renderLatencyTable: true }));
}

main().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});