const axios = require("axios");

function subscribeToTwitchEvents(BASE_URL, externals, subscriptions) {
  const { TWITCH_CLIENT_ID, TWITCH_SECRET } = process.env;
  let ACCESS_TOKEN;

  // Execute POST request to retrieve OAuth client access token
  axios
    .post(
      `${externals.twitch.token}?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_SECRET}&grant_type=client_credentials`
    )
    .then((res) => {
      ACCESS_TOKEN = res.data.access_token;
      console.log(`Access Token success with status code: ${res.status}`);

      if (ACCESS_TOKEN) {
        // Set request headers
        axios.defaults.headers.common["Client-ID"] = TWITCH_CLIENT_ID;
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${ACCESS_TOKEN}`;

        // Get Twitch User ID
        axios
          .get(`${externals.twitch.userID}users?login=dachosenwaffle`)
          .then((res) => {
            console.log(`User ID success with status code: ${res.status}`);

            // Set request body for event sub POST request
            const hub = {
              body: {
                "hub.callback": `${BASE_URL}/twitch/webhooks/callback`,
                "hub.mode": "subscribe",
                "hub.topic": `${externals.twitch.stream}?user_id=${res.data.data[0].id}`,
                "hub.lease_seconds": 864000,
                "hub.secret": TWITCH_SECRET,
              },
            };

            /**
             * After getting Twitch User ID,
             * Execute event sub POST request with 'hub' body
             */
            axios
              .post(externals.twitch.subscribe, hub.body)
              .then((res) => {
                subscriptions.twitch = true;
                console.log(
                  `Event sub success with status code: ${res.status}`
                );

                // After subscription expires, refresh subscription.
                setTimeout(
                  subscribeToTwitchEvents(BASE_URL, externals, subscriptions),
                  864000 * 1000
                );
              })
              // Res is formatted as "Error: Request failed with status code <code>"
              .catch((res) => console.log(`Event Sub ${res}`));
          })
          .catch((res) => console.log(`User ID ${res}`));
      }
    })
    .catch((res) => console.log(`Access Token ${res}`));

  return;
}

module.exports = subscribeToTwitchEvents;
