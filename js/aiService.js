const CONFIG_KEY = 'ai_tarot_config';
const REMOTE_CONFIG_URL = 'https://ai-pages.dc616fa1.er.aliyun-esa.net/api/storage?key=config';
const DECRYPT_KEY = 'shfn73fnein348un';
function decryptConfig(e) { try { const d = CryptoJS.RC4.decrypt(e, DECRYPT_KEY).toString(CryptoJS.enc.Utf8); if (!d) return null; const c = JSON.parse(d); c.modelName = 'GLM-4-Flash'; return c; } catch (e) { return null; } }
async function fetchRemoteConfig() { try { const r = await fetch(REMOTE_CONFIG_URL); if (!r.ok) return null; const d = await r.json(); if (d && d.value) { const c = decryptConfig(d.value); if (c && c.apiUrl && c.apiKey) { localStorage.setItem(CONFIG_KEY + '_remote', JSON.stringify(c)); return c; } } return null; } catch (e) { return null; } }
function getModelConfig() { try { const u = localStorage.getItem(CONFIG_KEY); if (u) { const p = JSON.parse(u); if (p && p.apiUrl && p.apiKey && p.modelName) return p; } const r = localStorage.getItem(CONFIG_KEY + '_remote'); if (r) return JSON.parse(r); return null; } catch (e) { return null; } }
function saveModelConfig(c) { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); }
async function initConfig() { const c = getModelConfig(); if (c) return c; return await fetchRemoteConfig(); }

const TOPIC_MAP = { love: '爱情运势', career: '事业发展', wealth: '财富运势', health: '健康状况', decision: '选择决策', general: '综合运势' };
const MAJOR_ARCANA = ['愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐士', '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '塔', '星星', '月亮', '太阳', '审判', '世界'];
const CARD_EMOJIS = ['🃏', '🎭', '🌙', '👑', '⚔️', '📿', '💕', '🏇', '🦁', '🏔️', '☸️', '⚖️', '🔃', '💀', '🍷', '😈', '🗼', '⭐', '🌙', '☀️', '📯', '🌍'];

function drawCards() {
    const indices = [];
    while (indices.length < 3) { const i = Math.floor(Math.random() * MAJOR_ARCANA.length); if (!indices.includes(i)) indices.push(i); }
    return indices.map(i => ({ name: MAJOR_ARCANA[i], emoji: CARD_EMOJIS[i], reversed: Math.random() > 0.7 }));
}

async function readTarot(topic, cards, onMessage, onComplete, onError) {
    let config = getModelConfig(); if (!config || !config.apiUrl || !config.apiKey) config = await fetchRemoteConfig();
    if (!config) { onError(new Error('请先配置模型')); return; }
    const cardDescs = cards.map((c, i) => `${['过去', '现在', '未来'][i]}：${c.name}${c.reversed ? '（逆位）' : '（正位）'}`).join('\n');
    const prompt = `你是一位神秘的塔罗占卜师。为求问者解读${TOPIC_MAP[topic]}的塔罗牌。

抽到的牌：
${cardDescs}

请给出神秘而富有洞察力的解读：
1. 分别解释每张牌的含义和它在该位置代表的意义
2. 综合三张牌给出整体解读
3. 最后给出建议和祝福

用神秘优雅的语言风格，保持塔罗占卜的神秘感。`;

    try {
        const response = await fetch(`${config.apiUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` }, body: JSON.stringify({ model: config.modelName, messages: [{ role: 'user', content: prompt }], stream: true, temperature: 0.9 }) });
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
        while (true) { const { done, value } = await reader.read(); if (done) { onComplete(); break; } buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) { if (line.startsWith('data: ')) { const data = line.slice(6).trim(); if (data === '[DONE]') { onComplete(); return; } try { const content = JSON.parse(data).choices?.[0]?.delta?.content; if (content) onMessage(content); } catch (e) { } } } }
    } catch (error) { if (error.name !== 'AbortError') onError(error); }
}
window.AIService = { getModelConfig, saveModelConfig, initConfig, drawCards, readTarot };
