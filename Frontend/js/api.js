const BACKEND_BASE_URL = 'http://localhost:3000';
const API_BASE = `${BACKEND_BASE_URL}/api`;

const api = {
    async request(endpoint, method = 'GET', body = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Important to send cookies
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }
            return data;
        } catch (error) {
            window.app.showToast(error.message, 'error');
            throw error;
        }
    },

    auth: {
        sendOtp: (name, email) => api.request('/auth/send-otp', 'POST', { name, email }),
        register: (email, otp, password) => api.request('/auth/register', 'POST', { email, otp, password }),
        login: (email, password) => api.request('/auth/login', 'POST', { email, password }),
        logout: () => api.request('/auth/logout', 'POST'),
        me: () => api.request('/auth/me')
    },

    complaints: {
        getAiQuestion: (complaint_text) => api.request('/ai/question', 'POST', { complaint_text }),
        submit: (complaint_text, ai_question, user_answer) => api.request('/complaints', 'POST', { complaint_text, ai_question, user_answer }),
        getMy: () => api.request('/complaints/my'),
        getAll: () => api.request('/admin/complaints')
    }
};

window.api = api;
