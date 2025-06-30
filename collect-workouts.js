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

// Function to validate DD-MM-YY date format
function validateDate(dateString) {
  const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{2})$/;
  const match = dateString.match(dateRegex);

  if (!match) {
    return {
      valid: false,
      error: "Invalid format. Please use DD-MM-YY (e.g., 15-03-25)",
    };
  }

  const [, day, month, year] = match;
  const fullYear = 2000 + parseInt(year);
  const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));

  // Check if the date is valid
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== parseInt(month) - 1 ||
    date.getDate() !== parseInt(day)
  ) {
    return {
      valid: false,
      error: "Invalid date. Please check day, month, and year.",
    };
  }

  return { valid: true, date };
}

// Function to get week boundaries for a specific date
function getWeekBoundariesForDate(date) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate Sunday (start of week)
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // Calculate Saturday (end of week)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
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

  console.log("✅ Strava connection successful!");
  console.log("✅ Notion connection successful!");
  console.log("📊 Database: Workout Data\n");

  console.log("📅 Choose your selection method:");
  console.log("  1. Enter a specific Date (DD-MM-YY format)");
  console.log("  2. Select by week number");

  const optionInput = await askQuestion("? Choose option (1 or 2): ");

  let weekStart, weekEnd, dateRangeLabel, selectedDate;

  if (optionInput === "1") {
    // Specific date input
    let validDate = false;

    while (!validDate) {
      const dateInput = await askQuestion(
        "? Enter Date in DD-MM-YY format (e.g., 15-03-25): "
      );

      const validation = validateDate(dateInput);
      if (validation.valid) {
        selectedDate = validation.date;
        validDate = true;
      } else {
        console.log(`❌ ${validation.error}`);
      }
    }

    // Set start and end to the same day
    weekStart = new Date(selectedDate);
    weekStart.setHours(0, 0, 0, 0);

    weekEnd = new Date(selectedDate);
    weekEnd.setHours(23, 59, 59, 999);

    dateRangeLabel = `Date: ${selectedDate.toDateString()}`;
  } else if (optionInput === "2") {
    // Week selection (current behavior)
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

    const weekData = getWeekBoundaries(2025, weekNumber);
    weekStart = weekData.weekStart;
    weekEnd = weekData.weekEnd;
    dateRangeLabel = `Week ${weekNumber}`;
  } else {
    console.log("❌ Invalid option. Please choose 1 or 2.");
    process.exit(1);
  }

  if (optionInput === "1") {
    console.log(
      `\n📊 Collecting workout data for Date ${selectedDate.toDateString()}`
    );
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(
      `📱 Strava Date: ${selectedDate.toDateString()} (${
        selectedDate.toISOString().split("T")[0]
      })\n`
    );

    console.log("📋 Summary:");
    console.log("📊 Single day operation");
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(
      `📱 Strava Date: ${selectedDate.toDateString()} (${
        selectedDate.toISOString().split("T")[0]
      })\n`
    );

    const proceed = await askQuestion(
      "? Proceed with collecting workout data for this period? (y/n): "
    );
    if (proceed.toLowerCase() !== "y") {
      console.log("❌ Operation cancelled");
      process.exit(0);
    }

    console.log(
      `🔄 Fetching Strava dates ${
        selectedDate.toISOString().split("T")[0]
      } to ${
        selectedDate.toISOString().split("T")[0]
      } for Date ${selectedDate.toDateString()} - ${selectedDate.toDateString()}`
    );
  } else {
    console.log(`\n📊 Collecting workout data for ${dateRangeLabel}`);
    console.log(
      `📅 Date range: ${weekStart.toDateString()} - ${weekEnd.toDateString()}\n`
    );
  }

  rl.close();

  // Fetch workouts from Strava
  const activities = await strava.getActivities(weekStart, weekEnd);

  if (activities.length === 0) {
    console.log("📭 No activities found for this period");
    return;
  }

  if (optionInput === "1") {
    console.log(
      `🔄 Fetching workout sessions from ${
        selectedDate.toISOString().split("T")[0]
      } to ${selectedDate.toISOString().split("T")[0]}`
    );
  }

  console.log(`🏃‍♂️ Found ${activities.length} workout sessions\n`);

  console.log("🏃‍♂️ Processing workout sessions:");
  let savedCount = 0;

  for (const activity of activities) {
    try {
      // Convert Strava's UTC time to EST local time
      const utcTime = new Date(activity.start_date);
      const estTimeString =
        utcTime
          .toLocaleString("sv-SE", {
            timeZone: "America/New_York",
          })
          .replace(" ", "T") + "-04:00";

      // Add the local time to the activity data
      const activityWithLocalTime = {
        ...activity,
        start_date_local: estTimeString,
      };

      await notion.createWorkoutRecord(activityWithLocalTime);
      savedCount++;

      if (optionInput === "1") {
        console.log(
          `✅ Processing Date ${selectedDate.toDateString()} from Strava Date ${
            activity.start_date.split("T")[0]
          }`
        );
        console.log(
          `✅ Created workout record for Date: ${selectedDate.toDateString()} (Strava Date: ${
            activity.start_date.split("T")[0]
          })`
        );
        console.log(
          `✅ Saved ${selectedDate.toDateString()}: ${activity.name} | ${
            activity.type
          } | ${
            activity.distance
              ? (activity.distance / 1000).toFixed(2) + "km"
              : "N/A"
          }`
        );
      } else {
        console.log(
          `✅ Saved ${activity.name}: ${activity.type} | ${
            activity.distance
              ? (activity.distance / 1000).toFixed(2) + "km"
              : "N/A"
          }`
        );
      }
    } catch (error) {
      console.error(`❌ Failed to save ${activity.name}:`, error.message);
    }
  }

  console.log(
    `\n✅ Successfully saved ${savedCount} workout sessions to Notion!`
  );
  console.log(
    "🎯 Next: Run update-workout-cal.js to add them to your calendar"
  );
}

main().catch(console.error);
