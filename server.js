const express = require('express');
const path = require('path');
const app = express();

// Sử dụng path.join để định vị chính xác thư mục chứa file tĩnh trên Vercel
app.use(express.static(path.join(__dirname, './')));

// Định tuyến trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Hỗ trợ chạy cả dưới máy local (cổng 3000)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    });
}

module.exports = app;
