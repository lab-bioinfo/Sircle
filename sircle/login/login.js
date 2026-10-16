// Mostrar/ocultar contraseña
document.getElementById('toggle-pwd').addEventListener('click', function() {
    const pwd = document.getElementById('password');
    const icon = this.querySelector('i');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        pwd.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

// Mostrar mensajes
function showMessage(msg, type = 'error') {
    const area = document.getElementById('message-area');
    area.textContent = msg;
    area.className = `message-area ${type}`;
    setTimeout(() => {
        area.style.display = 'none';
        area.className = 'message-area';
    }, 4000);
}

// Manejar envío del formulario
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const remember = document.getElementById('remember').checked;
    
    if (!username || !password) {
        showMessage('Por favor complete todos los campos');
        return;
    }
    
    const btn = this.querySelector('.btn-login');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    btn.disabled = true;
    
    try {
        const response = await fetch('http://172.22.251.49:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar sesión en localStorage
            localStorage.setItem('user', JSON.stringify({
                name: data.user.name,
                role: data.user.role,
                username: username,
                loggedIn: true
            }));
            
            if (remember) {
                localStorage.setItem('rememberedUser', username);
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            showMessage('¡Bienvenido! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1200);
        } else {
            showMessage(data.message || 'Credenciales incorrectas');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    } catch (error) {
        showMessage('Error de conexión con el servidor');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});

// Modal de recuperación
const modal = document.getElementById('forgot-modal');
document.getElementById('forgot-link').addEventListener('click', function(e) {
    e.preventDefault();
    modal.classList.add('show');
});
document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('show'));
document.getElementById('cancel-reset').addEventListener('click', () => modal.classList.remove('show'));
document.getElementById('send-reset').addEventListener('click', function() {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) {
        alert('Ingrese un correo electrónico');
        return;
    }
    alert('Se ha enviado un enlace de recuperación a ' + email);
    modal.classList.remove('show');
    document.getElementById('reset-email').value = '';
});

// Cerrar modal al hacer click fuera
modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.remove('show');
});

// Auto-completar usuario recordado
const remembered = localStorage.getItem('rememberedUser');
if (remembered) {
    document.getElementById('username').value = remembered;
    document.getElementById('remember').checked = true;
}
