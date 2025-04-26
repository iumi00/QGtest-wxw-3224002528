document.addEventListener('DOMContentLoaded', function () {
    // 从localStorage获取用户信息
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
        const username = user.username;
        const hasChinese = /[\u4E00-\u9FFF]/.test(username); // 检测是否包含中文字符

        // 根据字符类型处理显示内容
        let avatarText = '';
        if (hasChinese) {
            // 中文：取最后两个汉字
            avatarText = username.slice(-2);
        } else {
            // 英文：取最后一个单词
            const words = username.trim().split(/\s+/);
            avatarText = words.length > 0 ? words[words.length - 1] : '';
        }

        // 更新DOM内容
        document.querySelector('.avatar').textContent = avatarText;
        document.querySelector('.name').textContent = username;
    }

    // 加载项目列表
    renderProjects();

    // 加载任务列表
    renderTasks();

    // 加载消息列表
    renderMessages();

    // 退出登录处理
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('确定退出登录吗?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    });

    // 获取导航栏元素
    const projectNav = document.querySelector('.project-nav');
    const taskNav = document.querySelector('.task-nav');
    const messageNav = document.querySelector('.message-nav');
    const navs = document.querySelectorAll('.nav-list ul li');

    // 定义导航栏添加点击事件的函数
    const ClickSwitch = function (nav) {
        nav.addEventListener('click', function () {
            // 重复点击直接返回
            if (this.classList.contains('active')) {
                return;
            }
            else {
                // 通过nav直接获取对应container
                const containersName = nav.classList[2].replace('-nav', 's');
                // 遍历导航栏列表取消所有活动模块
                navs.forEach(function (nav) {
                    const containerName = nav.classList[2].replace('-nav', 's');
                    nav.classList.remove('active');
                    document.querySelector(`.${containerName}`).classList.add('hide');
                })
                // 给被点击的导航栏及对应模块添加活动类名
                this.classList.add('active');
                document.querySelector(`.${containersName}`).classList.remove('hide');
                if (containersName === 'messages') {
                    renderMessages();
                } else if (containersName === 'projects') {
                    renderProjects();
                } else if (containersName === 'tasks') {
                    renderTasks();
                }
            }
        })
    }

    // 调用函数给导航栏添加点击事件
    ClickSwitch(projectNav);
    ClickSwitch(taskNav);
    ClickSwitch(messageNav);

    // 新建项目

    // 新建项目按钮点击事件
    const newitemBtn = document.querySelector('.projects-top .newitem');
    const newitemCard = document.querySelector('.project-add');

    newitemBtn.addEventListener('click', function () {
        initMembers().then(() => {
            if (newitemCard.classList.contains('hide')) {
                newitemCard.classList.remove('hide');
            } else {
                return;
            }
        })
    })

    // 新建项目弹窗取消按钮
    const newitemCancelBtn = document.querySelector('.project-add-card .button-group .cancel-btn');

    newitemCancelBtn.addEventListener('click', function () {
        if (!newitemCard.classList.contains('hide')) {
            if (confirm('确定取消上传该项目吗?')) {
                newitemCard.classList.add('hide');
            }
        } else {
            return;
        }
    })

    // 获取当前用户并填充负责人
    if (user) {
        document.querySelector('.project-meta em').textContent = user.username;
    }

    async function initMembers() {
        try {
            await fetchUsers();
            updateAdminSelect();
            updateTaskMemberSelect();
        } catch (error) {
            console.error('初始化成员失败:', error);
        }
        return Promise.resolve(); // 明确返回 Promise
    }

    // 获取用户列表并填充成员选择框
    async function fetchUsers() {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token 不存在，请重新登录');
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const users = await response.json();

            const memberSelect = document.querySelector('.member-group select');
            const currentUserId = user ? user.id : null;

            // 清空现有选项
            memberSelect.innerHTML = '<option value="">选择成员</option>';

            users.forEach(user => {
                if (user.id === currentUserId) return; // 排除当前用户

                const option = document.createElement('option');
                option.value = user.id;
                option.text = user.username;
                memberSelect.appendChild(option);
            });
        } catch (error) {
            console.error('加载用户失败:', error);
            return []; // 返回空数组避免后续错误
        }
    }

    // 更新管理员选项框（显示所有已添加成员）
    function updateAdminSelect() {
        const adminSelect = document.querySelector('.admin-group select');
        const memberList = document.querySelectorAll('#memberList li');

        // 清空原有选项，只保留默认提示项
        adminSelect.innerHTML = '<option value="">请选择管理员</option>';

        memberList.forEach(function (li) {
            const memberName = li.querySelector('span').textContent;
            const memberId = li.dataset.userId; // 获取存储的用户 ID
            // 创建新的 option 元素
            const option = document.createElement('option');
            option.text = memberName; // 显示的文本
            option.value = memberId; // 使用用户 ID 作为 value

            // 检查是否已经存在相同内容的 option
            const existingOptions = adminSelect.options;
            let isDuplicate = false;
            for (let i = 0; i < existingOptions.length; i++) {
                if (existingOptions[i].text === memberName) {
                    isDuplicate = true;
                    break;
                }
            }

            // 如果不是重复项，则添加到 select 中
            if (!isDuplicate) {
                adminSelect.appendChild(option);
            }
        });
    }

    // 更新任务负责成员选项框（成员 + 当前用户）
    function updateTaskMemberSelect() {
        document.querySelectorAll('.task-assignee').forEach(select => {
            // 保存当前选中的值
            const selectedValue = select.value;

            // 清空选项时保留默认提示
            select.innerHTML = '<option value="">选择负责成员</option>';

            // 添加当前用户选项
            if (user) {
                const currentUserOption = document.createElement('option');
                currentUserOption.value = user.id.toString();
                currentUserOption.textContent = user.username;
                select.appendChild(currentUserOption);
            }

            // 添加成员选项
            document.querySelectorAll('.member-item').forEach(memberItem => {
                const memberId = memberItem.dataset.userId;
                const memberName = memberItem.querySelector('span').textContent;

                const option = document.createElement('option');
                option.value = memberId.toString();
                option.textContent = memberName;
                select.appendChild(option);
            });

            // 恢复选中的值
            select.value = selectedValue
        });
    }

    // 添加成员时的统一处理
    document.querySelectorAll('.add-member-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const select = e.target.previousElementSibling;
            const selectedValue = select.value;
            const selectedText = select.options[select.selectedIndex].text;

            if (!selectedValue) return alert('请选择成员');

            const targetList = e.target.closest('.member-group')
                ? '#memberList'
                : '#adminList';
            const list = document.querySelector(targetList);
            const exists = Array.from(list.children).some(item =>
                item.textContent.includes(selectedText)
            );

            if (exists) return alert('成员已存在');

            const li = document.createElement('li');

            // 根据目标列表设置不同的类名
            if (targetList === '#memberList') {
                li.className = 'member-item';
            } else {
                li.className = 'admin-item';
            }

            // 添加自定义属性来存储 option 的 value
            li.dataset.userId = selectedValue;

            li.innerHTML = `
            <span>${selectedText}</span>
                <button class="remove-btn">×</button>
        `;
            list.appendChild(li);

            select.selectedIndex = 0;

            // 同步更新所有依赖选项
            updateAdminSelect();
            updateTaskMemberSelect();
        });
    });

    // 删除成员时的统一处理
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const parent = e.target.closest('.member-item, .admin-item');
            const isMember = parent.classList.contains('member-item');
            const username = parent.querySelector('span').textContent;

            // 从DOM中移除
            parent.remove();

            // 同步更新所有依赖选项
            updateAdminSelect();
            updateTaskMemberSelect();

            // 如果删除的是成员，同步删除管理员列表中的同名用户
            if (isMember) {
                const adminList = document.querySelector('#adminList');
                const adminItems = adminList.querySelectorAll('.admin-item');

                adminItems.forEach(adminItem => {
                    if (adminItem.querySelector('span').textContent === username) {
                        adminItem.remove();
                    }
                });
            }
        }
    });

    // 删除按钮点击事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            e.target.closest('.member-item, .admin-item').remove();
        }
    });

    // 添加任务项
    document.querySelector('.add-task-btn').addEventListener('click', () => {
        const taskList = document.getElementById('taskList');
        const taskItem = document.createElement('div');
        taskItem.className = 'taskItem';

        taskItem.innerHTML = `
                <input type="text" placeholder="任务名称" required class="task-title">
                <select class="task-assignee">
                    <option value="">选择负责成员</option>
                </select>
                <textarea placeholder="任务说明" required class="task-desc"></textarea>
                <div class="input-group deadline-group">
                    <label for="deadline">截止日期：</label>
                    <input type="date" id="deadline" class="task-deadline" required>
                </div>
                <button class="remove-task">×</button>
            `;
        // 添加实时验证
        taskItem.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => validateTask(input));
        });

        taskList.appendChild(taskItem);
        updateTaskMemberSelect(); // 任务项添加后更新选项
    });

    function validateTask(input) {
        const taskItem = input.closest('.taskItem');
        const isValid = taskItem.querySelectorAll(':invalid').length === 0;
        taskItem.style.border = isValid ? '' : '2px solid red';
    }

    // 删除任务项
    document.getElementById('taskList').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-task')) {
            e.target.closest('.taskItem').remove();
        }
    });

    // 文件大小格式化函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]);
    }

    const uploadArea = document.getElementById('uploadArea');
    const fileList = document.getElementById('fileList');
    let uploadedFiles = [];

    // 文件上传处理
    if (uploadArea) {
        // 点击上传区域触发文件选择
        uploadArea.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt';

            input.onchange = handleFileSelect;
            input.click();
        });

        // 拖放文件处理
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            uploadArea.classList.add('highlight');
        }

        function unhighlight() {
            uploadArea.classList.remove('highlight');
        }

        uploadArea.addEventListener('drop', handleDrop, false);
    }

    // 文件选择处理
    function handleFileSelect(e) {
        // 优先从 dataTransfer 获取（拖放场景）
        const files = e.dataTransfer?.files || e.target.files;
        if (!files) return;
        handleFiles(Array.from(files));
    }

    // 拖放文件处理
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (!files) return;
        handleFiles(Array.from(files));
    }

    // 处理文件列表
    function handleFiles(files) {
        uploadedFiles = []; // 初始化文件列表
        [...files].forEach(file => {
            if (file.size > 50 * 1024 * 1024) { // 恢复文件大小检查
                alert('文件大小不能超过50MB');
                return;
            }
            uploadedFiles.push(file); // 直接存储原始File对象
            displayFile(file); // 传入原始file对象
        });
    }

    // 显示文件列表
    function displayFile(file) {
        const li = document.createElement('div');
        li.className = 'file-item';

        const typeIcons = {
            pdf: '📕',
            jpg: '🖼️',
            png: '🖼️',
            doc: '📘',
            docx: '📘',
            txt: '📄'
        };

        const isImage = file.type.startsWith('image/');

        li.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${typeIcons[file.type.split('/')[1]] || '📄'}</span>
            <div>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
        </div>
        <div class="file-preview ${isImage ? 'image-preview' : ''}">
            ${isImage ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}" class="preview-img">` : ''}
        </div>
        <button class="remove-file">×</button>
    `;

        li.querySelector('.remove-file').addEventListener('click', () => {
            const index = uploadedFiles.indexOf(file); // 通过文件对象查找索引
            if (index > -1) {
                uploadedFiles.splice(index, 1);
                li.remove();
                // 释放不再使用的对象URL（避免内存泄漏）
                URL.revokeObjectURL(li.querySelector('img')?.src);
            }
        });

        fileList.appendChild(li);
    }

    // 表单提交处理
    document.querySelector('.create-btn').addEventListener('click', async (e) => {
        e.preventDefault();

        // 检查项目基础信息
        const projectName = document.getElementById('projectName').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const members = [
            ...document.querySelectorAll('#memberList li'),
            ...document.querySelectorAll('#adminList li')
        ];

        // 验证项目名称
        if (!projectName) {
            alert('项目名称不能为空');
            document.getElementById('projectName').focus();
            return;
        }

        // 验证至少一个成员
        if (members.length === 0) {
            alert('请至少添加一个项目成员');
            return;
        }

        // 验证时间范围
        if (!startDate || !endDate) {
            alert('请填写完整的起止时间');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            alert('结束时间不能早于开始时间');
            return;
        }

        // 检查任务数据
        let hasTaskError = false;
        const tasks = [];
        document.querySelectorAll('.taskItem').forEach(taskItem => {
            const title = taskItem.querySelector('.task-title').value.trim();
            const assigneeId = taskItem.querySelector('.task-assignee').value;
            const deadline = taskItem.querySelector('.task-deadline').value;
            const description = taskItem.querySelector('.task-desc').value.trim();  // 获取任务描述

            // 任务名称必填
            if (!title) {
                taskItem.style.border = '2px solid red';
                hasTaskError = true;
                return;
            }

            // 负责人必选
            if (!assigneeId) {
                taskItem.style.border = '2px solid red';
                hasTaskError = true;
                return;
            }

            tasks.push({ title, assigneeId, status: 'default', deadline, description });
        });

        // 如果存在任务错误则拦截
        if (hasTaskError) {
            alert('请完善所有任务信息（红色边框项）');
            return;
        }

        // 收集动态成员数据
        const memberList = [];
        document.querySelectorAll('.member-item').forEach(li => {
            const userId = li.dataset.userId;
            const username = li.querySelector('span').textContent;
            memberList.push({ userId, username, role: 'member' });
        });
        const adminList = [];
        document.querySelectorAll('.admin-item').forEach(li => {
            const userId = li.dataset.userId;
            const username = li.querySelector('span').textContent;
            adminList.push({ userId, username, role: 'admin' });
        });

        // 构造FormData
        const formData = new FormData();

        // 去重逻辑：admin优先级高于member，相同userId时跳过member
        const uniqueUsers = new Map(); // 使用Map保证插入顺序

        // 先处理admin（相同userId的admin会覆盖member）
        adminList.forEach(admin => uniqueUsers.set(admin.userId, admin));

        // 再处理member（只添加未存在的userId）
        memberList.forEach(member => {
            if (!uniqueUsers.has(member.userId)) {
                uniqueUsers.set(member.userId, member);
            }
        });

        const allMembers = Array.from(uniqueUsers.values());

        // 添加文件到FormData（关键修改）
        uploadedFiles.forEach(file => {
            formData.append('documents', file); // 字段名必须与后端multer配置一致
        });

        formData.append('name', document.getElementById('projectName').value);
        formData.append('startDate', document.getElementById('startDate').value);
        formData.append('endDate', document.getElementById('endDate').value);
        formData.append('description', document.getElementById('projectDesc').value);
        formData.append('leader_id', user.id); // 当前登录用户作为负责人
        formData.append('members', JSON.stringify(allMembers));
        // 添加任务数据到FormData
        formData.append('tasks', JSON.stringify(tasks));

        try {
            const response = await fetch('http://localhost:3000/api/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                alert('项目创建成功！');
                // await renderProjects(); // 新增：立即刷新列表
                // newitemCard.classList.add('hide'); // 关闭新建卡片
                location.reload();
            } else {
                const errorData = await response.json();
                alert(`创建失败：${errorData.message}`);
            }
        } catch (error) {
            console.error('网络错误:', error);
            alert('网络连接问题，请稍后重试');
        }
    });

    // 渲染我的项目列表函数
    async function renderProjects() {
        const projectsList = document.querySelector('.projects-list ul');
        if (!projectsList) return;

        // 清空现有列表
        projectsList.innerHTML = '';

        try {
            const projects = await fetchMyProjects();
            console.log('项目数据:', projects); // 添加调试日志

            projects.forEach(project => {
                const li = document.createElement('li');
                li.dataset.projectId = project.id; // 添加项目ID标识

                // 根据角色添加标签
                const roleBadge = {
                    leader: '<span class="role role-leader">负责人</span>',
                    admin: '<span class="role role-admin">管理员</span>',
                    member: '<span class="role role-member">普通成员</span>'
                }[project.role];

                // 根据状态添加样式
                const statusMap = {
                    default: ['未开始', 'default'],    // 假设数据库状态为 'default'
                    being: ['进行中', 'being'],        // 对应数据库 'being'
                    finished: ['已完成', 'finished']   // 对应数据库 'finished'
                };
                const [statusText, statusClass] = statusMap[project.status] || ['未知状态', 'default'];

                // 格式化日期
                const startDate = new Date(project.start_date).toLocaleDateString('zh-CN');
                const endDate = new Date(project.end_date).toLocaleDateString('zh-CN');

                li.innerHTML = `
        ${roleBadge}
        <h5>${project.name || '未命名项目'}</h5>
        <p class="status ${statusClass}">${statusText}</p>
        <div class="progress"></div>
        <p class="responsible-person">👤 负责人：<span>${project.leader_name}</span></p>
        <p class="start-time">📅 开始：<span>${startDate}</span></p>
        <p class="end-time">📅 预计结束：<span>${endDate}</span></p>
      `;

                projectsList.appendChild(li);
                // 绑定点击事件
                bindProjectClick();
            });

        } catch (error) {
            console.error('渲染项目列表失败:', error);
        }
    }

    // 添加搜索功能
    const searchInput = document.querySelector('.search input');
    const searchButton = document.querySelector('.search-button');

    // 防抖函数（300ms延迟）
    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(executeSearch, 300);
    }

    // 渲染函数
    function createProjectElement(project) {
        const li = document.createElement('li');

        // 处理可能的空值
        const rawRole = project.role || 'member'; // 默认普通成员
        const role = rawRole.toLowerCase().trim();
        const validRole = ['leader', 'admin', 'member'].includes(role) ? role : 'member';

        // 状态映射
        const statusMap = {
            default: ['未开始', 'default'],
            being: ['进行中', 'being'],
            finished: ['已完成', 'finished']
        };
        const [statusText, statusClass] = statusMap[project.status] || ['未知状态', 'default'];

        li.innerHTML = `
    <span class="role role-${validRole}">${getRoleLabel(validRole)}</span>
    <h5>${project.name}</h5>
    <p class="status ${statusClass}">${statusText}</p>
    <div class="progress"></div>
    <p class="responsible-person">👤 负责人：<span>${project.leader_name}</span></p>
    <p class="start-time">📅 开始：<span>${new Date(project.start_date).toLocaleDateString('zh-CN')}</span></p>
    <p class="end-time">📅 预计结束：<span>${new Date(project.end_date).toLocaleDateString('zh-CN')}</span></p>
  `;

        return li;
    }

    // 角色标签转换函数
    function getRoleLabel(role) {
        return {
            leader: '负责人',
            admin: '管理员',
            member: '普通成员'
        }[role] || '成员';
    }

    // 执行搜索
    async function executeSearch() {
        const searchTerm = searchInput.value.trim();
        const projectsList = document.querySelector('.projects-list ul');

        if (!searchTerm) {
            await renderProjects(); // 显示所有项目
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/search-projects?q=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('搜索失败');
            const projects = await response.json();

            // 清空现有列表
            projectsList.innerHTML = '';

            // 渲染搜索结果
            projects.forEach(project => {
                const li = createProjectElement(project); // 复用原有渲染逻辑
                projectsList.appendChild(li);
            });

        } catch (error) {
            console.error('搜索错误:', error);
            projectsList.innerHTML = '<li class="error-msg">🔍 搜索失败，请稍后重试</li>';
        }
    }

    // 绑定事件
    searchInput.addEventListener('input', debounceSearch);
    searchButton.addEventListener('click', executeSearch);

    // 项目详情卡

    // 添加项目点击事件监听
    function bindProjectClick() {
        document.querySelectorAll('.projects-list li').forEach(projectItem => {
            projectItem.addEventListener('click', async function () {
                const projectId = this.dataset.projectId; // 需要先在渲染时添加data-project-id属性
                const project = await fetchProjectDetail(projectId);

                // 显示详情卡片
                document.querySelector('.project-detail').classList.remove('hide');

                // 填充数据
                renderProjectDetail(project);
            });
        });
    }

    // 添加获取项目详情的API函数
    async function fetchProjectDetail(projectId) {
        try {
            const response = await fetchWithAuth(`/api/projects/${projectId}`);
            if (!response.ok) {
                throw new Error(`HTTP错误 ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('获取项目详情失败:', error);
            alert('加载详情失败: ' + error.message);
            return null; // 返回空值防止后续崩溃
        }
    }

    // 实现详情渲染函数
    function renderProjectDetail(project) {
        const detailCard = document.querySelector('.project-detail-card');

        if (!detailCard) return;

        const leaderName = project.leader_name || '未知负责人';
        detailCard.querySelector('.leader-name').textContent = project.leader_name || '未知负责人';
        detailCard.querySelector('.leader-avatar').textContent = leaderName.slice(0, 2).toUpperCase();

        // 更新头部
        detailCard.querySelector('h3').textContent = project.name;
        const actionBtn = detailCard.querySelector('.detail-card-head button');

        // 动态按钮
        if (project.currentUserRole === 'leader' || project.currentUserRole === 'admin') {
            actionBtn.textContent = '✏️ 编辑项目';
            actionBtn.classList.add('edit-btn');
            actionBtn.onclick = () => openEditMode(project);
        } else {
            actionBtn.textContent = '🛡️ 申请管理员权限';
            actionBtn.classList.add('apply-admin-btn');
            actionBtn.onclick = () => applyForAdmin(project.id);
        }

        // 负责人信息
        detailCard.querySelector('.leader-name').textContent = project.leader_name;

        const hasChinese = /[\u4E00-\u9FFF]/.test(leaderName);
        const avatarText = hasChinese ? leaderName.slice(-2) : leaderName.split(/\s+/).pop();
        detailCard.querySelector('.leader-avatar').textContent = avatarText;

        // 项目描述
        detailCard.querySelector('.project-description').textContent = project.description || '暂无描述';

        // 成员和管理员
        detailCard.querySelector('.member-list').innerHTML = project.members
            .map(m => `<li>${m.username}</li>`).join('');
        detailCard.querySelector('.admin-list').innerHTML = project.admins
            .map(a => `<li>${a.username}</li>`).join('');

        // 项目文档
        detailCard.querySelector('.document-list').innerHTML = project.documents
            .map(d => `
        <a href="${d.url}" class="doc-item">
            <span class="file-icon">${getFileIcon(d.name.split('.').pop())}</span>
            <div>
                <p class="doc-name">${d.name}</p>
            </div>
        </a>
    `).join('');

        // 任务分配
        detailCard.querySelector('.task-grid').innerHTML = project.tasks
            .map(t => `
        <div class="task-card ${t.status}">
            <div class="task-header">
                <h5>${t.title}</h5>
                <span class="task-status">${t.status}</span>
            </div>
            <p class="task-desc">${t.description || '暂无描述'}</p>
            <div class="task-meta">
                <span>负责人：${t.assignee}</span>
                <span>截止：${new Date(t.deadline).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');

        // 成员渲染
        const memberList = detailCard.querySelector('.member-list');
        memberList.innerHTML = project.members.map(m => `
        <li data-user-id="${m.id}">${m.username}</li>
    `).join('');

        // 管理员渲染
        const adminList = detailCard.querySelector('.admin-list');
        adminList.innerHTML = project.admins.map(a => `
        <li data-user-id="${a.id}">${a.username} 👑</li>
    `).join('');

        // 任务渲染
        const taskGrid = detailCard.querySelector('.task-grid');
        taskGrid.innerHTML = project.tasks.map(t => `
        <div class="task-card ${t.status}">
            <div class="task-header">
                <h5>${t.title}</h5>
                <span class="task-status">${t.status}</span>
            </div>
            ${t.description ? `<p class="task-desc">${t.description}</p>` : ''}
            <div class="task-meta">
                <span>负责人：${t.assignee}</span>
                <span>截止：${new Date(t.deadline).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');

        // 文档渲染
        const docList = detailCard.querySelector('.document-list');
        docList.innerHTML = project.documents.map(d => `
        <a href="${d.url}" class="doc-item" download>
            <span class="file-icon">${getFileIcon(d.name.split('.').pop())}</span>
            <div>
                <p class="doc-name">${d.name}</p>
            </div>
        </a>
    `).join('');

        // 时间信息
        detailCard.querySelector('.start-date').textContent =
            new Date(project.start_date).toLocaleDateString();
        detailCard.querySelector('.end-date').textContent =
            new Date(project.end_date).toLocaleDateString();

        // 显示项目成员、管理员、项目文档和任务分配信息
        document.querySelector('.memberCount').textContent = project.memberCount;
        document.querySelector('.adminCount').textContent = project.adminCount;
        document.querySelector('.docCount').textContent = project.docCount;
        document.querySelector('.taskCount').textContent = project.taskCount;
    }

    // 补充工具函数
    function getFileIcon(ext) {
        const icons = {
            pdf: '📕',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
            doc: '📘', docx: '📘',
            txt: '📄'
        };
        return icons[ext.toLowerCase()] || '📁';
    }

    // 关闭功能
    document.querySelector('.close-btn').addEventListener('click', () => {
        document.querySelector('.project-detail').classList.add('hide');
    });

    // Tasks区

    // 渲染任务列表函数
    async function renderTasks() {
        const taskList = document.querySelector('.task-list ul');
        if (!taskList) return;

        taskList.innerHTML = '';

        try {
            const tasks = await fetchMyTasks();

            tasks.forEach(task => {
                const li = document.createElement('li');
                li.dataset.taskId = task.id;

                // 状态映射
                const statusMap = {
                    default: ['未开始', 'default'],
                    being: ['进行中', 'being'],
                    finished: ['已完成', 'finished']
                };
                const [statusText, statusClass] = statusMap[task.status] || ['未知状态', 'default'];

                li.innerHTML = `
        <p class="task-item">所属项目：${task.project_name}</p>
        <h5 class="task-name">${task.title}</h5>
        <p class="task-description">${task.description || '无描述'}</p>
        <div class="status-box">
          <div class="task-status ${statusClass}">${statusText}</div>
          <button>更新任务状态</button>
        </div>
        <p class="task-endtime">📅 截止时间：<span>${new Date(task.deadline).toLocaleDateString('zh-CN')}</span></p>
      `;

                taskList.appendChild(li);
                bindTaskStatusUpdate();
            });
        } catch (error) {
            console.error('渲染任务失败:', error);
        }
    }

    // 绑定任务状态更新按钮事件（动态元素）
    function bindTaskStatusUpdate() {
        document.querySelectorAll('.status-box button').forEach(button => {
            button.removeEventListener('click', handleStatusUpdate); // 避免重复绑定
            button.addEventListener('click', handleStatusUpdate);
        });
    }

    async function handleStatusUpdate(e) {
        const taskItem = e.target.closest('li');
        const taskId = taskItem.dataset.taskId;
        const updateStatusDiv = document.querySelector('.update-status');

        if (!taskId || taskId === 'null') {
            alert('无效的任务ID');
            return;
        }

        try {
            const task = await fetchTaskDetail(taskId);
            if (!task) return;

            // 显示已有的 update-status 弹窗
            const modalTitle = updateStatusDiv.querySelector('.update-card h4');
            modalTitle.textContent = `更新【${task.title}】任务状态`; // 插入任务名称

            // 显示弹窗
            updateStatusDiv.classList.remove('hide');

            // 绑定取消按钮事件
            document.querySelector('.cancel-update').addEventListener('click', () => {
                updateStatusDiv.classList.add('hide');
            });

            // 修改表单提交逻辑
            document.getElementById('updateTaskForm').onsubmit = async (e) => {
                e.preventDefault();

                const formData = new FormData();
                formData.append('newStatus', document.getElementById('newStatus').value);
                formData.append('note', document.getElementById('updateNote').value);

                // 添加附件
                Array.from(document.getElementById('updateFiles').files).forEach(file => {
                    formData.append('attachments', file);
                });

                try {
                    const response = await fetchWithAuth(`/api/update-task-status/${taskId}`, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        updateStatusDiv.classList.add('hide');
                        await renderTasks();
                        alert('状态更新成功！');
                    }
                } catch (error) {
                    console.error('更新失败:', error);
                    alert('更新失败: ' + error.message);
                }
            };
        } catch (error) {
            console.error('加载任务失败:', error);
            updateStatusDiv.classList.add('hide');
        }
    }

    // fetchTaskDetail 函数
    async function fetchTaskDetail(taskId) {
        try {
            const response = await fetchWithAuth(`/api/tasks/${taskId}`);
            if (!response.ok) {
                throw new Error(`HTTP错误 ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('获取任务详情失败:', error);
            alert('加载任务详情失败: ' + error.message);
            return null; // 返回空值防止后续崩溃
        }
    }

    // 关闭弹窗
    document.querySelector('.cancel-update').addEventListener('click', () => {
        document.querySelector('.update-status').classList.add('hide');
    });

    // Messages渲染
    async function renderMessages() {
        try {
            const list = document.querySelector('.message-list ul');
            if (!list) return;

            list.innerHTML = '<li class="loading">加载中...</li>';

            const response = await fetchWithAuth('/api/messages');
            if (!response.ok) throw new Error(`HTTP错误 ${response.status}`);

            const messages = await response.json();
            console.log('消息数据:', messages);

            list.innerHTML = messages.map(msg => {
                // 解析附件
                let attachments = [];
                try {
                    attachments = msg.attachments ? JSON.parse(msg.attachments) : [];
                } catch (error) {
                    console.warn('附件解析失败:', error);
                }
                const attachmentsHtml = attachments.map(file => `
                <a href="${file.url}" target="_blank" class="attachment">
                    ${file.name || file.url.split('/').pop()}
                </a>
            `).join('');

                // 生成操作按钮
                const generateActionButton = () => {
                    if (msg.type === 'approval_request') {
                        return msg.approval_status === 'pending' ?
                            '<button class="handle-task-approval">操作</button>' :
                            `<button disabled>${msg.approval_status === 'approved' ? '✅ 已批准' : '❌ 已拒绝'}</button>`;
                    }
                    if (msg.type === 'admin_request') {
                        if (msg.message_approval_status === 'pending') {
                            return '<button class="handle-admin-approval">处理申请</button>';
                        } else {
                            return `<button disabled>${msg.message_approval_status === 'approved' ? '✅ 已批准' : '❌ 已驳回'}</button>`;
                        }
                    }
                };

                return `
                <li data-msg-id="${msg.id}" data-type="${msg.type}" ${msg.is_read ? 'class="processed"' : ''}>
                    <p class="message-content">${msg.content}</p>
                    ${attachmentsHtml ? `<div class="attachments">${attachmentsHtml}</div>` : ''}
                    <p class="time">${new Date(msg.created_at).toLocaleString('zh-CN')}</p>
                    ${generateActionButton()}
                </li>
            `;
            }).join('') || '<li class="empty">暂无消息</li>';



            // 事件委托绑定
            list.addEventListener('click', async (e) => {
                // if (e.target.classList.contains('handle-btn')) {
                //     const li = e.target.closest('li');
                //     try {
                //         const response = await fetchWithAuth(`/api/messages/${li.dataset.msgId}`);
                //         const msgDetail = await response.json();
                //         showApprovalModal(msgDetail);
                //     } catch (error) {
                //         console.error('加载详情失败:', error);
                //         alert('无法加载请求详情');
                //     }
                // }
                if (e.target.classList.contains('handle-task-approval')) {
                    handleTaskApproval(e.target.closest('li').dataset.msgId);
                }
                if (e.target.classList.contains('handle-admin-approval')) {
                    handleAdminApproval(e.target.closest('li').dataset.msgId);
                }
            });

        } catch (error) {
            console.error('加载消息失败:', error);
            list.innerHTML = `<li class="error">加载失败: ${error.message}</li>`;
        }
    }

    async function showMessageDetail(msgId, msgType) {
        try {
            const response = await fetchWithAuth(`/api/messages/${msgId}`);

            // 增加HTTP状态检查
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP Error ${response.status}`);
            }

            const msgDetail = await response.json();

            // 显示模态框前验证数据完整性
            if (!msgDetail.relatedId) {
                throw new Error('Invalid message data');
            }

            showApprovalModal(msgDetail);
        } catch (error) {
            console.error('加载详情失败:', error);
            showErrorModal(`无法加载请求详情: ${error.message}`);
        }
    }

    // 通用弹窗控制函数
    function showModal(config) {
        const modal = document.getElementById('globalModal');
        const { title, body, footer, isError } = config;

        // 清空内容
        modal.querySelector('.modal-title').innerHTML = title;
        modal.querySelector('.modal-body').innerHTML = body;
        modal.querySelector('.modal-footer').innerHTML = footer || '';

        // 添加错误样式类
        modal.classList.toggle('error-modal', isError);

        // 显示模态框
        modal.classList.remove('hide');
    }

    // 关闭模态框函数
    function closeModal() {
        document.getElementById('globalModal').classList.add('hide');
    }

    // 绑定关闭事件
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);


    // 审批弹窗显示函数
    async function showApprovalModal(msgDetail) {
        if (msgDetail.type === 'admin_request') {
            // 显示管理员申请详情
            showModal({
                title: '🛡️ 管理员权限申请',
                body: `
                <p>项目ID：${msgDetail.related_id}</p>
                <p>申请人：${msgDetail.assignee}</p>
            `,
                footer: `
                <button onclick="handleAdminRequest(${msgDetail.id}, true)">批准</button>
                <button onclick="handleAdminRequest(${msgDetail.id}, false)">驳回</button>
            `
            });
        }
        try {
            const taskId = msgDetail.taskId;
            const response = await fetchWithAuth(`/api/tasks/${taskId}`);
            const task = await response.json();

            // 显示附件
            const decodeFileName = (str) => {
                try {
                    return decodeURIComponent(escape(str));
                } catch {
                    return str;
                }
            };
            attachmentsHtml = msgDetail.attachments.map(file => `
            <a href = "${file.url}" download = "${decodeFileName(file.name)}" >
            ${decodeFileName(file.name)}</a>
            `);

            showModal({
                title: `📋 任务审批申请（${task.project_name})`,
                body: `
    <div class= "approval-info" >
        <p><strong>申请人：</strong>${msgDetail.assignee}</p>
                    ${msgDetail.note ? `<p><strong>备注：</strong>${msgDetail.note}</p>` : ''}
                    ${attachmentsHtml}
                </div>
    `,
                footer: `
    <button class= "action-btn approve-btn" onclick = "handleApproval(${msgDetail.id}, true)" >✅ 批准</button>
        <button class="action-btn reject-btn" onclick="handleApproval(${msgDetail.id}, false)">❌ 驳回</button>
`
            });
        } catch (error) {
            showModal({
                title: '⚠️ 错误',
                body: `无法加载任务详情：${error.message} `,
                isError: true,
                footer: '<button class="action-btn" onclick="closeModal()">关闭</button>'
            });
        }
    }

    // 错误提示函数
    function showErrorModal(message) {
        showModal({
            title: '⚠️ 错误',
            body: message,
            isError: true,
            footer: '<button class="action-btn" onclick="closeModal()">关闭</button>'
        });
    }

    // 关闭函数
    function closeApprovalModal() {
        const modal = document.querySelector('.approval-modal');
        if (modal) modal.remove();
    }

    // 全局处理函数
    window.handleApproval = async (approvalId, isApproved) => {
        try {
            const response = await fetchWithAuth('/api/handle-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvalId, isApproved })
            });

            if (response.ok) {
                alert(`操作成功：${isApproved ? '已批准' : '已拒绝'} `);
                // 关闭弹窗并刷新消息列表
                closeModal();
                await renderMessages();

                // 添加操作反馈
                const msgList = document.querySelector('.message-list ul');
                const msgItem = msgList.querySelector(`[data - msg - id= "${approvalId}"]`);
                if (msgItem) {
                    msgItem.querySelector('.handle-btn').disabled = true;
                    msgItem.querySelector('.handle-btn').textContent = isApproved ? '已批准' : '已拒绝';
                }
            }
        } catch (error) {
            console.error('处理失败:', error);
        }
    };

    // 申请成为管理员
    async function applyForAdmin(projectId) {
        try {
            const response = await fetchWithAuth('/api/request-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId })
            });

            if (confirm("确认申请成为该项目管理员吗？")) {
                if (response.ok) {
                    alert('申请已发送给负责人');
                } else {
                    alert('申请失败，请稍后重试');
                }
            } else {
                return;
            }
        } catch (error) {
            console.error('申请错误:', error);
            alert('网络错误，请检查连接');
        }
    }

    // 在项目详情按钮绑定点击事件
    function bindApplyAdminButton() {
        document.querySelector('.apply-admin-btn').addEventListener('click', function () {
            const projectId = document.querySelector('.project-detail-card').dataset.projectId;
            applyForAdmin(projectId);
        });
    }

    // 全局处理函数
    window.handleAdminRequest = async (messageId, isApproved) => {
        try {
            const response = await fetchWithAuth('/api/handle-admin-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, isApproved })
            });

            if (response.ok) {
                alert(`操作成功：${isApproved ? '已批准' : '已驳回'}`);
                closeModal();
                await renderMessages();
            }
        } catch (error) {
            console.error('处理失败:', error);
        }
    };

    // 在index.js中明确定义任务审批处理函数
    async function handleTaskApproval(messageId) {
        try {
            const response = await fetchWithAuth(`/api/messages/${messageId}`);
            const msgDetail = await response.json();

            // 显示任务审批模态框
            showModal({
                title: '任务审批',
                body: `
                <p>任务名称：${msgDetail.task_title}</p>
                <p>申请人：${msgDetail.assignee_name}</p>
                ${msgDetail.attachments.map(file => `
                    <a href="${file.url}" download>${file.name}</a>
                `).join('')}
            `,
                footer: `
                <button onclick="handleApproval(${msgDetail.related_id}, true)">批准</button>
                <button onclick="handleApproval(${msgDetail.related_id}, false)">驳回</button>
            `
            });
        } catch (error) {
            console.error('处理失败:', error);
        }
    }

    // 将函数暴露到全局作用域
    window.handleTaskApproval = handleTaskApproval;
})
