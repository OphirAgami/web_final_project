console.log("DriveX main.js is connected");

const navUserText = document.getElementById("navUserText");
const logoutButton = document.getElementById("logoutButton");

function updateNavbarUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!navUserText || !logoutButton) {
        return;
    }

    if (!currentUser) {
        navUserText.textContent = "Guest";
        logoutButton.style.display = "none";
        return;
    }

    navUserText.textContent = currentUser.username + " (" + currentUser.role + ")";
    logoutButton.style.display = "inline-block";
}

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });
}

updateNavbarUser();
