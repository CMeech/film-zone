
document.addEventListener('alpine:init', () => {
    Alpine.data('listAnnouncements', () => {
        return {
            currentPage: 1,
            pageSize: 10,

            init() {
                this.loadAnnouncements()
            },

            loadAnnouncements() {
                console.log('Loading announcements...')
                console.log('Page:', this.currentPage)
                console.log('Size:', this.pageSize)
                this.$ajax(`/announcements/team?page=${this.currentPage}&size=${this.pageSize}`, {
                    method: 'GET',
                    target: "announcements-page"
                }).catch(error => {
                    console.error('Failed to load announcements:', error)
                })
            },

            previousPage() {
                this.currentPage = Math.max(1, this.currentPage - 1);
                this.loadAnnouncements();
            },

            nextPage() {
                this.currentPage = this.currentPage + 1;
                this.loadAnnouncements()
            },

            getCurrentPageText() {
                return this.currentPage;
            }
        }
    });
    Alpine.data('createAnnouncement', () => ({
        message: '',
        title: '',
        handleMessageInput(event) {
            this.message = event.target.value;
        },
        handleTitleInput(event) {
            this.title = event.target.value;
        },
        submitForm(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData();
            formData.append('message', this.message);
            formData.append('title', this.title);
            formData.append('csrf_token', form.querySelector('input[name="csrf_token"]').value);

            fetch('/announcements/create', {
                method: 'POST',
                body: formData
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Network response failed');
                }
                // Clear the form
                this.message = '';
                document.getElementById('message').value = '';
                // Refresh the announcements list
                // We need to access the listAnnouncements component
                this.$dispatch('announcement-created');
            }).catch(error => {
                console.error('Failed to create announcement:', error)
            })
        },
        getPlaceholderText() {
            return 'Type your announcement here...';
        },
        get disabled() {
            return this.message.length <= 0 || this.title.length <= 0;
        },
    }));

})