export default async function handler(req, res) {
    // Chỉ chấp nhận phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Lấy API Key từ biến môi trường của Vercel (sẽ cấu hình ở Bước 3)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel' });
    }

    try {
        // Gọi trực tiếp đến endpoint của Gemini API
        const response = await fetch(`https://googleapis.com{apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Bạn là một con quái vật trong game bắn súng 3D vừa bị người chơi bắn trúng. Hãy nói một câu cay cú, chửi thề hài hước hoặc thách thức người chơi ngắn gọn dưới 15 từ bằng tiếng Việt." }]
                }]
            })
        });

        const data = await response.json();
        const botReply = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({ reply: botReply.trim() });
    } catch (error) {
        return res.status(500).json({ error: 'Lỗi khi gọi Gemini API' });
    }
}
