const express = require("express");
const app = express();
require("dotenv").config();
const pool = require("./database");
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
