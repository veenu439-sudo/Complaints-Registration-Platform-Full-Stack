window.viewHandlers['login'] = () => {
    const form = document.getElementById('form-login');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            await window.api.auth.login(email, password);
            window.app.showToast('Login successful!');
            await window.app.checkSession();
        } catch (error) {
            // Toast is shown inside api request
        }
    });
};

window.viewHandlers['register'] = () => {
    const step1 = document.getElementById('form-register-step1');
    const step2 = document.getElementById('form-register-step2');
    
    let currentEmail = '';

    step1.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        
        try {
            await window.api.auth.sendOtp(name, email);
            window.app.showToast('OTP sent to your email.');
            currentEmail = email;
            step1.style.display = 'none';
            step2.style.display = 'block';
        } catch (error) {}
    });

    step2.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('reg-otp').value;
        const pass = document.getElementById('reg-password').value;
        const confirmPass = document.getElementById('reg-confirm-password').value;
        
        if (pass !== confirmPass) {
            window.app.showToast('Passwords do not match.', 'error');
            return;
        }

        try {
            await window.api.auth.register(currentEmail, otp, pass);
            window.app.showToast('Registration successful! Please log in.');
            window.app.navigate('login');
        } catch (error) {}
    });
};
