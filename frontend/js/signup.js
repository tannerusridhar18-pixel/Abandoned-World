function validatesignup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("message");

    message.textContent = "";
    message.className = "message";

    if (!email || !password || !confirmPassword) {
        showError("All fields are required");
        return false;
    }

    if (password !== confirmPassword) {
        showError("Passwords do not match");
        return false;
    }

    message.textContent = "Creating your account...";

    fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("jwtToken", data.token);
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("userEmail", data.email);

            message.textContent = "Account created successfully!";
            message.className = "message success";

            setTimeout(() => {
                window.location.href = "interest.html";
            }, 1200);
        } else {
            showError("Registration failed");
        }
    })
    .catch(error => {
        showError("Server error. Try again.");
    });

    return false;
}

function showError(text) {
    const message = document.getElementById("message");
    const submitBtn = document.querySelector('input[type="submit"]');

    message.textContent = text;
    message.className = "message error";

    if (submitBtn) submitBtn.disabled = false;
}
