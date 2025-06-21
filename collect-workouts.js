const StravaClient = require("./lib/strava-client.js");
const NotionClient = require("./lib/notion-client.js");
const {
  getWeekBoundaries,
  generateWeekOptions,
} = require("./lib/week-utils.js");
const readline = require("readline");

// Create clients
const strava = new StravaClient();
const notion = new NotionClient();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log("🏃‍♂️ Strava Workout Collector 2025\n");

  // Test connections
  console.log("Testing connections...");
  const stravaOk = await strava.testConnection();
  const notionOk = await notion.testConnection();

  if (!stravaOk || !notionOk) {
    console.log("❌ Connection failed. Please check your .env file.");
    process.exit(1);
  }

  console.log("\n📅 Available weeks:");
  const weeks = generateWeekOptions(2025);

  // Show first few weeks as examples
  weeks.slice(0, 5).forEach((week, index) => {
    console.log(`  ${week.value} - ${week.label}`);
  });
  console.log("  ...");
  console.log(`  52 - ${weeks[51].label}\n`);

  const weekInput = await askQuestion(
    "? Which week to collect? (enter week number): "
  );
  const weekNumber = parseInt(weekInput);

  if (weekNumber < 1 || weekNumber > 52) {
    console.log("❌ Invalid week number");
    process.exit(1);
  }

  const { weekStart, weekEnd } = getWeekBoundaries(2025, weekNumber);
  console.log(`\n📊 Collecting workouts for Week ${weekNumber}`);
  console.log(
    `📅 Date range: ${weekStart.toDateString()} - ${weekEnd.toDateString()}\n`
  );

  rl.close();

  // TODO: Fetch workouts from Strava and save to Notion
  console.log("🚧 Next: Implement workout fetching...");
}

main().catch(console.error);
