// static/js/components/games/list-games.js
document.addEventListener('alpine:init', () => {
    Alpine.data('gamesApp', () => ({
        // ---- State ----
        games: [],
        events: [],
        submitting: false,
        submitText: 'Create Game',
        newGame: {
            opponent_name: '',
            final_score: '',
            is_home: false,
            event_id: null,
        },

        get disabled() {
            return !this.newGame.opponent_name || this.submitting;
        },

        // ---- Navigation & title ----
        goToGame(id) {
            window.location.href = `/games/view/${id}`;
        },
        gameTitle(game) {
            return (game.is_home ? 'Vs. ' : '@ ') + game.opponent_name;
        },
        getEventTitle(event) {
            return `${event.title} (${this.formatDate(event.start)})`;
        },

        // ---- Data fetching ----
        async loadEvents() {
            try {
                const end = new Date();
                end.setDate(end.getDate() + 7);
                const start = new Date();
                start.setMonth(start.getMonth() - 2);

                const url = `/events/calendar/range?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;

                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error('Failed to load events');
                const data = await res.json();
                this.events = data?.events || [];
            } catch (err) {
                console.error(err);
            }
        },

        formatDate(date) {
            if (!date) return '';
            const parsedDate = new Date(date);
            return parsedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        async loadGames() {
            try {
                await this.loadEvents();
                const res = await fetch('/games/list/json', {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });
                if (!res.ok) throw new Error('Failed to load games');
                this.games = await res.json();
                this.animateList();
            } catch (err) {
                console.error(err);
            }
        },

        // ---- Create & Delete ----

        getCSRFToken() {
            const el = document.getElementById('csrf_token');
            if (!el) throw new Error('CSRF token not found');
            return el.value;
        },

        async createGame() {
            if (this.submitting) return;
            this.submitting = true;
            this.submitText = 'Creating...';

            try {
                const payload = {
                    opponent_name: this.newGame.opponent_name,
                    final_score: this.newGame.final_score || null,
                    is_home: !!this.newGame.is_home,
                    event_id: this.newGame.event_id,
                };

                const res = await fetch('/games/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRFToken': this.getCSRFToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Failed to create game');

                // Reset form
                this.newGame = { opponent_name: '', final_score: '', is_home: false, event_id: null };

                await this.loadGames();
            } catch (err) {
                console.error(err);
            } finally {
                this.submitting = false;
                this.submitText = 'Create Game';
            }
        },

        async deleteGame(gameId) {
            if (!confirm('Are you sure you want to delete this game?')) return;

            try {
                const res = await fetch(`/games/delete/${gameId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRFToken': this.getCSRFToken(),
                    },
                    credentials: 'same-origin',
                });
                if (!res.ok) throw new Error('Failed to delete game');
                await this.loadGames();
            } catch (err) {
                console.error(err);
            }
        },

        // ---- Animations ----
        animateList() {
            if (!window.gsap) return;
            this.$nextTick(() => {
                const items = document.querySelectorAll('#games-list > *');
                if (!items.length) return;
                window.gsap.fromTo(items, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.05 });
            });
        },

        // ---- Lifecycle ----
        init() {
            this.loadGames();
        },
    }));
});
