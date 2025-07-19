document.addEventListener("alpine:init", () => {
    Alpine.data("playerData", () => ({
        name: "",
        number: "",
        position: "",
        birthYear: "",
        submitting: false,

        submitForm() {
            this.submitting = true;
            document.querySelector("#playerForm").submit();
        },

        get submitText() {
            return this.submitting ? "Registering..." : "Register Player";
        },

        get disabled() {
            return this.name.length <= 0 ||
                !this.number ||
                this.position.length <= 0 ||
                !this.birthYear ||
                this.submitting;
        },

        setName(event) {
            this.name = event.target.value;
        },

        setNumber(event) {
            this.number = event.target.value;
        },

        setPosition(event) {
            this.position = event.target.value;
        },

        setBirthYear(event) {
            this.birthYear = event.target.value;
        }
    }));
});