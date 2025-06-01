document.addEventListener('alpine:init', () => {
    Alpine.data('appData', () => {
        return {
            sidebarOpen: false,
            toggleSidebar() {
                this.sidebarOpen = !this.sidebarOpen;
            },
            get sideBarClass() {
                return this.sidebarOpen ? 'translate-x-0' : '-translate-x-full';
            },
            showContentTransition() {
                gsap.to(".box", { x: 100, duration: 1 });
            }
        }
    })
})