
document.addEventListener('alpine:init', () => {
    Alpine.data('listResources', () => ({
        loading: true,

        init() {
            this.loadResources()
            this.$el.addEventListener('click', this.handleClick.bind(this))
        },

        handleClick(event) {
            const button = event.target.closest('button[data-action]')
            if (!button) return

            const action = button.dataset.action
            const resourceId = button.dataset.resourceId

            if (action === 'view') {
                window.open(`/resources/view/${resourceId}`, '_blank')
            } else if (action === 'delete') {
                this.deleteResource(resourceId)
            }
        },

        loadResources() {
            this.loading = true
            this.$ajax('/resources/list/partial', {
                method: 'GET',
                target: 'resources-content'
            }).finally(() => {
                this.loading = false
            }).catch(error => {
                console.error('Failed to load resources:', error)
            })
        },

        deleteResource(resourceId) {
            if (confirm('Are you sure you want to delete this resource?')) {
                const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                fetch(`/resources/delete/${resourceId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrfToken
                    }
                }).then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete resource')
                    }
                    this.$dispatch('resource-deleted')
                }).catch(error => {
                    console.error('Error:', error)
                    alert('Failed to delete resource')
                })
            }
        },
    }));

    Alpine.data('createResource', () => ({
        file: null,

        handleFileSelect(event) {
            this.file = event.target.files[0];
            console.log('Selected file:', {
                name: this.file.name,
                size: this.file.size,
                type: this.file.type
            });
        },

        submitForm(event) {
            event.preventDefault();

            if (!this.file) {
                alert('Please select a file');
                return;
            }

            const formData = new FormData();
            formData.append('file', this.file);
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            fetch('/resources/create', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            })
                .then(async response => {
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Upload failed');
                    }

                    // Clear the form
                    event.target.reset();
                    this.file = null;
                    // Notify the list to refresh
                    this.$dispatch('resource-created');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to upload resource');
                });
        },

        fileText() {
            return this.file ? this.file.name : 'No file selected';
        }
    }));
})