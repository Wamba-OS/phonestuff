const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;

const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
};

http.createServer((req, res) => {
  const filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(data);
  });
}).listen(PORT, () => console.log("http://localhost:" + PORT));
