const { Client } = require("@notionhq/client");
require("dotenv").config();

class NotionClient {
  constructor() {
    this.notion = new Client({ auth: process.env.NOTION_TOKEN });
    this.databaseId = process.env.NOTION_DATABASE_ID;
  }

  async testConnection() {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });

      console.log("✅ Notion connection successful!");
      console.log(
        `📊 Database: ${response.title[0]?.plain_text || "Workout Database"}`
      );
      return true;
    } catch (error) {
      console.error("❌ Notion connection failed:", error.message);
      return false;
    }
  }

  async createWorkoutRecord(workoutData) {
    try {
      const properties = this.transformWorkoutToNotion(workoutData);

      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

      console.log(`✅ Created workout record: ${workoutData.name}`);
      return response;
    } catch (error) {
      console.error("❌ Error creating workout record:", error.message);
      throw error;
    }
  }

  transformWorkoutToNotion(workout) {
    // Convert Strava workout to Notion properties format
    const distance = workout.distance
      ? (workout.distance / 1609.34).toFixed(1)
      : "0"; // Convert meters to miles
    const duration = Math.round(workout.moving_time / 60); // Convert seconds to minutes

    return {
      "Activity Name": {
        title: [{ text: { content: workout.name || "Unnamed Workout" } }],
      },
      Date: {
        date: { start: workout.start_date_local.split("T")[0] },
      },
      "Activity Type": {
        select: { name: workout.type || "Workout" },
      },
      "Start Time": {
        rich_text: [{ text: { content: workout.start_date_local } }],
      },
      Duration: {
        number: duration,
      },
      Distance: {
        number: parseFloat(distance),
      },
      "Activity ID": {
        number: workout.id,
      },
      "Calendar Created": {
        checkbox: false,
      },
    };
  }
}

module.exports = NotionClient;
