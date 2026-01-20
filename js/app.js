const DOM = {};
let currentTopic = '', currentCards = [], readingText = '';

function initDOM() { DOM.questionPanel = document.getElementById('question-panel'); DOM.drawPanel = document.getElementById('draw-panel'); DOM.resultPanel = document.getElementById('result-panel'); DOM.readingContent = document.getElementById('reading-content'); DOM.settingsModal = document.getElementById('settings-modal'); DOM.toast = document.getElementById('toast'); }

function initEvents() {
    document.querySelectorAll('.topic-btn').forEach(btn => btn.addEventListener('click', () => { currentTopic = btn.dataset.topic; DOM.questionPanel.classList.add('hidden'); DOM.drawPanel.classList.remove('hidden'); }));
    document.getElementById('btn-draw').addEventListener('click', drawCards);
    document.getElementById('btn-restart').addEventListener('click', restart);
    document.getElementById('btn-settings').addEventListener('click', () => { DOM.settingsModal.classList.add('show'); loadSettings(); });
    document.getElementById('btn-close-settings').addEventListener('click', () => DOM.settingsModal.classList.remove('show'));
    document.getElementById('btn-cancel-settings').addEventListener('click', () => DOM.settingsModal.classList.remove('show'));
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
}

async function drawCards() {
    currentCards = AIService.drawCards();
    DOM.drawPanel.classList.add('hidden');
    DOM.resultPanel.classList.remove('hidden');

    // 显示卡牌
    currentCards.forEach((card, i) => {
        const el = document.getElementById(`card-${i + 1}`);
        el.textContent = card.emoji;
        el.title = card.name + (card.reversed ? '（逆位）' : '（正位）');
        if (card.reversed) el.style.transform = 'rotate(180deg)';
    });

    DOM.readingContent.innerHTML = '<p class="text-purple-300 animate-pulse text-center">🔮 命运之轮正在转动...</p>';
    readingText = '';

    await AIService.readTarot(currentTopic, currentCards,
        (t) => { readingText += t; DOM.readingContent.innerHTML = formatReading(readingText); },
        () => { showToast('success', '解读完成', '愿命运眷顾你'); },
        (e) => { DOM.readingContent.innerHTML = `<p class="text-red-300">解读失败: ${e.message}</p>`; }
    );
}

function formatReading(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-400">$1</strong>')
        .replace(/\n/g, '<br>');
}

function restart() {
    DOM.resultPanel.classList.add('hidden');
    DOM.drawPanel.classList.add('hidden');
    DOM.questionPanel.classList.remove('hidden');
    document.querySelectorAll('[id^="card-"]').forEach(el => { el.textContent = ''; el.style.transform = ''; });
}

function loadSettings() { const c = AIService.getModelConfig() || {}; document.getElementById('api-url').value = c.apiUrl || ''; document.getElementById('api-key').value = c.apiKey || ''; document.getElementById('model-name').value = c.modelName || ''; }
function saveSettings() { const c = { apiUrl: document.getElementById('api-url').value.trim(), apiKey: document.getElementById('api-key').value.trim(), modelName: document.getElementById('model-name').value.trim() || 'GLM-4-Flash' }; if (!c.apiUrl || !c.apiKey) { showToast('warning', '请填写完整', ''); return; } AIService.saveModelConfig(c); DOM.settingsModal.classList.remove('show'); showToast('success', '配置已保存', ''); }
function showToast(type, title, message) { const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }; const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-purple-500' }; document.getElementById('toast-icon').className = `w-8 h-8 rounded-full flex items-center justify-center ${colors[type]}`; document.getElementById('toast-icon').textContent = icons[type]; document.getElementById('toast-title').textContent = title; document.getElementById('toast-message').textContent = message; DOM.toast.classList.remove('hidden'); setTimeout(() => DOM.toast.classList.add('hidden'), 3000); }

async function init() { initDOM(); initEvents(); await AIService.initConfig(); }
document.addEventListener('DOMContentLoaded', init);
