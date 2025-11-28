// server.js
import express from "express";

const app = express();
const PORT = 3000;

// 如果用户没设置自己的Key再用这个默认值
const DEFAULT_STEAM_KEY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 您的 Steam Web API 密钥

app.use(express.json());

// 跨域
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

// 代理 Steam API
app.get("/api/games/:steamid", async (req, res) => {
    const {steamid} = req.params;
    const userKey = req.query.key;
    const STEAM_KEY = userKey || DEFAULT_STEAM_KEY;

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`;

    try {
        const r = await fetch(url);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`✅ 后台开启端口：http://localhost:${PORT}`));
}

export default app;
