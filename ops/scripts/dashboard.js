const fs = require("node:fs");
const path = require("node:path");

const env = process.env.ENV || "dev";

const configPath = path.join(__dirname, "../config/dashboard.json");

try {
  const configFile = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(configFile);
  const data = config[env];

  if (!data) {
    process.exit(0);
  }

  console.log(`\n${data.title}`);
  console.log("-----------------------------------");
  data.services.forEach((svc) => {
    console.log(`${svc.name.padEnd(18)} ${svc.url}`);
  });

  if (data.tools && data.tools.length > 0) {
    console.log("-----------------------------------");
    console.log(" DEV TOOLS");
    data.tools.forEach((tool) => {
      console.log(`${tool.name.padEnd(18)} ${tool.url}`);
    });
  }
  console.log("-----------------------------------\n");
} catch (error) {
  console.error("Dashboard Error:", error.message);
}
