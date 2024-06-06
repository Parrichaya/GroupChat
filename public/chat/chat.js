document.addEventListener('DOMContentLoaded', (event) => {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');   
    const fileInput = document.getElementById('file-input');
    const createGroupButton = document.getElementById('create-group-button');
    const addUserOption = document.getElementById('add-user-option');
    const removeUserOption = document.getElementById('remove-user-option');
    const makeUserAdminOption = document.getElementById('make-user-admin-option');
    const groupList = document.getElementById('group-list'); 
    const groupMembersDiv = document.getElementById('group-members');
    const checkboxesContainer = document.getElementById('add-user-checkboxes');
    const makeAdminCheckboxes= document.getElementById('make-admin-checkboxes');
    const removeUserCheckboxes= document.getElementById('remove-user-checkboxes');
    const createGroupModal = new bootstrap.Modal(document.getElementById('create-group-modal'), {});
    const addUserModal = new bootstrap.Modal(document.getElementById('add-user-modal'), {});
    const removeUserModal = new bootstrap.Modal(document.getElementById('remove-user-modal'), {});
    const makeAdminModal = new bootstrap.Modal(document.getElementById('make-admin-modal'), {});
    const dropdown = document.getElementById('user-management-dropdown');

    const socket = io('http://localhost:4000');

    // Get the logged-in username from local storage 
    const tokenDetails = localStorage.getItem("token");
    let loggedInUser = '';
    let loggedInUserId = '';
    if (tokenDetails) {
        const payload = JSON.parse(atob(tokenDetails.split('.')[1]));
        loggedInUser = payload.username;
        loggedInUserId = payload.userId;
        console.log('Logged in user and id:', loggedInUser, loggedInUserId);
    }

    // Add a message to the chat
    function addMessage(message, sender) {
        const messageElement = document.createElement('div');    
        messageElement.classList.add('message');
        
        const senderText = `<strong>${sender === loggedInUser ? 'You' : sender}:</strong>`;
        
        // Check if the message is a URL
        if (message.startsWith('http://') || message.startsWith('https://')) {
            // Create a link to the file URL
            messageElement.innerHTML = `${senderText} <a href="${message}" target="_blank">Attached File</a>`;
        } else {
            // Regular text message
            messageElement.innerHTML = `${senderText} ${message}`;
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    }

    let currentGroupId = null;
    let msgId = null;

    if (!currentGroupId) {
       dropdown.style.display = 'none'; 
    }

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
                messageInput.value = '';
            })
            .catch(error => console.error(error));
        }
    });

    // Event listener for the File input
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('groupId', currentGroupId);

            axios.post('http://localhost:5000/chat/upload-file', formData, {
                headers: {
                    "Authorization": localStorage.getItem("token"),
                    "Content-Type": "multipart/form-data"
                }
            })
            .then(response => {
                // Populate the message input field with the S3 URL
                messageInput.value = response.data.fileUrl;
                fileInput.value = ''; // Clear the file input after upload
                console.log('File uploaded successfully:', response.data);
            })
            .catch(error => console.error(error));
        }
    })

    // Event listener for 'Enter' key
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    // Listen for real-time chat messages
    socket.on('newMessage', (data) => {
        if (data.groupId === currentGroupId) {
            addMessage(data.message, data.username);
            saveMessageToLocalStorage(data.message, data.username, data.id, currentGroupId);
            msgId = data.id;
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
                addMessage(message.message, message.username);
                saveMessageToLocalStorage(message.message, message.username, message.id, currentGroupId);
                msgId = message.id;
            });
        })
        .catch(error => console.error(error));
    }    

    // Fetch all users and populate the checkboxes
    function fetchUsers() {
        axios.get('http://localhost:5000/user/get-users', { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            const users = response.data.users;
            localStorage.setItem('users', JSON.stringify(users));
            groupMembersDiv.innerHTML = '';
            users.forEach(user => {
                if (user.username !== loggedInUser && user.id !== loggedInUserId) {
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
    
    fetchUsers()
    
    function getUsersFromGroup() {
        // Retrieve the users from local storage
        const allUsers = JSON.parse(localStorage.getItem('users')) || [];
        // Fetch group members
        axios.get(`http://localhost:5000/group/get-group-members?groupId=${currentGroupId}`, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            const groupMembers = response.data.members;
            const groupMemberIds = response.data.members.map(member => member.id);
            localStorage.setItem('groupMembers', JSON.stringify(groupMembers));
            checkboxesContainer.innerHTML = '';
            allUsers.forEach(user => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `user-${user.id}`;
                checkbox.value = user.id;
                checkbox.disabled = groupMemberIds.includes(user.id); // Disable if user is already in the group
                const label = document.createElement('label');
                label.htmlFor = `user-${user.id}`;
                label.textContent = user.username;
                const div = document.createElement('div');
                div.appendChild(checkbox);
                div.appendChild(label);
                checkboxesContainer.appendChild(div);
            });
        })
        .catch(error => console.error(error));
    }

    // Event listener for the Create Group button
    createGroupButton.addEventListener('click', () => {
        fetchUsers();
        createGroupModal.show();
    })
    
    // Event listener for the add user dropdown option
    addUserOption.addEventListener('click', () => {
        addUserModal.show();
    })
    
    document.getElementById('dropdownUserManagement').addEventListener('click', function() {
        getUsersFromGroup();
    });
    

    // Event listener for the make user admin dropdown option
    makeUserAdminOption.addEventListener('click', () => {
        const groupMembers = JSON.parse(localStorage.getItem('groupMembers')) || [];
        console.log('members:',groupMembers);
        makeAdminCheckboxes.innerHTML = '';
        groupMembers.forEach(member => {
            if (!member.isAdmin) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `member-${member.id}`;
                checkbox.value = member.id;
                const label = document.createElement('label');
                label.htmlFor = `member-${member.id}`;
                label.textContent = member.username;
                const div = document.createElement('div');
                div.appendChild(checkbox);
                div.appendChild(label);
                makeAdminCheckboxes.appendChild(div);
            }
        });
        makeAdminModal.show();
    })

    // Event listener for the remove user dropdown option
    removeUserOption.addEventListener('click', () => {
        const groupMembers = JSON.parse(localStorage.getItem('groupMembers')) || [];
        console.log('members:',groupMembers);
        removeUserCheckboxes.innerHTML = '';
        groupMembers.forEach(member => {
            if (!member.isAdmin) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `member-${member.id}`;
                checkbox.value = member.id;
                const label = document.createElement('label');
                label.htmlFor = `member-${member.id}`;
                label.textContent = member.username;
                const div = document.createElement('div');
                div.appendChild(checkbox);
                div.appendChild(label);
                removeUserCheckboxes.appendChild(div);
            }
        });
        removeUserModal.show();
    })

    // Function to check if the user is an admin of the current group
    async function isAdminStatus(groupId) {
        try {
            const response = await axios.get(`http://localhost:5000/group/get-group-members?groupId=${groupId}`, { headers: { "Authorization": localStorage.getItem("token") } });
            const groupMembers = response.data.members;
            console.log(groupMembers);
            for (let i = 0; i < groupMembers.length; i++) {
                if (groupMembers[i].isAdmin && groupMembers[i].id === loggedInUserId) {
                    return true;
                }
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }
    
    function fetchGroups() {
        axios.get('http://localhost:5000/group/get-groups', { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            groupList.innerHTML = '';
            response.data.groups.forEach((group, index) => {
                const groupElement = document.createElement('div');
                groupElement.classList.add('group-item');
                groupElement.textContent = group.name;
                groupElement.addEventListener('click', async () => {
                    localStorage.setItem('index', index);
                    document.querySelectorAll('.group-item').forEach(item => item.classList.remove('active'));
                    groupElement.classList.add('active');
                    currentGroupId = group.id;

                    const isAdmin = await isAdminStatus(currentGroupId);
                    console.log('isadmin status',isAdmin);
                    if (!isAdmin) {
                        dropdown.style.display = 'none';
                    } else {
                        dropdown.style.display = 'block';
                    }

                    chatMessages.innerHTML = '';
                    msgId = fetchMessagesFromLocalStorage(currentGroupId);
                    fetchChats();
                    getUsersFromGroup();
                });
                groupList.appendChild(groupElement);

                if (index === parseInt(localStorage.getItem('index'))) {
                    groupElement.click();
                }
            });
        })
        .catch(error => console.error(error));
    }

    fetchGroups();

    // Listen for newGroups event
    socket.on('newGroup', () => {
        fetchGroups();
    });

    // Create group form submission
    document.getElementById('create-group-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const groupName = document.getElementById('group-name').value;
        const selectedUserIds = Array.from(document.querySelectorAll('#group-members input:checked')).map(checkbox => checkbox.value);

        axios.post('http://localhost:5000/group/add-group', { name: groupName, userIds: selectedUserIds }, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            console.log(response);
            createGroupModal.hide();
        })
        .catch(error => console.error(error));
    })    

    // Add user form submission
    document.getElementById('add-user-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedUserIds = Array.from(document.querySelectorAll('#add-user-checkboxes input:checked')).map(checkbox => checkbox.value);
        
        axios.post('http://localhost:5000/group/add-users-to-group', { groupId: currentGroupId, userIds: selectedUserIds }, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            console.log(response);
            addUserModal.hide();
        })
        .catch(error => console.error(error));
    })

    // Make user admin form submission
    document.getElementById('make-admin-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedUserIds = Array.from(document.querySelectorAll('#make-admin-checkboxes input:checked')).map(checkbox => checkbox.value);
        
        axios.post('http://localhost:5000/group/make-admin', { groupId: currentGroupId, userIds: selectedUserIds }, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            console.log(response);
            makeAdminModal.hide();
        })
        .catch(error => console.error(error));
    })

    // Remove user form submission
    document.getElementById('remove-user-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedUserIds = Array.from(document.querySelectorAll('#remove-user-checkboxes input:checked')).map(checkbox => checkbox.value);
        
        axios.post('http://localhost:5000/group/remove-users-from-group', { groupId: currentGroupId, userIds: selectedUserIds }, { headers: { "Authorization": localStorage.getItem("token") } })
        .then(response => {
            console.log(response);
            removeUserModal.hide();
        })
        .catch(error => console.error(error));
    })
});
