document.addEventListener('alpine:init', () => {
    Alpine.data('accessCodeData', () => ({
        accessCode: '',
        teamId: '',
        submitText: 'Create Access Code',
        submitting: false,

        // init() {
        //     this.validateForm();
        // },

        setAccessCode(event) {
            this.accessCode = event.target.value;
        },

        setTeamId(event) {
            this.teamId = event.target.value;
        },

        get disabled() {
            // Both fields are required
            return !this.accessCode || !this.teamId || this.submitting;
        },

        submitForm() {
            this.submitting = true;
            this.submitText = 'Creating...';
            document.querySelector("#accessCodeForm").submit();

            // nice sample code for fetch
            // const response = await fetch('/api/player/access-code', {
            //     method: 'POST',
            //     headers: {
            //         'X-CSRFToken': formData.get('csrf_token'),
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         accessCode: this.accessCode,
            //         teamId: parseInt(this.teamId)
            //     })
            // });
            //
            // if (!response.ok) {
            //     throw new Error('Failed to create access code');
            // }
            //
            // const result = await response.json();
            //
            // // Reset form
            // form.reset();
            // this.accessCode = '';
            // this.teamId = '';
            //
            // // Show success message (assumes you have flash messages handling)
            // window.location.href = result.redirect || '/';
        }
    }));
});