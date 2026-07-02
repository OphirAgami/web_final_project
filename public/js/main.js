console.log("DriveX main.js is connected");

const statusText = document.getElementById("statusText");
const navUserText = document.getElementById("navUserText");
const logoutButton = document.getElementById("logoutButton");

if (statusText) {
    statusText.textContent = "Website files are connected successfully.";
}

function updateNavbarUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (navUserText) {
        navUserText.textContent = "";
        navUserText.style.display = "none";
    }

    if (!logoutButton) {
        return;
    }

    if (!currentUser) {
        logoutButton.style.display = "none";
        return;
    }

    logoutButton.style.display = "inline-block";
}

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });
}

updateNavbarUser();