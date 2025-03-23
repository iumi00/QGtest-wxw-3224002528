// 定义数组，将轮播图放入
const images = [
    'img/轮播图/1.jpg',
    'img/轮播图/2.webp',
    'img/轮播图/3.webp',
    'img/轮播图/4.webp',
    'img/轮播图/5.webp',
    'img/轮播图/6.webp']

//获取元素
const container = document.querySelector('.container');
const pictureSection = document.querySelector('.picture');
const indicators = document.querySelectorAll('.m');
const leftButton = document.querySelector('.button-left');
const rightButton = document.querySelector('.button-right');
let index = 0
let timer

//初始化圆点样式
indicators[index].style.backgroundColor = 'rgba(254, 254, 254, .9)'

//给按钮添加点击事件
rightButton.addEventListener('click', function () {
    clearInterval(timer);
    indicators[index].style.backgroundColor = 'rgba(135, 138, 136, .9)';
    index++;
    if (index >= images.length) {
        index = 0;
    };
    container.style.backgroundImage = `url('${images[index]}')`;
    indicators[index].style.backgroundColor = 'rgba(254, 254, 254, .9)';
    startTimer();
})
leftButton.addEventListener('click', function () {
    clearInterval(timer);
    indicators[index].style.backgroundColor = 'rgba(135, 138, 136, .9)';
    index--;
    if (index < 0) {
        index = images.length - 1;
    };
    container.style.backgroundImage = `url('${images[index]}')`;
    indicators[index].style.backgroundColor = 'rgba(254, 254, 254, .9)';
    startTimer();
});

// 启动自动播放定时器
function startTimer() {
    timer = setInterval(function () {
        indicators[index].style.backgroundColor = 'rgba(135, 138, 136, .9)';
        index++;
        if (index >= images.length) {
            index = 0;
        };
        container.style.backgroundImage = `url('${images[index]}')`;
        indicators[index].style.backgroundColor = 'rgba(254, 254, 254, .9)';
    }, 3000);
}

// 启动定时器
startTimer();

// 鼠标悬停时清除定时器
pictureSection.addEventListener('mouseover', function () {
    clearInterval(timer);
});

// 鼠标移出时重新启动定时器
pictureSection.addEventListener('mouseout', function () {
    startTimer();
});

//此处差一个节流函数
//差圆点点击跳转效果

