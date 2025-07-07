document.addEventListener("alpine:init", () => {
    Alpine.data("teamData", () => {
        return {
            name: "",
            year: "",
            logo: null,
            submitting: false,
            submitForm() {
                this.submitting = true;
                const form = document.querySelector("#teamForm");
                form.submit();
            },
            get submitText() {
                return this.submitting ? "Creating..." : "Create Team";
            },
            get disabled() {
                return this.name.length <= 0 ||
                    !this.year ||
                    !this.logo ||
                    this.submitting;
            },
            setName(event) {
                this.name = event.target.value;
            },
            setYear(event) {
                this.year = event.target.value;
            },
            setLogo(event) {
                this.logo = event.target.value;
            }
        }
    })
})