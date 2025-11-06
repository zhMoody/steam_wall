const API_BASE = "http://localhost:3000/api/games"
const API_KEY_STORAGE_KEY = 'steam_api_key'
const HISTORY_STORAGE_KEY = 'steam_id_history'

const steamIdInput = document.getElementById('steamid')
const apiKeyInput = document.getElementById('api-key-input')
const grid = document.getElementById("grid")
const messageContainer = document.getElementById("message-container")
const downloadBtn = document.getElementById('download-btn')
const historyContainer = document.getElementById('history-container')

document.addEventListener('DOMContentLoaded', () => {
    loadApiKey()
    renderHistory()
    downloadBtn.addEventListener('click', downloadImage)
})

function saveApiKey() {
    const apiKey = apiKeyInput.value.trim()
    if (apiKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
        alert('API Key 已保存！')
    } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY)
        alert('API Key 已清除！')
    }
}

function loadApiKey() {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (savedKey) {
        apiKeyInput.value = savedKey
    }
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || []
    historyContainer.innerHTML = ''
    if (history.length > 0) {
        historyContainer.innerHTML += '<span>历史记录: </span>'
    }
    history.forEach(id => {
        const btn = document.createElement('button')
        btn.textContent = id
        btn.onclick = () => {
            steamIdInput.value = id
            loadGames()
        }
        historyContainer.appendChild(btn)
    })
}

function addToHistory(steamId) {
    let history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || []
    history = history.filter(id => id !== steamId)
    history.unshift(steamId)
    history = history.slice(0, 10)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    renderHistory()
}

async function downloadImage() {
    downloadBtn.textContent = '生成中...'
    downloadBtn.disabled = true
    grid.classList.add('grid--capturing')

    try {
        const canvas = await html2canvas(grid, {
            useCORS: true,
            backgroundColor: '#1b2838',
            logging: false
        })
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = `steam-wall-${steamIdInput.value}.png`
        link.click()
    } catch (error) {
        console.error('生成图片失败:', error)
        alert('生成图片失败，详情请查看控制台。')
    } finally {
        grid.classList.remove('grid--capturing')
        downloadBtn.textContent = '下载封面墙'
        downloadBtn.disabled = false
    }
}

async function loadGames() {
    const steamid = steamIdInput.value.trim()
    if (!steamid) {
        alert("请输入 SteamID64")
        return
    }

    downloadBtn.disabled = true
    grid.classList.add('hidden')
    messageContainer.classList.remove('hidden')
    messageContainer.innerHTML = '<p class="message-text">正在从云端获取游戏库...</p>'

    try {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
        let requestUrl = `${API_BASE}/${steamid}`
        if (apiKey) {
            requestUrl += `?key=${apiKey}`
        }

        const res = await fetch(requestUrl)
        if (!res.ok) {
            throw new Error(`API 请求失败 (状态: ${res.status})`)
        }

        const data = await res.json()
        const games = data.response?.games || []

        if (games.length === 0) {
            messageContainer.innerHTML = "<p class='message-text'>未能获取到游戏数据。<br>请检查 SteamID 或确保个人资料是公开的。</p>"
            return
        }

        addToHistory(steamid)
        downloadBtn.disabled = false

        messageContainer.classList.add('hidden')
        grid.classList.remove('hidden')
        grid.innerHTML = ""

        games.sort((a, b) => b.playtime_forever - a.playtime_forever)

        for (const g of games) {
            if (g.playtime_forever < 10) continue
            const playtimeHours = g.playtime_forever / 60
            let colSpan = 1, rowSpan = 1
            if (playtimeHours > 1000) {
                colSpan = 4
                rowSpan = 3
            } else if (playtimeHours > 500) {
                colSpan = 3
                rowSpan = 3
            } else if (playtimeHours > 200) {
                colSpan = 3
                rowSpan = 2
            } else if (playtimeHours > 100) {
                colSpan = 2
                rowSpan = 2
            } else if (playtimeHours > 40) {
                colSpan = 2
                rowSpan = 1
            }

            const div = document.createElement("div")
            div.className = "game"
            div.style.gridColumn = `span ${colSpan}`
            div.style.gridRow = `span ${rowSpan}`

            const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`
            div.style.backgroundImage = `url('${imageUrl}')`

            const overlay = document.createElement("div")
            overlay.className = "overlay"
            overlay.innerHTML = `<span class="playtime">${playtimeHours.toFixed(1)}h</span><span class="game-name">${g.name}</span>`

            div.appendChild(overlay)
            grid.appendChild(div)
        }
    } catch (error) {
        messageContainer.innerHTML = `<p class='message-text'>加载失败: ${error.message}<br><br>请检查后台服务或 API Key 是否正确，或查看浏览器控制台获取详细信息。</p>`
        console.error("加载游戏时出错:", error)
    }
}
