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
      return res.status(500).json({ error: "Không thể kết nối PM2" });
    }

    pm2.list((err, list) => {
      pm2.disconnect(); // Ngắt kết nối sau khi lấy danh sách
      if (err) {
        return res.status(500).json({ error: "Lỗi khi lấy danh sách PM2" });
      }

      res.json(list);
    });
  });
});

app.get("/viewLogs", (req, res) => {
  const appName = req.query.name;
  if (!appName) return res.status(400).send("Thiếu tên ứng dụng");
  const logPath = "/root/.pm2/logs/" + appName + "-out.log";

  if (!fs.existsSync(logPath)) {
    return res.status(404).send(`Không tìm thấy log cho app "${appName}"`);
  }

  const tail = spawn("tail", ["-n", "100", "-f", logPath]); // <- realtime

  res.setHeader("Content-Type", "text/plain");

  tail.stdout.pipe(res);

  req.on("close", () => {
    tail.kill(); // dọn process khi client disconnect
  });
});

app.listen(PORT, () => {
  console.log(`API đang chạy tại ${PORT}`);
});
