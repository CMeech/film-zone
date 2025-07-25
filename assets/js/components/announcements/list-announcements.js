
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
    });
    Alpine.data('createAnnouncement', () => ({
        message: '',
        handleMessageInput(event) {
            this.message = event.target.value;
        },
        submitForm(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData();
            formData.append('message', this.message);
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
    }));

})