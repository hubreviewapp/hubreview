function formatDateInterval(firstDay: string, lastDay: string) {
  // Parse input strings into Date objects
  const startDate = new Date(firstDay);
  const endDate = new Date(lastDay);

  // Get month and day for start and end dates
  const startMonth = startDate.toLocaleString("en-us", { month: "long" });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleString("en-us", { month: "long" });
  const endDay = endDate.getDate();

  // Format the interval
  const formattedInterval = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

  return formattedInterval;
}

export default formatDateInterval;
