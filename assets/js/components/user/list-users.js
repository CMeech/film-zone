document.addEventListener('alpine:init', () => {
    Alpine.data('usersData', () => {
        return {
            createUser() {
                window.location.href="/user/register"
            }
        }
    })
})