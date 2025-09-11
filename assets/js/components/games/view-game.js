
// static/js/components/games/view-game.js
import { ReplaySubject, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

document.addEventListener('alpine:init', function () {
    Alpine.data('viewGameApp', function () {
        return {
            // ---------- State ----------/
            gameId: null,
            gameSubject: new ReplaySubject(1),
            metaSubject: new ReplaySubject(1),

            latestGame: null,
            latestGameData: null,

            // ui / form states
            updating: false,
            updateButtonText: 'Save Changes',
            updateStatusText: '',

            // main reactive view selectors
            activeSetIndex: 0,
            activeTeamKey: 'team',

            formFinalScore: '',
            formVideoUrl: '',

            // Interactive form state (modes)
            mode: 'idle', // 'idle' | 'addStat' | 'addPlayer' | 'adjustScore' | 'setRotation'
            selectedTeam: null,
            selectedPlayer: null,
            selectedStat: null,

            // position selection
            positionSelection: {
                visible: false,
                type: null, // 'set' | 'kill'
                from: null,
                to: null
            },

            // rotation edit staging
            rotationEdit: { team: [null, null, null, null, null, null], opponent: [null, null, null, null, null, null] },

            // opponent player add
            newOpponentNumber: null,

            // RxJS update channel for debounced server saves
            updateSubject: new Subject(),

            // ---------- Computeds & getters ----------
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
                    { key: 'team', label: 'My Team' },
                    { key: 'opponent', label: 'Opponent' }
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

            setActiveSet(idx) {
                this.activeSetIndex = idx;
                this.enterSetRotation();
            },

            // returns array of [num, stats] sorted by player number (used in table)
            getCurrentStatsEntries() {
                const statsMap = this.getCurrentStatsMap();
                const out = [];
                for (const num in statsMap) {
                    out.push([num, statsMap[num]]);
                }
                out.sort(function (a, b) { return Number(a[0]) - Number(b[0]); });
                return out;
            },

            // ---------- Lifecycle ----------
            async init() {
                this.gameId = this.parseGameIdFromUrl();
                if (!this.gameId) return console.error('No game ID.');

                // load persisted local cache first if present
                this.loadLocalCache();

                // setup debounced saver (2s after last change)
                this.updateSubject.pipe(debounceTime(2000)).subscribe(() => {
                    this.persistGameToServer();
                });

                await this.fetchGame();

                // wire subjects
                this.gameSubject.subscribe((game) => {
                    this.latestGame = game || {};
                    this.$nextTick(() => {
                        this.formFinalScore = this.latestGame?.final_score || '';
                        this.formVideoUrl = this.latestGame?.video_url || '';
                        this.latestGameData = this.latestGame?.game_data || null;
                        this.fillSetRotations();
                    });
                });

                this.metaSubject.subscribe((meta) => {
                    this.formFinalScore = meta?.final_score || '';
                    this.formVideoUrl = meta?.video_url || '';
                    if (this.latestGame) {
                        this.latestGame.final_score = this.formFinalScore;
                        this.latestGame.video_url = this.formVideoUrl;
                        this.cacheLocalGame();
                        this.updateSubject.next(true);
                    }
                });
            },

            // ---------- Fetch / Parse ----------
            parseGameIdFromUrl() {
                var parts = window.location.pathname.split('/').filter(Boolean);
                var last = parts[parts.length - 1];
                var id = parseInt(last, 10);
                return Number.isFinite(id) ? id : null;
            },

            async fetchGame() {
                try {
                    var res = await fetch('/games/' + this.gameId, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        credentials: 'same-origin'
                    });
                    if (!res.ok) throw new Error('Failed to load game');
                    var game = await res.json();
                    // merge local cache (if present) to avoid losing offline edits
                    var cached = this.loadLocalCacheRaw();
                    if (cached && cached.gameId === this.gameId && cached.latestGameData) {
                        // prefer cached latestGameData; keep server meta for final_score/video unless cache has them
                        if (!game.game_data) game.game_data = cached.latestGameData;
                        else {
                            // merge gently: prefer cached sets (it may contain additional events)
                            game.game_data = cached.latestGameData;
                        }
                        if (cached.formFinalScore) game.final_score = cached.formFinalScore;
                        if (cached.formVideoUrl) game.video_url = cached.formVideoUrl;
                    }
                    this.gameSubject.next(game);
                } catch (e) {
                    console.error(e);
                    // If fetch failed, but we have local cache, load it
                    var cached = this.loadLocalCacheRaw();
                    if (cached && cached.gameId === this.gameId && cached.latestGameData) {
                        this.gameSubject.next({
                            id: this.gameId,
                            final_score: cached.formFinalScore || '',
                            video_url: cached.formVideoUrl || '',
                            game_data: cached.latestGameData
                        });
                    }
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

            // ---------- Update server (debounced) ----------
            async persistGameToServer() {
                // build payload: include full game_data and meta
                if (!this.latestGame) return;
                try {
                    // attempt update; same endpoint used earlier for meta updates
                    var res = await fetch('/games/update/game_data/' + this.gameId, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRFToken': this.getCSRF()
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({ game_data: this.latestGameData })
                    });
                    if (!res.ok) throw new Error('Persist failed');
                    this.updateStatusText = 'Saved.';
                    // clear local cache after successful server save
                    this.clearLocalCache();
                } catch (e) {
                    console.error('persistGameToServer error', e);
                    this.updateStatusText = 'Save (offline cached).';
                    // keep cached in localStorage; it already is cached by caller
                }
            },

            // ---------- Local storage cache ----------
            cacheLocalGame() {
                try {
                    var key = 'game_cache_' + this.gameId;
                    var blob = {
                        gameId: this.gameId,
                        latestGameData: this.latestGameData,
                        formFinalScore: this.formFinalScore,
                        formVideoUrl: this.formVideoUrl,
                        updatedAt: Date.now()
                    };
                    localStorage.setItem(key, JSON.stringify(blob));
                } catch (e) {
                    // ignore
                }
            },
            loadLocalCache() {
                try {
                    var raw = this.loadLocalCacheRaw();
                    if (raw && raw.latestGameData) {
                        // apply to component state immediately
                        this.latestGameData = raw.latestGameData;
                        if (raw.formFinalScore) this.formFinalScore = raw.formFinalScore;
                        if (raw.formVideoUrl) this.formVideoUrl = raw.formVideoUrl;
                    }
                } catch (e) {}
            },
            loadLocalCacheRaw() {
                try {
                    var key = 'game_cache_' + this.gameId;
                    var s = localStorage.getItem(key);
                    if (!s) return null;
                    return JSON.parse(s);
                } catch (e) {
                    return null;
                }
            },
            clearLocalCache() {
                try {
                    var key = 'game_cache_' + this.gameId;
                    localStorage.removeItem(key);
                } catch (e) {}
            },

            // ---------- Form handlers & interactive flows ----------
            enterAddStat: function () {
                this.resetInteractive();
                this.mode = 'addStat';
                this.selectedTeam = null;
                this.selectedPlayer = null;
                this.selectedStat = null;
                this.positionSelection.visible = false;
            },
            enterAddPlayer: function () {
                this.resetInteractive();
                this.mode = 'addPlayer';
                this.newOpponentNumber = null;
            },
            enterAdjustScore: function () {
                this.resetInteractive();
                this.mode = 'adjustScore';
            },
            enterSetRotation: function () {
                this.resetInteractive();
                this.mode = 'setRotation';
                this.fillSetRotations();
            },

            fillSetRotations: function () {
                var sets = this.latestGameData?.sets || [];
                var activeSet = sets[this.activeSetIndex];

                if (activeSet && activeSet.team && Array.isArray(activeSet.team.starting_rotation)) {
                    this.rotationEdit.team = activeSet.team.starting_rotation.slice(0, 6);
                } else {
                    this.rotationEdit.team = [null, null, null, null, null, null];
                }

                if (activeSet && activeSet.opponent && Array.isArray(activeSet.opponent.starting_rotation)) {
                    this.rotationEdit.opponent = activeSet.opponent.starting_rotation.slice(0, 6);
                } else {
                    this.rotationEdit.opponent = [null, null, null, null, null, null];
                }
            },

            resetInteractive: function () {
                this.mode = 'idle';
                this.selectedTeam = null;
                this.selectedPlayer = null;
                this.selectedStat = null;
                this.positionSelection.visible = false;
                this.positionSelection.type = null;
                this.positionSelection.from = null;
                this.positionSelection.to = null;
            },

            selectTeam: function (teamKey) {
                this.selectedTeam = teamKey;
                this.selectedPlayer = null;
            },

            getRoster: function (teamKey) {
                // returns array of player numbers for buttons (team or opponent)
                var set = (this.latestGameData?.sets || [])[this.activeSetIndex];
                var out = [];
                if (!set) return out;
                var teamObj = set[teamKey];
                if (!teamObj) return out;
                // if player_stats exists, enumerate keys
                if (teamObj.player_stats) {
                    for (var k in teamObj.player_stats) {
                        out.push(Number(k));
                    }
                }
                // also include starting rotation players
                if (Array.isArray(teamObj.starting_rotation)) {
                    teamObj.starting_rotation.forEach(function (n) {
                        if (n && out.indexOf(n) === -1) out.push(n);
                    });
                }
                out.sort(function (a, b) { return a - b; });
                return out;
            },

            selectPlayerButton: function (num) {
                this.selectedPlayer = num;
            },

            chooseStat: function (stat) {
                // stat names must match schema keys
                this.selectedStat = stat;
                if (stat === 'sets') {
                    this.positionSelection.visible = true;
                    this.positionSelection.type = 'set';
                    this.positionSelection.from = null;
                    this.positionSelection.to = null;
                } else if (stat === 'kills') {
                    this.positionSelection.visible = true;
                    this.positionSelection.type = 'kill';
                    this.positionSelection.from = null;
                    this.positionSelection.to = null;
                } else {
                    // simple numeric stat; apply immediately
                    this.applySimpleStat(stat);
                }
            },

            positionSelectFrom: function (i) {
                this.positionSelection.from = i;
            },

            positionSelectTo: function (i) {
                if (!this.positionSelection.visible) return;
                this.positionSelection.to = i;
                // finalize position stat
                this.finalizePositionStat();
            },

            finalizePositionStat: function () {
                if (!this.selectedTeam || !this.selectedPlayer || !this.selectedStat) {
                    // safety
                    this.resetInteractive();
                    return;
                }
                if (this.positionSelection.type === 'set') {
                    var entry = { from_position: Number(this.positionSelection.from), to_position: Number(this.positionSelection.to) };
                    this.pushPlayerSet(this.selectedTeam, this.selectedPlayer, entry);
                } else if (this.positionSelection.type === 'kill') {
                    var entry2 = { from_position: Number(this.positionSelection.from), target_position: Number(this.positionSelection.to) };
                    this.pushPlayerKill(this.selectedTeam, this.selectedPlayer, entry2);
                }
                // reset and cache & schedule save
                this.cacheLocalGame();
                this.updateSubject.next(true);
                this.resetInteractive();
            },

            applySimpleStat: function (stat) {
                if (!this.selectedTeam || !this.selectedPlayer) {
                    // can't apply
                    this.resetInteractive();
                    return;
                }
                // increment numeric stat by 1
                this.incrementStatValue(this.selectedTeam, this.selectedPlayer, stat, 1);
                this.cacheLocalGame();
                this.updateSubject.next(true);
                this.resetInteractive();
            },

            // Adds a player to opponent roster (from the add-player form)
            addOpponentPlayerFromForm: function () {
                if (!this.newOpponentNumber) return;
                var num = Number(this.newOpponentNumber);
                if (!Number.isFinite(num)) return;
                // ensure player_stats object exists for current set
                var set = this.ensureSetExists(this.activeSetIndex);
                if (!set.opponent) set.opponent = { player_stats: {} };
                if (!set.opponent.player_stats) set.opponent.player_stats = {};
                if (!set.opponent.player_stats[num]) set.opponent.player_stats[num] = {};
                this.cacheLocalGame();
                this.updateSubject.next(true);
                this.resetInteractive();
            },

            // Update rotations
            applyRotations: function () {
                var set = this.ensureSetExists(this.activeSetIndex);
                if (!set.team) set.team = {};
                if (!set.opponent) set.opponent = {};
                set.team.starting_rotation = this.rotationEdit.team.map(function (n) { return Number.isFinite(n) ? n : null; });
                set.opponent.starting_rotation = this.rotationEdit.opponent.map(function (n) { return Number.isFinite(n) ? n : null; });
                this.cacheLocalGame();
                this.updateSubject.next(true);
                this.resetInteractive();
            },

            // ---------- Score adjustments ----------
            adjustScore: function (teamKey, delta) {
                var set = this.ensureSetExists(this.activeSetIndex);
                if (!set.score) set.score = { team: 0, opponent: 0 };
                set.score[teamKey] = Number.isFinite(set.score[teamKey]) ? set.score[teamKey] + delta : delta;
                if (set.score[teamKey] < 0) set.score[teamKey] = 0;
                this.cacheLocalGame();
                this.updateSubject.next(true);
                // remain in adjustScore mode? spec said reset after change: do reset
                this.resetInteractive();
            },

            // ---------- Helpers for manipulating game_data ----------
            ensureSetExists: function (idx) {
                if (!this.latestGameData) this.latestGameData = { sets: [] };
                if (!Array.isArray(this.latestGameData.sets)) this.latestGameData.sets = [];
                while (this.latestGameData.sets.length <= idx) {
                    this.latestGameData.sets.push({ score: { team: 0, opponent: 0 }, team: { player_stats: {} }, opponent: { player_stats: {} } });
                }
                return this.latestGameData.sets[idx];
            },

            ensurePlayerEntry: function (setObj, teamKey, playerNum) {
                if (!setObj[teamKey]) setObj[teamKey] = { player_stats: {} };
                if (!setObj[teamKey].player_stats) setObj[teamKey].player_stats = {};
                if (!setObj[teamKey].player_stats[playerNum]) setObj[teamKey].player_stats[playerNum] = {};
                return setObj[teamKey].player_stats[playerNum];
            },

            incrementStatValue: function (teamKey, playerNum, statKey, delta) {
                var set = this.ensureSetExists(this.activeSetIndex);
                var p = this.ensurePlayerEntry(set, teamKey, playerNum);
                if (!p[statKey]) {
                    // if this is kills or sets which are arrays in schema, create arrays
                    if (statKey === 'kills' || statKey === 'sets') p[statKey] = [];
                    else p[statKey] = 0;
                }
                if (statKey === 'kills' || statKey === 'sets') {
                    // for simple increment on these types, push a default event (without positions)
                    if (statKey === 'kills') p.kills.push({ target_position: null });
                    if (statKey === 'sets') p.sets.push({ from_position: null, to_position: null });
                } else {
                    p[statKey] = Number.isFinite(Number(p[statKey])) ? (p[statKey] + delta) : delta;
                }
            },

            pushPlayerSet: function (teamKey, playerNum, setEntry) {
                var set = this.ensureSetExists(this.activeSetIndex);
                var p = this.ensurePlayerEntry(set, teamKey, playerNum);
                if (!p.sets) p.sets = [];
                p.sets.push({ from_position: Number(setEntry.from_position), to_position: Number(setEntry.to_position) });
            },

            pushPlayerKill: function (teamKey, playerNum, killEntry) {
                var set = this.ensureSetExists(this.activeSetIndex);
                var p = this.ensurePlayerEntry(set, teamKey, playerNum);
                if (!p.kills) p.kills = [];
                // record from_position + target_position
                p.kills.push({ from_position: Number(killEntry.from_position), target_position: Number(killEntry.target_position) });
            },

            // ---------- Stats aggregation (used by stats table) ----------
            getCurrentStatsMap: function () {
                var data = this.latestGameData;
                if (!data || !Array.isArray(data.sets)) return {};
                if (this.activeSetIndex > 4) {
                    var aggregate = {};
                    for (var i = 0; i < Math.min(5, data.sets.length); i++) {
                        this.mergeTeamStatsInto(aggregate, this.getTeamStatsForSet(data.sets[i], this.activeTeamKey));
                    }
                    return aggregate;
                }
                var set = data.sets[this.activeSetIndex];
                return this.getTeamStatsForSet(set, this.activeTeamKey);
            },

            getTeamStatsForSet: function (setObj, teamKey) {
                var out = {};
                if (!setObj || !setObj[teamKey] || !setObj[teamKey].player_stats) return out;
                var players = setObj[teamKey].player_stats;

                for (var num in players) {
                    var p = players[num] || {};
                    // kills array and distribution
                    var kills = Array.isArray(p.kills) ? p.kills : [];
                    var killDistribution = {};
                    for (var ki = 0; ki < kills.length; ki++) {
                        var k = kills[ki];
                        var tp = k && Number.isFinite(k.target_position) ? k.target_position : null;
                        if (tp) killDistribution[tp] = (killDistribution[tp] || 0) + 1;
                    }
                    var killDistributionArr = [];
                    for (var kd in killDistribution) {
                        killDistributionArr.push([kd, killDistribution[kd]]);
                    }
                    // sets matrix
                    var sets = Array.isArray(p.sets) ? p.sets : [];
                    var matrixMap = {};
                    for (var si = 0; si < sets.length; si++) {
                        var s = sets[si];
                        if (s && Number.isFinite(s.from_position) && Number.isFinite(s.to_position)) {
                            var key = s.from_position + '-' + s.to_position;
                            matrixMap[key] = (matrixMap[key] || 0) + 1;
                        }
                    }
                    var setMatrix = [];
                    for (var mk in matrixMap) {
                        var parts = mk.split('-');
                        setMatrix.push({ from: parseInt(parts[0], 10), to: parseInt(parts[1], 10), count: matrixMap[mk] });
                    }

                    out[num] = {
                        kills: kills,
                        killDistribution: killDistributionArr, // array of [pos, count]
                        sets: sets,
                        setMatrix: setMatrix,
                        blocks: this.asInt(p.blocks),
                        digs: this.asInt(p.digs),
                        aces: this.asInt(p.aces),
                        missed_serves: this.asInt(p.missed_serves),
                        errors: this.asInt(p.errors)
                    };
                }
                return out;
            },

            mergeTeamStatsInto: function (target, source) {
                for (var num in source) {
                    if (!target[num]) {
                        // create shallow clone counters
                        var s = source[num];
                        target[num] = {
                            kills: Array.isArray(s.kills) ? s.kills.slice() : [],
                            killDistribution: Array.isArray(s.killDistribution) ? s.killDistribution.slice() : [],
                            sets: Array.isArray(s.sets) ? s.sets.slice() : [],
                            setMatrix: Array.isArray(s.setMatrix) ? s.setMatrix.slice() : [],
                            blocks: s.blocks || 0,
                            digs: s.digs || 0,
                            aces: s.aces || 0,
                            missed_serves: s.missed_serves || 0,
                            errors: s.errors || 0
                        };
                        continue;
                    }
                    var t = target[num];
                    var s2 = source[num];
                    // merge numeric
                    t.blocks = (t.blocks || 0) + (s2.blocks || 0);
                    t.digs = (t.digs || 0) + (s2.digs || 0);
                    t.aces = (t.aces || 0) + (s2.aces || 0);
                    t.missed_serves = (t.missed_serves || 0) + (s2.missed_serves || 0);
                    t.errors = (t.errors || 0) + (s2.errors || 0);
                    // append arrays
                    t.kills = (t.kills || []).concat(Array.isArray(s2.kills) ? s2.kills : []);
                    t.sets = (t.sets || []).concat(Array.isArray(s2.sets) ? s2.sets : []);
                    // merge distributions (convert to map then back)
                    var map = {};
                    (t.killDistribution || []).forEach(function (kv) { map[kv[0]] = (map[kv[0]] || 0) + kv[1]; });
                    (s2.killDistribution || []).forEach(function (kv) { map[kv[0]] = (map[kv[0]] || 0) + kv[1]; });
                    t.killDistribution = [];
                    for (var kkk in map) t.killDistribution.push([kkk, map[kkk]]);
                    t.setMatrix = (t.setMatrix || []).concat(Array.isArray(s2.setMatrix) ? s2.setMatrix : []);
                }
            },

            asInt: function (v) {
                var n = Number(v);
                return Number.isFinite(n) && n >= 0 ? n : 0;
            },

            // ---------- Small utility ----------
            getCSRF: function () {
                var el = document.getElementById('csrf_token');
                return el ? el.value : '';
            },

            toEmbedUrl: function (raw) {
                try {
                    var u = new URL(raw);
                    if (u.hostname.indexOf('youtube.com') !== -1) {
                        var vid = u.searchParams.get('v');
                        return vid ? 'https://www.youtube.com/embed/' + vid : raw;
                    }
                    if (u.hostname === 'youtu.be') {
                        var vid2 = u.pathname.replace('/', '');
                        return vid2 ? 'https://www.youtube.com/embed/' + vid2 : raw;
                    }
                    if (u.hostname.indexOf('vimeo.com') !== -1) {
                        var id = u.pathname.split('/').filter(Boolean)[0];
                        return id ? 'https://player.vimeo.com/video/' + id : raw;
                    }
                    return raw;
                } catch (e) {
                    return raw;
                }
            }
        };
    });
});
