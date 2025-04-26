const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    // 从请求头获取令牌
    const authHeader = req.headers['authorization'];

    // 检查 Authorization 头是否存在且格式正确
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1]; // 提取 Bearer 后的令牌

    try {
        // 验证令牌
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // 将解码信息挂载到请求对象
        next();
    } catch (error) {
        console.error('令牌验证失败:', error);
        return res.status(403).json({ message: '无效或过期的令牌' });
    }
};