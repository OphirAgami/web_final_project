console.log("DriveX auth.js is connected");

/* -------------------------------
   Helper functions
-------------------------------- */

function getElementValue(ids) {
    for (let i = 0; i < ids.length; i++) {
        const element = document.getElementById(ids[i]);

        if (element) {
            return element.value;
        }
    }

    return "";
}

function getElement(ids) {
    for (let i = 0; i < ids.length; i++) {
        const element = document.getElementById(ids[i]);

        if (element) {
            return element;
        }
    }

    return null;
}

function showMessage(element, message, color) {
    if (!element) {
        return;
    }

    element.style.color = color;
    element.textContent = message;
}

/* -------------------------------
   Login
-------------------------------- */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = getElementValue(["loginUsername", "username"]);
        const email = getElementValue(["loginEmail", "email"]);
        const password = getElementValue(["loginPassword", "password"]);
        const messageElement = getElement(["loginMessage", "message"]);

        try {
            let response;

            if (username) {
                response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                });
            } else {
                response = await fetch("/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    }),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                showMessage(messageElement, data.message, "red");
                return;
            }

            const loggedUser = {
                username: data.user.username || data.user.firstName || email || username,
                email: data.user.email || email,
                firstName: data.user.firstName || "",
                lastName: data.user.lastName || "",
                role: data.user.role,
            };

            localStorage.setItem("currentUser", JSON.stringify(loggedUser));

            showMessage(messageElement, "Login successful!", "green");

            setTimeout(function () {
                if (loggedUser.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "store.html";
                }
            }, 1000);
        } catch (error) {
            console.error("Login error:", error);
            showMessage(messageElement, "Something went wrong. Please try again.", "red");
        }
    });
}

/* -------------------------------
   Signup / Register
-------------------------------- */

const signupForm = document.getElementById("signupForm");
const registerForm = document.getElementById("registerForm");

const activeRegisterForm = signupForm || registerForm;

if (activeRegisterForm) {
    activeRegisterForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = getElementValue(["signupUsername", "username"]);
        const email = getElementValue(["signupEmail", "email"]);
        const password = getElementValue(["signupPassword", "password"]);
        const firstName = getElementValue(["firstName", "signupFirstName"]);
        const lastName = getElementValue(["lastName", "signupLastName"]);
        const phone = getElementValue(["phone", "signupPhone"]);
        const messageElement = getElement(["signupMessage", "registerMessage", "message"]);

        try {
            let response;

            if (username) {
                response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                });
            } else {
                response = await fetch("/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        role: "customer",
                    }),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                showMessage(messageElement, data.message, "red");
                return;
            }

            showMessage(messageElement, "User created successfully! You can now login.", "green");
            activeRegisterForm.reset();
        } catch (error) {
            console.error("Signup error:", error);
            showMessage(messageElement, "Something went wrong. Please try again.", "red");
        }
    });
}
