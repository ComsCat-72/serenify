document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('Form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                this.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while sending the email. Please try again later.');
            });
        });
    } else {
        console.error('Form not found');
    }
});