const express = require('express');
const path = require('path');
const app = express();

// 1. Cấu hình phục vụ các file tĩnh (game.js, style.css, hình ảnh, mô hình 3D)
app.use(express.static(__dirname));

// 2. Định tuyến trang chủ để tải giao diện game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Cơ chế tự động nhận diện môi trường để chạy:
// Nếu chạy local dưới máy, sử dụng cổng 3000. Nếu chạy trên Vercel, xuất module ra ngoài.
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`[LOCAL] Server đang chạy tại: http://localhost:${PORT}`);
    });
}

// Xuất app để tương thích hoàn toàn với cấu hình Serverless của Vercel
module.exports = app;
