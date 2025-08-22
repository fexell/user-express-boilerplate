

/**
 * @constant TimeHelper - Time Helper
 * @type {Object}
 * @description Object containing time constants, for easy access
 * 
 * @property {Number} FiveSeconds - 5 seconds
 * @property {Number} TenSeconds - 10 seconds
 * @property {Number} OneMinute - 1 minute
 * @property {Number} ThreeMinutes - 3 minutes
 * @property {Number} FifteenMinutes - 15 minutes
 * @property {Number} OneHour - 1 hour
 * @property {Number} OneDay - 1 day
 * @property {Number} OneWeek - 1 week
 * @property {Number} OneMonth - 1 month
 * @property {Number} OneYear - 1 year
 */
const TimeHelper                            = {
  FiveSeconds                               : 1000 * 5, // 5 seconds
  EightSeconds                              : 1000 * 8, // 8 seconds
  TenSeconds                                : 1000 * 10, // 10 seconds
  OneMinute                                 : 1000 * 60, // 1 minute
  ThreeMinutes                              : 1000 * 60 * 3, // 3 minutes
  FifteenMinutes                            : 1000 * 60 * 15, // 15 minutes
  OneHour                                   : 1000 * 60 * 60, // 1 hour
  OneDay                                    : 1000 * 60 * 60 * 24, // 1 day
  OneWeek                                   : 1000 * 60 * 60 * 24 * 7, // 1 week
  OneMonth                                  : 1000 * 60 * 60 * 24 * 30, // 1 month
  OneYear                                   : 1000 * 60 * 60 * 24 * 365, // 1 year
}

export {
  TimeHelper as default,
}
