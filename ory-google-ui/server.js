const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/login", (_, res) =>
  res.sendFile(path.join(__dirname, "public/login.html")),
);
app.get("/register", (_, res) =>
  res.sendFile(path.join(__dirname, "public/register.html")),
);
app.listen(3000, () => console.log("UI running on http://127.0.0.1:3000"));
