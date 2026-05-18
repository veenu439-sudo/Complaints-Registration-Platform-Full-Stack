window.viewHandlers['my-complaints'] = async () => {
    const listEl = document.getElementById('user-complaints-list');
    
    try {
        const complaints = await window.api.complaints.getMy();
        if (complaints.length === 0) {
            listEl.innerHTML = '<p class="info-text">You have not submitted any complaints yet.</p>';
            return;
        }
        
        listEl.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-meta">
                    <span>Submitted on: ${new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div class="qna-item">
                    <strong>Your Complaint:</strong>
                    <p>${c.complaint_text}</p>
                </div>
                ${c.ai_question ? `
                <div class="qna-block">
                    <div class="qna-item">
                        <strong>AI Follow-up:</strong>
                        <p>${c.ai_question}</p>
                    </div>
                    <div class="qna-item">
                        <strong>Your Answer:</strong>
                        <p>${c.user_answer}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = '<p class="error">Failed to load complaints.</p>';
    }
};

window.viewHandlers['new-complaint'] = () => {
    const form = document.getElementById('form-new-complaint');
    const btnGetAi = document.getElementById('btn-get-ai-q');
    const aiSection = document.getElementById('ai-section');
    const aiQuestionText = document.getElementById('ai-question-text');
    
    let currentAiQuestion = '';

    btnGetAi.addEventListener('click', async () => {
        const text = document.getElementById('complaint-text').value;
        if (!text) {
            window.app.showToast('Please enter your complaint first', 'error');
            return;
        }

        const originalText = btnGetAi.textContent;
        btnGetAi.textContent = 'Generating...';
        btnGetAi.disabled = true;

        try {
            const data = await window.api.complaints.getAiQuestion(text);
            currentAiQuestion = data.question;
            
            aiQuestionText.textContent = currentAiQuestion;
            btnGetAi.style.display = 'none';
            aiSection.style.display = 'block';
            document.getElementById('complaint-text').readOnly = true;
        } catch (error) {
            btnGetAi.textContent = originalText;
            btnGetAi.disabled = false;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('complaint-text').value;
        const answer = document.getElementById('ai-answer').value;
        
        try {
            await window.api.complaints.submit(text, currentAiQuestion, answer);
            window.app.showToast('Complaint submitted successfully!');
            window.app.navigate('my-complaints');
        } catch (error) {}
    });
};
