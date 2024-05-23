function signup(event) {
    event.preventDefault();
    const signupDetails = {
        username: event.target.username.value,
        email: event.target.email.value,
        phone: event.target.phone.value,
        password: event.target.password.value
      }
    axios
      .post(
        "http://localhost:5000/user/signup", signupDetails)
      .then((response) => {
        console.log(response)
        window.location.href = "../login/login.html";
      })
      .catch((err) => {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';
        errorMessage.textContent = err.response.data.message;
      })
   
    document.getElementById("username").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("password").value = "";
  }