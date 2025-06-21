const fetch = require("node-fetch");
require("dotenv").config();

class StravaClient {
  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID;
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET;
    this.accessToken = process.env.STRAVA_ACCESS_TOKEN;
    this.refreshToken = process.env.STRAVA_REFRESH_TOKEN;
    this.baseUrl = "https://www.strava.com/api/v3";
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/athlete`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const athlete = await response.json();
        console.log("✅ Strava connection successful!");
        console.log(`👤 Athlete: ${athlete.firstname} ${athlete.lastname}`);
        return true;
      } else {
        console.error("❌ Strava connection failed:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error testing Strava connection:", error.message);
      return false;
    }
  }
}

module.exports = StravaClient;
