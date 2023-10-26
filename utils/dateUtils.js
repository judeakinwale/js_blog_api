function addMonthsToDate(date, monthsToAdd) {
  var newDate = new Date(date);

  // Get the current month and year
  var currentMonth = newDate.getMonth();
  var currentYear = newDate.getFullYear();

  // Calculate the new month and year
  var newMonth = currentMonth + monthsToAdd;
  var newYear = currentYear + Math.floor(newMonth / 12);

  // Adjust the new month if it exceeds 11 (December)
  newMonth = ((newMonth % 12) + 12) % 12;

  // Set the new month and year in the Date object
  newDate.setMonth(newMonth);
  newDate.setFullYear(newYear);

  return newDate;
}

module.exports = {
  addMonthsToDate,
};
