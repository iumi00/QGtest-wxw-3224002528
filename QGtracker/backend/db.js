// 引入Mysql数据库驱动 连接数据库
const mysql = require('mysql2/promise');
// 加载环境变量配置 避免将数据库密码明文写在代码中
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
    // 数据库服务器地址
    host: process.env.DB_HOST || 'localhost',
    // 数据库用户名
    user: process.env.DB_USER || 'root',
    // 数据库密码
    password: process.env.DB_PASSWORD || '',
    // 连接的数据库名称
    database: 'qg_tracker',
    // 当连接池满时排队等待
    waitForConnections: true,
    // 最大并发连接数
    connectionLimit: 10
});

// 将连接池对象导出，供其他文件使用
module.exports = pool;