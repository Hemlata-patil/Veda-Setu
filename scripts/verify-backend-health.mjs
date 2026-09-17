import { spawn } from "child_process";
import http from "http";

async function runHealthCheck() {
  console.log("================================================================================");
  console.log(" BACKEND HEALTH CHECK VERIFICATION: GET /api/health");
  console.log("================================================================================\n");

  const port = 5055;
  console.log(`Starting backend server on port ${port}...`);

  const serverProcess = spawn("node", ["backend/dist/server.js"], {
    env: { ...process.env, PORT: String(port), NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (d) => {
    // console.log("[Backend stdout]", d.toString().trim());
  });

  serverProcess.stderr.on("data", (d) => {
    console.error("[Backend stderr]", d.toString().trim());
  });

  // Give server 1.5 seconds to start listening
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let passed = false;

  try {
    const data = await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body });
        });
      });
      req.on("error", reject);
      req.setTimeout(5000, () => req.destroy(new Error("Timeout")));
    });

    console.log("Health Check Status Code:", data.statusCode);
    console.log("Health Check Response Body:", data.body);

    const parsed = JSON.parse(data.body);

    if (
      data.statusCode === 200 &&
      parsed.status === "ok" &&
      parsed.service === "veda-setu-backend"
    ) {
      console.log("\n[PASS] GET /api/health returned valid 200 OK with expected JSON payload.");
      passed = true;
    } else {
      console.error("\n[FAIL] Unexpected response from /api/health:", parsed);
    }
  } catch (err) {
    console.error("\n[FAIL] Request to /api/health failed:", err);
  } finally {
    serverProcess.kill("SIGTERM");
  }

  if (!passed) {
    process.exit(1);
  }
}

runHealthCheck().catch((err) => {
  console.error("Health check runner exception:", err);
  process.exit(1);
});
