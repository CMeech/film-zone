
document.addEventListener('alpine:init', () => {
    Alpine.data('listAnnouncements', () => {
        return {
            currentPage: 0,
            pageSize: 10,

            init() {
                this.loadAnnouncements()
            },

            loadAnnouncements() {
                this.$ajax('/announcements/team', {
                    method: 'GET',
                    params: {
                        page: this.currentPage,
                        size: this.pageSize
                    },
                    target: "announcements-page"
                }).catch(error => {
                    console.error('Failed to load announcements:', error)
                })
            },

            previousPage() {
                this.currentPage = Math.max(0, this.currentPage - 1);
                this.loadAnnouncements();
            },

            nextPage() {
                this.currentPage = this.currentPage + 1;
                this.loadAnnouncements()
            },

            getCurrentPageText() {
                return this.currentPage + 1;
            }
        }
    })
})