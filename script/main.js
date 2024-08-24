document.addEventListener('DOMContentLoaded', function() {
    const teamGrid = document.querySelector('.team-grid');
    const prevButton = document.querySelector('.slider-button.prev');
    const nextButton = document.querySelector('.slider-button.next');
    let slidePosition = 0;

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (slidePosition > 0) {
                slidePosition--;
                updateSlidePosition();
            }
        });

        nextButton.addEventListener('click', () => {
            if (slidePosition < 1) {
                slidePosition++;
                updateSlidePosition();
            }
        });
    }

    function updateSlidePosition() {
        teamGrid.style.transform = `translateX(-${slidePosition * 50}%)`;
    }
});
