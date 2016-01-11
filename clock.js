//For specific times, use a chron job
var fifteenSeconsAfterMinute = function() {
  console.log("Another 10 mins is gone forever. Hopefully, you made the most of it...");
}
var CronJob = require('cron').CronJob;
new CronJob({
  cronTime: "0 0,10,20,30,40,50 * * * *",//10 min 
  onTick: fifteenSeconsAfterMinute,
  start: true,
  timeZone: "America/Los_Angeles"
});
