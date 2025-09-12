document.addEventListener('alpine:init', () => {
    Alpine.data('dashboardData', () => {
        return {
            currentPage: 1,
            pageSize: 3,

            loadAnnouncements() {
                this.$ajax(`/announcements/team?page=${this.currentPage}&size=${this.pageSize}`, {
                    method: 'GET',
                    target: "announcements-page"
                }).catch(error => {
                    console.error('Failed to load announcements:', error);
                });
            },

            nextPage() {
                this.currentPage++;
                this.loadAnnouncements();
            },

            prevPage() {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadAnnouncements();
                }
            }
        }
    })
})
