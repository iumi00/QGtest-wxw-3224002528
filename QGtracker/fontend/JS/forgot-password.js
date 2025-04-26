document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('verifyForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const errorMsg = document.getElementById('errorMsg');

        try {
            const response = await fetch('http://localhost:3000/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message);

            // 保存令牌到 localStorage
            localStorage.setItem('token', data.token); // 假设后端返回 { token: "xxx" }

            // 切换表单显示
            document.getElementById('verifyForm').style.display = 'none';
            document.getElementById('resetForm').style.display = 'block';

        } catch (error) {
            showError(errorMsg, error.message);
        }
    });

    document.getElementById('resetForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passError = document.getElementById('passError');
        const token = localStorage.getItem('token'); // 获取保存的令牌

        if (!token) {
            showError(passError, '请先验证账户以获取令牌');
            return;
        }


        if (newPassword !== confirmPassword) {
            showError(passError, '两次输入密码不一致');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    newPassword,
                    email: document.getElementById('email').value
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message);

            alert('密码重置成功！');
            window.location.href = 'login.html';

        } catch (error) {
            showError(passError, error.message);
        }
    });

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }
})