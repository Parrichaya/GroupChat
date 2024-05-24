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

    // addMessage('You joined the chat!', 'Bot');
    
    // Event listener for the Send button
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            axios.post('http://localhost:5000/chat/add-chat', { message: message }, { headers: { "Authorization": localStorage.getItem("token") } })
            .then(response => {
                addMessage(message);
                messageInput.value = '';
            })
            .catch(error => console.error(error));
        }
    });

    // Event listener for 'Enter' key
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });
});
