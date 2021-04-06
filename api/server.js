const { PORT = 3000 } = process.env;
const app = require("./app");

const listener = app.listen(PORT, () =>
  console.log(`Listening on Port ${PORT}!`)
);
