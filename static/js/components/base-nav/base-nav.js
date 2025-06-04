document.addEventListener('alpine:init', () => {
    Alpine.data('appData', () => {
        return {
            sidebarOpen: false,
            toggleSidebar() {
                this.sidebarOpen = !this.sidebarOpen;
            },
            get sideBarClass() {
                return this.sidebarOpen ? 'translate-x-0' : '-translate-x-full';
            }
        }
    })
})