document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // עוצר את רענון העמוד האוטומטי

    // שולפים את הערכים שהמשתמש הזין בשדות
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    const messageElement = document.getElementById('message');

    try {
        // שליחת בקשת POST לשרת שלנו
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // אנחנו שולחים את המבנה בדיוק כמו שה-Schema שלנו במונגו מצפה לקבל
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // ההרשמה הצליחה!
            messageElement.style.color = 'green';
            messageElement.textContent = 'החשבון נוצר בהצלחה! מעביר אותך להתחברות...';

            // השהייה של שתי שניות ואז הפניה אוטומטית למסך ההתחברות
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);

        } else {
            // שגיאה (למשל: האימייל כבר קיים במערכת)
            messageElement.style.color = 'red';
            messageElement.textContent = data.message || 'שגיאה ביצירת החשבון.';
        }
    } catch (error) {
        console.error('Error:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = 'שגיאת שרת, נסה שוב מאוחר יותר.';
    }
});