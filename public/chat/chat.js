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

        if (message === '') {
            messageElement.classList.add('join-message');
            messageElement.innerHTML = `${sender === loggedInUser ? 'You' : sender} joined the chat!`;
        } else {
            messageElement.classList.add('message');
            messageElement.innerHTML = `<strong>${sender === loggedInUser ? 'You' : sender}:</strong> ${message}`;
        }

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    }

    // Show Users joined! message
    addMessage('', loggedInUser);

    // Get messages from local storage
    function fetchMessagesFromLocalStorage() {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        messages.forEach(message => {
            addMessage(message.message, message.username);
        })
        if (messages.length > 0) {
            return messages[messages.length - 1].id;
        }
        else {
            return 0;
        }
    }

    // Save messages to local storage
    function saveMessageToLocalStorage(message, username, id) {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        let msgIdExists = false;
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].id === id) {
                msgIdExists = true;
                break;
            }
        }
        if (!msgIdExists) {
            messages.push({ message: message, username: username, id: id });

            // Save not more than 15 messages
            if (messages.length > 15) {
                messages.shift();
            }
            
            localStorage.setItem('chatMessages', JSON.stringify(messages));
        }
    }

    let msgId = fetchMessagesFromLocalStorage();  // Call the function and also keep track of the last message ID
    
    // Event listener for the Send button
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            axios.post('http://localhost:5000/chat/add-chat', { message: message }, { headers: { "Authorization": localStorage.getItem("token") } })
            .then(response => {
                addMessage(message, loggedInUser);
                saveMessageToLocalStorage(message, loggedInUser, response.data.chatMessage.id);
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
        axios.get(`http://localhost:5000/chat/get-chats?lastId=${msgId}`, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            response.data.chats.forEach(message => {
                // if (message.id > msgId) {
                //     addMessage(message.message, message.username);
                //     msgId = message.id;
                // }
                addMessage(message.message, message.username);
                saveMessageToLocalStorage(message.message, message.username, message.id);
                msgId = message.id;
            });
        })
        .catch(error => console.error(error));
    }    

    fetchChats();
    setInterval(fetchChats, 2000);
});
