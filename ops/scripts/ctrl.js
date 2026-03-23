const { spawn } = require("node:child_process");
const path = require("node:path");

const env = process.env.ENV || "dev";
const action = process.argv[2]; // 'up' | 'down'
const target = process.argv[3]; // 'infra', 'svc:all', 'app:client', etc.

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

if (!["dev", "prod"].includes(env)) {
  console.error(`${colors.red}Invalid ENV="${env}". Allowed values: dev | prod${colors.reset}`);
  process.exit(1);
}

if (!action || !target) {
  console.error(`${colors.red}Usage: ENV=dev node ops/scripts/ctrl.js [up|down] [target]${colors.reset}`);
  console.error(`${colors.gray}Targets: infra:data, infra:edge(*), svc:all, app:client, dev:tools, prod:monitor, prod:backup, infra:all, all${colors.reset}`);
  console.error(`${colors.gray}(*) infra:edge only available in prod (Caddy)${colors.reset}`);
  process.exit(1);
}

// ── Common layers (both environments) ─────────────────────────────────────────
const layers = {
  "infra:data":  ["ops/compose/common/data.yml"],
  "svc:all":     ["ops/compose/common/services.yml"],
  "app:client":  ["ops/compose/common/client.yml"],
};

// ── Dev-only layers ────────────────────────────────────────────────────────────
if (env === "dev") {
  layers["dev:tools"] = ["ops/compose/dev/devtools.yml"];
}

// ── Prod-only layers ───────────────────────────────────────────────────────────
if (env === "prod") {
  layers["infra:edge"]    = ["ops/compose/prod/caddy.yml"];
  layers["prod:monitor"]  = ["ops/compose/prod/monitor.yml"];
  layers["prod:backup"]   = ["ops/compose/prod/backup.yml"];
}

// ── Aliases ────────────────────────────────────────────────────────────────────
layers["infra:all"] = [
  ...layers["infra:data"],
  ...(env === "dev"  ? layers["dev:tools"]                                          : []),
  ...(env === "prod" ? [...layers["infra:edge"], ...layers["prod:monitor"], ...layers["prod:backup"]] : []),
];

layers["all"] = [
  ...layers["infra:all"],
  ...layers["svc:all"],
  ...layers["app:client"],
];

// ── Resolve target ─────────────────────────────────────────────────────────────
const selectedFiles = layers[target];

if (!selectedFiles) {
  console.error(`${colors.red}Unknown target: "${target}"${colors.reset}`);
  console.log(`Available targets: ${Object.keys(layers).join(", ")}`);
  process.exit(1);
}

// ── Build docker compose command ───────────────────────────────────────────────
const envFile = path.join(__dirname, `../env/.env.${env}`);

const args = [
  "compose",
  "--env-file", envFile,
  ...selectedFiles.flatMap((f) => ["-f", f]),
  action === "up" ? "up" : "down",
];

if (action === "up") args.push("--detach");

// Optionally target a single service within the layer
const extraService = process.argv[4];
if (extraService) args.push(extraService);

// ── Print summary ──────────────────────────────────────────────────────────────
console.log(`\n${colors.cyan}┌─ Riffle Controller ─────────────────────┐${colors.reset}`);
console.log(`${colors.cyan}│${colors.reset}  ENV     : ${colors.yellow}${env}${colors.reset}`);
console.log(`${colors.cyan}│${colors.reset}  Target  : ${colors.yellow}${target}${colors.reset}`);
console.log(`${colors.cyan}│${colors.reset}  Action  : ${colors.yellow}${action.toUpperCase()}${colors.reset}`);
console.log(`${colors.cyan}│${colors.reset}  Config  : ${colors.gray}${envFile}${colors.reset}`);
console.log(`${colors.cyan}│${colors.reset}  Files   : ${colors.gray}${selectedFiles.join(", ")}${colors.reset}`);
console.log(`${colors.cyan}└─────────────────────────────────────────┘${colors.reset}\n`);

// ── Run ────────────────────────────────────────────────────────────────────────
const cmd = spawn("docker", args, { stdio: "inherit", shell: true });

cmd.on("close", (code) => {
  if (code !== 0) {
    console.error(`\n${colors.red}✗ Failed (exit ${code})${colors.reset}`);
    process.exit(code);
  }
  console.log(`\n${colors.green}✓ Done${colors.reset}`);
});
