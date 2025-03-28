window.onload = function () {
    // 快捷导航栏开关
    const operation0ff = document.querySelector('.operation-off');
    const operation0n = document.querySelector('.operation-on');
    const switchOff = document.querySelector('.switch-off');
    const switchOn = document.querySelector('.switch-on');

    switchOff.addEventListener('click', function () {
        operation0n.classList.remove('hide');
        operation0ff.classList.add('hide');
    });

    switchOn.addEventListener('click', function () {
        operation0ff.classList.remove('hide');
        operation0n.classList.add('hide');
    });

    // 快捷导航栏 全部-进行中-已完成-回收站内容切换
    const all = document.querySelector('.all');
    const being = document.querySelector('.being');
    const finished = document.querySelector('.finished');
    const recycle = document.querySelector('.recycle');
    const listBeing = document.querySelector('.list-being');
    const listRecycle = document.querySelector('.list-recycle');
    const listFinished = document.querySelector('.list-finished');

    // 全部-初始化
    all.style.backgroundColor = '#f8d8e8';

    // 全部
    all.addEventListener('click', function () {
        being.style.cssText = '';
        finished.style.cssText = '';
        recycle.style.cssText = '';
        all.style.backgroundColor = '#f8d8e8';
        delHide(listFinished);
        delHide(listBeing);
        addHide(listRecycle);
    });

    // 进行中
    being.addEventListener('click', function () {
        all.style.cssText = '';
        finished.style.cssText = '';
        recycle.style.cssText = '';
        being.style.backgroundColor = '#f0daa5';
        addHide(listFinished);
        addHide(listRecycle);
        delHide(listBeing);
    });

    // 已完成
    finished.addEventListener('click', function () {
        all.style.cssText = '';
        being.style.cssText = '';
        recycle.style.cssText = '';
        finished.style.backgroundColor = '#9cd2cb';
        addHide(listBeing);
        addHide(listRecycle);
        delHide(listFinished);
    });

    // 回收站
    recycle.addEventListener('click', function () {
        all.style.cssText = '';
        being.style.cssText = '';
        finished.style.cssText = '';
        recycle.style.backgroundColor = '#ebaba1';
        addHide(listBeing);
        addHide(listFinished);
        delHide(listRecycle);
    });

    // 显示函数
    function delHide(element) {
        if (element.classList.contains('hide')) {
            element.classList.remove('hide')
        }
    };
    // 隐藏函数
    function addHide(element) {
        if (!element.classList.contains('hide')) {
            element.classList.add('hide')
        }
    };

    //实现功能

    // 新增函数：根据传入的参数生成一个列表项（li 元素），并插入到对应的列表中
    // 使用模板字符串生成 HTML 结构，根据 status 和 list 的值设置类名和按钮文本 然后根据 list 参数选择目标列表，使用 insertAdjacentHTML 将生成的 HTML 插入到列表的开头
    const inserhtml = function (val, status = 'complete', list = 'being') {
        let targetList;
        const liClass = (status === 'completed') ? 'li-finished' : '';
        const html = `
        <li class="${liClass}">
        <button class="${status}">${status === 'completed' ? '✓' : ''}</button>
            <span>${val}</span>
        <button class="${list === 'recycle' ? 'return' : 'delete'}">${list === 'recycle' ? '↩' : '✕'}</button>
        </li>
        `;
        switch (list) {
            case 'being':
                targetList = listBeing;
                break;
            case 'finished':
                targetList = listFinished;
                break;
            case 'recycle':
                targetList = listRecycle;
                break;
            default:
                targetList = listBeing;
        }

        targetList.insertAdjacentHTML("afterbegin", html);
    };

    //localStorage本地存储

    // 保存函数：将数组转换为 JSON 字符串，并存储到 localStorage 的 'todos' 键中
    const save = function (arr) {
        localStorage.setItem('todos', JSON.stringify(arr));
    }

    // 读取函数：从 localStorage 中读取 'todos' 数据，并解析为 JSON 数组 如果数据不存在，则返回空数组
    const load = function () {
        const storedData = localStorage.getItem('todos');
        return storedData ? JSON.parse(storedData) : []; // 初始化为空数组
    }

    //保存todo的函数：从 localStorage 加载数据，并渲染到页面上。如果没有数据，初始化示例数据。
    const savetodo = function () {
        const todoItems = [];
        const processList = (list, type) => {
            //reverse方法：颠倒数组顺序，保证最新添加的笔记在最前面
            Array.from(list.children).reverse().forEach(li => {
                const text = li.querySelector('span').textContent;
                const status = li.querySelector('button:first-child').classList.contains('completed') ? 'completed' : 'complete';
                todoItems.push({ text, status, list: type });
            });
        };

        processList(listBeing, 'being');
        processList(listFinished, 'finished');
        processList(listRecycle, 'recycle');

        save(todoItems);
    };

    // 加载函数
    const loadtodo = function () {
        const todoItems = load();
        if (todoItems.length === 0) {
            // 初始化示例数据
            inserhtml('开始书写你的故事吧！', 'complete', 'being');
            savetodo();
        } else {
            todoItems.forEach(item => {
                inserhtml(item.text, item.status, item.list);
            });
        }
    };

    loadtodo();

    // 添加笔记
    const input = document.querySelector('.add-content-wrapper input');
    const submit = document.querySelector('.submit');

    const add = function () {
        inserhtml(input.value, 'complete', 'being');
        input.value = '';
        // 焦点回到输入框
        input.focus();
        // 调用保存函数
        savetodo();
    };

    submit.addEventListener('click', add);
    input.addEventListener('keydown', function (event) {
        if (event.key == 'Enter') {
            add();
        }
    });

    // 完成笔记
    // const btnComplete = document.querySelectorAll('.list-being .complete')
    // btnComplete.forEach(function (button) {
    //     button.addEventListener('click', function () {
    //         const li = this.parentElement;
    //         const firstChild = listFinished.firstChild;
    //         listFinished.insertBefore(li, firstChild);
    //         this.className = 'completed';
    //         this.innerText = '✓';
    //     });
    // })  新添加的笔记不能完成，因为页面加载时元素以及获取完毕，新添加的元素不会被获取
    //改用事件委托，将事件监听器添加到父元素上
    listBeing.addEventListener('click', function (event) {
        if (event.target.classList.contains('complete')) {
            const li = event.target.parentElement;
            const firstChild = listFinished.firstChild;
            listFinished.insertBefore(li, firstChild);
            event.target.className = 'completed';
            event.target.innerText = '✓';
            savetodo();
        }
    });

    //取消完成笔记
    listFinished.addEventListener('click', function (event) {
        if (event.target.classList.contains('completed')) {
            const li = event.target.parentElement;
            const firstChild = listBeing.firstChild;
            listBeing.insertBefore(li, firstChild);
            event.target.className = 'complete';
            event.target.innerText = '';
            savetodo();
        }
    });

    //将笔记放入回收站
    function Recycle(list) {
        list.addEventListener('click', function (event) {
            if (event.target.classList.contains('delete')) {
                const li = event.target.parentElement;
                const firstChild = listRecycle.firstChild;
                listRecycle.insertBefore(li, firstChild);
                event.target.className = 'return';
                event.target.innerText = '↩';
                if (list == listFinished) {
                    li.className = 'li-finished';
                }
                savetodo();
            }
        });
    };
    Recycle(listBeing);
    Recycle(listFinished);

    // // 回收站中的完成
    // listRecycle.addEventListener('click', function (event) {
    //     if (event.target.classList.contains('complete')) {
    //         const li = event.target.parentElement;
    //         event.target.className = 'completed';
    //         event.target.innerText = '✓';
    //         li.className = 'li-finished'; //此处增加了一个类名便于更改样式，而不用再一样一样单独更改
    //     }
    // });

    // //回收站中的取消完成
    // listRecycle.addEventListener('click', function (event) {
    //     if (event.target.classList.contains('completed')) {
    //         const li = event.target.parentElement;
    //         event.target.className = 'complete';
    //         event.target.innerText = '';
    //         li.className = '';
    //     }
    // });

    //同一个元素绑定两个监听器，导致冲突
    //以下将其合并用一个监听器
    listRecycle.addEventListener('click', function (event) {
        const target = event.target;
        const li = target.parentElement;
        // 回收站中的完成
        if (target.classList.contains('complete')) {
            target.className = 'completed';
            target.innerText = '✓';
            li.className = 'li-finished';
            savetodo();
        }
        //回收站中的取消完成
        else if (target.classList.contains('completed')) {
            target.className = 'complete';
            target.innerText = '';
            li.className = '';
            savetodo();
        }
        //将元素移出回收站
        else if (target.classList.contains('return')) {
            // const signBtns = document.querySelectorAll('.list-recycle button')
            target.className = 'delete';
            target.innerText = '✕';
            // signBtns.forEach(element => { //forEach的遍历导致逻辑混乱
            //     if (element.classList.contains('complete')) {
            //         const firstChild = listBeing.firstChild;
            //         listBeing.insertBefore(li, firstChild);
            //     }
            //     else if (element.classList.contains('completed')) {
            //         li.className = '';
            //         const firstChild = listFinished.firstChild;
            //         listFinished.insertBefore(li, firstChild);
            //     }
            // });  //在回收站中完成的笔记移出时会到进行中的列表中去
            const prevButton = target.previousElementSibling.previousElementSibling; //简化逻辑！获取同级前一个兄弟元素的前一个兄弟元素
            if (prevButton.classList.contains('complete')) {
                const firstChild = listBeing.firstChild;
                listBeing.insertBefore(li, firstChild);
            } else if (prevButton.classList.contains('completed')) {
                li.className = '';
                const firstChild = listFinished.firstChild;
                listFinished.insertBefore(li, firstChild);
            }
            savetodo();
        }
    });

    //一键标记已完成
    const allFinish = document.querySelector('.all-finish');
    allFinish.addEventListener('click', function () {
        // const liBeings = document.querySelectorAll('.list-being li');
        // liBeings.forEach(item => {
        //     item.firstElementChild.className = 'completed';
        //     item.firstElementChild.innerText = '✓';
        //     const firstChild = listFinished.firstChild;
        //     listFinished.insertBefore(item, firstChild);
        // }) //在列表显示内容不同时功能应有区别
        if (!listBeing.classList.contains('hide')) {
            if (confirm('确定要将当前显示内容全部标记为已完成吗？')) {
                // 显示全部或进行中列表时，将进行中的笔记全部变成已完成
                const liBeings = document.querySelectorAll('.list-being li');
                liBeings.forEach(item => {
                    item.firstElementChild.className = 'completed';
                    item.firstElementChild.innerText = '✓';
                    const firstChild = listFinished.firstChild;
                    listFinished.insertBefore(item, firstChild);
                });
                savetodo();
            } else if (!listRecycle.classList.contains('hide')) {
                // 显示回收站列表时，把回收站中未完成的笔记全部变成完成的样式
                const liRecycles = document.querySelectorAll('.list-recycle li');
                liRecycles.forEach(item => {
                    const completeButton = item.firstElementChild;
                    if (completeButton.classList.contains('complete')) {
                        completeButton.className = 'completed';
                        completeButton.innerText = '✓';
                        item.className = 'li-finished';
                    }
                })
                savetodo();
            }
        }
    });

    //一键清除已完成
    const clearFinished = document.querySelector('.clear-finished')
    clearFinished.addEventListener('click', function () {
        if (!listFinished.classList.contains('hide')) {
            if (confirm('确定要将已完成任务全部清除吗？')) {
                const liFinished = document.querySelectorAll('.list-finished li');
                liFinished.forEach(item => {
                    const firstChild = listRecycle.firstChild;
                    listRecycle.insertBefore(item, firstChild);
                    item.className = 'li-finished';
                })
            }
            savetodo();
        };
    });

    //一键清除全部
    const clearAll = document.querySelector('.clear-all')
    clearAll.addEventListener('click', function () {
        if (confirm('确定要将当前显示内容全部清除吗？')) {
            //显示进行中时，把进行中的内容都放入回收站
            if (!listBeing.classList.contains('hide') && listFinished.classList.contains('hide')) {
                const liBeings = document.querySelectorAll('.list-being li');
                liBeings.forEach(item => {
                    const firstChild = listRecycle.firstChild;
                    listRecycle.insertBefore(item, firstChild);
                })
                savetodo();
            };
            //显示已完成时，把已完成的内容都放入回收站
            if (listBeing.classList.contains('hide') && !listFinished.classList.contains('hide')) {
                const liFinisheds = document.querySelectorAll('.list-finished li');
                liFinisheds.forEach(item => {
                    const firstChild = listRecycle.firstChild;
                    listRecycle.insertBefore(item, firstChild);
                    item.className = 'li-finished';
                })
                savetodo();
            };
            //显示全部时，把全部的内容都放入回收站
            if (!listBeing.classList.contains('hide') && !listFinished.classList.contains('hide')) {
                const lis = document.querySelectorAll('.list-out li');
                lis.forEach(item => {
                    if (item.parentElement.classList.contains('list-finished')) {
                        item.className = 'li-finished';
                    }
                    const firstChild = listRecycle.firstChild;
                    listRecycle.insertBefore(item, firstChild);
                })
                savetodo();
            };
        }
    });


    // 编辑笔记内容
    // 使用事件委托绑定双击事件
    listBeing.addEventListener('dblclick', function (event) {
        if (event.target.tagName == 'SPAN') {
            const originalText = event.target.textContent;
            const editableElement = event.target;

            // 进入编辑模式
            editableElement.contentEditable = 'true';
            editableElement.parentElement.classList.add('edit-mode');
            editableElement.focus();

            // 保存修改
            const saveEdit = () => {
                editableElement.contentEditable = 'false';
                editableElement.parentElement.classList.remove('edit-mode');
                savetodo();
            };

            // 取消修改
            const cancelEdit = () => {
                editableElement.textContent = originalText;
                editableElement.contentEditable = 'false';
                editableElement.classList.remove('edit-mode');
            };

            // 绑定事件
            editableElement.addEventListener('blur', saveEdit);
            editableElement.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    saveEdit();
                } else if (event.key === 'Escape') {
                    cancelEdit();
                }
            });

            // 防止事件冒泡干扰
            e.stopPropagation();
        }
    })


    // document.getElementById('container').addEventListener('dblclick', function (e) {
    //     if (e.target.classList.contains('editable')) {
    //         const originalText = e.target.textContent;
    //         const editableElement = e.target;

    //         // 进入编辑模式
    //         editableElement.contentEditable = 'true';
    //         editableElement.classList.add('edit-mode');
    //         editableElement.focus();

    //         // 保存修改
    //         const saveEdit = () => {
    //             editableElement.contentEditable = 'false';
    //             editableElement.classList.remove('edit-mode');
    //             // 数据持久化（示例：保存到localStorage）
    //             localStorage.setItem('editableData', JSON.stringify({
    //                 id: editableElement.dataset.id,
    //                 text: editableElement.textContent
    //             }));
    //         };

    //         // 取消修改
    //         const cancelEdit = () => {
    //             editableElement.textContent = originalText;
    //             editableElement.contentEditable = 'false';
    //             editableElement.classList.remove('edit-mode');
    //         };

    //         // 绑定事件
    //         editableElement.addEventListener('blur', saveEdit);
    //         editableElement.addEventListener('keydown', (event) => {
    //             if (event.key === 'Enter') {
    //                 saveEdit();
    //             } else if (event.key === 'Escape') {
    //                 cancelEdit();
    //             }
    //         });

    //         // 防止事件冒泡干扰
    //         e.stopPropagation();
    //     }
    // });

    // // 页面加载时恢复保存的数据（示例）
    // window.onload = () => {
    //     const savedData = JSON.parse(localStorage.getItem('editableData'));
    //     if (savedData) {
    //         const element = document.querySelector(`[data-id="${savedData.id}"]`);
    //         if (element) {
    //             element.textContent = savedData.text;
    //         }
    //     }
    // };


}

