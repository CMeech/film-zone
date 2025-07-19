document.addEventListener('alpine:init', () => {
    Alpine.data('rosterData', () => {
        return {
            registerPlayer() {
                window.location.href = "/roster/createPlayer";
            }
        }
    });
});