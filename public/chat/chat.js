document.addEventListener('DOMContentLoaded', (event) => {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');    

    // Get the logged-in username from local storage 
    const tokenDetails = localStorage.getItem("token");
    let loggedInUser = '';
    if (tokenDetails) {
        const payload = JSON.parse(atob(tokenDetails.split('.')[1]));
        loggedInUser = payload.username;
        console.log('Logged in user:', loggedInUser);
    }

    // Add a message to the chat
    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${sender === loggedInUser ? 'You' : sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    }

    let msgId = 0;  // Keep track of the last message ID to avoid duplicates
    
    // Event listener for the Send button
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            axios.post('http://localhost:5000/chat/add-chat', { message: message }, { headers: { "Authorization": localStorage.getItem("token") } })
            .then(response => {
                addMessage(message, loggedInUser);
                messageInput.value = '';
                msgId = response.data.chatMessage.id;
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

    // Get chat messages
    function fetchChats() {
        axios.get('http://localhost:5000/chat/get-chats', { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            response.data.chats.forEach(message => {
                if (message.id > msgId) {
                    addMessage(message.message, message.username);
                    msgId = message.id;
                }
            });
        })
        .catch(error => console.error(error));
    }    

    fetchChats();
    // setInterval(fetchChats, 2000);
});
