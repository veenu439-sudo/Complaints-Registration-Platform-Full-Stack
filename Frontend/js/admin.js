window.viewHandlers['admin-dashboard'] = async () => {
    const listEl = document.getElementById('admin-complaints-list');
    
    try {
        const complaints = await window.api.complaints.getAll();
        if (complaints.length === 0) {
            listEl.innerHTML = '<p class="info-text">No complaints found.</p>';
            return;
        }
        
        listEl.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-meta">
                    <span>User: ${c.user_name} (${c.user_email})</span>
                    <span>Date: ${new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div class="qna-item">
                    <strong>Complaint:</strong>
                    <p>${c.complaint_text}</p>
                </div>
                ${c.ai_question ? `
                <div class="qna-block">
                    <div class="qna-item">
                        <strong>AI Follow-up:</strong>
                        <p>${c.ai_question}</p>
                    </div>
                    <div class="qna-item">
                        <strong>User's Answer:</strong>
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
