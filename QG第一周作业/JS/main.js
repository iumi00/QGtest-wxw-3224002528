// // 轮播图配置
// const images = [
//     '../img/轮播图/1.jpg',
//     '../img/轮播图/2.webp',
//     '../img/轮播图/3.webp',
//     '../img/轮播图/4.webp',
//     '../img/轮播图/5.webp',
//     '../img/轮播图/6.webp'
// ];
// let currentIndex = 0;
// let autoPlayInterval;

// // 获取元素
// const container = document.querySelector('.container');
// const pictureSection = document.querySelector('.picture');
// const indicators = document.querySelectorAll('.m');
// const leftButton = document.querySelector('.button-left');
// const rightButton = document.querySelector('.button-right');

// // 初始化背景图
// function init() {
//     updateBackground();
//     startAutoPlay();
// }

// // 下一张
// function nextSlide() {
//     currentIndex = (currentIndex + 1) % images.length;
//     updateBackground();
// }

// // 上一张
// function prevSlide() {
//     currentIndex = (currentIndex - 1 + images.length) % images.length;
//     updateBackground();
// }

// // 更新背景图
// function updateBackground() {
//     container.style.backgroundImage = `url(${images[currentIndex]})`;
//     updateIndicators();
// }

// // 更新指示点
// function updateIndicators() {
//     indicators.forEach((indicator, index) => {
//         indicator.classList.toggle('active', index === currentIndex);
//     });
// }

// // 自动轮播
// function startAutoPlay() {
//     autoPlayInterval = setInterval(nextSlide, 3000);
// }

// // 暂停自动轮播
// function pauseAutoPlay() {
//     clearInterval(autoPlayInterval);
// }

// // 重置自动轮播
// function resetAutoPlay() {
//     pauseAutoPlay();
//     startAutoPlay();
// }

// // 绑定事件
// leftButton.addEventListener('click', () => {
//     prevSlide();
//     resetAutoPlay();
// });

// rightButton.addEventListener('click', () => {
//     nextSlide();
//     resetAutoPlay();
// });

// indicators.forEach((indicator, index) => {
//     indicator.addEventListener('click', () => {
//         currentIndex = index;
//         updateBackground();
//         resetAutoPlay();
//     });
// });

// // 初始化轮播图
// init();