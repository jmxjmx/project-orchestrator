const http = require("node:http");
const fs = require("node:fs");

const server = http.createServer((request, response) => {
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(fs.readFileSync("index.html", "utf8"));
});

server.listen(0, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${server.address().port}`);
});
