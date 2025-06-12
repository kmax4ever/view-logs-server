const express = require("express");
const pm2 = require("pm2");
const app = express();
const PORT = 3001;
const fs = require("fs");
const { spawn } = require("child_process");
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/pm2/list", (req, res) => {
  pm2.connect((err) => {
    if (err) {
      return res.status(500).json({ error: "Cannot connect to PM2" });
    }

    pm2.list((err, list) => {
      pm2.disconnect(); // Disconnect after getting the list
      if (err) {
        return res.status(500).json({ error: "Error getting PM2 list" });
      }

      res.json(list);
    });
  });
});

app.get("/viewLogs", (req, res) => {
  const appName = req.query.name;
  if (!appName) return res.status(400).send("Missing application name");
  const logPath = "/root/.pm2/logs/" + appName + "-out.log";

  if (!fs.existsSync(logPath)) {
    return res.status(404).send(`Log not found for app "${appName}"`);
  }

  const tail = spawn("tail", ["-n", "100", "-f", logPath]); // <- realtime

  res.setHeader("Content-Type", "text/plain");

  tail.stdout.pipe(res);

  req.on("close", () => {
    tail.kill(); // cleanup process when client disconnects
  });
});

app.get("/pm2/stop", (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).send("Missing application name");

  pm2.connect(() => {
    pm2.stop(name, (err) => {
      pm2.disconnect();
      if (err) return res.status(500).send("❌ Stop failed: " + err.message);
      res.send(`Application "${name}" has been stopped.`);
    });
  });
});

app.get("/pm2/restart", (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).send("Missing application name");

  pm2.connect(() => {
    pm2.restart(name, (err) => {
      pm2.disconnect();
      if (err) return res.status(500).send("❌ Restart failed: " + err.message);
      res.send(`Application "${name}" has been restarted.`);
    });
  });
});

app.listen(PORT, () => {
  console.log(`API running at ${PORT}`);
});
