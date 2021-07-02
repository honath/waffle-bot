require("dotenv").config();
const path = require("path");

module.exports = {
  development: {
    client: "pg",
    pool: { min: 1, max: 5 },
    connection: process.env.DEV_DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, "db", "migrations"),
    },
    seeds: {
      directory: path.join(__dirname, "db", "seeds"),
    },
  },
  production: {
    client: "pg",
    pool: { min: 1, max: 5 },
    connection: process.env.PROD_DATABASE_URL,
    migrations: {
      directory: path.join(__dirname, "db", "migrations"),
    },
    seeds: {
      directory: path.join(__dirname, "db", "seeds"),
    },
  },
};
