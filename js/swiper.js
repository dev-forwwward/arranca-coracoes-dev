export function swiperInit() {

    console.log("running swiper.js");

    // Init all Swipers
    const swipersList = document.querySelectorAll('.swiper');

    if (swipersList.length > 0) {

        swipersList.forEach((swiper) => {

            const swiperPagination = swiper.closest('.swiper-pagination');
            const swiperNext = swiper.closest('.swiper-button-next');
            const swiperPrevious = swiper.closest('.swiper-button-prev');


            const swiperEl = new Swiper(swiper, {
                slidesPerView: 1.25,
                spaceBetween: 16,
                direction: 'horizontal',
                loop: true,
                autoWidth: true,
                speed: 1000,

                freeMode: true,
                freeModeMomentum: false,
                allowTouchMove: true,
                breakpoints: {
                    // for screens 500px wide and up
                    500: {
                        slidesPerView: 2.25,
                    },
                    // for screens 768px wide and up
                    768: {
                        slidesPerView: 3.25,
                    }
                },
                pagination: {
                    el: swiperPagination,
                },
                navigation: {
                    nextEl: swiperNext,
                    prevEl: swiperPrevious,
                },
            });
        });

        window.addEventListener('resize', () => {
            swipersList.forEach((swiper) => {
                swiper.update();
            });
        });


    }

    console.log("running swiperInit()");

}