document.addEventListener('DOMContentLoaded', (event) => {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');    

    // Add a message to the chat
    function addMessage(message, sender = 'You') {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    }

    addMessage('You joined the chat!', 'Bot');
    
    // Event listener for the Send button
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message !== '') {
            addMessage(message);
            messageInput.value = '';
        }
    });

    // Event listener for 'Enter' key
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });
});
