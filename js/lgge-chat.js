(function() {
  'use strict';

  // System prompt
  const SYSTEM_PROMPT = "你是一个幽默的，为 OIer 服务的 AI 助手，名叫 General0000000826。请避免机械感。如果用户情绪低落，请给予鼓励；如果用户好奇，请激发探索欲，如果用户很强，请输出 %%% 或者 STO 表达对与用户的膜拜";

  // 检查marked库是否已加载，如果没有则加载
  if (typeof marked === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.umd.min.js ';
    script.onload = function() {
      initChat();
    };
    document.head.appendChild(script);
  } else {
    initChat();
  }

  function initChat() {
    // Create style element
    const style = document.createElement('style');
    style.textContent = `
      #chat-sidebar {
        position: fixed;
        left: 70px;
        top: 75px;
        width: 360px;
        height: 91%;
        background: rgba(22, 8, 36, 0.94);
        backdrop-filter: blur(14px);
        border-radius: 8px;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483647;
        font-family: 'Segoe UI', system-ui, sans-serif;
        border: 1px solid rgba(106, 13, 173, 0.35);
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #chat-sidebar:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 35px rgba(106, 13, 173, 0.4);
      }
      #selection-bar {
        padding: 8px 12px;
        background: rgba(106, 13, 173, 0.25);
        color: #e0d6ff;
        font-size: 13px;
        border-bottom: 1px solid rgba(106, 13, 173, 0.4);
        display: none;
        align-items: center;
        justify-content: space-between;
      }
      #selection-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 10px;
      }
      .action-btn {
        background: rgba(255, 255, 255, 0.15);
        color: #d9c2ff;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        margin-left: 4px;
        transition: background 0.2s;
      }
      .action-btn:hover {
        background: rgba(255, 255, 255, 0.25);
      }
      #chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chat-bubble {
        max-width: 88%;
        padding: 10px 14px;
        border-radius: 8px;
        line-height: 1.55;
        word-break: break-word;
        animation: fadeIn 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
        position: relative;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .user-bubble {
        align-self: flex-end;
        background: linear-gradient(135deg, #4a4a4a, #3a3a3a);
        color: white;
      }
      .bot-bubble {
        align-self: flex-start;
        background: linear-gradient(135deg, #2d2d2d, #222222);
        color: #f0f0f0;
      }
      #input-area {
        padding: 12px;
        border-top: 1px solid rgba(106, 13, 173, 0.3);
        display: flex;
        gap: 8px;
        background: rgba(0, 0, 0, 0.08);
      }
      #message-input {
        flex: 1;
        padding: 10px 12px;
        border: none;
        border-radius: 6px;
        background: rgba(40, 40, 40, 0.7);
        color: white;
        outline: none;
        font-size: 14px;
        transition: background 0.2s;
      }
      #message-input:focus {
        background: rgba(40, 40, 40, 0.95);
        box-shadow: 0 0 0 2px rgba(106, 13, 173, 0.4);
      }
      #send-button {
        background: linear-gradient(135deg, #6a0dad, #5a0d9d);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 16px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }
      #send-button:hover {
        background: linear-gradient(135deg, #7a1dbe, #6a0dad);
        transform: translateY(-1px);
      }
      .thinking {
        display: inline-block;
        width: 24px;
        height: 12px;
        margin-left: 6px;
      }
      .thinking span {
        display: inline-block;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #aaa;
        margin: 0 1.5px;
        animation: bounce 1.4s infinite ease-in-out;
      }
      .thinking span:nth-child(2) { animation-delay: 0.2s; }
      .thinking span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
    `;
    document.head.appendChild(style);

    // Create UI
    const sidebar = document.createElement('div');
    sidebar.id = 'chat-sidebar';
    sidebar.innerHTML = `
      <div id="chat-messages"></div>
      <div id="selection-bar">
        <div id="selection-text"></div>
        <div>
          <button class="action-btn" id="btn-summarize">总结</button>
          <button class="action-btn" id="btn-explain">解释</button>
        </div>
      </div>
      <div id="input-area">
        <input id="message-input" placeholder="有问必答，尽管问">
        <button id="send-button">发送</button>
      </div>
    `;
    document.body.appendChild(sidebar);

    // API Configuration
    const API_KEY = '7a731303e72744e287a21daa021eaa3f.fMYf7XN1zGJLrQqs';
    const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions ';
    const MODEL = 'glm-4.7-flash';
    let abortController = null;
    let currentRetryTimeout = null;
    let selectedText = '';

    // Add message to chat (with markdown)
    function addMessage(sender, content, isStreaming = false) {
      const messages = document.getElementById('chat-messages');
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${sender === 'user' ? 'user-bubble' : 'bot-bubble'}`;
      
      if (isStreaming) {
        bubble.textContent = content;
      } else {
        if (sender === 'bot') {
          bubble.innerHTML = marked.parse(content || '');
        } else {
          bubble.textContent = content;
        }
      }
      
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    // Show selection bar
    function showSelectionBar(text) {
      if (!text || !text.trim()) return;
      selectedText = text.trim();
      const selectionText = document.getElementById('selection-text');
      const selectionBar = document.getElementById('selection-bar');
      selectionText.textContent = `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`;
      selectionBar.style.display = 'flex';
      console.log('选中内容:', selectedText);
    }

    // Hide selection bar
    function hideSelectionBar() {
      document.getElementById('selection-bar').style.display = 'none';
      selectedText = '';
    }

    // Stream chat request with retry on 429
    async function streamRequest(fullPrompt, onChunk, onError) {
      abortController?.abort();
      abortController = new AbortController();

      const attempt = async () => {
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: MODEL,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: fullPrompt }
              ],
              stream: true,
              thinking: { type: "disabled" }
            }),
            signal: abortController.signal
          });

          if (response.status === 429) {
            throw new Error('429');
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith(' ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') return;

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) onChunk(content);
                } catch (e) { /* Ignore */ }
              }
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') return;
          if (error.message === '429') {
            onError('服务器繁忙，请稍等...');
            currentRetryTimeout = setTimeout(() => attempt(), 3000);
          } else {
            onError(`请求失败: ${error.message}`);
          }
        }
      };

      await attempt();
    }

    // Send message handler
    function sendMessage(userMessage) {
      if (!userMessage.trim()) return;

      // Clear any pending retry
      if (currentRetryTimeout) {
        clearTimeout(currentRetryTimeout);
        currentRetryTimeout = null;
      }

      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send-button');
      input.disabled = true;
      sendBtn.disabled = true;
      hideSelectionBar();

      addMessage('user', userMessage);
      const botMsg = addMessage('bot', '', true);
      botMsg.innerHTML = '<div class="thinking"><span></span><span></span><span></span></div>';

      streamRequest(
        userMessage,
        (chunk) => {
          botMsg.textContent += chunk;
          botMsg.scrollTop = botMsg.scrollHeight;
        },
        (errorMsg) => {
          // Only show error if not aborted
          if (!abortController?.signal.aborted) {
            botMsg.textContent = errorMsg;
          }
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
        }
      ).finally(() => {
        if (!abortController?.signal.aborted) {
          // Final render with markdown
          botMsg.innerHTML = marked.parse(botMsg.textContent);
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
        }
      });
    }

    // Add welcome message
    addMessage('bot', '欢迎使用 **洛谷仓库 GenGen Edition**！我是 **General0000000826**，基于 GLM 大模型 💜\n\n你可以问我任何问题，我会尽力用温暖、清晰的方式回答你～');

    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');

    // Input fix: ensure all characters can be typed
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
        input.value = '';
      }
    });

    sendBtn.onclick = () => {
      sendMessage(input.value);
      input.value = '';
    };

    // Selection handling - capture selection from entire document
    let isSelecting = false;
    
    document.addEventListener('mousedown', (e) => {
      isSelecting = true;
    });
    
    document.addEventListener('mouseup', (e) => {
      if (!isSelecting) return;
      isSelecting = false;
      
      // 延迟获取选中内容，确保selection已经更新
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) return;
        
        const selectionText = selection.toString();
        
        // 检查选中内容是否有效且不在sidebar内
        if (selectionText && selectionText.trim().length > 0) {
          // 检查选中的范围是否在sidebar内
          const range = selection.getRangeAt(0);
          const commonAncestor = range.commonAncestorContainer;
          const sidebarElement = document.getElementById('chat-sidebar');
          
          if (!sidebarElement.contains(commonAncestor)) {
            showSelectionBar(selectionText);
          } else {
            hideSelectionBar();
          }
        } else {
          hideSelectionBar();
        }
      }, 10);
    });

    // Action buttons
    document.getElementById('btn-summarize').onclick = () => {
      if (!selectedText || !selectedText.trim()) {
        hideSelectionBar();
        return;
      }
      const prompt = `请用中文简明总结以下内容：\n\n${selectedText}`;
      sendMessage(prompt);
      hideSelectionBar();
    };
    
    document.getElementById('btn-explain').onclick = () => {
      if (!selectedText || !selectedText.trim()) {
        hideSelectionBar();
        return;
      }
      const prompt = `请用通俗易懂的中文解释以下内容：\n\n${selectedText}`;
      sendMessage(prompt);
      hideSelectionBar();
    };

    // Click outside to hide selection bar
    document.addEventListener('click', (e) => {
      const sidebarElement = document.getElementById('chat-sidebar');
      if (!sidebarElement.contains(e.target) && e.target.id !== 'message-input') {
        hideSelectionBar();
      }
    });
    
    // 当输入框获得焦点时，隐藏selection bar
    input.addEventListener('focus', () => {
      hideSelectionBar();
    });
  }
})();
