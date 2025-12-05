/**
 * Datacivis WebChat SDK
 * Widget de chat embebible para sitios web
 * 
 * Uso:
 * <script src="datacivis.js?campaignId=TU_ID&serverUrl=TU_URL"></script>
 */

((d, l, w) => {
  'use strict'
  
  // ========== VARIABLES ==========
  let socket, chatData, chatIcon, chatContainer, messageArea, resizeHandle
  let minimizeButton, maximizeButton, closeButton, inputField, sendButton
  let fileInput, audioButton, fileButton, darkModeButton
  let mediaRecorder, audioChunks = [], audioStartTime = null
  let assistantName = 'Asistente', campaignName = 'Chat'
  let notificationAudio = null
  
  // ========== CONFIGURACIÓN ==========
  function _getScriptParams() {
    const scripts = d.getElementsByTagName('script')
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src
      if (src && src.includes('datacivis.js')) {
        try {
          const url = new URL(src, w.location.href)
          return {
            campaignId: url.searchParams.get('campaignId') || url.searchParams.get('id'),
            serverUrl: url.searchParams.get('serverUrl') || url.searchParams.get('server'),
            enableAudio: url.searchParams.get('audio'),
            enableSound: url.searchParams.get('sound')
          }
        } catch (e) {
          return {}
        }
      }
    }
    return {}
  }
  
  const scriptParams = _getScriptParams()
  const config = w.DATACIVIS_CONFIG || {}
  const campaignId = scriptParams.campaignId || config.campaignId || ''
  const serverUrl = scriptParams.serverUrl || config.serverUrl || 'http://localhost:9000/webchat'
  const enableAudio = scriptParams.enableAudio !== undefined 
    ? (scriptParams.enableAudio === true || scriptParams.enableAudio === 'true') 
    : (config.enableAudio === true)
  const enableFile = config.enableFile === true
  const enableSound = scriptParams.enableSound !== undefined
    ? (scriptParams.enableSound === true || scriptParams.enableSound === 'true')
    : (config.enableSound !== false) // Default: true
  
  if (!campaignId) {
    console.error('Datacivis: campaignId es requerido')
    return
  }

  // ========== HTML DEL WIDGET ==========
  function _generateWidgetHTML() {
    return `
      <div id="chatbot-container">
        <div id="datacivis-chat-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </div>
        <div id="datacivis-chat-container">
          <div id="datacivis-resize-handle"></div>
          <div class="datacivis-chat-header">
            <div class="datacivis-header-info">
              <div class="datacivis-chat-title" id="datacivis-chat-title">Chat</div>
              <div class="datacivis-chat-subtitle" id="datacivis-chat-subtitle"></div>
            </div>
            <div class="datacivis-header-buttons">
              <button id="datacivis-dark-mode-button" title="Modo oscuro" class="header-icon-btn">🌙</button>
              <button id="datacivis-minimize-button" title="Minimizar">−</button>
              <button id="datacivis-maximize-button" title="Maximizar">□</button>
              <button id="datacivis-close-button" title="Cerrar">×</button>
            </div>
          </div>
          <div id="datacivis-message-area">
            <div id="datacivis-loader" style="display: none;">
              <div class="loader-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
          <div class="datacivis-input-area">
            ${enableFile ? '<button id="datacivis-file-button" class="input-action-btn" title="Adjuntar archivo">📎</button>' : ''}
            ${enableAudio ? '<button id="datacivis-audio-button" class="input-action-btn" title="Grabar audio">🎤</button>' : ''}
            <input type="text" id="datacivis-input-field" placeholder="Escribe un mensaje...">
            <button id="datacivis-send-button">→</button>
            <input type="file" id="datacivis-file-input" style="display: none !important;" accept="*/*" multiple>
          </div>
          ${enableAudio ? '<div id="datacivis-audio-recorder" style="display: none;" class="audio-recorder"><div class="audio-recorder-content"><div class="audio-recorder-status"><span class="recording-dot"></span><span id="audio-recorder-time">00:00</span></div><button id="audio-recorder-stop" class="audio-recorder-btn stop">✓</button><button id="audio-recorder-cancel" class="audio-recorder-btn cancel">✕</button></div></div>' : ''}
          ${enableFile ? '<div id="datacivis-file-preview" style="display: none;" class="file-preview-container"></div>' : ''}
        </div>
      </div>
    `
  }

  // ========== CSS DEL WIDGET ==========
  function _generateWidgetCSS() {
    return `
      <style id="datacivis-style">
        #datacivis-chat-icon {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4), 0 0 0 0 rgba(99, 102, 241, 0.5);
          z-index: 9999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #datacivis-chat-icon:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5), 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        #datacivis-chat-icon:active {
          transform: scale(0.95);
        }
        #datacivis-chat-icon svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        #datacivis-chat-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 380px;
          height: 520px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          display: none;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .datacivis-chat-header {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .datacivis-header-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .datacivis-chat-title {
          font-weight: 600;
          font-size: 16px;
          line-height: 1.2;
        }
        .datacivis-chat-subtitle {
          font-size: 12px;
          opacity: 0.9;
          font-weight: 400;
        }
        .datacivis-header-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .datacivis-header-buttons button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-icon-btn {
          font-size: 16px !important;
        }
        .datacivis-header-buttons button:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        .datacivis-header-buttons button:active {
          transform: scale(0.95);
        }
        #datacivis-message-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
        }
        #datacivis-message-area::-webkit-scrollbar {
          width: 6px;
        }
        #datacivis-message-area::-webkit-scrollbar-track {
          background: transparent;
        }
        #datacivis-message-area::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        #datacivis-message-area::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        #datacivis-message-area.drag-over {
          background: rgba(99, 102, 241, 0.1);
          border: 2px dashed #6366f1;
        }
        .file-preview-container {
          position: absolute;
          bottom: 80px;
          left: 16px;
          right: 16px;
          z-index: 100;
        }
        .file-preview-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
        }
        .file-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        .file-preview-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .file-preview-close:hover {
          background: rgba(255,255,255,0.3);
        }
        .file-preview-image {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          background: #f9fafb;
        }
        .file-preview-info {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
        }
        .file-preview-name {
          font-weight: 600;
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .file-preview-size {
          font-size: 12px;
          color: #6b7280;
        }
        .file-preview-send {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .file-preview-send:hover {
          opacity: 0.9;
        }
        .datacivis-message-bubble {
          padding: 12px 16px;
          border-radius: 20px 20px 4px 20px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          margin-bottom: 10px;
          max-width: 75%;
          margin-left: auto;
          word-wrap: break-word;
          line-height: 1.5;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
          animation: messageSlideIn 0.3s ease-out;
        }
        .datacivis-message-response {
          padding: 12px 16px;
          border-radius: 20px 20px 20px 4px;
          background: white;
          color: #374151;
          margin-bottom: 10px;
          max-width: 75%;
          border: 1px solid #e5e7eb;
          word-wrap: break-word;
          line-height: 1.5;
          font-size: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          animation: messageSlideIn 0.3s ease-out;
        }
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .audio-message-container {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 200px;
          max-width: 280px;
        }
        .audio-controls-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        .datacivis-message-response .audio-controls-wrapper {
          background: rgba(0, 0, 0, 0.05);
        }
        .audio-play-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .audio-play-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }
        .audio-play-btn.playing {
          background: rgba(255, 255, 255, 0.3);
        }
        .datacivis-message-response .audio-play-btn {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }
        .datacivis-message-response .audio-play-btn:hover {
          background: rgba(99, 102, 241, 0.2);
        }
        .datacivis-message-response .audio-play-btn.playing {
          background: rgba(99, 102, 241, 0.2);
        }
        .audio-progress-container {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .datacivis-message-response .audio-progress-container {
          background: rgba(0, 0, 0, 0.1);
        }
        .audio-progress-bar {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .audio-progress-fill {
          height: 100%;
          background: white;
          border-radius: 2px;
          transition: width 0.1s linear;
          width: 0%;
        }
        .datacivis-message-response .audio-progress-fill {
          background: #6366f1;
        }
        .audio-time-display {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          white-space: nowrap;
          min-width: 60px;
          text-align: right;
        }
        .datacivis-message-response .audio-time-display {
          color: #6b7280;
        }
        .audio-message-container audio {
          display: none;
        }
        .file-message-container {
          min-width: 200px;
          max-width: 280px;
        }
        .file-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        .datacivis-message-response .file-wrapper {
          background: rgba(0, 0, 0, 0.05);
        }
        .file-icon-container {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          font-size: 24px;
          flex-shrink: 0;
        }
        .datacivis-message-response .file-icon-container {
          background: rgba(99, 102, 241, 0.1);
        }
        .file-details {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .file-name {
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }
        .file-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          opacity: 0.8;
        }
        .file-size {
          font-weight: 500;
        }
        .file-type {
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .datacivis-message-response .file-type {
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
        }
        #datacivis-loader {
          display: flex;
          align-items: center;
          padding: 10px 0;
        }
        .loader-dots {
          display: flex;
          gap: 4px;
        }
        .loader-dots span {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .loader-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loader-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        .datacivis-input-area {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .input-action-btn {
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-action-btn:hover {
          opacity: 1;
          background: rgba(99, 102, 241, 0.1);
          transform: scale(1.1);
        }
        .input-action-btn:active {
          transform: scale(0.95);
        }
        .input-action-btn.recording {
          opacity: 1;
          background: rgba(239, 68, 68, 0.2);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .audio-recorder {
          position: absolute;
          bottom: 80px;
          left: 16px;
          right: 16px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          padding: 16px;
          z-index: 100;
          animation: slideUp 0.2s ease-out;
        }
        .audio-recorder-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .audio-recorder-status {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .recording-dot {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        #audio-recorder-time {
          font-weight: 600;
          color: #374151;
        }
        .audio-recorder-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .audio-recorder-btn.stop {
          background: #10b981;
          color: white;
        }
        .audio-recorder-btn.cancel {
          background: #e5e7eb;
          color: #374151;
        }
        .audio-recorder-btn:hover {
          transform: scale(1.1);
        }
        #datacivis-input-field {
          flex: 1;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          background: white;
        }
        #datacivis-input-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        #datacivis-file-input {
          display: none !important;
          visibility: hidden !important;
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        #datacivis-send-button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #datacivis-send-button:hover {
          transform: scale(1.1) translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        #datacivis-send-button:active {
          transform: scale(0.95);
        }
        #datacivis-resize-handle {
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          cursor: nw-resize;
        }
        #datacivis-chat-container.datacivis-maximized {
          width: 100vw !important;
          height: 100vh !important;
          bottom: 0 !important;
          right: 0 !important;
          border-radius: 0;
        }
        /* Dark Mode */
        #datacivis-chat-container.datacivis-dark {
          background: #1f2937;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
        }
        #datacivis-chat-container.datacivis-dark #datacivis-message-area {
          background: #111827;
        }
        #datacivis-chat-container.datacivis-dark #datacivis-message-area::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
        }
        #datacivis-chat-container.datacivis-dark #datacivis-message-area::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
        #datacivis-chat-container.datacivis-dark .datacivis-message-response {
          background: #374151;
          color: #f3f4f6;
          border-color: #4b5563;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        #datacivis-chat-container.datacivis-dark .datacivis-input-area {
          background: #1f2937;
          border-top-color: #374151;
        }
        #datacivis-chat-container.datacivis-dark #datacivis-input-field {
          background: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        #datacivis-chat-container.datacivis-dark #datacivis-input-field::placeholder {
          color: #9ca3af;
        }
        #datacivis-chat-container.datacivis-dark .input-action-btn {
          color: #9ca3af;
        }
        #datacivis-chat-container.datacivis-dark .input-action-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
        }
        #datacivis-chat-container.datacivis-dark .audio-recorder {
          background: #374151;
          color: #f3f4f6;
        }
        #datacivis-chat-container.datacivis-dark #audio-recorder-time {
          color: #f3f4f6;
        }
        #datacivis-chat-container.datacivis-dark .audio-recorder-btn.cancel {
          background: #4b5563;
          color: #f3f4f6;
        }
        #datacivis-chat-container.datacivis-dark .audio-controls-wrapper {
          background: rgba(255, 255, 255, 0.05);
        }
        #datacivis-chat-container.datacivis-dark .datacivis-message-response .audio-controls-wrapper {
          background: rgba(255, 255, 255, 0.1);
        }
        #datacivis-chat-container.datacivis-dark .audio-time-display {
          color: rgba(255, 255, 255, 0.7);
        }
        #datacivis-chat-container.datacivis-dark .datacivis-message-response .audio-time-display {
          color: #d1d5db;
        }
        #datacivis-chat-container.datacivis-dark .file-wrapper {
          background: rgba(255, 255, 255, 0.05);
        }
        #datacivis-chat-container.datacivis-dark .datacivis-message-response .file-wrapper {
          background: rgba(255, 255, 255, 0.1);
        }
        #datacivis-chat-container.datacivis-dark .file-icon-container {
          background: rgba(255, 255, 255, 0.1);
        }
        #datacivis-chat-container.datacivis-dark .datacivis-message-response .file-icon-container {
          background: rgba(99, 102, 241, 0.2);
        }
        #datacivis-chat-container.datacivis-dark .file-name {
          color: #f3f4f6;
        }
        #datacivis-chat-container.datacivis-dark .file-meta {
          color: #d1d5db;
        }
        #datacivis-chat-container.datacivis-dark .file-type {
          background: rgba(255, 255, 255, 0.15);
          color: #e5e7eb;
        }
        #datacivis-chat-container.datacivis-dark .datacivis-message-response .file-type {
          background: rgba(99, 102, 241, 0.25);
          color: #a5b4fc;
        }
        #datacivis-chat-container.datacivis-dark #datacivis-message-area.drag-over {
          background: rgba(99, 102, 241, 0.2);
          border-color: #8b5cf6;
        }
        #datacivis-chat-container.datacivis-dark .file-preview-content {
          background: #374151;
        }
        #datacivis-chat-container.datacivis-dark .file-preview-image {
          background: #1f2937;
        }
        #datacivis-chat-container.datacivis-dark .file-preview-info {
          border-top-color: #4b5563;
        }
        #datacivis-chat-container.datacivis-dark .file-preview-name {
          color: #f3f4f6;
        }
        #datacivis-chat-container.datacivis-dark .file-preview-size {
          color: #d1d5db;
        }
      </style>
    `
  }

  // ========== RENDERIZADO ==========
  function _renderWidget() {
    if (d.getElementById('chatbot-container')) return
    
    d.head.insertAdjacentHTML('beforeend', _generateWidgetCSS())
    d.body.insertAdjacentHTML('beforeend', _generateWidgetHTML())
    _getFunctionalities()
    _initNotificationSound()
  }

  // ========== FUNCIONALIDADES ==========
  function _getFunctionalities() {
    chatIcon = d.getElementById('datacivis-chat-icon')
    chatContainer = d.getElementById('datacivis-chat-container')
    messageArea = d.getElementById('datacivis-message-area')
    resizeHandle = d.getElementById('datacivis-resize-handle')
    minimizeButton = d.getElementById('datacivis-minimize-button')
    maximizeButton = d.getElementById('datacivis-maximize-button')
    closeButton = d.getElementById('datacivis-close-button')
    inputField = d.getElementById('datacivis-input-field')
    sendButton = d.getElementById('datacivis-send-button')
    fileInput = d.getElementById('datacivis-file-input')
    fileButton = d.getElementById('datacivis-file-button')
    audioButton = d.getElementById('datacivis-audio-button')
    darkModeButton = d.getElementById('datacivis-dark-mode-button')
    chatData = _getChatData()

    _setOldMessages()
    _setListenerChatIcon()
    _setResizeHandle()
    _setMinimizeButton()
    _setMaximizeButton()
    _setCloseButton()
    _setInputField()
    _setSendButton()
    _setDarkModeButton()
    if (enableFile && fileButton && fileInput) {
      _setFileButton()
    }
    if (enableAudio && audioButton) {
      _setAudioButton()
    }
  }

  // ========== DATOS ==========
  function _getChatData() {
    const storageKey = `datacivisChat_${campaignId}`
    chatData = JSON.parse(l.getItem(storageKey)) || null
    if(!chatData) {
      let chatId = 'user-' + Date.now()
      chatData = {
        id: chatId,
        campaignId: campaignId,
        messages: []
      }
      l.setItem(storageKey, JSON.stringify(chatData))
    }
    return chatData
  }

  function _saveChatData() {
    const storageKey = `datacivisChat_${campaignId}`
    l.setItem(storageKey, JSON.stringify(chatData))
  }

  // ========== SONIDO DE NOTIFICACIÓN ==========
  function _initNotificationSound() {
    if (!enableSound) return
    
    try {
      // Preparar el contexto de audio (no reproducir nada aún)
      // Esto ayuda a "desbloquear" el audio en algunos navegadores
      const audioContext = new (w.AudioContext || w.webkitAudioContext)()
      notificationAudio = audioContext
      
      // Intentar reanudar el contexto si está suspendido
      // (algunos navegadores requieren interacción del usuario primero)
      if (audioContext.state === 'suspended') {
        // Intentar reanudar cuando el usuario interactúe
        const resumeAudio = () => {
          if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('Datacivis: Contexto de audio reanudado')
            }).catch((e) => {
              console.warn('Datacivis: No se pudo reanudar el contexto de audio', e)
            })
          }
          d.removeEventListener('click', resumeAudio)
          d.removeEventListener('touchstart', resumeAudio)
        }
        d.addEventListener('click', resumeAudio, { once: true })
        d.addEventListener('touchstart', resumeAudio, { once: true })
      }
    } catch (e) {
      console.warn('Datacivis: No se pudo inicializar el sonido de notificación', e)
    }
  }

  function _playNotificationSound() {
    console.log('Datacivis: _playNotificationSound llamado, enableSound:', enableSound)
    if (!enableSound) {
      console.log('Datacivis: Sonido deshabilitado, no se reproduce')
      return
    }
    
    // Reproducir sonido cuando llega un mensaje
    _playSound()
  }

  function _playSound() {
    if (!enableSound) {
      console.log('Datacivis: Sonido deshabilitado')
      return
    }
    
    console.log('Datacivis: Intentando reproducir sonido...')
    
    try {
      let audioContext = notificationAudio
      
      // Si no hay contexto, crear uno nuevo
      if (!audioContext) {
        console.log('Datacivis: Creando nuevo contexto de audio')
        audioContext = new (w.AudioContext || w.webkitAudioContext)()
        notificationAudio = audioContext
      }
      
      console.log('Datacivis: Estado del contexto:', audioContext.state)
      
      // Si el contexto está suspendido (por políticas del navegador), reanudarlo
      if (audioContext.state === 'suspended') {
        console.log('Datacivis: Contexto suspendido, intentando reanudar...')
        audioContext.resume().then(() => {
          console.log('Datacivis: Contexto reanudado, reproduciendo sonido')
          _playSoundInternal(audioContext)
        }).catch((e) => {
          console.error('Datacivis: No se pudo reanudar el contexto de audio', e)
        })
        return
      }
      
      _playSoundInternal(audioContext)
    } catch (e) {
      console.error('Datacivis: Error al reproducir sonido', e)
    }
  }

  function _playSoundInternal(audioContext) {
    try {
      console.log('Datacivis: Reproduciendo sonido interno...')
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Sonido de notificación más audible (dos tonos)
      oscillator.type = 'sine'
      const now = audioContext.currentTime
      
      // Primer tono: 800Hz por 0.15s
      oscillator.frequency.setValueAtTime(800, now)
      // Segundo tono: 600Hz por 0.15s
      oscillator.frequency.setValueAtTime(600, now + 0.15)
      
      // Envelope de volumen: más audible
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(1.0, now + 0.005)
      gainNode.gain.setValueAtTime(1.0, now + 0.1)
      gainNode.gain.setValueAtTime(1.0, now + 0.2)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      
      oscillator.start(now)
      oscillator.stop(now + 0.3)
      
      console.log('Datacivis: Sonido iniciado')
    } catch (e) {
      console.error('Datacivis: Error al reproducir sonido interno', e)
    }
  }

  // ========== MENSAJES ==========
  function _setOldMessages() {
    chatData.messages.forEach(function(msg) {
      if (msg.type === 'audio') {
        // Para audios guardados, mostrar solo el texto (los blobs no persisten)
        // Si hay audioUrl y es válido, intentar usarlo
        if (msg.audioUrl && msg.audioUrl.startsWith('blob:')) {
          // Blob URL ya no es válida después de recargar, mostrar solo texto
          _addMessage(msg.data, msg.origin === 'client', 'text')
        } else if (msg.audioUrl && msg.audioUrl.startsWith('data:')) {
          // Base64 data URL sí persiste
          _addMessage(msg.data, msg.origin === 'client', 'audio', msg.audioUrl)
        } else {
          _addMessage(msg.data, msg.origin === 'client', 'text')
        }
      } else if (msg.type === 'file' && msg.fileData) {
        _addMessage(msg.data, msg.origin === 'client', 'file', null, msg.fileData)
      } else {
        _addMessage(msg.data, msg.origin === 'client', msg.type || 'text')
      }
    })
  }

  function _addMessage(text, isUser, type = 'text', audioData = null, fileData = null) {
    const messageBubble = d.createElement('div')
    messageBubble.className = isUser ? 'datacivis-message-bubble' : 'datacivis-message-response'
    
    if (type === 'file' && fileData) {
      // Crear visualización de archivo mejorada
      const fileContainer = d.createElement('div')
      fileContainer.className = 'file-message-container'
      
      const fileWrapper = d.createElement('div')
      fileWrapper.className = 'file-wrapper'
      
      const fileIconContainer = d.createElement('div')
      fileIconContainer.className = 'file-icon-container'
      fileIconContainer.innerHTML = _getFileIcon(fileData.type || '')
      
      const fileDetails = d.createElement('div')
      fileDetails.className = 'file-details'
      
      const fileName = d.createElement('div')
      fileName.className = 'file-name'
      fileName.textContent = fileData.name
      fileName.title = fileData.name
      
      const fileMeta = d.createElement('div')
      fileMeta.className = 'file-meta'
      fileMeta.innerHTML = `<span class="file-size">${_formatFileSize(fileData.size)}</span> <span class="file-type">${_getFileTypeLabel(fileData.type || '')}</span>`
      
      fileDetails.appendChild(fileName)
      fileDetails.appendChild(fileMeta)
      
      fileWrapper.appendChild(fileIconContainer)
      fileWrapper.appendChild(fileDetails)
      
      fileContainer.appendChild(fileWrapper)
      messageBubble.appendChild(fileContainer)
    } else if (type === 'audio' && audioData) {
      // Crear reproductor de audio personalizado
      const audioContainer = d.createElement('div')
      audioContainer.className = 'audio-message-container'
      
      const audioPlayer = d.createElement('audio')
      audioPlayer.preload = 'metadata'
      
      // Si audioData es un blob, crear URL
      if (audioData instanceof Blob) {
        audioPlayer.src = URL.createObjectURL(audioData)
      } else if (typeof audioData === 'string') {
        audioPlayer.src = audioData
      }
      
      // Controles personalizados
      const controlsWrapper = d.createElement('div')
      controlsWrapper.className = 'audio-controls-wrapper'
      
      const playButton = d.createElement('button')
      playButton.className = 'audio-play-btn'
      playButton.innerHTML = '▶'
      playButton.setAttribute('aria-label', 'Reproducir')
      
      const progressContainer = d.createElement('div')
      progressContainer.className = 'audio-progress-container'
      
      const progressBar = d.createElement('div')
      progressBar.className = 'audio-progress-bar'
      
      const progressFill = d.createElement('div')
      progressFill.className = 'audio-progress-fill'
      
      progressBar.appendChild(progressFill)
      progressContainer.appendChild(progressBar)
      
      const timeDisplay = d.createElement('div')
      timeDisplay.className = 'audio-time-display'
      timeDisplay.textContent = '0:00'
      
      controlsWrapper.appendChild(playButton)
      controlsWrapper.appendChild(progressContainer)
      controlsWrapper.appendChild(timeDisplay)
      
      audioContainer.appendChild(controlsWrapper)
      audioContainer.appendChild(audioPlayer)
      messageBubble.appendChild(audioContainer)
      
      // Funcionalidad del reproductor
      let isPlaying = false
      
      playButton.addEventListener('click', function() {
        if (isPlaying) {
          audioPlayer.pause()
        } else {
          audioPlayer.play()
        }
      })
      
      audioPlayer.addEventListener('play', function() {
        isPlaying = true
        playButton.innerHTML = '⏸'
        playButton.classList.add('playing')
      })
      
      audioPlayer.addEventListener('pause', function() {
        isPlaying = false
        playButton.innerHTML = '▶'
        playButton.classList.remove('playing')
      })
      
      audioPlayer.addEventListener('timeupdate', function() {
        const current = audioPlayer.currentTime
        const duration = audioPlayer.duration || 0
        const percent = duration > 0 ? (current / duration) * 100 : 0
        progressFill.style.width = percent + '%'
        
        const currentMin = Math.floor(current / 60)
        const currentSec = Math.floor(current % 60)
        const durationMin = Math.floor(duration / 60)
        const durationSec = Math.floor(duration % 60)
        
        timeDisplay.textContent = `${currentMin}:${String(currentSec).padStart(2, '0')} / ${durationMin}:${String(durationSec).padStart(2, '0')}`
      })
      
      audioPlayer.addEventListener('loadedmetadata', function() {
        const duration = audioPlayer.duration || 0
        const durationMin = Math.floor(duration / 60)
        const durationSec = Math.floor(duration % 60)
        timeDisplay.textContent = `0:00 / ${durationMin}:${String(durationSec).padStart(2, '0')}`
      })
      
      progressBar.addEventListener('click', function(e) {
        const rect = progressBar.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        if (audioPlayer.duration) {
          audioPlayer.currentTime = percent * audioPlayer.duration
        }
      })
    } else {
      messageBubble.innerText = text
    }
    
    let loader = d.getElementById('datacivis-loader')
    if (loader && loader.parentNode === messageArea) {
      messageArea.insertBefore(messageBubble, loader)
    } else {
      messageArea.appendChild(messageBubble)
    }
    
    messageArea.scrollTop = messageArea.scrollHeight
    
    // Guardar en historial
    const messageData = {
      origin: isUser ? 'client' : 'server', 
      type: type, 
      data: text
    }
    
    if (type === 'audio' && audioData) {
      // Guardar referencia al audio (URL del blob)
      if (audioData instanceof Blob) {
        messageData.audioUrl = URL.createObjectURL(audioData)
      } else {
        messageData.audioUrl = audioData
      }
    }
    
    if (type === 'file' && fileData) {
      messageData.fileData = fileData
    }
    
    chatData.messages.push(messageData)
    _saveChatData()
  }

  function _getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
    if (mimeType.includes('text')) return '📃'
    if (mimeType.includes('json') || mimeType.includes('xml')) return '📋'
    return '📎'
  }

  function _getFileTypeLabel(mimeType) {
    if (!mimeType) return 'Archivo'
    if (mimeType.startsWith('image/')) return 'Imagen'
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('audio/')) return 'Audio'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'ZIP'
    if (mimeType.includes('text')) return 'Texto'
    if (mimeType.includes('json')) return 'JSON'
    if (mimeType.includes('xml')) return 'XML'
    // Extraer extensión del tipo MIME
    const parts = mimeType.split('/')
    if (parts.length > 1) {
      return parts[1].toUpperCase()
    }
    return 'Archivo'
  }

  function _showLoader() {
    let loader = d.getElementById('datacivis-loader')
    if (loader) {
      loader.style.display = 'flex'
      messageArea.scrollTop = messageArea.scrollHeight
    }
  }

  function _hideLoader() {
    let loader = d.getElementById('datacivis-loader')
    if (loader) loader.style.display = 'none'
  }

  // ========== EVENTOS ==========
  function _setListenerChatIcon() {
    chatIcon.addEventListener('click', function() {
      chatContainer.style.display = 'flex'
      chatIcon.style.display = 'none'
      if (!socket || !socket.connected) {
        _connectSocket()
      }
      messageArea.scrollTop = messageArea.scrollHeight
    })
  }

  function _setResizeHandle() {
    let isResizing = false, startX, startY, startWidth, startHeight, startTop, startLeft

    resizeHandle.addEventListener('mousedown', function(e) {
      e.preventDefault()
      isResizing = true
      startX = e.clientX
      startY = e.clientY
      startWidth = chatContainer.offsetWidth
      startHeight = chatContainer.offsetHeight
      startTop = chatContainer.offsetTop
      startLeft = chatContainer.offsetLeft
      d.addEventListener('mousemove', resize)
      d.addEventListener('mouseup', stopResize)
    })

    function resize(e) {
      if (!isResizing) return
      const diffX = e.clientX - startX
      const diffY = e.clientY - startY
      chatContainer.style.width = `${startWidth - diffX}px`
      chatContainer.style.height = `${startHeight - diffY}px`
      chatContainer.style.top = `${startTop + diffY}px`
      chatContainer.style.left = `${startLeft + diffX}px`
    }

    function stopResize() {
      isResizing = false
      d.removeEventListener('mousemove', resize)
      d.removeEventListener('mouseup', stopResize)
    }
  }

  function _setMinimizeButton() {
    minimizeButton.addEventListener('click', function() {
      chatContainer.style.display = 'none'
      chatIcon.style.display = 'flex'
    })
  }

  function _setMaximizeButton() {
    maximizeButton.addEventListener('click', function() {
      chatContainer.classList.toggle('datacivis-maximized')
      resizeHandle.style.display = chatContainer.classList.contains('datacivis-maximized') ? 'none' : 'block'
    })
  }

  function _setCloseButton() {
    closeButton.addEventListener('click', function() {
      chatContainer.style.display = 'none'
      chatIcon.style.display = 'flex'
      chatData = null
      const storageKey = `datacivisChat_${campaignId}`
      l.removeItem(storageKey)
      messageArea.innerHTML = '<div id="datacivis-loader" style="display: none;"><div class="loader-dots"><span></span><span></span><span></span></div></div>'
      _disconnectSocket()
    })
  }

  function _setInputField() {
    inputField.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.keyCode === 13) {
        _sendMessage()
      }
    })
  }

  function _setSendButton() {
    sendButton.addEventListener('click', _sendMessage)
  }

  // ========== DARK MODE ==========
  function _setDarkModeButton() {
    if (!darkModeButton) return
    
    // Cargar preferencia guardada
    const storageKey = `datacivisDarkMode_${campaignId}`
    const isDark = l.getItem(storageKey) === 'true'
    if (isDark) {
      chatContainer.classList.add('datacivis-dark')
      darkModeButton.textContent = '☀️'
    }
    
    darkModeButton.addEventListener('click', function() {
      const isDark = chatContainer.classList.toggle('datacivis-dark')
      darkModeButton.textContent = isDark ? '☀️' : '🌙'
      l.setItem(storageKey, isDark ? 'true' : 'false')
    })
  }

  // ========== ACTUALIZAR HEADER ==========
  function _updateHeader(data) {
    const titleEl = d.getElementById('datacivis-chat-title')
    const subtitleEl = d.getElementById('datacivis-chat-subtitle')
    
    if (data.assistantName) {
      assistantName = data.assistantName
    }
    if (data.campaignName) {
      campaignName = data.campaignName
    }
    
    if (titleEl) {
      titleEl.textContent = assistantName
    }
    if (subtitleEl) {
      subtitleEl.textContent = campaignName
    }
  }

  // ========== ARCHIVOS ==========
  function _setFileButton() {
    const filePreview = d.getElementById('datacivis-file-preview')
    
    fileButton.addEventListener('click', function(e) {
      e.stopPropagation()
      if (fileInput) {
        // Usar setTimeout para asegurar que el click se ejecute después del evento actual
        setTimeout(function() {
          fileInput.click()
        }, 0)
      } else {
        console.error('Datacivis: fileInput no encontrado')
      }
    })
    
    // Drag and Drop
    messageArea.addEventListener('dragover', function(e) {
      e.preventDefault()
      e.stopPropagation()
      messageArea.classList.add('drag-over')
    })
    
    messageArea.addEventListener('dragleave', function(e) {
      e.preventDefault()
      e.stopPropagation()
      messageArea.classList.remove('drag-over')
    })
    
    messageArea.addEventListener('drop', function(e) {
      e.preventDefault()
      e.stopPropagation()
      messageArea.classList.remove('drag-over')
      
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        _handleFiles(files)
      }
    })
    
    fileInput.addEventListener('change', function(e) {
      const files = Array.from(e.target.files)
      if (files.length > 0) {
        _handleFiles(files)
      }
      fileInput.value = '' // Reset
    })
  }

  function _handleFiles(files) {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const validFiles = []
    const invalidFiles = []
    
    files.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push({ name: file.name, reason: 'Tamaño excedido (máx. 10MB)' })
      } else {
        validFiles.push(file)
      }
    })
    
    // Mostrar errores si hay
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(invalid => {
        _addMessage(`❌ ${invalid.name}: ${invalid.reason}`, true)
      })
    }
    
    // Procesar archivos válidos
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        _previewAndSendImage(file)
      } else {
        _sendFile(file)
      }
    })
  }

  function _previewAndSendImage(file) {
    const reader = new FileReader()
    reader.onload = function(e) {
      const imageUrl = e.target.result
      
      // Mostrar preview
      const previewContainer = d.getElementById('datacivis-file-preview')
      if (previewContainer) {
        previewContainer.style.display = 'block'
        previewContainer.innerHTML = `
          <div class="file-preview-content">
            <div class="file-preview-header">
              <span>📷 Vista previa</span>
              <button id="file-preview-close" class="file-preview-close">×</button>
            </div>
            <img src="${imageUrl}" alt="${file.name}" class="file-preview-image">
            <div class="file-preview-info">
              <div class="file-preview-name">${file.name}</div>
              <div class="file-preview-size">${_formatFileSize(file.size)}</div>
            </div>
            <button id="file-preview-send" class="file-preview-send">Enviar</button>
          </div>
        `
        
        const closeBtn = d.getElementById('file-preview-close')
        const sendBtn = d.getElementById('file-preview-send')
        
        closeBtn.addEventListener('click', function() {
          previewContainer.style.display = 'none'
          previewContainer.innerHTML = ''
        })
        
        sendBtn.addEventListener('click', function() {
          _sendFile(file)
          previewContainer.style.display = 'none'
          previewContainer.innerHTML = ''
        })
      } else {
        // Si no hay preview, enviar directamente
        _sendFile(file)
      }
    }
    reader.readAsDataURL(file)
  }

  function _sendFile(file) {
    if (!socket || !socket.connected) {
      console.warn('Datacivis: Socket no conectado')
      return
    }

    chatData = _getChatData()
    
    // Mostrar mensaje en el chat ANTES de enviar
    _addMessage(file.name, true, 'file', null, {
      name: file.name,
      type: file.type,
      size: file.size
    })
    _showLoader()
    
    // Convertir archivo a base64
    const reader = new FileReader()
    reader.onload = function(e) {
      const base64 = e.target.result
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64.split(',')[1] // Remover el prefijo data:type;base64,
      }
      
      // Enviar al backend
      socket.emit('message', {
        chatId: chatData.id,
        campaignId: campaignId,
        type: 'file',
        message: fileData.name,
        file: fileData,
        timestamp: new Date().toISOString()
      })
    }
    reader.readAsDataURL(file)
  }

  function _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // ========== AUDIO ==========
  function _setAudioButton() {
    let isRecording = false
    let recordingTimer = null
    let startTime = null
    const audioRecorder = d.getElementById('datacivis-audio-recorder')
    const recorderTime = d.getElementById('audio-recorder-time')
    const stopBtn = d.getElementById('audio-recorder-stop')
    const cancelBtn = d.getElementById('audio-recorder-cancel')

    audioButton.addEventListener('click', function() {
      if (!isRecording) {
        _startRecording()
      }
    })

    if (stopBtn) {
      stopBtn.addEventListener('click', function() {
        _stopRecording()
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        _cancelRecording()
      })
    }

    function _startRecording() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta grabación de audio')
        return
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
          isRecording = true
          audioChunks = []
          audioStartTime = Date.now()
          mediaRecorder = new MediaRecorder(stream)
          
          mediaRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) {
              audioChunks.push(e.data)
            }
          }

          audioStartTime = Date.now()
          
          mediaRecorder.onstop = function() {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
            const duration = Math.floor((Date.now() - audioStartTime) / 1000)
            _sendAudio(audioBlob, duration)
            stream.getTracks().forEach(track => track.stop())
            audioStartTime = null
          }

          mediaRecorder.start()
          audioButton.classList.add('recording')
          if (audioRecorder) audioRecorder.style.display = 'block'
          recordingTimer = setInterval(function() {
            const elapsed = Math.floor((Date.now() - audioStartTime) / 1000)
            const minutes = Math.floor(elapsed / 60)
            const seconds = elapsed % 60
            if (recorderTime) {
              recorderTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            }
          }, 1000)
        })
        .catch(function(err) {
          console.error('Error al acceder al micrófono:', err)
          alert('No se pudo acceder al micrófono. Verifica los permisos.')
        })
    }

    function _stopRecording() {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop()
        isRecording = false
        audioButton.classList.remove('recording')
        if (audioRecorder) audioRecorder.style.display = 'none'
        if (recordingTimer) clearInterval(recordingTimer)
        if (recorderTime) recorderTime.textContent = '00:00'
      }
    }

    function _cancelRecording() {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop()
        isRecording = false
        audioChunks = []
        audioStartTime = null
        audioButton.classList.remove('recording')
        if (audioRecorder) audioRecorder.style.display = 'none'
        if (recordingTimer) clearInterval(recordingTimer)
        if (recorderTime) recorderTime.textContent = '00:00'
      }
    }
  }

  function _sendAudio(audioBlob, duration) {
    if (!socket || !socket.connected) {
      console.warn('Datacivis: Socket no conectado')
      return
    }

    chatData = _getChatData()
    
    // Mostrar mensaje con reproductor de audio ANTES de enviar
    _addMessage(`Audio (${duration}s)`, true, 'audio', audioBlob)
    _showLoader()
    
    // Convertir audio a base64
    const reader = new FileReader()
    reader.onload = function(e) {
      const base64 = e.target.result
      const audioData = {
        type: audioBlob.type,
        size: audioBlob.size,
        data: base64.split(',')[1] // Remover el prefijo data:type;base64,
      }
      
      // Enviar al backend
      socket.emit('message', {
        chatId: chatData.id,
        campaignId: campaignId,
        type: 'audio',
        message: `Audio de ${duration} segundos`,
        audio: audioData,
        timestamp: new Date().toISOString()
      })
    }
    reader.readAsDataURL(audioBlob)
  }

  // ========== MENSAJES ==========
  function _sendMessage() {
    chatData = _getChatData()
    const message = inputField.value.trim()
    if (message === '') return
    
    // Mostrar mensaje siempre, aunque no haya conexión
    _addMessage(message, true)
    inputField.value = ''
    inputField.focus()
    
    // Intentar enviar solo si hay conexión
    if (socket && socket.connected) {
      _showLoader()
      socket.emit('message', {
        chatId: chatData.id,
        campaignId: campaignId,
        type: 'text',
        message: message,
        timestamp: new Date().toISOString()
      })
    } else {
      // Si no hay conexión, mostrar mensaje de error
      setTimeout(() => {
        _addMessage('⚠️ No hay conexión con el servidor. Por favor, verifica tu conexión.', false)
      }, 500)
    }
  }

  // ========== SOCKET.IO ==========
  function _connectSocket() {
    chatData = _getChatData()
    
    if (typeof io === 'undefined') {
      console.error('Datacivis: Socket.IO client no está cargado')
      return
    }
    
    console.log(`Datacivis: Conectando a ${serverUrl}`)
    
    socket = io(serverUrl, {
      query: {
        campaignId: campaignId,
        chatId: chatData.id
      }
    })

    socket.on('connected', function(data) {
      console.log('Datacivis: Conectado', data)
      _updateHeader(data)
      if (chatData.messages.length === 0 && data.greeting) {
        _addMessage(data.greeting, false)
      }
    })

    socket.on('response', function(data) {
      console.log('Datacivis: Mensaje recibido del servidor', data)
      _hideLoader()
      if (data.type === 'audio' && data.audio) {
        // Si el backend envía un audio como respuesta
        const audioBase64 = `data:${data.audio.type || 'audio/webm'};base64,${data.audio.data}`
        _addMessage(data.message || 'Audio recibido', false, 'audio', audioBase64)
      } else if (data.message) {
        _addMessage(data.message, false)
      }
      // Reproducir sonido de notificación
      console.log('Datacivis: Llamando a _playNotificationSound después de recibir mensaje')
      _playNotificationSound()
    })

    socket.on('typing', function(data) {
      if (data.isTyping) {
        _showLoader()
      } else {
        _hideLoader()
      }
    })

    socket.on('error', function(data) {
      console.error('Datacivis: Error', data)
      _hideLoader()
      _addMessage('❌ Error: ' + (data.message || 'Error de conexión'), false)
    })

    socket.on('connect', function() {
      console.log('Datacivis: Socket conectado')
    })

    socket.on('disconnect', function() {
      console.log('Datacivis: Socket desconectado')
    })

    socket.on('connect_error', function(error) {
      console.error('Datacivis: Error de conexión', error)
    })
  }

  function _disconnectSocket() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  // ========== INICIALIZACIÓN ==========
  function init() {
    console.log(`Datacivis SDK inicializado - Campaign: ${campaignId}`)
    if (d.body) {
      _renderWidget()
    } else {
      d.addEventListener('DOMContentLoaded', _renderWidget)
    }
  }

  if (w.self === w.top) {
    init()
  }
})(document, localStorage, window)

