document.addEventListener('DOMContentLoaded', function () {
    // 监听注册表单的提交事件
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        // 阻止默认提交行为
        e.preventDefault();

        // 获取表单字段值
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 密码一致性验证
        if (password !== confirmPassword) {
            document.getElementById('passwordError').style.display = 'block';
            return;
        }

        // 发送注册请求
        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            // 处理响应
            const data = await response.json();

            if (response.ok) {
                alert('注册成功，请登录');
                window.location.href = 'login.html';
            } else {
                alert(data.message || '注册失败');
            }
        } catch (error) {
            console.error('注册错误:', error);
            alert('网络错误，请稍后重试');
        }
    });
})