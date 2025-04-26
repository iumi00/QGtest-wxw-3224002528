document.addEventListener('DOMContentLoaded', function () {
    // 页面加载时自动填充凭证
    const rememberEmail = localStorage.getItem('rememberEmail');
    const rememberPassword = localStorage.getItem('rememberPassword');

    if (rememberEmail && rememberPassword) {
        // 自动填充表单
        document.querySelector('input[type="text"]').value = rememberEmail;
        document.querySelector('input[type="password"]').value = rememberPassword;
        document.getElementById('rememberMe').checked = true;
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.querySelector('input[type="text"]').value;
        const password = document.querySelector('input[type="password"]').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            //登录成功逻辑
            if (response.ok) {
                localStorage.setItem('token', data.token); // 存储令牌
                localStorage.setItem('user', JSON.stringify(data.user)); // 存储用户信息

                // 记住密码时存储凭证
                if (rememberMe) {
                    localStorage.setItem('rememberEmail', email);
                    localStorage.setItem('rememberPassword', password);
                } else {
                    localStorage.removeItem('rememberEmail');
                    localStorage.removeItem('rememberPassword');
                }

                window.location.href = 'index.html';

            } else {
                alert(data.message || '登录失败');
            }
        } catch (error) {
            console.error('登录错误:', error);
            alert('网络错误，请稍后重试');
        }
    });
})