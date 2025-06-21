// Week calculation utilities for Sunday-Saturday weeks
function getWeekBoundaries(year, weekNumber) {
  // Calculate Sunday-Saturday boundaries for any week in year
  const firstDayOfYear = new Date(year, 0, 1);
  const firstSunday = getFirstSunday(firstDayOfYear);

  const weekStart = new Date(firstSunday);
  weekStart.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function getFirstSunday(firstDayOfYear) {
  const dayOfWeek = firstDayOfYear.getDay(); // 0 = Sunday
  const firstSunday = new Date(firstDayOfYear);

  if (dayOfWeek === 0) {
    // January 1st is already Sunday
    return firstSunday;
  } else {
    // Find the first Sunday
    firstSunday.setDate(firstDayOfYear.getDate() + (7 - dayOfWeek));
    return firstSunday;
  }
}

function generateWeekOptions(year) {
  const weeks = [];
  for (let i = 1; i <= 52; i++) {
    const { weekStart, weekEnd } = getWeekBoundaries(year, i);
    const startStr = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    weeks.push({
      value: i,
      label: `Week ${i.toString().padStart(2, "0")} (${startStr} - ${endStr})`,
    });
  }
  return weeks;
}

module.exports = {
  getWeekBoundaries,
  generateWeekOptions,
};
