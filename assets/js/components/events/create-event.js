
document.addEventListener("alpine:init", () => {
    Alpine.data("eventData", () => {
        return {
            name: "",
            date: "",
            location: "",
            duration: "",
            details: "",
            submitting: false,

            submitForm(form) {
                this.submitting = true;
                document.querySelector("#eventForm").submit();
            },

            get submitText() {
                return this.submitting ? "Creating Event..." : "Create Event";
            },

            get disabled() {
                return this.name.length <= 0 ||
                    this.date.length <= 0 ||
                    this.location.length <= 0 ||
                    this.duration.length <= 0 ||
                    this.details.length <= 0 ||
                    this.submitting;
            },

            setName(event) {
                this.name = event.target.value;
            },

            setDate(event) {
                this.date = event.target.value;
            },

            setLocation(event) {
                this.location = event.target.value;
            },

            setDuration(event) {
                this.duration = event.target.value;
            },

            setDetails(event) {
                this.details = event.target.value;
            }
        }
    })
})