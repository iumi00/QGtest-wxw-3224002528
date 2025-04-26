// 引入Express框架,用于构建Web服务器和API
const express = require('express');
// 引入bcrypt,用于密码哈希和验证
const bcrypt = require('bcrypt');
// 引入dotenv模块，将配置信息存储在.env 文件中，加载.env文件中的环境变量
require('dotenv').config();
// 引入jsonwebtoken模块
const jwt = require('jsonwebtoken');
// 引入authMiddleware自定义身份验证中间件
const authMiddleware = require('./middleware/authMiddleware');
// // 引入CORS中间件,解决跨域请求问题
const cors = require('cors');
// 引入数据库连接池配置
const pool = require('./db');

// 添加token密钥配置，使用环境变量
if (!process.env.JWT_SECRET) {
    console.error('错误：未设置 JWT_SECRET 环境变量！');
    process.exit(1); // 强制退出程序
}
const JWT_SECRET = process.env.JWT_SECRET;

// 创建Express应用实例
const app = express();

// 启用CORS中间件,允许跨域请求
app.use(cors());

// 启用JSON解析中间件,处理请求体中的JSON数据
app.use(express.json());

// 处理根路径的GET请求
app.get('/', (req, res) => {
    res.send('项目进度跟踪系统 API 运行中');
});

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// 创建一个新的路由器实例
const router = express.Router();

// 在express路由中处理multipart/form-data
const multer = require('multer');

// 统一multer配置
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const sanitizedName = originalname.normalize('NFC');
        cb(null, `${Date.now()}-${sanitizedName}`);
    }
});

// 创建一个 multer 实例
const upload = multer({
    storage: storage,
    preservePath: true
});

// 允许通过 /uploads 路径访问静态文件
app.use('/uploads', express.static('uploads'));

const path = require('path');

// 静态文件服务配置
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 统一错误处理中间件
app.use((err, req, res, next) => {
    console.error('[ERROR]', new Date().toISOString(), err.stack);

    // 处理JWT验证错误
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            code: 'INVALID_TOKEN',
            message: '无效的身份验证令牌'
        });
    }

    // 处理数据库查询错误
    if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            code: 'DB_TABLE_MISSING',
            message: '数据库表不存在'
        });
    }

    // 默认错误处理
    res.status(500).json({
        code: 'SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ?
            err.message : '服务器内部错误'
    });
});

// 登录

// 登录接口
app.post('/api/login', async (req, res) => { //定义POST请求路由,路径为'/api/login'
    try {
        // 获取请求参数，从请求体中解构出邮箱和密码
        const { email, password } = req.body;

        // 查询数据库,查找匹配的用户
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
            [email, email] // 同时检查邮箱和用户名字段
        );

        // 如果查询结果为空,说明邮箱不存在
        if (rows.length === 0) {
            // 返回401未授权错误
            return res.status(401).json({ message: '用户名/邮箱或密码错误' });
        }

        // 验证密码是否匹配(哈希对比)
        const isValid = await bcrypt.compare(password, rows[0].password);

        // 若密码不匹配
        if (!isValid) {
            // 返回401错误
            return res.status(401).json({ message: '用户名/邮箱或密码错误' });
        }

        // 生成JWT令牌（有效期1小时）
        const token = jwt.sign(
            {
                id: rows[0].id,
                username: rows[0].username,
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 返回令牌
        res.json({
            token,
            user: {
                id: rows[0].id,
                username: rows[0].username
            }
        });

        // 捕获异步操作中的错误
    } catch (error) {
        console.error(error); // 打印错误日志
        res.status(500).json({ message: '服务器错误' }); // 返回 500 内部服务器错误
    }
});

// 注册

// 注册接口
app.post('/api/register', async (req, res) => { //定义POST请求路由,路径为'/api/register'
    try {
        const { username, email, password } = req.body; //从请求体中解构出用户名、邮箱、密码 

        // 清理输入数据（去除首尾空格）
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        // 检查用户名是否已存在
        // !!!正常显示不了
        const [existingName] = await pool.query('SELECT * FROM users WHERE username = ?', [trimmedUsername]);
        if (existingName.length > 0) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 检查邮箱是否已存在
        const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: '邮箱已被注册' });
        }

        // 密码哈希处理（盐值为10，强度适中）
        const hashedPassword = await bcrypt.hash(password, 10);

        // 向数据库插入新用户记录
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [trimmedUsername, trimmedEmail, hashedPassword]
        );

        // 注册成功后自动生成令牌
        const token = jwt.sign(
            {
                id: result.insertId, // 使用插入的ID
                trimmedUsername,
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: '注册成功',
            token // 返回令牌
        }); //返回201创建成功状态码

    } catch (error) { //捕获异步操作中的错误
        console.error(error); //打印错误日志
        res.status(500).json({ message: '服务器错误' }); //返回500内部服务器错误
    }
});

