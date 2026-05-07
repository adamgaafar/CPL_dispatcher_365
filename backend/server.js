import http from "http";
import app from "./app.js";
import "dotenv/config"; // This must be the first or second line

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});