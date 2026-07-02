document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // עוצר את רענון העמוד האוטומטי

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // התחברות הצליחה
            messageElement.style.color = 'green';
            messageElement.textContent = 'ההתחברות הצליחה! שלום ' + data.user.firstName;

                // השהייה של שנייה וחצי ואז הפניה לעמוד המתאים לפי סוג המשתמש
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '/dashboard.html';
                    } else {
                        window.location.href = '/'; // מפנה ל-index.html (עמוד החנות)
                    }
                }, 1500);

        } else {
            // שגיאה (סיסמה או אימייל לא נכונים)
            messageElement.style.color = 'red';
            messageElement.textContent = data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        messageElement.textContent = 'שגיאת שרת, נסה שוב מאוחר יותר.';
    }
});