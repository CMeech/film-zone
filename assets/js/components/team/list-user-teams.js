document.addEventListener('alpine:init', () => {
    Alpine.data('teamsData', () => {
        return {
            selectTeam(id) {
                window.location.href = `/team/select/${id}`
            },
        }
    })
})