import { ReplaySubject } from 'rxjs';

document.addEventListener('alpine:init', () => {
    Alpine.data('viewGameApp', () => ({
        // ---------- State ----------
        gameId: null,
        gameSubject: new ReplaySubject(1),
        metaSubject: new ReplaySubject(1),

        latestGame: null,
        latestGameData: null,

        updating: false,
        updateButtonText: 'Save Changes',
        updateStatusText: '',

        activeSetIndex: 0,
        activeTeamKey: 'team',

        formFinalScore: '',
        formVideoUrl: '',

        // ---------- Computed helpers ----------
        get hasVideo() {
            return !!this.formVideoUrl;
        },
        get embedVideoUrl() {
            return this.toEmbedUrl(this.formVideoUrl || '');
        },
        get setLabels() {
            return ['Set 1','Set 2','Set 3','Set 4','Set 5','Total'];
        },
        get teams() {
            return [
                {key: 'team', label: 'My Team'},
                {key: 'opponent', label: 'Opponent'}
            ];
        },
        get currentSetScoreText() {
            if (this.activeSetIndex > 4) return '';
            const set = (this.latestGameData?.sets || [])[this.activeSetIndex];
            if (!set || !set.score) return '';
            const t = Number.isFinite(set.score.team) ? set.score.team : null;
            const o = Number.isFinite(set.score.opponent) ? set.score.opponent : null;
            if (t === null || o === null) return '';
            return 'Set ' + (this.activeSetIndex + 1) + ' Score — Team ' + t + ' : Opponent ' + o;
        },

        getCurrentStatsEntries() {
            const statsMap = this.getCurrentStatsMap();
            const out = [];
            for (const num in statsMap) {
                out.push([num, statsMap[num]]);
            }
            out.sort((a, b) => Number(a[0]) - Number(b[0]));
            return out;
        },

        // ---------- Lifecycle ----------
        async init() {
            this.gameId = this.parseGameIdFromUrl();
            if (!this.gameId) return console.error('No game ID.');
            await this.fetchGame();
            this.gameSubject.subscribe(game => {
                this.latestGame = game || {};
                this.$nextTick(() => {
                    this.formFinalScore = game?.final_score || '';
                    this.formVideoUrl = game?.video_url || '';
                    this.latestGameData = game?.game_data || null;
                });
            });
            this.metaSubject.subscribe(meta => {
                this.formFinalScore = meta?.final_score || '';
                this.formVideoUrl = meta?.video_url || '';
                if (this.latestGame) {
                    this.latestGame.final_score = this.formFinalScore;
                    this.latestGame.video_url = this.formVideoUrl;
                }
            });
        },

        parseGameIdFromUrl() {
            const parts = window.location.pathname.split('/').filter(Boolean);
            const id = parseInt(parts[parts.length - 1], 10);
            return Number.isFinite(id) ? id : null;
        },

        async fetchGame() {
            try {
                const res = await fetch('/games/' + this.gameId, {
                    method: 'GET',
                    headers: {'Accept': 'application/json'},
                    credentials: 'same-origin'
                });
                if (!res.ok) throw new Error('Failed to load game');
                const game = await res.json();
                this.gameSubject.next(game);
            } catch (e) {
                console.error(e);
            }
        },

        async submitUpdate() {
            if (this.updating) return;
            this.updating = true;
            this.updateButtonText = 'Saving...';
            this.updateStatusText = '';
            try {
                const payload = {
                    final_score: this.formFinalScore || '',
                    video_url: this.formVideoUrl || ''
                };
                const res = await fetch('/games/update/' + this.gameId, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRFToken': this.getCSRF()
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Update failed');
                this.metaSubject.next(payload);
                this.updateStatusText = 'Saved.';
            } catch (e) {
                console.error(e);
                this.updateStatusText = 'Save failed.';
            } finally {
                this.updating = false;
                this.updateButtonText = 'Save Changes';
            }
        },

        getCSRF() {
            const el = document.getElementById('csrf_token');
            return el ? el.value : '';
        },

        // ---------- Video helpers ----------
        toEmbedUrl(raw) {
            try {
                const u = new URL(raw);
                if (u.hostname.includes('youtube.com')) {
                    const vid = u.searchParams.get('v');
                    return vid ? 'https://www.youtube.com/embed/' + vid : raw;
                }
                if (u.hostname === 'youtu.be') {
                    const vid = u.pathname.replace('/', '');
                    return vid ? 'https://www.youtube.com/embed/' + vid : raw;
                }
                if (u.hostname.includes('vimeo.com')) {
                    const id = u.pathname.split('/').filter(Boolean)[0];
                    return id ? 'https://player.vimeo.com/video/' + id : raw;
                }
                return raw;
            } catch {
                return raw;
            }
        },

        // ---------- Stats logic ----------
        getCurrentStatsMap() {
            const data = this.latestGameData;
            if (!data || !Array.isArray(data.sets)) return {};
            if (this.activeSetIndex > 4) {
                const aggregate = {};
                for (let i = 0; i < Math.min(5, data.sets.length); i++) {
                    this.mergeTeamStatsInto(aggregate, this.getTeamStatsForSet(data.sets[i], this.activeTeamKey));
                }
                return aggregate;
            }
            const set = data.sets[this.activeSetIndex];
            return this.getTeamStatsForSet(set, this.activeTeamKey);
        },

        getTeamStatsForSet(setObj, teamKey) {
            const out = {};
            if (!setObj || !setObj[teamKey] || !setObj[teamKey].player_stats) return out;
            const players = setObj[teamKey].player_stats;
            for (const num in players) {
                const p = players[num] || {};
                out[num] = {
                    kills: Array.isArray(p.kills) ? p.kills.length : 0,
                    setsCount: Array.isArray(p.sets) ? p.sets.length : 0,
                    blocks: this.asInt(p.blocks),
                    digs: this.asInt(p.digs),
                    aces: this.asInt(p.aces),
                    missed_serves: this.asInt(p.missed_serves),
                    errors: this.asInt(p.errors)
                };
            }
            return out;
        },

        mergeTeamStatsInto(target, source) {
            for (const num in source) {
                if (!target[num]) {
                    target[num] = { ...source[num] };
                    continue;
                }
                const t = target[num];
                const s = source[num];
                t.kills += s.kills;
                t.setsCount += s.setsCount;
                t.blocks += s.blocks;
                t.digs += s.digs;
                t.aces += s.aces;
                t.missed_serves += s.missed_serves;
                t.errors += s.errors;
            }
        },

        asInt(v) {
            const n = Number(v);
            return Number.isFinite(n) && n >= 0 ? n : 0;
        }
    }));
});
