function validateLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    message.textContent = "";
    message.className = "message";

    if (!email || !password) {
        message.textContent = "Please fill in all fields";
        message.classList.add("error");
        return false;
    }

    message.textContent = "Checking credentials...";

    fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Login response:", data);

        if (data.token) {
            const role = (data.role || "").trim();
            localStorage.setItem("jwtToken", data.token);
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userRole", role);

            if (role.includes("ADMIN")) {
                window.location.href = "../admin/admin.html";
            } else {
                window.location.href = "home.html";
            }
        } else {
            message.textContent = data.message || "Login failed";
            message.className = "message error";
        }
    })
    .catch(error => {
        message.textContent = "Server error. Try again.";
        message.className = "message error";
    });

    return false;
}
