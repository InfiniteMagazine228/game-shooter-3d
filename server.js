const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Phục vụ tất cả các file tĩnh trong thư mục hiện tại
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
