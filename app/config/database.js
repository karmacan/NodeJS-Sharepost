// process.env.NODE_ENV set by Heroku
// if (!process.env.NODE_ENV) {
//   // LOCAL DB
//   const mongoPath = 'mongodb://localhost/vidjot-dev';
//   module.exports = { mongoPath: mongoPath };
// }
// REMOTE DB (process.env.NODE_ENV === 'production')
const mlabUser = 'host';
const mlabUserPass = 'c0dew0rd';
const mongoPath = `mongodb://${mlabUser}:${mlabUserPass}@ds161790.mlab.com:61790/db_storybooks`;
module.exports = { mongoPath: mongoPath };