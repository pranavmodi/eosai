(function() {
    const config = window.AI_NEXUS_CHAT_CONFIG || {
      apiUrl: 'http://54.71.183.198:50000/api/v1/chat/',
      theme: {
        primaryColor: '#0066cc',
        buttonPosition: 'bottom-right'
      }
    };
  
    // Create chat button
    function createChatButton() {
      const button = document.createElement('div');
      button.id = 'ai-nexus-chat-button';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        #ai-nexus-chat-button {
          position: fixed;
          ${config.theme.buttonPosition === 'bottom-right' ? 'right: 20px; bottom: 20px;' : 'left: 20px; bottom: 20px;'}
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${config.theme.primaryColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 9999;
          transition: all 0.3s ease;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(button);
      
      button.addEventListener('click', () => {
        window.open(config.apiUrl, '_blank');
      });
    }
  
    // Initialize
    createChatButton();
  })();