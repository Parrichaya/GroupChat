document.addEventListener('DOMContentLoaded', (event) => {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');   
    const createGroupButton = document.getElementById('create-group-button');
    const groupList = document.getElementById('group-list'); 
    const groupMembersDiv = document.getElementById('group-members');
    const createGroupModal = new bootstrap.Modal(document.getElementById('create-group-modal'), {});


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

    let currentGroupId = null;
    let msgId = null;

    // Get messages from local storage
    function fetchMessagesFromLocalStorage(groupId) {
        const groupChatMessages = `chatMessages_group_${groupId}`;
        const messages = JSON.parse(localStorage.getItem(groupChatMessages)) || [];
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
    function saveMessageToLocalStorage(message, username, id, groupId) {
        const groupChatMessages = `chatMessages_group_${groupId}`;
        const messages = JSON.parse(localStorage.getItem(groupChatMessages)) || [];
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
            
            localStorage.setItem(groupChatMessages, JSON.stringify(messages));
        }
    }

    if (currentGroupId) {
        msgId = fetchMessagesFromLocalStorage(currentGroupId);
    }
    
     // Event listener for the Send button
     sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message && currentGroupId) {
            axios.post('http://localhost:5000/chat/add-chat', { message: message, groupId: currentGroupId }, { headers: { "Authorization": localStorage.getItem("token") } })
            .then(response => {
                addMessage(message, loggedInUser);
                saveMessageToLocalStorage(message, loggedInUser, response.data.chatMessage.id, currentGroupId);
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
        if (!currentGroupId) {
            return;
        }

        axios.get(`http://localhost:5000/chat/get-chats?lastId=${msgId}&groupId=${currentGroupId}`, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            response.data.chats.forEach(message => {
                // if (message.id > msgId) {
                //     addMessage(message.message, message.username);
                //     msgId = message.id;
                // }
                addMessage(message.message, message.username);
                saveMessageToLocalStorage(message.message, message.username, message.id, currentGroupId);
                msgId = message.id;
            });
        })
        .catch(error => console.error(error));
    }    

    // fetchChats();
    // setInterval(fetchChats, 2000);

    // Fetch all users and populate the checkboxes
    function fetchUsers() {
        axios.get('http://localhost:5000/chat/get-users', { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            const users = response.data.users;
            groupMembersDiv.innerHTML = '';
            users.forEach(user => {
                if (user.username !== loggedInUser) {
                    const checkbox = document.createElement('div');
                    checkbox.innerHTML = `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${user.id}" id="user-${user.id}">
                            <label class="form-check-label" for="user-${user.id}">
                                ${user.username}
                            </label>
                        </div>`;
                    groupMembersDiv.appendChild(checkbox);
                }
            });
        })
        .catch(error => console.error(error));
    }

    // Event listener for the Create Group button
    createGroupButton.addEventListener('click', () => {
        fetchUsers();
        createGroupModal.show();
    })
    
    let pollInterval;

    function fetchGroups() {
        axios.get('http://localhost:5000/chat/get-groups', { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            groupList.innerHTML = '';
            response.data.groups.forEach((group, index) => {
                const groupElement = document.createElement('div');
                groupElement.classList.add('group-item');
                groupElement.textContent = group.name;
                groupElement.addEventListener('click', () => {
                    document.querySelectorAll('.group-item').forEach(item => item.classList.remove('active'));
                    groupElement.classList.add('active');
                    currentGroupId = group.id;
                    chatMessages.innerHTML = '';
                    msgId = fetchMessagesFromLocalStorage(currentGroupId);
                    fetchChats();
                    
                    // clear existing poll interval and start a new one for the new group
                    if (pollInterval) {
                        clearInterval(pollInterval);
                    }
                    pollInterval = setInterval(fetchChats, 2000);
                });
                groupList.appendChild(groupElement);

                if (index === 0) {
                    groupElement.click();
                }
            });
        })
        .catch(error => console.error(error));
    }

    fetchGroups();

    // Create group form submission
    document.getElementById('create-group-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const groupName = document.getElementById('group-name').value;
        const selectedUserIds = Array.from(document.querySelectorAll('#group-members input:checked')).map(checkbox => checkbox.value);

        axios.post('http://localhost:5000/chat/add-group', { name: groupName, userIds: selectedUserIds }, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            console.log(response);
            createGroupModal.hide();
            fetchGroups();
        })
        .catch(error => console.error(error));
    })    
});
