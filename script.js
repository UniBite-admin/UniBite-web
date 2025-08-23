document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript is loaded and ready to go!");

    // Smooth scroll for anchor links with offset
    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            // Calculate offset based on fixed header and nav height
            const headerHeight = document.querySelector('header').offsetHeight;
            const navHeight = document.querySelector('nav').offsetHeight;
            const offset = headerHeight + navHeight;

            // Calculate scroll position to center section header below fixed headers
            const scrollPosition = targetElement.offsetTop - offset;

            // Scroll to the target element with offset
            window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        });
    });
});
