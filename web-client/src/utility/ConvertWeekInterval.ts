import { WeekData } from "../pages/AnalyticsPage.tsx";

function ConvertWeekInterval(data: WeekData[]) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return data.map((item) => {
    const weekDates = item.week.split(" - ");
    const startDate = new Date(weekDates[0]);
    const endDate = new Date(weekDates[1]);

    const startMonth = monthNames[startDate.getMonth()];
    const startDay = startDate.getDate();

    const endMonth = monthNames[endDate.getMonth()];
    const endDay = endDate.getDate();

    // Convert speed to total hours
    const speedParts = item.speed.split(":");
    const days = parseInt(speedParts[0]);
    const hours = parseInt(speedParts[1]);
    const minutes = parseInt(speedParts[2]);
    let totalHours = days * 24 + hours + minutes / 60;
    totalHours = parseFloat(totalHours.toFixed(2));
    return {
      ...item,
      week: `${startMonth} ${startDay} - ${endMonth} ${endDay}`,
      speedInHours: totalHours,
    };
  });
}

export default ConvertWeekInterval;
