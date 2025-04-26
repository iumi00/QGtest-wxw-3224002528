async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    return fetch(`http://localhost:3000${url}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
}

// 获取项目列表
fetchWithAuth('/api/projects')
    .then(response => response.json())
    .then(data => console.log(data));

// 获取我的项目列表
async function fetchMyProjects() {
    try {
        const response = await fetchWithAuth('/api/my-projects');
        if (!response.ok) throw new Error('获取项目失败');
        return await response.json();
    } catch (error) {
        console.error('获取项目列表失败:', error);
        return [];
    }
}

window.fetchMyProjects = fetchMyProjects;

async function fetchMyTasks() {
    try {
        const response = await fetchWithAuth('/api/my-tasks');
        if (!response.ok) throw new Error('获取任务失败');
        const tasks = await response.json();
        console.log(tasks); // 打印获取到的任务数据
        return tasks;
    } catch (error) {
        console.error('获取任务列表失败:', error);
        return [];
    }
}

window.fetchMyTasks = fetchMyTasks;

