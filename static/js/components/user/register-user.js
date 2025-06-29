document.addEventListener("alpine:init", () => {
    Alpine.data("userData", () => {
        return {
            username: "",
            password: "",
            submitting: false,
            submitForm(form) {
                this.submitting = true;
                document.querySelector("#userForm").submit();
                console.log(form);
            },
            get submitText() {
                return this.submitting ? "Submitting..." : "Submit";
            },
            get disabled() {
                return this.username.length <= 0 || this.password.length <= 0 || this.submitting;
            },
            setUsername(event) {
                this.username = event.target.value;
            },
            setPassword(event) {
                this.password = event.target.value;
            }
        }
    })
})