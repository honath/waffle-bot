/**
 * Twitch callback function passed into
 * subscription POST call
 * @param {object} req 
 * @param {object} res 
 */
function subscribe(req, res) {
  const hubChallenge = req.query["hub.challenge"];
  console.log(`${req.method} at ${req.originalUrl}`);
  res.status(200).send(`${hubChallenge}`);
}

module.exports = {
  subscribe,
};
