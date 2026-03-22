const API_BASE = "http://localhost:8081/api/password";

// SEND RESET LINK
function sendResetLink() {
    const email = document.getElementById("email").value;
    const message = document.getElementById("message");

    if (!email) {
        message.innerText = "Please enter your email.";
        message.style.color = "red";
        return;
    }

    fetch(`${API_BASE}/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.text())
    .then(data => {
        message.innerText = data;
        message.style.color = "lightgreen";
    })
    .catch(() => {
        message.innerText = "Error sending reset link.";
        message.style.color = "red";
    });
}

// RESET PASSWORD
function resetPassword() {
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!password) {
        message.innerText = "Please enter new password.";
        message.style.color = "red";
        return;
    }

    fetch(`${API_BASE}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, password: password })
    })
    .then(response => response.text())
    .then(data => {
        message.innerText = data;
        message.style.color = "lightgreen";
    })
    .catch(() => {
        message.innerText = "Error resetting password.";
        message.style.color = "red";
    });
}
