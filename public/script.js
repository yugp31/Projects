function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        alert(data.message || data.error);
        if (data.message === 'Login successful') {
            showDashboard();
        }
    } catch (error) {
        alert('Error logging in');
    }
}

async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        alert(data.message || data.error);
        if (data.message === 'User registered successfully') {
            toggleForms(); // Switch back to login form after successful registration
        }
    } catch (error) {
        alert('Error registering');
    }
}

function showDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadPapers(); // Load papers when dashboard is shown
}

async function uploadPaper(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('paperTitle').value);
    formData.append('authors', document.getElementById('paperAuthors').value);
    formData.append('keywords', document.getElementById('paperKeywords').value);
    formData.append('abstract', document.getElementById('paperAbstract').value);
    formData.append('file', document.getElementById('paperFile').files[0]);

    try {
        const response = await fetch('/api/papers/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            alert('Paper uploaded successfully!');
            document.getElementById('uploadForm').reset();
            loadPapers(); // Refresh the papers list
        } else {
            alert(data.error || 'Upload failed');
        }
    } catch (error) {
        alert('Error uploading paper');
    }
}

async function loadPapers() {
    try {
        const response = await fetch('/api/papers');
        const papers = await response.json();
        const papersList = document.getElementById('papersList');
        
        papersList.innerHTML = papers.map(paper => `
            <div class="paper-item">
                <div class="paper-info">
                    <h4>${paper.title}</h4>
                    <p>Authors: ${paper.authors}</p>
                    <p>Keywords: ${paper.keywords}</p>
                </div>
                <div class="paper-actions">
                    <button onclick="downloadPaper('${paper._id}')">Download</button>
                    <button onclick="deletePaper('${paper._id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('papersList').innerHTML = '<p class="error">Error loading papers. Please try again.</p>';
        console.error('Error loading papers:', error);
    }
}

function logout() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}
// ...existing code...

async function downloadPaper(paperId) {
    try {
        window.open(`/api/papers/${paperId}/download`, '_blank');
    } catch (error) {
        alert('Error downloading paper');
    }
}

async function deletePaper(paperId) {
    if (!confirm('Are you sure you want to delete this paper?')) {
        return;
    }

    try {
        const response = await fetch(`/api/papers/${paperId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            alert('Paper deleted successfully');
            loadPapers(); // Refresh the list
        } else {
            alert(data.error || 'Delete failed');
        }
    } catch (error) {
        alert('Error deleting paper');
    }
}