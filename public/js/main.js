// הודעה לבדיקה שהקובץ הראשי נטען בדפדפן
console.log("DriveX main.js is connected");

// תפיסת אלמנטים מה-HTML
const statusText = document.getElementById("statusText");
const navUserText = document.getElementById("navUserText");
const logoutButton = document.getElementById("logoutButton");

// אם קיים טקסט סטטוס בעמוד, מציגים שהקבצים התחברו בהצלחה
if (statusText) {
    statusText.textContent = "Website files are connected successfully.";
}

// עדכון אזור המשתמש בתפריט העליון
function updateNavbarUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // איפוס הטקסט של המשתמש בתפריט
    if (navUserText) {
        navUserText.textContent = "";
        navUserText.style.display = "none";
    }

    // אם אין כפתור התנתקות בעמוד, מפסיקים כאן
    if (!logoutButton) {
        return;
    }

    // אם אין משתמש מחובר, מסתירים את כפתור ההתנתקות
    if (!currentUser) {
        logoutButton.style.display = "none";
        return;
    }

    // אם יש משתמש מחובר, מציגים את כפתור ההתנתקות
    logoutButton.style.display = "inline-block";
}

// פעולה שמתבצעת בלחיצה על כפתור התנתקות
if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });
}

// הפעלת עדכון התפריט כשהעמוד נטען
updateNavbarUser();