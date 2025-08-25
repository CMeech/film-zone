// static/js/components/games/list-games.js
document.addEventListener('alpine:init', () => {
    function createGamesComponent() {
        return {
            // ---- State ----
            games: [],
            submitting: false,
            submitText: 'Create Game',
            newGame: {
                opponent_name: '',
                final_score: '',
                is_home: false,
                team_id: null, // resolved dynamically
            },

            noGames() {
                return this.games.length === 0;
            },

            // ---- Field setters (used by @change) ----
            setOpponentName(event) {
                this.newGame.opponent_name = event.target.value;
            },
            setFinalScore(event) {
                this.newGame.final_score = event.target.value;
            },
            setIsHome(event) {
                this.newGame.is_home = !!event.target.checked;
            },

            // Optional computed if you wire :disabled on the button later
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

            // ---- Data fetching & rendering ----
            async loadGames() {
                try {
                    const res = await fetch('/games/list/json', {
                        headers: { 'Accept': 'application/json' },
                        credentials: 'same-origin',
                    });
                    if (!res.ok) throw new Error('Failed to load games');
                    this.games = await res.json();
                    this.renderGames();
                    this.animateList();
                } catch (err) {
                    console.error(err);
                }
            },

            renderGames() {
                const container = document.getElementById('games-list');
                if (!container) return;

                container.innerHTML = '';
                const tpl = document.getElementById('game-tile-template');
                if (!tpl) return;

                this.games.forEach((game) => {
                    const frag = tpl.content.cloneNode(true);

                    // Outer clickable card
                    const card = frag.querySelector('[class*="rounded-xl"]');
                    if (card) card.addEventListener('click', () => this.goToGame(game.id));

                    // Title
                    const titleEl = frag.querySelector('h3');
                    if (titleEl) titleEl.textContent = this.gameTitle(game);

                    // Final score (first <p> inside body)
                    const scoreEl = frag.querySelector('p');
                    if (scoreEl) scoreEl.textContent = game.final_score || '';

                    // Delete button (if present in template due to role)
                    const delBtn = frag.querySelector('button');
                    if (delBtn) {
                        delBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            this.deleteGame(game.id);
                        });
                    }

                    container.appendChild(frag);
                });
            },

            // ---- Create & Delete ----
            resolveTeamId() {
                // Try hidden input
                const hid = document.getElementById('teamId');
                if (hid && hid.value) return parseInt(hid.value, 10);

                // Try meta tag
                const meta = document.querySelector('meta[name="active-team-id"]');
                if (meta && meta.content) return parseInt(meta.content, 10);

                // Try data attribute on the root Alpine element
                const root = document.querySelector('[x-data]');
                if (root && root.dataset.teamId) return parseInt(root.dataset.teamId, 10);

                return null;
            },

            // Helper to get CSRF token value
            getCSRFToken() {
                const el = document.getElementById('csrf_token');
                if (!el) {
                    throw new Error('CSRF token not found');
                }
                return el ? el.value : '';
            },

            async createGame() {
                if (this.submitting) return;
                this.submitting = true;
                this.submitText = 'Creating...';

                try {
                    const team_id = this.resolveTeamId();
                    const payload = {
                        opponent_name: this.newGame.opponent_name,
                        final_score: this.newGame.final_score || null,
                        is_home: !!this.newGame.is_home,
                        team_id: team_id,
                        // event_id, video_url, game_data can be added later if you expose fields
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

                    // Reset fields (and inputs, if desired)
                    this.newGame.opponent_name = '';
                    this.newGame.final_score = '';
                    this.newGame.is_home = false;

                    // Clear form UI values to stay in sync with Alpine state
                    const opp = document.getElementById('opponent_name');
                    const score = document.getElementById('final_score');
                    const home = document.getElementById('is_home');
                    if (opp) opp.value = '';
                    if (score) score.value = '';
                    if (home) home.checked = false;

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
        };
    }

    // Register both to avoid mismatches between template & JS
    Alpine.data('gameFormData', createGamesComponent);
    Alpine.data('gamesData', createGamesComponent);
});
