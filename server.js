// server.js
import express from "express";
import path from "path";

const app = express();
const PORT = 3000;
const DEFAULT_STEAM_KEY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

app.use(express.json());

// 跨域
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});
// API 路由 (侦探版)
app.get("/api/games/:steamid", async (req, res) => {
    const {steamid} = req.params;
    const userKey = req.query.key;
    const STEAM_KEY = userKey || DEFAULT_STEAM_KEY;

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`;

    try {
        console.log(`正在请求 Steam: ${steamid}`);

        // 1. 发起请求
        const r = await fetch(url);

        // 2. 先拿文本 (不直接 json()，防止报错)
        const rawText = await r.text();

        console.log("Steam 返回原始内容:", rawText);

        try {
            const data = JSON.parse(rawText);

            if (!r.ok) {
                return res.status(r.status).json({
                    error: `Steam API 报错 (${r.status})`,
                    details: data
                });
            }
            res.json(data);

        } catch (jsonError) {
            throw new Error(`无法解析 Steam 返回的数据: ${rawText.substring(0, 200)}...`);
        }

    } catch (e) {
        console.error("服务器内部错误:", e);
        res.status(500).json({
            error: "服务器处理失败",
            message: e.message
        });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`✅ 后台开启端口：http://localhost:${PORT}`));
}

export default app;
