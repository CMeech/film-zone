document.addEventListener('alpine:init', () => {
    Alpine.data('teamsData', () => {
        return {
            createTeam() {
                window.location.href = "/team/create"
            }
        }
    })
})