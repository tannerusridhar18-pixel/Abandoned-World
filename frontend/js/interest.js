document.addEventListener("DOMContentLoaded", function () {

    const interestBoxes = document.querySelectorAll(".interest-box");
    const continueBtn = document.querySelector(".continue-btn");

    let selectedInterests = [];

    interestBoxes.forEach(box => {
        box.addEventListener("click", function () {

            const value = box.getAttribute("data-value");

            box.classList.toggle("active");

            if (selectedInterests.includes(value)) {
                selectedInterests = selectedInterests.filter(item => item !== value);
            } else {
                selectedInterests.push(value);
            }

            updateButtonState();
        });
    });

    function updateButtonState() {
        if (selectedInterests.length > 0) {
            continueBtn.classList.add("enabled");
            continueBtn.disabled = false;
        } else {
            continueBtn.classList.remove("enabled");
            continueBtn.disabled = true;
        }
    }

    continueBtn.addEventListener("click", function () {

        if (selectedInterests.length === 0) return;

        const email = localStorage.getItem("userEmail");

        fetch("http://localhost:8081/api/interests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                interests: selectedInterests
            })
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            window.location.href = "home.html";
        })
        .catch(error => {
            console.error("Error:", error);
        });
    });

    updateButtonState();
});