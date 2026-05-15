const express = require('express');
const path = require('path');
const app = express();

// Trỏ thẳng hệ thống phục vụ file tĩnh vào thư mục public theo chuẩn Vercel
app.use(express.static(path.join(__dirname, 'public')));

// Định tuyến chính xác đến file index.html nằm bên trong thư mục public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chạy thử dưới máy local (Cổng 3000)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    });
}

module.exports = app;