// 修改密码

// 验证账户接口
app.post('/api/verify-account', async (req, res) => {
    try {
        const { username, email } = req.body;

        // 同时验证用户名和邮箱必须属于同一用户
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? AND email = ?',
            [username, email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                message: '用户名或邮箱不存在，或两者不匹配'
            });
        }

        // 验证成功后生成新令牌（有效期1小时）
        const token = jwt.sign(
            { id: users[0].id, username: users[0].username }, // 根据实际用户信息调整
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: '验证成功',
            token: token // 关键：返回新生成的令牌
        });

    } catch (error) {
        console.error('验证失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 重置密码接口
app.post('/api/reset-password', authMiddleware, async (req, res) => {
    try {
        const { newPassword, email } = req.body;
        const userId = req.user.id; // 通过中间件获取已认证用户ID

        // 验证邮箱是否属于当前用户
        const [users] = await pool.query(
            'SELECT * FROM users WHERE id = ? AND email = ?',
            [userId, email]
        );

        if (users.length === 0) {
            return res.status(403).json({ message: '无权修改此邮箱' });
        }

        // 直接通过邮箱更新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        res.json({ message: '密码重置成功' });

    } catch (error) {
        console.error('密码重置失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 受保护的路由
app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM projects');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取用户项目接口
app.get('/api/my-projects', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [projects] = await pool.query(`
  SELECT 
    p.*,
    COALESCE(pm.role, 'leader') AS role, -- 负责人默认角色
    leader.username AS leader_name
  FROM projects p
  LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
  JOIN users leader ON p.leader_id = leader.id
  WHERE p.leader_id = ? OR pm.user_id = ? -- 显示负责人项目+成员项目
`, [userId, userId, userId]);

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 新建项目

// 获取已注册用户的接口
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username FROM users');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});



// 提交新建项目接口
router.post('/projects', upload.array('documents'), async (req, res) => {
    try {
        console.log('Received members:', req.body.members); // 添加日志

        // 解析JSON字符串
        const members = JSON.parse(req.body.members);

        // 插入项目
        const [project] = await pool.query(
            'INSERT INTO projects (name, leader_id, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)',
            [req.body.name, req.body.leader_id, req.body.startDate, req.body.endDate, req.body.description]
        );

        // 自动添加负责人到成员表
        await pool.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
            [project.insertId, req.body.leader_id, 'leader'] // 角色设为leader
        );

        // 处理成员关系（覆盖逻辑）
        for (const member of members) {

            // 检查是否已存在记录
            const [existingRows] = await pool.query(
                'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
                [project.insertId, member.userId]
            );

            if (existingRows.length > 0) {
                const existing = existingRows[0];
                if (existing.role !== member.role) {
                    await pool.query(
                        'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
                        [member.role, project.insertId, member.userId]
                    );
                }
            } else {
                // 插入新记录
                await pool.query(
                    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                    [project.insertId, member.userId, member.role]
                );
            }
        }

        // 处理任务分配
        if (req.body.tasks) {
            const tasks = JSON.parse(req.body.tasks);
            const validStatus = ['default', 'being', 'finished'];
            // 过滤无效任务（assigneeId 必须存在）
            const validTasks = tasks.filter(task => !!task.assigneeId);

            // 批量插入优化
            const taskValues = validTasks.map(task => [
                project.insertId,
                task.title,
                task.assigneeId,
                validStatus.includes(task.status) ? task.status : 'default', // 状态兜底
                task.deadline || null,
                task.description || null
            ]);

            if (taskValues.length > 0) {
                await pool.query(
                    'INSERT INTO project_tasks (project_id, title, assignee_id, status, deadline, description) VALUES ?',
                    [taskValues]
                );
            }
        }

        // 获取上传文件信息
        const files = req.files.map(file => ({
            filename: file.filename, // 存储后的文件名（带时间戳）
            originalname: file.originalname, // 原始文件名
            path: file.path // 文件存储路径
        }));

        // 插入文档记录
        await Promise.all(files.map(file =>
            pool.query(
                'INSERT INTO project_documents (project_id, file_name, file_path) VALUES (?, ?, ?)',
                [
                    project.insertId,
                    file.originalname, // 使用原始文件名
                    file.path // 存储路径包含修改后的文件名
                ]
            )
        ));

        res.status(201).json({ message: '项目创建成功' });
    } catch (error) {
        console.error('错误详情:', error);
        res.status(500).json({ message: '服务器错误: ' + error.message });
    }
});

// 获取用户任务接口
router.get('/my-tasks', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [tasks] = await pool.query(`
      SELECT 
        t.*,
        p.name AS project_name,
        u.username AS assignee_name
      FROM project_tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON t.assignee_id = u.id
      WHERE t.assignee_id = ?
    `, [userId]);

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 模糊搜索项目接口
router.get('/search-projects', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const searchTerm = `%${req.query.q}%`; // 获取搜索词并包装为模糊查询格式

        const [projects] = await pool.query(`
      SELECT 
        p.*,
        -- 关键逻辑：从成员表获取角色，负责人特殊处理
        COALESCE(
          (SELECT role FROM project_members
           WHERE project_id = p.id AND user_id = ?),
          IF(p.leader_id = ?, 'leader', NULL)
        ) AS role,
        leader.username AS leader_name
      FROM projects p
      JOIN users leader ON p.leader_id = leader.id
      WHERE
        p.name LIKE ? OR
        p.description LIKE ? OR
        leader.username LIKE ?
    `, [userId, userId, searchTerm, searchTerm, searchTerm]);


        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取项目信息接口
app.get('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        // 获取项目基础信息
        const [project] = await pool.query(`
            SELECT
                p.*,
                u.username AS leader_name,
                COALESCE(
                    (SELECT role FROM project_members
                     WHERE project_id = p.id AND user_id = ?),
                    IF(p.leader_id = ?, 'leader', NULL)
                ) AS currentUserRole
            FROM projects p
            JOIN users u ON p.leader_id = u.id
            WHERE p.id = ?
        `, [userId, userId, projectId]);

        if (project.length === 0) {
            return res.status(404).json({ message: '项目未找到' });
        }

        // 获取成员信息
        const [members] = await pool.query(`
            SELECT pm.user_id AS id, u.username, pm.role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
        `, [projectId]);

        // 获取任务信息
        const [tasks] = await pool.query(`
            SELECT t.*, u.username as assignee 
            FROM project_tasks t
            JOIN users u ON t.assignee_id = u.id
            WHERE t.project_id = ?
        `, [projectId]);

        // 获取文档信息
        const [documents] = await pool.query(`
            SELECT
            file_name as name,
            file_path as storedName 
            FROM project_documents
            WHERE project_id = ?
        `, [projectId]);

        const memberCount = members.filter(m => m.role === 'member').length;
        const adminCount = members.filter(m => m.role === 'admin').length;
        const taskCount = tasks.length;
        const docCount = documents.length;

        res.json({
            ...project[0],
            members: members.filter(m => m.role === 'member').map(m => ({
                id: m.id,
                username: m.username
            })),
            admins: members.filter(m => m.role === 'admin').map(a => ({
                id: a.id,
                username: a.username
            })),
            tasks: tasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                deadline: t.deadline,
                assignee: t.assignee
            })),
            documents: documents.map(d => ({
                name: d.name,
                url: `http://localhost:3000/uploads/${d.storedName.replace(/\\/g, '/')}`
            })),
            memberCount: memberCount,
            adminCount: adminCount,
            taskCount: taskCount,
            docCount: docCount
        });

    } catch (error) {
        console.error('详细错误:', error); // 打印完整错误堆栈
        res.status(500).json({ message: '服务器错误: ' + error.message });
    }
});

// 项目文档下载接口
app.get('/download/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename); // 解码文件名
    const filePath = path.join(__dirname, 'uploads', filename);
    res.download(filePath, (err) => {
        if (err) res.status(404).send('文件未找到');
    });
});

const cron = require('node-cron'); // 引入 cron 定时任务模块

// 定义一个函数来更新项目状态
async function updateProjectStatus() {
    try {
        // 获取当前日期
        const now = new Date();

        // 查询所有状态为“未开始”且开始日期小于等于当前日期的项目
        const [projects] = await pool.query(`
            SELECT id, start_date, status
            FROM projects
            WHERE status = 'default' AND start_date <= ?
        `, [now]);

        // 如果没有符合条件的项目，直接返回
        if (projects.length === 0) return;

        // 更新项目状态为“进行中”
        for (const project of projects) {
            await pool.query('UPDATE projects SET status = ? WHERE id = ?', ['being', project.id]);
        }
    } catch (error) {
        console.error('更新项目状态失败:', error);
    }
}

// 设置定时任务，每分钟执行一次
cron.schedule('* * * * *', () => {
    updateProjectStatus();
}, {
    scheduled: true,
    timezone: "Asia/Shanghai"
});

// 更新任务状态接口
router.post(
    '/update-task-status/:taskId',
    authMiddleware,
    upload.array("attachments"),
    async (req, res) => {
        try {
            const taskId = parseInt(req.params.taskId);
            const { newStatus, note } = req.body;
            const userId = req.user.id;

            // 调试日志：打印接收到的参数
            console.log('Received newStatus:', newStatus);
            console.log('Received note:', note);
            console.log('Received files:', req.files);

            // 检查逻辑
            // const [existingApprovals] = await pool.query(
            //     'SELECT id FROM task_approvals WHERE task_id = ? AND approval_status = "pending"',
            //     [taskId]
            // );
            // if (existingApprovals.length > 0) {
            //     alert('请等待当前审批完成后再提交');
            //     return;
            // } else {

            const attachments = req.files.map(file => ({
                name: file.originalname, // 保留原始文件名
                // url: `http://localhost:3000/uploads/${file.filename}` 
                url: `uploads/${file.filename}`
            }));

            // 存储时序列化为 JSON 数组
            await pool.query(
                'INSERT INTO task_approvals (task_id, requester_id, new_status, attachments, note) VALUES (?, ?, ?, ?, ?)',
                [taskId, userId, newStatus, JSON.stringify(attachments), note]
            );

            // 存储序列化后的附件信息
            await pool.query(
                'INSERT INTO task_approvals (task_id, requester_id, new_status, attachments, note) VALUES (?, ?, ?, ?, ?)',
                [
                    taskId,
                    userId,
                    newStatus,
                    JSON.stringify(attachments),  // 存储包含URL的对象
                    note || ''
                ]
            );

            const serializedAttachments = JSON.stringify(attachments);

            // 检查任务是否存在
            const [taskCheck] = await pool.query('SELECT id FROM project_tasks WHERE id = ?', [taskId]);
            console.log('任务检查结果:', taskCheck);
            if (taskCheck.length === 0) {
                return res.status(404).json({ message: '任务不存在' });
            }

            // 获取当前任务状态
            const [currentTask] = await pool.query(
                'SELECT status FROM project_tasks WHERE id = ?',
                [taskId]
            );
            const originalStatus = currentTask[0].status;

            // 创建审批记录时保存原始状态
            await pool.query(
                'INSERT INTO task_approvals (approval_status) VALUES (?)',
                ['pending'],
                'INSERT INTO task_approvals (task_id, original_status, requester_id, new_status, attachments, note) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    taskId,
                    originalStatus,
                    userId,
                    newStatus,
                    JSON.stringify(attachments),
                    note || ''
                ]
            );

            // 自动状态变更逻辑
            if (newStatus === 'finished' && originalStatus === 'default') {
                await pool.query(
                    'UPDATE project_tasks SET status = "being" WHERE id = ?',
                    [taskId]
                );
            }
            // 提交审批请求
            const [approvalResult] = await pool.query(
                'INSERT INTO task_approvals (task_id, requester_id, new_status, attachments, note) VALUES (?, ?, ?, ?, ?)',
                [taskId, userId, newStatus, JSON.stringify(attachments), note]
            );
            const approvalId = approvalResult.insertId;
            await pool.query(
                'INSERT INTO task_approvals (task_id, requester_id, new_status, attachments, note) VALUES (?, ?, ?, ?, ?)',
                [taskId, userId, newStatus, JSON.stringify(attachments), note]
            );

            // 发送通知给负责人和管理员
            const [task] = await pool.query(`
    SELECT
    t.*,
    p.leader_id, 
    p.name AS project_name,
    u.username AS assignee_name,
    ta.note AS approval_note,
    ta.attachments AS attachments
  FROM project_tasks t
  JOIN projects p ON t.project_id = p.id
  JOIN users u ON t.assignee_id = u.id
  LEFT JOIN task_approvals ta ON t.id = ta.task_id
  WHERE t.id = ?
`, [taskId]);

            const [admins] = await pool.query(`
                  SELECT user_id
  FROM project_members
  WHERE project_id = ?
    AND role = 'admin'
    AND user_id IS NOT NULL  
`, [task[0].project_id]);

            const adminIds = admins
                .map(a => a.user_id)
                .filter(id => Number.isInteger(id));
            const receivers = [...new Set([
                task[0].leader_id,
                ...adminIds
            ])].filter(id =>
                id !== null &&
                id !== undefined &&
                Number.isInteger(id)
            );
            // 添加验证
            if (receivers.length === 0) {
                console.error('无法发送通知：没有有效的接收者');
                return;
            }
            await Promise.all(receivers.map(async receiverId => {
                await pool.query(
                    'INSERT INTO messages (user_id, content, type, related_id) VALUES (?, ?, ?, ?)',
                    [receiverId, '有新的任务完成申请需要审批', 'approval_request', approvalId] // 使用 approvalId
                );
            }));

            res.json({ message: '审批请求已提交' });
        }

        catch (error) {
            console.error('更新任务状态失败:', error); // 打印详细错误
            res.status(500).json({ message: '服务器错误: ' + error.message });
        }
    });

// 消息接口
app.get('/api/messages', authMiddleware, async (req, res) => {
    try {
        const [messages] = await pool.query(`
            SELECT 
  m.id,
  m.type,
  m.approval_status AS message_approval_status, -- 别名避免冲突
  ta.approval_status AS task_approval_status,
  m.content,
  m.created_at
FROM messages m
LEFT JOIN task_approvals ta ON m.related_id = ta.id
WHERE m.user_id = ?
        `, [req.user.id]);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

app.get('/api/messages/:id', authMiddleware, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const userId = req.user.id;

        const [rows] = await pool.query(
            ` SELECT 
        m.id,
        m.content,
        m.type,
        m.created_at,
        m.related_id,
        ta.task_id,  
        ta.attachments,
        ta.note,
        pt.title AS task_title,  
        u.username AS assignee_name
      FROM messages m
      LEFT JOIN task_approvals ta ON m.related_id = ta.id
      LEFT JOIN project_tasks pt ON ta.task_id = pt.id 
      LEFT JOIN users u ON ta.requester_id = u.id
      WHERE m.id = ? AND m.user_id = ?`,
            [messageId, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ code: 'MSG_404', message: '消息未找到' });
        }

        const row = rows[0];

        // 解析附件字段的旧数据
        let attachments = [];
        try {
            if (rows[0]?.attachments) {
                // 直接使用已解析的JSON对象
                if (typeof rows[0].attachments === 'string') {
                    attachments = JSON.parse(rows[0].attachments);
                } else {
                    attachments = rows[0].attachments;
                }
            }
        } catch (error) {
            console.warn('附件解析警告:', error.message);
        }

        // 返回标准化数据
        res.json({
            id: row.id,
            content: row.content,
            type: row.type,
            createdAt: row.created_at,
            relatedId: row.related_id,
            note: row.note || '',
            attachments: attachments,
            assignee: row.assignee_name || '未知负责人',
            taskId: row.task_id, // 确保字段存在
            taskName: row.task_title,  // 返回任务名称
        });

    } catch (error) {
        console.error('消息详情查询错误:', error);
        res.status(500).json({
            code: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});

// 审批接口
router.post('/handle-approval', authMiddleware, async (req, res) => {
    try {
        const { approvalId, isApproved } = req.body;
        const userId = req.user.id;

        // 验证审批记录存在
        const [approval] = await pool.query(`
            SELECT
        ta.*,
        pt.project_id,
        p.leader_id,  -- 添加项目负责人ID
        pt.title,     -- 添加任务标题
        pt.id AS task_id
    FROM task_approvals ta
    JOIN project_tasks pt ON ta.task_id = pt.id
    JOIN projects p ON pt.project_id = p.id  
    WHERE ta.id = ?`,
            [approvalId]
        );

        if (approval.length === 0) {
            return res.status(404).json({ message: '审批记录不存在' });
        }

        // 权限验证
        if (
            approval[0].leader_id !== userId &&
            !(await isProjectAdmin(approval[0].project_id, userId)
            )) {
            return res.status(403).json({ message: '无权操作' });
        }

        // 更新审批状态
        await pool.query(
            'UPDATE task_approvals SET approval_status = ?, approved_by = ? WHERE id = ?',
            [isApproved ? 'approved' : 'rejected', userId, approvalId]
        );

        // 如果批准，更新任务状态
        if (isApproved) {
            await pool.query(
                'UPDATE project_tasks SET status = ? WHERE id = ?',
                ['finished', approval[0].task_id]
            );
        }

        // 恢复逻辑
        if (!isApproved) {
            await pool.query(
                'UPDATE project_tasks SET status = ? WHERE id = ?',
                [approval[0].original_status, approval[0].task_id]
            );
        }

        // 发送通知
        await pool.query(
            'INSERT INTO messages (user_id, content, type, related_id) VALUES (?, ?, ?, ?)',
            [
                approval[0].requester_id,
                `任务【${approval[0].title}】的申请已被${req.user.username}${isApproved ? '批准' : '拒绝'}`,
                'approval_result',
                approvalId
            ]
        );

        res.json({ message: '操作成功' });
    } catch (error) {
        console.error('审批处理失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 辅助函数：检查用户是否是管理员
async function isProjectAdmin(projectId, userId) { // 参数改为projectId
    const [role] = await pool.query(`
        SELECT role 
        FROM project_members 
        WHERE project_id = ? 
        AND user_id = ?
        AND role = 'admin'
    `, [projectId, userId]);
    return role.length > 0;
}

// 获取任务详情的接口
app.get('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        if (isNaN(taskId)) {
            return res.status(400).json({ message: '无效的任务ID' });
        }

        // 查询数据库
        const [task] = await pool.query(`
            SELECT 
                t.*,
                p.name AS project_name,
                u.username AS assignee_name,
                ta.attachments AS approval_attachments 
            FROM project_tasks t
            LEFT JOIN task_approvals ta ON t.id = ta.task_id  
            JOIN projects p ON t.project_id = p.id
            JOIN users u ON t.assignee_id = u.id
            WHERE t.id = ?
        `, [taskId]);

        if (task.length === 0) {
            return res.status(404).json({ message: '任务不存在' });
        }

        // 安全解析attachments
        let attachments = [];
        try {
            attachments = task[0].attachments
                ? JSON.parse(task[0].attachments)
                : [];
        } catch (error) {
            // 兼容旧数据：如果是纯字符串，转换为数组
            if (typeof task[0].attachments === 'string') {
                attachments = [task[0].attachments];
            }
            console.warn('附件解析警告:', error.message);
        }

        // 返回数据
        res.json({
            ...task[0],
            attachments: attachments.map(file => ({
                name: file.split('/').pop(),
                url: `http://localhost:3000/uploads/${file.replace(/\\/g, '/')}` // 处理路径分隔符
            }))
        });

    } catch (error) {
        console.error('获取任务详情失败:', error);
        res.status(500).json({ code: 'SERVER_ERROR', message: '服务器错误' });
    }
});

// 申请成为管理员接口
app.post('/api/request-admin', authMiddleware, async (req, res) => {
    try {
        const { projectId } = req.body;
        const userId = req.user.id;

        // 获取项目负责人信息
        const [project] = await pool.query(
            'SELECT leader_id FROM projects WHERE id = ?',
            [projectId]
        );

        if (project.length === 0) {
            return res.status(404).json({ message: '项目不存在' });
        }

        const leaderId = project[0].leader_id;

        // 插入消息
        await pool.query(
            'INSERT INTO messages (user_id, content, type, related_id, approval_status) VALUES (?, ?, ?, ?, ?)',
            [leaderId, '有新的管理员权限申请', 'admin_request', projectId, 'pending']
        );

        res.json({ message: '申请已提交' });
    } catch (error) {
        console.error('申请失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 处理管理员申请接口
app.post('/api/handle-admin-request', authMiddleware, async (req, res) => {
    try {
        const { messageId, isApproved } = req.body;
        const approverId = req.user.id;

        // 验证消息有效性
        const [message] = await pool.query(`
            SELECT m.*, p.leader_id 
            FROM messages m
            JOIN projects p ON m.related_id = p.id
            WHERE m.id = ?
        `, [messageId]);

        if (message.length === 0 || message[0].leader_id !== approverId) {
            return res.status(403).json({ message: '无权操作' });
        }

        // 更新消息状态
        await pool.query(
            'UPDATE messages SET approval_status = ? WHERE id = ?',
            [isApproved ? 'approved' : 'rejected', messageId]
        );

        // 如果批准，添加管理员权限
        if (isApproved) {
            const requesterId = message[0].user_id;
            await pool.query(`
                INSERT INTO project_members (project_id, user_id, role)
                VALUES (?, ?, 'admin')
                ON DUPLICATE KEY UPDATE role = 'admin'
            `, [message[0].related_id, requesterId]);
        }

        // 发送通知给申请人
        await pool.query(
            'INSERT INTO messages (user_id, content, type) VALUES (?, ?, ?)',
            [message[0].user_id,
            `您管理员权限申请已被${isApproved ? '批准' : '驳回'}`,
                'admin_result']
        );

        res.json({ message: '操作成功' });
    } catch (error) {
        console.error('处理失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 将路由器挂载到应用的 /api 路径下
app.use('/api', router);

// 导出router
module.exports = router;

const PORT = process.env.PORT || 3000; // 获取环境变量中的端口号（用于部署）
app.listen(PORT, () => { // 启动服务器，监听指定端口
    console.log(`服务器运行在 http://localhost:${PORT}`); // 打印启动成功信息
}); 