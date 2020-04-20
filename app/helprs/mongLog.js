const whichMongo = process.env.NODE_ENV ? 'Remote' : 'Local';

const mongConnectManaged = function () {
  console.log(`[_dev_] ${whichMongo} MongoDB connected...`)
}

const mongConnectFailed = function (er) {
  console.log(`[_dev_] ${whichMongo} MongoDB error!`);
  console.log(`\n${er.message}`);
}

module.exports = {
  mongConnectManaged,
  mongConnectFailed
};