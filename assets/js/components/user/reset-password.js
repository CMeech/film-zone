document.addEventListener("alpine:init", () => {
    Alpine.data("resetPasswordData", () => {
        return {
            id: "",
            password: "",
            confirmPassword: "",
            submitting: false,

            submitForm() {
                this.submitting = true;
                document.querySelector("#resetPasswordForm").submit();
            },

            get passwordsMatch() {
                return this.password === this.confirmPassword;
            },

            get submitText() {
                return this.submitting ? "Submitting..." : "Reset Password";
            },

            get disabled() {
                return (
                    this.password.length <= 0 ||
                    this.confirmPassword.length <= 0 ||
                    !this.passwordsMatch ||
                    this.submitting
                );
            },

            setId(event) {
                this.id = event.target.value;
            },

            setPassword(event) {
                this.password = event.target.value;
            },

            showPasswordError() {
               return confirmPassword.length > 0 && !this.passwordsMatch;
            },

            setConfirmPassword(event) {
                this.confirmPassword = event.target.value;
            }
        }
    })
})
