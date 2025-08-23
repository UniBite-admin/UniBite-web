document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript is loaded and ready to go!");

    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            const headerHeight = document.querySelector('header').offsetHeight;
            const navHeight = document.querySelector('nav').offsetHeight;
            const offset = headerHeight + navHeight;

            const scrollPosition = targetElement.offsetTop - offset;

            window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        });
    });
});
