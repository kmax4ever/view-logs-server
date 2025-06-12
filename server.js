const express = require("express");
const pm2 = require("pm2");

const app = express();
const PORT = 3001;

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

app.listen(PORT, () => {
  console.log(`API đang chạy tại ${PORT}`);
});
