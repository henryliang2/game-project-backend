const currDate = new Date();
const currDateString = currDate.toISOString().slice(0, 10);

let threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(currDate.getMonth() - 3);
const threeMonthsAgoString = threeMonthsAgo.toISOString().slice(0, 10);

let threeMonthsForward = new Date();
threeMonthsForward.setMonth(currDate.getMonth() + 3);
const threeMonthsForwardString = threeMonthsForward.toISOString().slice(0, 10);

module.exports = {
  currDateString,
  threeMonthsAgoString,
  threeMonthsForwardString
}