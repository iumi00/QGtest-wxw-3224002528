window.onload = function () {
    // 点击导航栏模块实现内容转换
    // 获取所有导航项和内容区块
    const navItems = document.querySelectorAll('.navi li');
    const sections = document.querySelectorAll('main > div');
    //集体获取，用数组遍历的方法减少代码行数

    // 为每个导航项绑定点击事件
    navItems.forEach(nav => {
        nav.addEventListener('click', function () {
            if (this.classList.contains('show')) return;

            // 移除所有导航项的激活状态
            navItems.forEach(item => {
                item.classList.remove('show');
            });

            // 隐藏所有内容区块
            sections.forEach(section => {
                section.classList.add('hide');
            });

            // 添加当前激活状态
            this.classList.add('show');

            // 显示对应内容区块
            const targetClass = this.className.split(' ')[0] + '-section'; //获取this的第一个类名：按空格将类名分开成为数组，取数组第一个元素即为第一个类名
            document.querySelector('.' + targetClass).classList.remove('hide');
        });
    });

    //鼠标悬停显示提示模型简介 //不需要用到js。。给元素添加title属性即可！！！
    // const models = document.querySelectorAll(".models-list li");
    // models.forEach(model => {
    //     model.addEventListener('mouseenter', function (event) { //代替mouseover，阻止事件冒泡
    //         const pageX = event.pageX;
    //         const pageY = event.pageY;
    //         const modelClass = this.className;
    //         const tip = document.querySelector('.' + modelClass + '-tip');
    //         tip.classList.remove('none');
    //         tip.style.top = pageY + 'px';
    //         tip.style.left = pageX + 'px';
    //     });
    //     model.addEventListener('mouseleave', function () { //代替mouseout，阻止事件冒泡
    //         const modelClass = this.className;
    //         const tip = document.querySelector('.' + modelClass + '-tip');
    //         tip.classList.add('none');
    //     });
    // });

    //上传模型
    const btnUpload = document.querySelector('.modelhub-buttons .upload');
    const modelUpload = document.querySelector('.workbench-section .model-upload');
    const uploadBtnCancel = document.querySelector('.upload-btn .upload-btn-cancel');
    const uploadBtnSure = document.querySelector('.upload-btn .upload-btn-sure');
    const modelList = document.querySelector('.container-models .models-list');
    // 点击上传按钮显示弹窗
    btnUpload.addEventListener('click', function () {
        modelUpload.classList.remove('hide');
    });
    // 点击取消按钮隐藏弹窗
    uploadBtnCancel.addEventListener('click', function () {
        if (confirm('确认取消上传这个模型吗？')) {
            modelUpload.classList.add('hide');
        }
    });

    // 点击确认提交上传
    uploadBtnSure.addEventListener('click', function (event) {
        event.preventDefault(); // 阻止表单默认提交行为
        if (confirm('确认上传该模型吗？')) {
            const ModelNameInput = document.querySelector('.model-upload .model-name input');
            const ModelUrlInput = document.querySelector('.model-upload .model-url input');
            const ModelTipTextarea = document.querySelector('.model-upload .model-tip textarea');
            const newModelName = ModelNameInput.value.trim();
            const newModelUrl = ModelUrlInput.value.trim();
            const newModelTip = ModelTipTextarea.value.trim(); //去除首尾空格
            // 必填项校验（至少模型名称和 URL 必须填写）
            if (!newModelName || !newModelUrl.match(/^https?:\/\/.+/)) { // 简单校验 URL 格式
                alert('模型名称和下载链接为必填项，且链接需为有效 URL！');
                return;
            }
            modelList.insertAdjacentHTML('afterbegin', `
            <li 
                data-url="${encodeURIComponent(newModelUrl)}" draggable="true"
                title="${newModelTip}" 
                id="${newModelName}"
            >
                ${newModelName} 
            </li>
        `); //缺一个将用户输入的中文名转换为英文名的程序，url常用encodeURLComponent进行编码
            // 清空输入框
            ModelNameInput.value = '';
            ModelUrlInput.value = '';
            ModelTipTextarea.value = '';
            modelUpload.classList.add('hide');
            // 每次添加新模型后重新调用模型绑定拖拽事件的函数
            modelAddDrag();
        };
    });

    //添加层级
    const addHierarchy = document.querySelector('.modelhub-buttons .add-hierarchy');
    const hierarchies = document.querySelector('.workbench-section .hierarchies');
    let currentLevel = 2;
    addHierarchy.addEventListener('click', function () {
        const hierarchiesUls = document.querySelectorAll('.hierarchies ul');
        const lastUl = hierarchiesUls[hierarchiesUls.length - 1];
        if (lastUl.querySelectorAll('li').length === 0) {
            alert('上一个层级中没有被添加模型，无法增加新层级。');
            return;
        }
        // hierarchies.insertAdjacentHTML('beforeend',
        //     `<ul><h5> 层级：${currentLevel}<h5></ul> `);
        const newUl = document.createElement('ul');
        newUl.innerHTML = `<h5> 层级：${currentLevel}</h5>`;
        hierarchies.appendChild(newUl);
        // 为新创建的层级绑定拖放事件
        addDragEvent(newUl);
        currentLevel++;
    });

    //拖动模型添加到层级中
    // 给模型库里的模型添加拖拽事件
    function modelAddDrag() {
        const models = document.querySelectorAll(".models-list li");
        models.forEach(model => {
            model.addEventListener('dragstart', function (event) {
                event.dataTransfer.setData('text/plain', this.id);
            });
        });
    }
    modelAddDrag();

    // 给现有层级添加拖放事件
    const hierarchiesUls = document.querySelectorAll('.workbench-section .hierarchies ul');
    hierarchiesUls.forEach(addDragEvent);

    // 定义绑定拖放事件的函数
    let cloneCounter = 1;
    function addDragEvent(targetUl) {
        targetUl.addEventListener('dragenter', function (event) {
            event.preventDefault();
        });

        targetUl.addEventListener('dragover', function (event) {
            event.preventDefault();
        });

        targetUl.addEventListener('drop', function (event) {
            event.preventDefault();
            const id = event.dataTransfer.getData('text/plain');
            const draggedLi = document.getElementById(id);
            if (targetUl && draggedLi && draggedLi.parentElement.classList.contains('models-list')) { //防止移动层级中的模型时误操作导致该模型重复添加
                const clonedLi = draggedLi.cloneNode(true);
                // 添加权重显示元素
                clonedLi.innerHTML += `<span class="weight-display">${clonedLi.dataset.weight || 1}</span>`;
                // 给克隆的li设置新id,使用计数器生成唯一的 id
                clonedLi.id = 'cloned-' + id + '-' + cloneCounter;
                cloneCounter++;
                targetUl.appendChild(clonedLi);
                // 为克隆的元素绑定拖拽事件
                clonedLi.addEventListener('dragstart', function (event) {
                    event.dataTransfer.setData('text/plain', this.id);
                });
                // 每次添加新模型到层级后，重新绑定点击事件
                addModelClickEvents();
            }
        });
    }

    //删除模型
    const dustbin = document.querySelector('.modelhead span');
    dustbin.addEventListener('dragenter', function (event) {
        event.preventDefault();
    });
    dustbin.addEventListener('dragover', function (event) {
        event.preventDefault();
        this.style.backgroundColor = 'red'
    });
    dustbin.addEventListener('drop', function (event) {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        const draggedLi = document.getElementById(id);
        if (!draggedLi.parentElement.classList.contains('models-list')) {
            draggedLi.remove();
        } else if (draggedLi.parentElement.classList.contains('models-list')) {
            if (confirm('确认从模型库中删除该模型吗？')) {
                draggedLi.remove();
            }
        }
        this.style.backgroundColor = '';
    });

    //点击模型添加信息
    // 定义绑定模型点击事件的函数
    function addModelClickEvents() {
        const modelsInHie = document.querySelectorAll('.hierarchies ul li');
        const modelInfo = document.querySelector('.workbench-section .model-info');
        const infoBtnCancel = document.querySelector('.info-btn .info-btn-cancel');
        const infoBtnSure = document.querySelector(".info-btn .info-btn-sure");
        // 移除之前绑定的点击事件,防止多次调用函数导致有元素多次绑定
        modelsInHie.forEach(model => {
            model.removeEventListener('click', showModelInfo);
            model.addEventListener('click', showModelInfo);
        });

        // 点击取消按钮隐藏弹窗
        infoBtnCancel.addEventListener('click', function () {
            modelInfo.classList.add('hide');
        });

        // // 点击窗口其他地方隐藏弹窗 //放在函数中多次绑定导致出错，放在函数外无法正常起作用
        // window.addEventListener('click', function (event) {
        //     let isModel = false;
        //     modelsInHie.forEach(model => {
        //         if (model === event.target) {
        //             isModel = true;
        //         }
        //     });
        //     if (!modelInfo.contains(event.target) && !isModel) {
        //         modelInfo.classList.add('hide');
        //     }
        // });

        // 在全局范围添加当前选中模型的引用
        let currentSelectedModel = null;

        // 修改模型点击事件处理函数
        function showModelInfo() {
            currentSelectedModel = this; // 存储当前点击的模型
            // 填充现有权重值
            const weightInput = document.querySelector('.model-weight input');
            weightInput.value = this.dataset.weight || '1'; // 默认为1
            modelInfo.classList.remove('hide');
        }

        // 修改权重确认按钮点击事件
        infoBtnSure.addEventListener('click', function () {
            if (confirm('确认修改该模型权重吗？')) {
                const modelWeightInput = document.querySelector('.model-info .model-weight input');
                const modelsWeight = parseFloat(modelWeightInput.value.trim());

                // 增强验证：0~1范围检查 验证失败啊啊啊！！
                // if (isNaN(modelsWeight) || modelsWeight < 0 || modelsWeight > 1) {
                //     alert('请输入0~1之间的有效数值（如0.8）！');
                //     return;
                // }

                // 更新当前选中模型的权重
                if (currentSelectedModel) {
                    currentSelectedModel.dataset.weight = modelsWeight;
                    currentSelectedModel.querySelector('.weight-display').textContent = modelsWeight;
                }

                modelWeightInput.value = '';
                modelInfo.classList.add('hide');
                currentSelectedModel = null; // 清空引用
            };
        });

        function showModelInfo() {
            modelInfo.classList.remove('hide');
        }
    }

    // 初始绑定点击事件
    addModelClickEvents();

    // 新建项目
    const btnNewitem = document.querySelector('.items-buttons .newitem-btn');
    const newitem = document.querySelector('.workbench-section .newitem');
    const newitemBtnCancel = document.querySelector('.newitem-btn .item-btn-cancel')
    // 点击新建按钮显示弹窗
    btnNewitem.addEventListener('click', function () {
        newitem.classList.remove('hide');
    });
    // 点击取消按钮隐藏弹窗
    newitemBtnCancel.addEventListener('click', function () {
        if (confirm('确认取消上传这个项目吗？')) {
            newitem.classList.add('hide');
        }
    });
    // 拖拽上传图片
    const uploadImgs = document.querySelector('.item-image label');
    const imagesList = document.querySelector('.item-image .imgs');
    const allBaseimg = [];
    const allowImgFileSize = 1024 * 400; //上传图片最大值为400k

    uploadImgs.addEventListener('dragover', function (event) {
        event.preventDefault(); //阻止默认行为，否则ondrop事件无法触发
    })
    uploadImgs.addEventListener('drop', function (event) {
        event.preventDefault(); //取消浏览器与事件关联的行为
        const dtfiles = event.dataTransfer.files; //获取图片
        // 转化为base64
        transferDataToBase64(dtfiles);
    });

    function transferDataToBase64(files) {
        for (let i = 0, len = files.length; i < len; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.readAsDataURL(file); //转化为base64，异步
            reader.onload = function (event) {
                const base64Img = event.target.result;
                const index = allBaseimg.indexOf(base64Img);
                //判断是否重复上传
                if (index !== -1) {
                    alert('请勿重复上传！');
                    return;
                }
                if (base64Img.length > allowImgFileSize) {
                    alert('图片上传失败，请确认图片大小小于400K。');
                    return;
                }
                const str = `<li><img src='${base64Img}'> <i class='close'>x</i></li>`;
                imagesList.innerHTML += str;
                allBaseimg.push(base64Img);
            }
        }
    }
    // 缩略图删除
    imagesList.addEventListener('click', function (event) {
        const target = event.target;
        if (target.className == 'close') {
            const thisbase = target.previousElementSibling.src;
            const sindex = allBaseimg.indexOf(thisbase);
            allBaseimg.splice(sindex, 1); //更新数据
            target.parentElement.remove(); //删除缩略图
        }
    })

    // 项目上传 此处仅模拟上传功能，按需上传后应与各层级模型等绑定，删除功能也未完善
    const newitemBtnSure = document.querySelector('.newitem-btn .item-btn-sure');
    const itemNameInput = document.querySelector('.newitem .item-name input');
    const itemTextTextarea = document.querySelector('.newitem .item-text textarea');
    const itemList = document.querySelector('.container-items ul');

    newitemBtnSure.addEventListener('click', function () {
        const itemName = itemNameInput.value.trim();
        const itemText = itemTextTextarea.value.trim();
        if (confirm('确认上传该项目吗？')) {
            if (itemName === '') {
                alert('项目名称不能为空！');
                return;
            }
            // 收集层级结构数据
            const layers = Array.from(document.querySelectorAll('.hierarchies ul')).map(ul => {
                const models = Array.from(ul.querySelectorAll('li')).map(li => ({
                    modelName: li.textContent.trim(),
                    modelUrl: li.dataset.url,
                    weight: parseFloat(li.dataset.weight) || 1
                }));

                return {
                    layer: parseInt(ul.querySelector('h5').textContent.replace('层级：', '')),
                    parallel: models.length >= 2 ? 1 : 0,
                    models: models
                };
            });

            // 构建请求数据
            const projectData = {
                projectName: itemName,
                content: itemText,
                images: allBaseimg,
                modelList: layers,
            };

            // 发送到后端
            fetch('http://localhost:3000/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            })
                .then(response => {
                    if (!response.ok) throw new Error('上传失败');
                    return response.json();
                })
                .then(data => {
                    alert('上传成功！');
                    // 清空界面
                    itemList.innerHTML += `<li>${itemName}</li>`;
                    itemNameInput.value = '';
                    itemTextTextarea.value = '';
                    imagesList.innerHTML = '';
                    newitem.classList.add('hide');
                    allBaseimg.length = 0;
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('上传失败: ' + error.message);
                });
        }
    });

}
