function login(event) {
    event.preventDefault();
    const loginDetails = {
        email: event.target.email.value,
        password: event.target.password.value
      }
    axios
      .post(
        "http://localhost:5000/user/login", loginDetails)
      .then((response) => {
        console.log(response)
        alert(response.data.message)
        localStorage.setItem("token", response.data.token)
        // window.location.href = "";
      })
      .catch((err) => {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';
        errorMessage.textContent = err.response.data.message;
      })
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
}