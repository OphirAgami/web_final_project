// הודעה לבדיקה שקובץ שירות הלקוחות נטען בדפדפן
console.log("Support page JavaScript is connected");

// תפיסת אלמנטים מה-HTML
const supportForm = document.getElementById("supportForm");
const supportFullNameInput = document.getElementById("supportFullName");
const supportEmailInput = document.getElementById("supportEmail");
const supportSubjectInput = document.getElementById("supportSubject");
const supportOrderNumberInput = document.getElementById("supportOrderNumber");
const supportMessageInput = document.getElementById("supportMessageInput");
const supportMessage = document.getElementById("supportMessage");

// קבלת המשתמש המחובר אם יש
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// הצגת הודעת הצלחה או שגיאה
function showSupportMessage(message, isSuccess) {
    supportMessage.textContent = message;
    supportMessage.style.color = isSuccess ? "green" : "red";
}

// שליחת פנייה לשירות לקוחות לשרת
supportForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const currentUser = getCurrentUser();

    const supportData = {
        username: currentUser ? currentUser.username || currentUser.email : "Guest",
        fullName: supportFullNameInput.value,
        email: supportEmailInput.value,
        subject: supportSubjectInput.value,
        orderNumber: supportOrderNumberInput.value,
        message: supportMessageInput.value,
    };

    try {
        const response = await fetch("/api/support", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(supportData),
        });

        const data = await response.json();

        if (!response.ok) {
            showSupportMessage(data.message || "Error sending support message.", false);
            return;
        }

        supportForm.reset();
        showSupportMessage("Your message was sent successfully. Our support team will contact you soon.", true);
    } catch (error) {
        showSupportMessage("Error sending support message.", false);
    }
});
