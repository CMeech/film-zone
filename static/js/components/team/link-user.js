document.addEventListener("alpine:init", () => {
    Alpine.data("linkUserData", () => {
        return {
            teamId: "",
            userId: "",
            submitting: false,
            submitForm() {
                this.submitting = true;
                const form = document.querySelector("#linkUserForm");
                form.submit();
            },
            get submitText() {
                return this.submitting ? "Linking..." : "Link User";
            },
            get disabled() {
                return !this.teamId ||
                    !this.userId ||
                    this.submitting;
            },
            setTeamId(event) {
                this.teamId = event.target.value;
            },
            setUserId(event) {
                this.userId = event.target.value;
            }
        }
    })
})