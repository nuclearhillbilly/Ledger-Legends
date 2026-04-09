(function () {
    const root = window.LedgerLegends = window.LedgerLegends || {};
    const Player = root.Player;
    const createPlatformManager = root.createPlatformManager;
    const QuestionEngine = root.QuestionEngine;

    const PX_TO_METERS = 0.2;
    const LEVEL_CYCLE_DISTANCE = 1000;
    const LEVEL_BLEND_DISTANCE = 100;
    const PLAYER_FOOT_ANCHOR = 76;
    const BASE_RUN_SPEED = 5.3 * 0.85;
    const MUSIC_VOLUME = 0.35;
    const COIN_VOLUME = 0.9;
    const LAVA_HEIGHT = 132;
    const LAVA_VERTICAL_NUDGE = 20;
    const LAVA_SOURCE_TOP = 420;
    const LAVA_SOURCE_HEIGHT = 280;
    const SCOREBOARD_STORAGE_KEY = "ledger-legends-highscores";
    const PLATFORM_SURFACE_CORRECTION = {
        green: 10,
        acid: 10,
        lava: 7
    };

    const LEVELS = [
        {
            name: "Castle",
            backgroundKey: "backgroundCastle",
            platformTheme: "green",
            ambience: "bird",
            music: "town",
            fallback: ["#9bd4ff", "#fef3c7", "#8dd16f"]
        },
        {
            name: "Ruins",
            backgroundKey: "backgroundRuins",
            platformTheme: "green",
            ambience: "bird",
            music: "town",
            fallback: ["#c6c1b4", "#efe3d4", "#62594f"]
        },
        {
            name: "Jungle",
            backgroundKey: "backgroundJungle",
            platformTheme: "green",
            ambience: "bird",
            music: "town",
            fallback: ["#1c5f4a", "#8cdab0", "#153127"]
        },
        {
            name: "Mushroom",
            backgroundKey: "backgroundMushroom",
            platformTheme: "acid",
            ambience: "bat",
            music: "cave",
            fallback: ["#574c7e", "#8b7bc0", "#1b1830"]
        },
        {
            name: "Dungeon",
            backgroundKey: "backgroundDungeon",
            platformTheme: "lava",
            ambience: "bat",
            music: "cave",
            fallback: ["#475569", "#1f2937", "#050816"]
        },
        {
            name: "Lava",
            backgroundKey: "backgroundLava",
            platformTheme: "lava",
            ambience: "bat",
            music: "cave",
            fallback: ["#3f0d06", "#f97316", "#1a0501"]
        }
    ];

    const PLAYER_DIALOGUE_LINES = [
        "Easy jump!",
        "Stay focused!",
        "One step at a time.",
        "Don't mess this up...",
        "I'm flying now!",
        "Too fast, too clean!",
        "Lock in, let's go!",
        "No mistakes!",
        "That was close!",
        "Keep it moving!",
        "I'm not falling today!",
        "Perfect timing!",
        "Let's go again!",
        "I won't choke this run!",
        "Clean run, clean run!",
        "Alright, here we go!",
        "Just a little further!",
        "I can do this all day!",
        "Finish strong!",
        "Alright... time to pass this test.",
        "Did I study enough for this?",
        "I definitely should've reviewed more...",
        "Debit on the left... right?",
        "Stay calm, I know this stuff.",
        "Balance the sheet, balance the run.",
        "No mistakes... no mistakes...",
        "I can't fail this class.",
        "Think... what did the professor say?",
        "Assets equal liabilities... plus equity!",
        "Okay, I remember this one!",
        "Don't panic, just keep moving.",
        "I need this grade.",
        "Alright, focus up!",
        "This is just like practice... I think.",
        "Please let this be on the test.",
        "I'm actually getting this!",
        "Wait... that didn't look right.",
        "One question at a time.",
        "I'm passing this. No matter what."
    ];
    const PLAYER_DIALOGUE_VISIBLE_MS = 4000;
    const PLAYER_DIALOGUE_NEAR_LAVA_BUFFER = 78;
    const PLAYER_DIALOGUE_FACE_ANCHOR_RIGHT = 0.58;
    const PLAYER_DIALOGUE_FACE_ANCHOR_LEFT = 0.42;
    const PLAYER_DIALOGUE_FACE_ANCHOR_Y = 0.36;
    const PLAYER_DIALOGUE_BUBBLE_TIP_X = 0.17;
    const PLAYER_DIALOGUE_BUBBLE_TIP_Y = 0.74;
    const PLAYER_DIALOGUE_BUBBLE_FACE_OFFSET_X_RIGHT = -20;
    const PLAYER_DIALOGUE_BUBBLE_FACE_OFFSET_X_LEFT = -16;
    const PLAYER_DIALOGUE_BUBBLE_FACE_OFFSET_Y = -4;
    const PLAYER_DIALOGUE_BUBBLE_TOUCH_SHIFT_X = -10;
    const LAVA_MONSTER_MIN_WIDTH = 96;
    const LAVA_MONSTER_MAX_WIDTH = 132;
    const LAVA_MONSTER_CHASE_GAP_MIN = 116;
    const LAVA_MONSTER_CHASE_GAP_MAX = 156;
    const LAVA_MONSTER_FOREGROUND_HEIGHT = 48;
    const MOBILE_TOUCH_BREAKPOINT = 900;
    const ARROW_HAZARD_START_METERS = 1000;
    const ARROW_HAZARD_WIDTH = 112;
    const ARROW_HAZARD_HEIGHT = 52;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function shuffleList(list) {
        const items = list.slice();

        for (let index = items.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = items[index];
            items[index] = items[swapIndex];
            items[swapIndex] = temp;
        }

        return items;
    }

    function nextDialogueLine(dialogueState) {
        if (!dialogueState.deck.length) {
            dialogueState.deck = shuffleList(PLAYER_DIALOGUE_LINES);

            if (
                dialogueState.lastLine &&
                dialogueState.deck.length > 1 &&
                dialogueState.deck[0] === dialogueState.lastLine
            ) {
                const first = dialogueState.deck[0];
                dialogueState.deck[0] = dialogueState.deck[1];
                dialogueState.deck[1] = first;
            }
        }

        const line = dialogueState.deck.shift();
        dialogueState.lastLine = line;
        return line;
    }

    function getDialogueVisibleMs() {
        return PLAYER_DIALOGUE_VISIBLE_MS;
    }

    function getDialogueCooldownMs(reason) {
        if (reason === "near-lava") {
            return randomBetween(3800, 5600);
        }

        if (reason === "ambient") {
            return randomBetween(3400, 5200);
        }

        return randomBetween(3000, 4600);
    }

    function getAmbientDialogueDelayMs(startSoon) {
        return startSoon
            ? randomBetween(1800, 3600)
            : randomBetween(5200, 8600);
    }

    function getViewportSize() {
        const viewport = window.visualViewport;
        if (viewport && viewport.width > 0 && viewport.height > 0) {
            return {
                width: Math.max(320, Math.round(viewport.width)),
                height: Math.max(320, Math.round(viewport.height))
            };
        }

        return {
            width: Math.max(320, Math.round(window.innerWidth)),
            height: Math.max(320, Math.round(window.innerHeight))
        };
    }

    function applyViewportSize() {
        const viewport = getViewportSize();
        document.documentElement.style.setProperty("--viewport-width", `${viewport.width}px`);
        document.documentElement.style.setProperty("--viewport-height", `${viewport.height}px`);
        return viewport;
    }

    function useTouchUILayout() {
        return window.matchMedia("(pointer: coarse)").matches || getViewportSize().width <= MOBILE_TOUCH_BREAKPOINT;
    }

    function imageReady(image) {
        return !!(image && image.complete && image.naturalWidth > 0);
    }

    function loadImageCandidates(candidates) {
        const paths = Array.isArray(candidates) ? candidates : [candidates];
        const image = new Image();

        return new Promise((resolve) => {
            function tryLoad(index) {
                if (index >= paths.length) {
                    resolve(image);
                    return;
                }

                image.onload = function () {
                    resolve(image);
                };

                image.onerror = function () {
                    tryLoad(index + 1);
                };

                image.src = encodeURI(paths[index]);
            }

            tryLoad(0);
        });
    }

    function createAudio(path, loop) {
        const audio = new Audio(encodeURI(path));
        audio.loop = !!loop;
        audio.preload = "auto";
        audio.volume = 0;
        return audio;
    }

    function safePlay(media) {
        if (!media) {
            return;
        }

        const result = media.play();
        if (result && typeof result.catch === "function") {
            result.catch(function () {});
        }
    }

    function sanitizeInitials(value) {
        const cleaned = (value || "")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 3);

        return cleaned || "???";
    }

    function sortScores(scores) {
        return scores.sort(function (left, right) {
            return (right.distance - left.distance) ||
                (right.questions - left.questions) ||
                (right.coins - left.coins);
        });
    }

    function createGame() {
        const canvas = document.getElementById("gameCanvas");
        if (!canvas || !Player || !createPlatformManager || !QuestionEngine) {
            return {
                start: function () {}
            };
        }

        const ctx = canvas.getContext("2d");
        const settings = Object.assign({
            category: "mixed",
            devMode: false
        }, root.settings || {});
        const dom = {
            hudText: document.getElementById("hudText"),
            playerDialogueBubble: document.getElementById("playerDialogueBubble"),
            playerDialogueText: document.getElementById("playerDialogueText"),
            mobileControls: document.getElementById("mobileControls"),
            touchLeftButton: document.getElementById("touchLeftButton"),
            touchRightButton: document.getElementById("touchRightButton"),
            touchJumpButton: document.getElementById("touchJumpButton"),
            devToolbar: document.getElementById("devToolbar"),
            devToolbarLabel: document.getElementById("devToolbarLabel"),
            devSkipButton: document.getElementById("devSkipButton"),
            devAutoButton: document.getElementById("devAutoButton"),
            devFreezeButton: document.getElementById("devFreezeButton"),
            devLevelDownButton: document.getElementById("devLevelDownButton"),
            devLevelClearButton: document.getElementById("devLevelClearButton"),
            devLevelUpButton: document.getElementById("devLevelUpButton"),
            devDistanceDownButton: document.getElementById("devDistanceDownButton"),
            devDistanceUpButton: document.getElementById("devDistanceUpButton"),
            cornerControls: document.getElementById("cornerControls"),
            pauseToggleButton: document.getElementById("pauseToggleButton"),
            soundToggleButton: document.getElementById("soundToggleButton"),
            pauseOverlay: document.getElementById("pauseOverlay"),
            resumeRunButton: document.getElementById("resumeRunButton"),
            restartRunButton: document.getElementById("restartRunButton"),
            summaryOverlay: document.getElementById("summaryOverlay"),
            summaryDistance: document.getElementById("summaryDistance"),
            summaryCoins: document.getElementById("summaryCoins"),
            summaryQuestions: document.getElementById("summaryQuestions"),
            summaryInitials: document.getElementById("summaryInitials"),
            summarySaveButton: document.getElementById("summarySaveButton"),
            scoreboardBody: document.getElementById("scoreboardBody"),
            summaryRestartButton: document.getElementById("summaryRestartButton"),
            questionBox: document.getElementById("questionBox"),
            questionText: document.getElementById("questionText"),
            options: document.getElementById("options"),
            feedback: document.getElementById("feedback")
        };

        const assets = {
            images: {},
            sounds: {}
        };

        const initialViewport = getViewportSize();
        const platformManager = createPlatformManager(initialViewport.width, initialViewport.height);
        const questionEngine = new QuestionEngine(
            dom.questionBox,
            dom.questionText,
            dom.options,
            dom.feedback,
            { category: settings.category }
        );

        const state = {
            started: false,
            assetsReady: false,
            rafId: 0,
            lastFrameTime: 0,
            keys: {},
            touch: {
                left: false,
                right: false
            },
            jumpQueued: false,
            audioUnlocked: false,
            isMuted: false,
            isPaused: false,
            isQuestionActive: false,
            isGameOver: false,
            scoreSaved: false,
            sceneTimeMs: 0,
            distancePixels: 0,
            distanceMeters: 0,
            maxWorldX: 0,
            startWorldX: 0,
            cameraX: 0,
            score: 0,
            coinsCollected: 0,
            questionsAnswered: 0,
            questionsCorrect: 0,
            safeSpawn: { x: 0, y: 0, platformId: null, offsetX: 0, surfaceY: 0 },
            smokeParticles: [],
            smokeSpawnTimer: 0,
            lavaSputters: [],
            lavaSputterTimer: 0,
            lavaMonster: null,
            activeAmbience: null,
            flyerSpawnTimer: 0,
            flyers: [],
            arrowHazards: [],
            arrowSpawnTimer: 0,
            dialogue: {
                deck: [],
                lastLine: "",
                currentText: "",
                visible: false,
                visibleMs: 0,
                visibleUntilMs: 0,
                cooldownMs: randomBetween(1200, 2400),
                idleMs: randomBetween(1800, 3600),
                nearLavaReady: true
            },
            dev: {
                enabled: !!settings.devMode,
                skipQuestions: false,
                autoCorrectQuestions: !!settings.devMode,
                freezeLava: false,
                levelOverrideIndex: null
            },
            musicTargetKey: "town",
            currentMusicKey: null,
            currentTrack: null,
            fade: null
        };

        let player = null;
        const lavaPlayerCanvas = document.createElement("canvas");
        const lavaPlayerCtx = lavaPlayerCanvas.getContext("2d");

        function getScores() {
            try {
                const raw = window.localStorage.getItem(SCOREBOARD_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        }

        function setScores(scores) {
            try {
                window.localStorage.setItem(
                    SCOREBOARD_STORAGE_KEY,
                    JSON.stringify(scores.slice(0, 10))
                );
            } catch (error) {
                return;
            }
        }

        function renderScoreboard() {
            const scores = sortScores(getScores()).slice(0, 10);
            dom.scoreboardBody.innerHTML = "";

            if (!scores.length) {
                const emptyRow = document.createElement("tr");
                const emptyCell = document.createElement("td");
                emptyCell.colSpan = 4;
                emptyCell.className = "scoreboard-empty";
                emptyCell.textContent = "No scores saved yet.";
                emptyRow.appendChild(emptyCell);
                dom.scoreboardBody.appendChild(emptyRow);
                return;
            }

            scores.forEach(function (entry) {
                const row = document.createElement("tr");
                row.innerHTML = [
                    `<td>${entry.initials}</td>`,
                    `<td>${entry.distance} m</td>`,
                    `<td>${entry.questions}</td>`,
                    `<td>${entry.coins}</td>`
                ].join("");
                dom.scoreboardBody.appendChild(row);
            });
        }

        function updateHud() {
            state.score = Math.floor(state.distanceMeters + state.coinsCollected * 50 + state.questionsCorrect * 100);
            dom.hudText.textContent = `Score: ${state.score} | Distance: ${state.distanceMeters} m | Coins: ${state.coinsCollected}`;
            dom.soundToggleButton.classList.toggle("is-muted", state.isMuted);
            dom.soundToggleButton.textContent = state.isMuted ? "Muted" : "Sound";
            dom.soundToggleButton.setAttribute("aria-pressed", String(!state.isMuted));
            updateDevToolbar();
        }

        function hidePlayerDialogueBubble() {
            if (!dom.playerDialogueBubble) {
                return;
            }

            dom.playerDialogueBubble.classList.remove("is-visible");
            dom.playerDialogueBubble.setAttribute("aria-hidden", "true");
        }

        function fitPlayerDialogueText(text) {
            if (!dom.playerDialogueBubble || !dom.playerDialogueText) {
                return;
            }

            const textNode = dom.playerDialogueText;
            const isCompactViewport = window.innerWidth <= 720;
            const baseFontSize = isCompactViewport ? 6.2 : 7.8;
            const minFontSize = isCompactViewport ? 4.05 : 4.8;
            let fontSize = baseFontSize;
            let lineHeight = fontSize <= 5.2 ? 0.98 : fontSize <= 6.5 ? 1.01 : 1.05;
            let letterSpacing = fontSize <= 5.2 ? "0" : fontSize <= 6.2 ? "0.003em" : "0.006em";

            textNode.textContent = text;
            textNode.style.fontSize = `${fontSize}px`;
            textNode.style.lineHeight = String(lineHeight);
            textNode.style.letterSpacing = letterSpacing;
            textNode.style.transform = "scale(1)";

            while (
                fontSize > minFontSize &&
                (textNode.scrollHeight > textNode.clientHeight || textNode.scrollWidth > textNode.clientWidth)
            ) {
                fontSize -= 0.25;
                lineHeight = fontSize <= 5.2 ? 0.98 : fontSize <= 6.3 ? 1 : 1.04;
                letterSpacing = fontSize <= 5.2 ? "0" : fontSize <= 6.2 ? "0.002em" : "0.005em";
                textNode.style.fontSize = `${fontSize}px`;
                textNode.style.lineHeight = String(lineHeight);
                textNode.style.letterSpacing = letterSpacing;
            }

            const widthScale = textNode.scrollWidth > textNode.clientWidth
                ? textNode.clientWidth / textNode.scrollWidth
                : 1;
            const heightScale = textNode.scrollHeight > textNode.clientHeight
                ? textNode.clientHeight / textNode.scrollHeight
                : 1;
            const contentScale = Math.max(0.62, Math.min(1, widthScale, heightScale));
            textNode.style.transform = contentScale < 0.999 ? `scale(${contentScale})` : "scale(1)";
        }

        function canShowPlayerDialogue() {
            return !!(
                dom.playerDialogueBubble &&
                dom.playerDialogueText &&
                player &&
                state.assetsReady &&
                !state.isPaused &&
                !state.isQuestionActive &&
                !state.isGameOver &&
                !state.dialogue.visible &&
                state.dialogue.cooldownMs <= 0
            );
        }

        function resetPlayerDialogue(startSoon) {
            state.dialogue.deck = [];
            state.dialogue.lastLine = "";
            state.dialogue.currentText = "";
            state.dialogue.visible = false;
            state.dialogue.visibleMs = 0;
            state.dialogue.visibleUntilMs = 0;
            state.dialogue.cooldownMs = 0;
            state.dialogue.idleMs = getAmbientDialogueDelayMs(startSoon);
            state.dialogue.nearLavaReady = true;

            if (dom.playerDialogueText) {
                dom.playerDialogueText.textContent = "";
            }

            hidePlayerDialogueBubble();
        }

        function showNextPlayerDialogue(reason) {
            const line = nextDialogueLine(state.dialogue);
            state.dialogue.currentText = line;
            state.dialogue.visible = true;
            state.dialogue.visibleMs = getDialogueVisibleMs();
            state.dialogue.visibleUntilMs = state.sceneTimeMs + getDialogueVisibleMs();
            state.dialogue.cooldownMs = getDialogueCooldownMs(reason);
            state.dialogue.idleMs = getAmbientDialogueDelayMs(false);
            state.dialogue.nearLavaReady = false;

            if (dom.playerDialogueBubble) {
                dom.playerDialogueBubble.classList.add("is-visible");
                dom.playerDialogueBubble.setAttribute("aria-hidden", "false");
            }

            if (dom.playerDialogueText) {
                fitPlayerDialogueText(line);
            }
        }

        function tryTriggerPlayerDialogue(reason, chance) {
            const triggerChance = typeof chance === "number" ? chance : 1;

            if (!canShowPlayerDialogue() || Math.random() > triggerChance) {
                return false;
            }

            showNextPlayerDialogue(reason);
            return true;
        }

        function updatePlayerDialogue(deltaMs) {
            if (!dom.playerDialogueBubble || !player) {
                return;
            }

            if (state.isPaused || state.isQuestionActive || state.isGameOver) {
                return;
            }

            state.dialogue.cooldownMs = Math.max(0, state.dialogue.cooldownMs - deltaMs);

            if (state.dialogue.visible) {
                state.dialogue.visibleMs = Math.max(0, state.dialogue.visibleUntilMs - state.sceneTimeMs);

                if (state.dialogue.visibleUntilMs <= state.sceneTimeMs) {
                    state.dialogue.visible = false;
                    state.dialogue.visibleUntilMs = 0;
                    hidePlayerDialogueBubble();
                }
                return;
            }

            state.dialogue.idleMs -= deltaMs;
            if (state.dialogue.idleMs <= 0 && state.dialogue.cooldownMs <= 0) {
                showNextPlayerDialogue("ambient");
            }
        }

        function renderPlayerDialogueBubble() {
            const bubble = dom.playerDialogueBubble;
            if (
                !bubble ||
                !player ||
                !state.assetsReady ||
                !state.dialogue.visible ||
                !state.dialogue.currentText ||
                state.isPaused ||
                state.isQuestionActive ||
                state.isGameOver
            ) {
                hidePlayerDialogueBubble();
                return;
            }

            const screenX = player.x - state.cameraX;
            const screenY = player.y;
            const bounds = player.getRenderBounds(screenX, screenY);
            const bubbleWidth = bubble.offsetWidth || 220;
            const bubbleHeight = bubble.offsetHeight || 146;
            const faceAnchorRatio = player.facing === -1
                ? PLAYER_DIALOGUE_FACE_ANCHOR_LEFT
                : PLAYER_DIALOGUE_FACE_ANCHOR_RIGHT;
            const anchorOffsetX = player.facing === -1
                ? PLAYER_DIALOGUE_BUBBLE_FACE_OFFSET_X_LEFT
                : PLAYER_DIALOGUE_BUBBLE_FACE_OFFSET_X_RIGHT;
            const touchShiftX = useTouchUILayout() ? PLAYER_DIALOGUE_BUBBLE_TOUCH_SHIFT_X : 0;
            const faceX = bounds.x + (bounds.width * faceAnchorRatio);
            const faceY = bounds.y + (bounds.height * PLAYER_DIALOGUE_FACE_ANCHOR_Y);
            const bubbleX = clamp(
                faceX - (bubbleWidth * PLAYER_DIALOGUE_BUBBLE_TIP_X) + anchorOffsetX + touchShiftX,
                12,
                canvas.width - bubbleWidth - 12
            );
            const bubbleY = clamp(
                faceY - (bubbleHeight * PLAYER_DIALOGUE_BUBBLE_TIP_Y) + PLAYER_DIALOGUE_BUBBLE_FACE_OFFSET_Y,
                12,
                canvas.height - bubbleHeight - 24
            );

            bubble.classList.add("is-visible");
            bubble.setAttribute("aria-hidden", "false");
            bubble.style.transform = `translate3d(${Math.round(bubbleX)}px, ${Math.round(bubbleY)}px, 0)`;
        }

        function getLavaMonsterWidth() {
            return clamp(canvas.width * 0.105, LAVA_MONSTER_MIN_WIDTH, LAVA_MONSTER_MAX_WIDTH);
        }

        function getLavaMonsterScreenBounds(width) {
            return {
                min: width * 0.58,
                max: Math.max(width * 0.58, canvas.width - width * 0.58)
            };
        }

        function pickLavaMonsterTarget(width) {
            const bounds = getLavaMonsterScreenBounds(width);
            const range = Math.max(0, bounds.max - bounds.min);
            const targetFractions = range < 180
                ? [0.16, 0.52, 0.86]
                : [0.08, 0.28, 0.5, 0.72, 0.9];
            const targetBase = targetFractions[Math.floor(Math.random() * targetFractions.length)];
            const jitter = randomBetween(-0.08, 0.08);
            return clamp(bounds.min + range * (targetBase + jitter), bounds.min, bounds.max);
        }

        function resetLavaMonster() {
            const width = getLavaMonsterWidth();
            const initialTarget = pickLavaMonsterTarget(width);
            state.lavaMonster = {
                screenX: initialTarget,
                targetScreenX: initialTarget,
                direction: 1,
                speed: randomBetween(46, 78),
                pauseMs: randomBetween(520, 1200),
                lastStep: 0,
                bobSeed: randomBetween(0, Math.PI * 2),
                submergeDepth: randomBetween(34, 40)
            };
        }

        function getArrowHazardIntensity(distanceMeters) {
            return clamp((distanceMeters - ARROW_HAZARD_START_METERS) / 2800, 0, 1);
        }

        function getArrowSpawnDelayMs(distanceMeters, warmup) {
            const intensity = getArrowHazardIntensity(distanceMeters);
            const minDelay = 2500 - intensity * 1100;
            const maxDelay = 3900 - intensity * 1600;
            const extraDelay = warmup ? randomBetween(480, 920) : 0;
            return randomBetween(minDelay, maxDelay) + extraDelay;
        }

        function getArrowSpeed(distanceMeters) {
            const intensity = getArrowHazardIntensity(distanceMeters);
            return randomBetween(236 + intensity * 34, 296 + intensity * 74);
        }

        function getArrowMaxOnScreen(distanceMeters) {
            return distanceMeters >= 2600 ? 2 : 1;
        }

        function getArrowHazardDimensions() {
            const arrowImage = assets.images.arrow;
            if (imageReady(arrowImage) && arrowImage.naturalWidth > 0 && arrowImage.naturalHeight > 0) {
                return {
                    width: Math.round(ARROW_HAZARD_HEIGHT * (arrowImage.naturalWidth / arrowImage.naturalHeight)),
                    height: ARROW_HAZARD_HEIGHT
                };
            }

            return {
                width: ARROW_HAZARD_WIDTH,
                height: ARROW_HAZARD_HEIGHT
            };
        }

        function resetArrowHazards(startSoon) {
            state.arrowHazards = [];
            state.arrowSpawnTimer = getArrowSpawnDelayMs(
                Math.max(state.distanceMeters, ARROW_HAZARD_START_METERS),
                !!startSoon
            );
        }

        function pickArrowLaneY(height) {
            const safeTop = 74;
            const safeBottom = Math.max(safeTop, getLavaSurfaceY() - height - 30);
            const laneSpan = Math.max(0, safeBottom - safeTop);
            const laneFractions = laneSpan < 130
                ? [0.62, 0.8]
                : laneSpan < 190
                    ? [0.58, 0.74, 0.88]
                    : [0.56, 0.68, 0.8, 0.9];
            const laneTargets = laneFractions.map(function (fraction) {
                return clamp(safeTop + laneSpan * fraction, safeTop, safeBottom);
            });
            return laneTargets[Math.floor(Math.random() * laneTargets.length)];
        }

        function createArrowHazard() {
            const size = getArrowHazardDimensions();
            return {
                x: canvas.width + size.width + randomBetween(28, 72),
                y: pickArrowLaneY(size.height),
                width: size.width,
                height: size.height,
                direction: -1,
                speed: getArrowSpeed(state.distanceMeters)
            };
        }

        function getPlayerScreenBounds() {
            const screenX = player.x - state.cameraX;
            return {
                left: screenX + 6,
                right: screenX + player.width - 6,
                top: player.hitboxTopY + 4,
                bottom: player.bottomY - 4
            };
        }

        function arrowHazardOverlapsPlayer(hazard) {
            if (!player) {
                return false;
            }

            const playerBounds = getPlayerScreenBounds();
            const hazardBounds = {
                left: hazard.x + 4,
                right: hazard.x + hazard.width - 4,
                top: hazard.y + 4,
                bottom: hazard.y + hazard.height - 4
            };

            return !(
                playerBounds.right <= hazardBounds.left ||
                playerBounds.left >= hazardBounds.right ||
                playerBounds.bottom <= hazardBounds.top ||
                playerBounds.top >= hazardBounds.bottom
            );
        }

        function updateArrowHazards(deltaMs) {
            if (!player || state.isPaused || state.isQuestionActive || state.isGameOver) {
                return false;
            }

            if (state.distanceMeters < ARROW_HAZARD_START_METERS) {
                if (state.arrowHazards.length) {
                    state.arrowHazards = [];
                }
                if (!Number.isFinite(state.arrowSpawnTimer) || state.arrowSpawnTimer <= 0) {
                    state.arrowSpawnTimer = getArrowSpawnDelayMs(ARROW_HAZARD_START_METERS, true);
                }
                return false;
            }

            state.arrowSpawnTimer -= deltaMs;
            const maxOnScreen = getArrowMaxOnScreen(state.distanceMeters);

            if (state.arrowSpawnTimer <= 0) {
                if (state.arrowHazards.length < maxOnScreen) {
                    state.arrowHazards.push(createArrowHazard());
                    state.arrowSpawnTimer = getArrowSpawnDelayMs(state.distanceMeters, false);
                } else {
                    state.arrowSpawnTimer = 240;
                }
            }

            const deltaSeconds = deltaMs / 1000;
            let hitArrow = false;

            state.arrowHazards.forEach(function (hazard) {
                hazard.x += hazard.direction * hazard.speed * deltaSeconds;

                if (!hitArrow && arrowHazardOverlapsPlayer(hazard)) {
                    hitArrow = true;
                    hazard.hit = true;
                }
            });

            state.arrowHazards = state.arrowHazards.filter(function (hazard) {
                return !hazard.hit &&
                    hazard.x < canvas.width + hazard.width + 80 &&
                    hazard.x + hazard.width > -hazard.width - 80;
            });

            if (hitArrow) {
                resetArrowHazards(false);
            }

            return hitArrow;
        }

        function drawRetroArrowHazard(hazard, timeMs) {
            const arrowImage = assets.images.arrow;
            if (imageReady(arrowImage)) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.shadowColor = "rgba(28, 16, 8, 0.26)";
                ctx.shadowBlur = 14;
                ctx.translate(Math.round(hazard.x), Math.round(hazard.y));

                if (hazard.direction < 0) {
                    ctx.translate(hazard.width, 0);
                    ctx.scale(-1, 1);
                }

                ctx.drawImage(arrowImage, 0, 0, hazard.width, hazard.height);
                ctx.restore();
                return;
            }

            const shadowColor = "rgba(35, 18, 8, 0.26)";
            const outlineColor = "#2b180f";
            const featherColor = "#6eaec0";
            const featherShade = "#375e73";
            const shaftColor = "#85522e";
            const shaftShade = "#603717";
            const tipColor = "#d8dce1";
            const tipShade = "#7f8b97";
            const highlightColor = Math.floor((timeMs || 0) / 120) % 2 === 0 ? "#fffdf1" : "#f3f5f7";
            const pixelX = hazard.width / 32;
            const pixelY = hazard.height / 16;
            const drawBlock = function (x, y, w, h, color, offsetX, offsetY) {
                ctx.fillStyle = color;
                ctx.fillRect(
                    Math.round((x + offsetX) * pixelX),
                    Math.round((y + offsetY) * pixelY),
                    Math.round(w * pixelX),
                    Math.round(h * pixelY)
                );
            };
            const drawArrowBody = function (offsetX, offsetY, isShadow) {
                const outline = isShadow ? shadowColor : outlineColor;
                drawBlock(0, 5, 5, 6, outline, offsetX, offsetY);
                drawBlock(5, 6, 3, 4, outline, offsetX, offsetY);
                drawBlock(8, 6, 10, 4, outline, offsetX, offsetY);
                drawBlock(18, 5, 2, 6, outline, offsetX, offsetY);
                drawBlock(20, 4, 3, 8, outline, offsetX, offsetY);
                drawBlock(23, 3, 3, 10, outline, offsetX, offsetY);
                drawBlock(26, 2, 3, 12, outline, offsetX, offsetY);
                drawBlock(29, 1, 3, 14, outline, offsetX, offsetY);

                if (isShadow) {
                    return;
                }

                drawBlock(1, 6, 2, 4, featherColor, offsetX, offsetY);
                drawBlock(3, 6, 1, 4, featherShade, offsetX, offsetY);
                drawBlock(4, 7, 1, 2, featherShade, offsetX, offsetY);
                drawBlock(8, 7, 9, 2, shaftColor, offsetX, offsetY);
                drawBlock(8, 8, 9, 1, shaftShade, offsetX, offsetY);
                drawBlock(18, 6, 1, 4, shaftShade, offsetX, offsetY);
                drawBlock(20, 5, 2, 6, tipShade, offsetX, offsetY);
                drawBlock(22, 4, 2, 8, tipColor, offsetX, offsetY);
                drawBlock(24, 3, 2, 10, tipShade, offsetX, offsetY);
                drawBlock(26, 2, 2, 12, tipColor, offsetX, offsetY);
                drawBlock(28, 3, 1, 10, tipShade, offsetX, offsetY);
                drawBlock(29, 2, 2, 12, tipColor, offsetX, offsetY);
                drawBlock(30, 5, 1, 6, highlightColor, offsetX, offsetY);
            };

            ctx.save();
            ctx.translate(Math.round(hazard.x), Math.round(hazard.y));

            if (hazard.direction < 0) {
                ctx.translate(hazard.width, 0);
                ctx.scale(-1, 1);
            }

            drawArrowBody(1.5, 1.5, true);
            drawArrowBody(0, 0, false);
            ctx.restore();
        }

        function drawArrowHazards(timeMs) {
            state.arrowHazards.forEach(function (hazard) {
                drawRetroArrowHazard(hazard, timeMs);
            });
        }

        function updateDevToolbar() {
            if (!dom.devToolbar) {
                return;
            }

            const visible = state.dev.enabled;
            dom.devToolbar.classList.toggle("hidden", !visible);

            if (!visible) {
                return;
            }

            const overrideName = state.dev.levelOverrideIndex === null
                ? "Auto Level"
                : `Level: ${LEVELS[state.dev.levelOverrideIndex].name}`;

            dom.devToolbarLabel.textContent = `Dev Mode | ${overrideName}`;
            dom.devSkipButton.classList.toggle("is-active", state.dev.skipQuestions);
            dom.devSkipButton.textContent = state.dev.skipQuestions ? "Skip Questions: On" : "Skip Questions";
            dom.devAutoButton.classList.toggle("is-active", state.dev.autoCorrectQuestions);
            dom.devAutoButton.textContent = state.dev.autoCorrectQuestions ? "Auto Correct: On" : "Auto Correct";
            dom.devFreezeButton.classList.toggle("is-active", state.dev.freezeLava);
            dom.devFreezeButton.textContent = state.dev.freezeLava ? "Freeze Lava: On" : "Freeze Lava";
            dom.devLevelClearButton.classList.toggle("is-active", state.dev.levelOverrideIndex === null);
        }

        function getCurrentLevelInfo(distanceMeters) {
            const levelNumber = Math.floor(distanceMeters / LEVEL_CYCLE_DISTANCE) + 1;
            const distanceIntoLevel = distanceMeters % LEVEL_CYCLE_DISTANCE;
            const overrideIndex = state.dev.enabled && state.dev.levelOverrideIndex !== null
                ? ((state.dev.levelOverrideIndex % LEVELS.length) + LEVELS.length) % LEVELS.length
                : null;
            const index = overrideIndex !== null ? overrideIndex : (levelNumber - 1) % LEVELS.length;
            const nextIndex = (index + 1) % LEVELS.length;

            return {
                index: index,
                levelNumber: levelNumber,
                distanceIntoLevel: distanceIntoLevel,
                config: LEVELS[index],
                nextConfig: LEVELS[nextIndex],
                blendAmount: overrideIndex !== null
                    ? 0
                    : clamp(
                        (distanceIntoLevel - (LEVEL_CYCLE_DISTANCE - LEVEL_BLEND_DISTANCE)) / LEVEL_BLEND_DISTANCE,
                        0,
                        1
                    )
            };
        }

        function getPlatformThemeForDistance(distanceMeters) {
            return getCurrentLevelInfo(distanceMeters).config.platformTheme;
        }

        function getPlatformThemeForPlatform(platform) {
            const platformMeters = Math.floor(Math.max(0, (platform.spawnX || platform.x) - state.startWorldX) * PX_TO_METERS);
            return getPlatformThemeForDistance(platformMeters);
        }

        function getPlatformSurfaceCorrection(theme) {
            return PLATFORM_SURFACE_CORRECTION[theme] || 10;
        }

        function getLandingSurfaceY(platform) {
            const theme = getPlatformThemeForPlatform(platform);
            return platform.y + platform.hitboxOffsetY + getPlatformSurfaceCorrection(theme);
        }

        function getLavaSurfaceY() {
            return canvas.height - LAVA_HEIGHT + LAVA_VERTICAL_NUDGE;
        }

        function updateSafeSpawn(platform) {
            const landingSurfaceY = getLandingSurfaceY(platform);
            const offsetX = Math.min(42, platform.w * 0.18);
            state.safeSpawn = {
                x: platform.x + offsetX,
                y: landingSurfaceY - PLAYER_FOOT_ANCHOR,
                platformId: platform.id,
                offsetX: offsetX,
                surfaceY: landingSurfaceY
            };
        }

        function getClosestPlatform(targetX) {
            const safePlatforms = platformManager.getPlatforms().filter(function (platform) {
                return getLandingSurfaceY(platform) < getLavaSurfaceY() - 24;
            });

            if (!safePlatforms.length) {
                return null;
            }

            if (state.safeSpawn.platformId) {
                const rememberedPlatform = safePlatforms.find(function (platform) {
                    return platform.id === state.safeSpawn.platformId;
                });

                if (rememberedPlatform) {
                    return rememberedPlatform;
                }
            }

            let bestPlatform = safePlatforms[0];
            let bestScore = Infinity;
            safePlatforms.forEach(function (platform) {
                const centerX = platform.x + platform.w / 2;
                const score =
                    Math.abs(centerX - targetX) +
                    Math.abs(getLandingSurfaceY(platform) - (state.safeSpawn.surfaceY || getLandingSurfaceY(platform))) * 0.22;

                if (score < bestScore) {
                    bestScore = score;
                    bestPlatform = platform;
                }
            });

            return bestPlatform;
        }

        function resizeCanvas() {
            const viewport = applyViewportSize();
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (player) {
                platformManager.resize(canvas.width, canvas.height);
                state.cameraX = Math.max(0, player.centerX - canvas.width * 0.34);
            }

            updateMobileControlsVisibility();
        }

        function hideAllOverlays() {
            dom.pauseOverlay.classList.add("hidden");
            dom.summaryOverlay.classList.add("hidden");
            dom.questionBox.classList.add("hidden");
        }

        function clearInputState() {
            state.touch.left = false;
            state.touch.right = false;
            state.jumpQueued = false;
            if (dom.touchLeftButton) {
                dom.touchLeftButton.classList.remove("is-active");
            }
            if (dom.touchRightButton) {
                dom.touchRightButton.classList.remove("is-active");
            }
            if (dom.touchJumpButton) {
                dom.touchJumpButton.classList.remove("is-active");
            }
            Object.keys(state.keys).forEach(function (key) {
                state.keys[key] = false;
            });
        }

        function logDev(message) {
            if (state.dev.enabled) {
                console.info(`[Ledger Legends][Dev] ${message}`);
            }
        }

        function toggleDevSkipQuestions() {
            state.dev.skipQuestions = !state.dev.skipQuestions;
            updateDevToolbar();
            logDev(`Skip questions ${state.dev.skipQuestions ? "enabled" : "disabled"}.`);
        }

        function toggleDevAutoCorrect() {
            state.dev.autoCorrectQuestions = !state.dev.autoCorrectQuestions;
            updateDevToolbar();
            logDev(`Auto-correct ${state.dev.autoCorrectQuestions ? "enabled" : "disabled"}.`);
        }

        function toggleDevFreezeLava() {
            state.dev.freezeLava = !state.dev.freezeLava;
            updateDevToolbar();
            logDev(`Freeze lava ${state.dev.freezeLava ? "enabled" : "disabled"}.`);
        }

        function pauseAllTracks() {
            Object.keys(assets.sounds).forEach(function (key) {
                const sound = assets.sounds[key];
                if (sound && typeof sound.pause === "function") {
                    sound.pause();
                }
            });
        }

        function startTrack(key) {
            const track = assets.sounds[key];
            if (!track) {
                return;
            }

            if (state.currentTrack && state.currentTrack !== track) {
                state.currentTrack.pause();
            }

            track.volume = state.isMuted ? 0 : MUSIC_VOLUME;
            safePlay(track);
            state.currentTrack = track;
            state.currentMusicKey = key;
            state.fade = null;
        }

        function requestMusic(key) {
            state.musicTargetKey = key;

            if (!state.audioUnlocked || state.isMuted || state.isPaused || state.isGameOver) {
                return;
            }

            if (!state.currentTrack) {
                startTrack(key);
                return;
            }

            if (state.currentMusicKey === key || (state.fade && state.fade.key === key)) {
                return;
            }

            const nextTrack = assets.sounds[key];
            if (!nextTrack) {
                return;
            }

            nextTrack.volume = 0;
            safePlay(nextTrack);
            state.fade = {
                from: state.currentTrack,
                to: nextTrack,
                key: key,
                elapsed: 0,
                duration: 1500
            };
        }

        function resumeMusicPlayback() {
            if (!state.audioUnlocked || state.isMuted || state.isPaused || state.isGameOver) {
                return;
            }

            if (state.fade) {
                if (state.fade.from) {
                    safePlay(state.fade.from);
                }

                if (state.fade.to) {
                    safePlay(state.fade.to);
                }
                return;
            }

            if (state.currentTrack) {
                state.currentTrack.volume = MUSIC_VOLUME;
                safePlay(state.currentTrack);
                return;
            }

            if (state.musicTargetKey) {
                startTrack(state.musicTargetKey);
            }
        }

        function updateMusic(deltaMs) {
            if (state.isMuted || state.isPaused || state.isGameOver || !state.audioUnlocked) {
                return;
            }

            if (state.fade) {
                state.fade.elapsed += deltaMs;
                const progress = clamp(state.fade.elapsed / state.fade.duration, 0, 1);

                if (state.fade.from) {
                    state.fade.from.volume = MUSIC_VOLUME * (1 - progress);
                }

                if (state.fade.to) {
                    state.fade.to.volume = MUSIC_VOLUME * progress;
                }

                if (progress >= 1) {
                    if (state.fade.from && state.fade.from !== state.fade.to) {
                        state.fade.from.pause();
                    }

                    state.currentTrack = state.fade.to;
                    state.currentMusicKey = state.fade.key;
                    state.fade = null;
                }
                return;
            }

            if (!state.currentTrack && state.musicTargetKey) {
                startTrack(state.musicTargetKey);
            }
        }

        function toggleMute() {
            state.isMuted = !state.isMuted;
            updateHud();

            if (state.isMuted) {
                pauseAllTracks();
                return;
            }

            unlockAudio();
            if (!state.isPaused && !state.isGameOver) {
                resumeMusicPlayback();
            }
        }

        function unlockAudio() {
            if (state.audioUnlocked) {
                return;
            }

            state.audioUnlocked = true;
            requestMusic(state.musicTargetKey);
        }

        function playCoinSound() {
            if (state.isMuted) {
                return;
            }

            const coinEffect = assets.sounds.coin;
            if (!coinEffect) {
                return;
            }

            const effect = coinEffect.cloneNode();
            effect.volume = COIN_VOLUME;
            safePlay(effect);
        }

        function loadAssets() {
            const imageSpecs = {
                playerIdle: ["assets/player_idle.png"],
                playerRun: ["assets/player_run.png"],
                playerSink: ["assets/player_sink.png"],
                backgroundCastle: ["assets/background_castle.png"],
                backgroundRuins: ["assets/background_ruins.png"],
                backgroundJungle: ["assets/background_jungle.png"],
                backgroundMushroom: ["assets/background_mushroom.png"],
                backgroundDungeon: ["assets/background_dungeon.png"],
                backgroundLava: ["assets/background_lava.png"],
                platformGreen: ["assets/platform-grass.png", "assets/green_platform.png"],
                platformAcid: ["assets/platform-acid.png"],
                platformLava: ["assets/platform-lava.png", "assets/lava_platform.png"],
                coin: ["assets/gold_coin.png"],
                lavaRiver: ["assets/river-lava.png"],
                lava: ["assets/lava.png"],
                monsterLava: ["assets/monster-lava.png"],
                arrow: ["assets/arrow.png"],
                birdUp: ["assets/BirdSprite_WingsUp.png", "assets/birdsprite_wingsup.png"],
                birdDown: ["assets/BirdSprite_WingDown.png", "assets/birdsprite_wingdown.png"],
                batUp: ["assets/bat-up.png"],
                batDown: ["assets/bat-down.png"]
            };

            const loaders = Object.keys(imageSpecs).map(function (key) {
                return loadImageCandidates(imageSpecs[key]).then(function (image) {
                    assets.images[key] = image;
                });
            });

            assets.sounds.town = createAudio("assets/Music/town_theme.mp3", true);
            assets.sounds.cave = createAudio("assets/Music/cave_theme.mp3", true);
            assets.sounds.coin = createAudio("assets/Music/coin.wav", false);

            return Promise.all(loaders).then(function () {
                state.assetsReady = true;
            });
        }

        function resetRun() {
            resizeCanvas();
            platformManager.resize(canvas.width, canvas.height);
            questionEngine.setCategory(settings.category);

            const firstPlatform = platformManager.getPlatforms()[0];
            state.startWorldX = firstPlatform.x + Math.min(42, firstPlatform.w * 0.18);
            updateSafeSpawn(firstPlatform);

            if (!player) {
                player = new Player({
                    idleImage: assets.images.playerIdle,
                    runImage: assets.images.playerRun,
                    sinkImage: assets.images.playerSink,
                    spawnX: state.safeSpawn.x,
                    spawnY: state.safeSpawn.y
                });
            } else {
                player.idleImage = assets.images.playerIdle;
                player.runImage = assets.images.playerRun;
                player.sinkImage = assets.images.playerSink || assets.images.playerRun;
                player.reset(state.safeSpawn.x, state.safeSpawn.y);
            }

            player.moveSpeed = BASE_RUN_SPEED;

            state.lastFrameTime = 0;
            state.sceneTimeMs = 0;
            state.distancePixels = 0;
            state.distanceMeters = 0;
            state.maxWorldX = player.centerX;
            state.cameraX = 0;
            state.score = 0;
            state.coinsCollected = 0;
            state.questionsAnswered = 0;
            state.questionsCorrect = 0;
            state.isPaused = false;
            state.isQuestionActive = false;
            state.isGameOver = false;
            state.scoreSaved = false;
            state.smokeParticles = [];
            state.smokeSpawnTimer = 0;
            state.lavaSputters = [];
            state.lavaSputterTimer = 0;
            resetLavaMonster();
            state.flyers = [];
            resetArrowHazards(true);
            state.activeAmbience = null;
            state.flyerSpawnTimer = randomBetween(1400, 2800);
            state.musicTargetKey = LEVELS[0].music;
            state.currentMusicKey = null;
            state.currentTrack = null;
            state.fade = null;
            state.dev.skipQuestions = false;
            state.dev.autoCorrectQuestions = !!settings.devMode;
            state.dev.freezeLava = false;
            state.dev.levelOverrideIndex = null;

            clearInputState();
            resetPlayerDialogue(true);
            hideAllOverlays();
            dom.cornerControls.classList.remove("hidden");
            updateMobileControlsVisibility();
            dom.summaryInitials.value = "";
            dom.summarySaveButton.disabled = false;
            updateHud();
            renderScoreboard();
            requestMusic(state.musicTargetKey);
            canvas.focus();

            if (state.dev.enabled) {
                logDev("Developer mode enabled. F6 skip questions, F7 auto-correct, F8 lava freeze, [ and ] level override, 0 clear override, =/- jump distance.");
            }
        }

        function drawCoverImage(image, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;

            if (imageReady(image)) {
                const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
                const drawWidth = image.naturalWidth * scale;
                const drawHeight = image.naturalHeight * scale;
                const drawX = (canvas.width - drawWidth) / 2;
                const drawY = (canvas.height - drawHeight) / 2;
                ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
            }

            ctx.restore();
        }

        function drawBackgroundFallback(colors, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(0.48, colors[1]);
            gradient.addColorStop(1, colors[2]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        function drawBackground() {
            const levelInfo = getCurrentLevelInfo(state.distanceMeters);
            const currentImage = assets.images[levelInfo.config.backgroundKey];
            const nextImage = assets.images[levelInfo.nextConfig.backgroundKey];

            if (imageReady(currentImage)) {
                drawCoverImage(currentImage, 1);
            } else {
                drawBackgroundFallback(levelInfo.config.fallback, 1);
            }

            if (levelInfo.blendAmount > 0) {
                if (imageReady(nextImage)) {
                    drawCoverImage(nextImage, levelInfo.blendAmount);
                } else {
                    drawBackgroundFallback(levelInfo.nextConfig.fallback, levelInfo.blendAmount);
                }
            }
        }

        function drawLava(timeMs) {
            const lavaY = getLavaSurfaceY();
            const riverImage = assets.images.lavaRiver;
            const lavaImage = assets.images.lava;

            if (imageReady(riverImage)) {
                const drawWidth = canvas.width + 120;
                const drawHeight = LAVA_HEIGHT;
                const flowOffset = ((timeMs || 0) * 0.08) % drawWidth;

                for (let offsetX = -drawWidth; offsetX < canvas.width + drawWidth; offsetX += drawWidth - 2) {
                    ctx.drawImage(
                        riverImage,
                        0,
                        LAVA_SOURCE_TOP,
                        riverImage.naturalWidth,
                        LAVA_SOURCE_HEIGHT,
                        offsetX - flowOffset,
                        lavaY,
                        drawWidth,
                        drawHeight
                    );
                }
            } else if (imageReady(lavaImage)) {
                const scale = Math.max(canvas.width / lavaImage.naturalWidth, LAVA_HEIGHT / lavaImage.naturalHeight);
                const drawWidth = lavaImage.naturalWidth * scale;
                const drawHeight = LAVA_HEIGHT;
                const flowOffset = ((timeMs || 0) * 0.09) % drawWidth;

                for (let offsetX = -drawWidth; offsetX < canvas.width + drawWidth; offsetX += drawWidth - 2) {
                    ctx.drawImage(lavaImage, offsetX - flowOffset, lavaY, drawWidth, drawHeight);
                }
            } else {
                const lavaGradient = ctx.createLinearGradient(0, lavaY, 0, canvas.height);
                lavaGradient.addColorStop(0, "#f97316");
                lavaGradient.addColorStop(0.4, "#fb923c");
                lavaGradient.addColorStop(1, "#7c2d12");
                ctx.fillStyle = lavaGradient;
                ctx.fillRect(0, lavaY, canvas.width, canvas.height - lavaY);
            }
        }

        function drawLavaForeground(timeMs) {
            const lavaY = getLavaSurfaceY();
            const riverImage = assets.images.lavaRiver;
            const lavaImage = assets.images.lava;

            ctx.save();
            ctx.globalAlpha = 0.96;

            if (imageReady(riverImage)) {
                const drawWidth = canvas.width + 120;
                const flowOffset = ((timeMs || 0) * 0.08) % drawWidth;

                for (let offsetX = -drawWidth; offsetX < canvas.width + drawWidth; offsetX += drawWidth - 2) {
                    ctx.drawImage(
                        riverImage,
                        0,
                        LAVA_SOURCE_TOP,
                        riverImage.naturalWidth,
                        Math.min(120, LAVA_SOURCE_HEIGHT),
                        offsetX - flowOffset,
                        lavaY,
                        drawWidth,
                        LAVA_MONSTER_FOREGROUND_HEIGHT
                    );
                }
            } else if (imageReady(lavaImage)) {
                const scale = Math.max(canvas.width / lavaImage.naturalWidth, LAVA_MONSTER_FOREGROUND_HEIGHT / lavaImage.naturalHeight);
                const drawWidth = lavaImage.naturalWidth * scale;
                const flowOffset = ((timeMs || 0) * 0.09) % drawWidth;

                for (let offsetX = -drawWidth; offsetX < canvas.width + drawWidth; offsetX += drawWidth - 2) {
                    ctx.drawImage(lavaImage, offsetX - flowOffset, lavaY, drawWidth, LAVA_MONSTER_FOREGROUND_HEIGHT);
                }
            } else {
                const lavaGradient = ctx.createLinearGradient(0, lavaY, 0, lavaY + LAVA_MONSTER_FOREGROUND_HEIGHT);
                lavaGradient.addColorStop(0, "rgba(251, 146, 60, 0.96)");
                lavaGradient.addColorStop(1, "rgba(194, 65, 12, 0.96)");
                ctx.fillStyle = lavaGradient;
                ctx.fillRect(0, lavaY, canvas.width, LAVA_MONSTER_FOREGROUND_HEIGHT);
            }

            ctx.restore();
        }

        function updateLavaSputters(deltaMs) {
            if (state.isPaused || state.isQuestionActive || state.isGameOver) {
                return;
            }

            state.lavaSputterTimer -= deltaMs;

            while (state.lavaSputterTimer <= 0) {
                const burstCount = Math.random() < 0.24 ? 3 : 1;
                const originX = state.cameraX + randomBetween(50, canvas.width - 50);

                for (let index = 0; index < burstCount; index += 1) {
                    state.lavaSputters.push({
                        x: originX + randomBetween(-16, 16),
                        y: getLavaSurfaceY() + randomBetween(4, 16),
                        vx: randomBetween(-0.4, 0.4),
                        vy: randomBetween(-2.8, -1.3),
                        radius: randomBetween(2.5, 5.5),
                        life: randomBetween(320, 560),
                        maxLife: 560,
                        glow: Math.random() < 0.35
                    });
                }

                state.lavaSputterTimer += randomBetween(120, 260);
            }

            const timeScale = deltaMs / 16.67;
            state.lavaSputters.forEach(function (particle) {
                particle.x += particle.vx * timeScale;
                particle.y += particle.vy * timeScale;
                particle.vy += 0.045 * timeScale;
                particle.life -= deltaMs;
                particle.radius *= 0.996;
            });

            state.lavaSputters = state.lavaSputters.filter(function (particle) {
                return particle.life > 0 && particle.radius > 0.8;
            });
        }

        function drawLavaSputters() {
            if (!state.lavaSputters.length) {
                return;
            }

            state.lavaSputters.forEach(function (particle) {
                const alpha = clamp(particle.life / particle.maxLife, 0, 1);
                const screenX = particle.x - state.cameraX;

                if (particle.glow) {
                    const glow = ctx.createRadialGradient(
                        screenX,
                        particle.y,
                        0,
                        screenX,
                        particle.y,
                        particle.radius * 2.6
                    );
                    glow.addColorStop(0, `rgba(255, 215, 120, ${alpha * 0.55})`);
                    glow.addColorStop(1, "rgba(255, 100, 0, 0)");
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(screenX, particle.y, particle.radius * 2.6, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = `rgba(255, 170, 60, ${alpha * 0.9})`;
                ctx.beginPath();
                ctx.arc(screenX, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function drawPlatforms() {
            platformManager.getPlatforms().forEach(function (platform) {
                const theme = getPlatformThemeForPlatform(platform);
                const image = theme === "green"
                    ? assets.images.platformGreen
                    : theme === "acid"
                        ? assets.images.platformAcid
                        : assets.images.platformLava;
                const screenX = platform.x - state.cameraX;
                const visualHeight = platform.h + (theme === "green" ? 20 : theme === "acid" ? 16 : 12);

                if (imageReady(image)) {
                    ctx.drawImage(image, screenX, platform.y, platform.w, visualHeight);
                    return;
                }

                const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + visualHeight);
                if (theme === "green") {
                    gradient.addColorStop(0, "#79d44c");
                    gradient.addColorStop(0.16, "#d6f59d");
                    gradient.addColorStop(1, "#8d6f47");
                } else if (theme === "acid") {
                    gradient.addColorStop(0, "#d8ff85");
                    gradient.addColorStop(0.16, "#9be64c");
                    gradient.addColorStop(0.55, "#4c9f44");
                    gradient.addColorStop(1, "#315a29");
                } else {
                    gradient.addColorStop(0, "#f97316");
                    gradient.addColorStop(0.18, "#fed7aa");
                    gradient.addColorStop(1, "#5b2114");
                }
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX, platform.y, platform.w, visualHeight);
            });
        }

        function drawCoins(timeMs) {
            const coinImage = assets.images.coin;
            const size = 59;
            const half = size / 2;

            platformManager.getCoins().forEach(function (coin, index) {
                if (coin.collected) {
                    return;
                }

                const bob = Math.sin((timeMs / 190) + index) * 4;
                const screenX = coin.x - state.cameraX - half;
                const screenY = coin.y + bob - half;

                if (imageReady(coinImage)) {
                    ctx.drawImage(coinImage, screenX, screenY, size, size);
                    return;
                }

                ctx.fillStyle = "#facc15";
                ctx.beginPath();
                ctx.arc(screenX + half, screenY + half, half * 0.8, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function updateAmbient(deltaMs) {
            const levelInfo = getCurrentLevelInfo(state.distanceMeters);
            if (state.activeAmbience !== levelInfo.config.ambience) {
                state.activeAmbience = levelInfo.config.ambience;
                state.flyers = [];
                state.flyerSpawnTimer = randomBetween(1600, 3000);
            }

            if (!state.lavaMonster) {
                resetLavaMonster();
            }

            state.flyerSpawnTimer -= deltaMs;
            if (state.flyerSpawnTimer <= 0 && state.flyers.length < 6) {
                spawnFlyers(levelInfo.config.ambience);
                state.flyerSpawnTimer = randomBetween(1800, 3600);
            }

            const deltaSeconds = deltaMs / 1000;
            const monsterWidth = getLavaMonsterWidth();
            const bounds = getLavaMonsterScreenBounds(monsterWidth);

            if (!Number.isFinite(state.lavaMonster.targetScreenX)) {
                state.lavaMonster.targetScreenX = pickLavaMonsterTarget(monsterWidth);
            }

            if (!Number.isFinite(state.lavaMonster.screenX)) {
                state.lavaMonster.screenX = state.lavaMonster.targetScreenX;
            }

            if (state.lavaMonster.pauseMs > 0) {
                state.lavaMonster.pauseMs = Math.max(0, state.lavaMonster.pauseMs - deltaMs);
                state.lavaMonster.lastStep = 0;
            }

            if (state.lavaMonster.pauseMs <= 0) {
                const maxStep = state.lavaMonster.speed * deltaSeconds;
                const deltaX = state.lavaMonster.targetScreenX - state.lavaMonster.screenX;
                const appliedStep = clamp(deltaX, -maxStep, maxStep);
                state.lavaMonster.screenX = clamp(state.lavaMonster.screenX + appliedStep, bounds.min, bounds.max);
                state.lavaMonster.lastStep = appliedStep;

                if (Math.abs(state.lavaMonster.targetScreenX - state.lavaMonster.screenX) <= 3) {
                    state.lavaMonster.targetScreenX = pickLavaMonsterTarget(monsterWidth);
                    state.lavaMonster.pauseMs = randomBetween(420, 980);
                    state.lavaMonster.speed = randomBetween(42, 76);
                    state.lavaMonster.lastStep = 0;
                }
            } else {
                state.lavaMonster.screenX = clamp(state.lavaMonster.screenX, bounds.min, bounds.max);
            }

            if (Math.abs(state.lavaMonster.lastStep) > 0.2) {
                state.lavaMonster.direction = state.lavaMonster.lastStep > 0 ? 1 : -1;
            }

            state.flyers.forEach(function (flyer) {
                flyer.x += flyer.vx * deltaSeconds;
            });

            state.flyers = state.flyers.filter(function (flyer) {
                return flyer.x > state.cameraX - 180 &&
                    flyer.x < state.cameraX + canvas.width + 180;
            });
        }

        function spawnFlyers(type) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const count = Math.random() < 0.58 ? 1 : Math.floor(randomBetween(3, 6));
            const baseY = type === "bat"
                ? randomBetween(150, 250)
                : randomBetween(60, 150);
            const speedBase = type === "bat" ? randomBetween(58, 84) : randomBetween(52, 78);
            const startX = direction > 0 ? state.cameraX - 120 : state.cameraX + canvas.width + 120;

            for (let index = 0; index < count; index += 1) {
                const spreadX = index * randomBetween(36, 56);
                const spreadY = index * randomBetween(8, 18);
                state.flyers.push({
                    type: type,
                    x: direction > 0 ? startX - spreadX : startX + spreadX,
                    y: baseY + spreadY,
                    vx: direction * (speedBase + index * 6),
                    width: type === "bat" ? 82 : 72,
                    height: type === "bat" ? 64 : 54
                });
            }
        }

        function drawFlyers(timeMs) {
            const birdFrame = Math.floor(timeMs / 120) % 2 === 0 ? assets.images.birdUp : assets.images.birdDown;
            const batFrame = Math.floor(timeMs / 120) % 2 === 0 ? assets.images.batUp : assets.images.batDown;

            state.flyers.forEach(function (flyer) {
                const image = flyer.type === "bat" ? batFrame : birdFrame;
                const screenX = flyer.x - state.cameraX;
                const movingRight = flyer.vx > 0;
                const shouldFlip = flyer.type === "bat" ? !movingRight : movingRight;

                if (imageReady(image)) {
                    if (shouldFlip) {
                        ctx.save();
                        ctx.translate(screenX + flyer.width, flyer.y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(image, 0, 0, flyer.width, flyer.height);
                        ctx.restore();
                    } else {
                        ctx.drawImage(image, screenX, flyer.y, flyer.width, flyer.height);
                    }
                    return;
                }

                ctx.fillStyle = flyer.type === "bat" ? "#2f2338" : "#ffffff";
                ctx.fillRect(screenX, flyer.y, flyer.width * 0.5, flyer.height * 0.24);
            });
        }

        function drawLavaMonster(timeMs) {
            if (!state.lavaMonster) {
                return;
            }

            const monsterImage = assets.images.monsterLava;
            if (!imageReady(monsterImage)) {
                return;
            }

            const width = getLavaMonsterWidth();
            const height = width;
            const screenX = state.lavaMonster.screenX - (width * 0.5);
            const bob = Math.sin((timeMs || 0) / 320 + state.lavaMonster.bobSeed) * 3;
            const strideStrength = Math.abs(state.lavaMonster.lastStep) > 0.2 ? 2.2 : 1.1;
            const stride = Math.abs(Math.sin((timeMs || 0) / 180)) * strideStrength;
            const drawY = getLavaSurfaceY() - height + state.lavaMonster.submergeDepth + bob + stride;

            ctx.save();
            ctx.globalAlpha = 0.98;
            ctx.shadowColor = "rgba(255, 120, 24, 0.42)";
            ctx.shadowBlur = 24;

            if (state.lavaMonster.direction < 0) {
                ctx.translate(screenX + width, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(monsterImage, 0, 0, width, height);
            } else {
                ctx.drawImage(monsterImage, screenX, drawY, width, height);
            }

            ctx.restore();
        }

        function drawPlayer() {
            const screenX = player.x - state.cameraX;
            const screenY = player.y;

            if (!player.inLava) {
                player.draw(ctx, screenX, screenY);
                return;
            }

            const bounds = player.getRenderBounds(screenX, screenY);
            const bobOffset = Math.sin((state.lastFrameTime || 0) * 0.01) * 1.5;
            const drawX = Math.round(bounds.x);
            const drawY = Math.round(bounds.y + bobOffset);
            const width = Math.max(1, Math.round(bounds.width));
            const height = Math.max(1, Math.round(bounds.height));

            lavaPlayerCanvas.width = width;
            lavaPlayerCanvas.height = height;
            lavaPlayerCtx.clearRect(0, 0, width, height);

            player.renderSpriteToContext(lavaPlayerCtx, {
                x: 0,
                y: 0,
                width: width,
                height: height
            });

            lavaPlayerCtx.save();
            lavaPlayerCtx.globalCompositeOperation = "source-atop";
            lavaPlayerCtx.globalAlpha = 0.88;
            const heatGradient = lavaPlayerCtx.createLinearGradient(0, height * 0.36, 0, height);
            heatGradient.addColorStop(0, "rgba(255, 170, 55, 0.00)");
            heatGradient.addColorStop(0.48, "rgba(255, 130, 30, 0.16)");
            heatGradient.addColorStop(1, "rgba(198, 42, 5, 0.46)");
            lavaPlayerCtx.fillStyle = heatGradient;
            lavaPlayerCtx.fillRect(0, 0, width, height);
            lavaPlayerCtx.restore();

            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.drawImage(lavaPlayerCanvas, drawX, drawY, width, height);
            ctx.restore();
        }

        function setPlayerLavaState(isInLava) {
            if (!player) {
                return;
            }

            player.setLavaState(isInLava);

            if (isInLava) {
                player.y = getLavaSurfaceY() - PLAYER_FOOT_ANCHOR + 24;
                player.dy = 0;
                state.smokeSpawnTimer = 0;
            }
        }

        function updateSmoke(deltaMs) {
            if (!player) {
                return;
            }

            if (state.isPaused || state.isQuestionActive || state.isGameOver) {
                return;
            }

            state.smokeSpawnTimer -= deltaMs;

            if (player.inLava) {
                while (state.smokeSpawnTimer <= 0) {
                    state.smokeParticles.push({
                        x: player.centerX + randomBetween(-10, 10),
                        y: player.y + 26 + randomBetween(-6, 6),
                        vx: randomBetween(-0.35, 0.35),
                        vy: randomBetween(-1.5, -0.7),
                        radius: randomBetween(7, 13),
                        life: randomBetween(480, 860),
                        maxLife: 860
                    });
                    state.smokeSpawnTimer += 70;
                }
            } else {
                state.smokeSpawnTimer = Math.min(state.smokeSpawnTimer, 0);
            }

            state.smokeParticles.forEach(function (particle) {
                const timeScale = deltaMs / 16.67;
                particle.x += particle.vx * timeScale;
                particle.y += particle.vy * timeScale;
                particle.life -= deltaMs;
                particle.radius += 0.09 * timeScale;
            });

            state.smokeParticles = state.smokeParticles.filter(function (particle) {
                return particle.life > 0;
            });
        }

        function drawSmoke() {
            if (!state.smokeParticles.length) {
                return;
            }

            state.smokeParticles.forEach(function (particle) {
                const alpha = clamp(particle.life / particle.maxLife, 0, 1) * 0.55;
                const gradient = ctx.createRadialGradient(
                    particle.x - state.cameraX,
                    particle.y,
                    1,
                    particle.x - state.cameraX,
                    particle.y,
                    particle.radius
                );
                gradient.addColorStop(0, `rgba(244, 244, 244, ${alpha})`);
                gradient.addColorStop(0.45, `rgba(176, 176, 176, ${alpha * 0.72})`);
                gradient.addColorStop(1, "rgba(80, 80, 80, 0)");
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x - state.cameraX, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function getMergedInput() {
            const input = Object.assign({}, state.keys);

            if (state.touch.left) {
                input.ArrowLeft = true;
            }

            if (state.touch.right) {
                input.ArrowRight = true;
            }

            if (state.jumpQueued) {
                input.Space = true;
            }

            return input;
        }

        function overlapsPlatform(platform) {
            return player.rightX > platform.x + 10 &&
                player.leftX < platform.x + platform.w - 10;
        }

        function getSupportingPlatform() {
            return platformManager.getPlatforms().find(function (platform) {
                return overlapsPlatform(platform) &&
                    Math.abs(player.bottomY - getLandingSurfaceY(platform)) <= 8;
            }) || null;
        }

        function carryPlayerWithMovingPlatform() {
            const platform = getSupportingPlatform();
            if (!platform || !platform.isMoving || !platform.lastDeltaX) {
                return;
            }

            player.x += platform.lastDeltaX;
        }

        function resolvePlatformCollisions(previousBottomY) {
            let landedPlatform = null;

            platformManager.getPlatforms().forEach(function (platform) {
                const landingSurfaceY = getLandingSurfaceY(platform);

                if (!overlapsPlatform(platform)) {
                    return;
                }

                if (player.dy >= 0 &&
                    previousBottomY <= landingSurfaceY + 6 &&
                    player.bottomY >= landingSurfaceY &&
                    player.hitboxTopY < landingSurfaceY) {
                    player.y = landingSurfaceY - player.hitboxHeight - player.hitboxOffsetY;
                    player.dy = 0;
                    player.jumping = false;
                    player.isOnGround = true;
                    landedPlatform = platform;
                }
            });

            return landedPlatform;
        }

        function collectCoins() {
            let collectedCount = 0;

            platformManager.getCoins().forEach(function (coin) {
                if (coin.collected) {
                    return;
                }

                const coinHalf = 29.5;
                const withinX = player.rightX > coin.x - coinHalf && player.leftX < coin.x + coinHalf;
                const withinY = player.bottomY > coin.y - coinHalf && player.hitboxTopY < coin.y + coinHalf;

                if (withinX && withinY) {
                    coin.collected = true;
                    state.coinsCollected += 1;
                    collectedCount += 1;
                    playCoinSound();
                }
            });

            return collectedCount;
        }

        function placePlayerOnPlatform(platform, preferredOffsetX) {
            const landingSurfaceY = getLandingSurfaceY(platform);
            const safeOffset = clamp(
                preferredOffsetX,
                18,
                Math.max(18, platform.w - player.width - 18)
            );

            player.reset(
                platform.x + safeOffset,
                landingSurfaceY - player.hitboxHeight - player.hitboxOffsetY
            );
            player.sinkImage = assets.images.playerSink || assets.images.playerRun;
            player.moveSpeed = BASE_RUN_SPEED;
            player.dy = 0;
            player.jumping = false;
            player.isOnGround = true;
            updateSafeSpawn(platform);
        }

        function respawnPlayer(targetX) {
            const referenceX = typeof targetX === "number"
                ? targetX
                : state.safeSpawn.x || player.centerX;
            const platform = getClosestPlatform(referenceX);

            if (platform) {
                const preferredOffset = platform.id === state.safeSpawn.platformId
                    ? state.safeSpawn.offsetX
                    : platform.w / 2 - player.width / 2;
                placePlayerOnPlatform(platform, preferredOffset);
            } else {
                player.reset(state.safeSpawn.x, state.safeSpawn.y);
            }

            player.sinkImage = assets.images.playerSink || assets.images.playerRun;
            player.moveSpeed = BASE_RUN_SPEED;
            player.dy = 0;
            player.jumping = false;
            player.isOnGround = true;
            state.smokeParticles = [];
            state.smokeSpawnTimer = 0;
            player.setLavaState(false);
            state.cameraX = Math.max(0, player.centerX - canvas.width * 0.34);
        }

        function jumpToDistance(targetMeters) {
            const clampedMeters = Math.max(0, targetMeters);

            if (clampedMeters < state.distanceMeters) {
                resetRun();
            }

            const targetCenterX = state.startWorldX + clampedMeters / PX_TO_METERS;

            player.x = targetCenterX - player.width / 2;
            state.maxWorldX = Math.max(state.maxWorldX, targetCenterX);
            state.distancePixels = Math.max(0, targetCenterX - state.startWorldX);
            state.distanceMeters = Math.floor(state.distancePixels * PX_TO_METERS);
            state.cameraX = Math.max(0, player.centerX - canvas.width * 0.34);

            platformManager.update(state.distancePixels, state.distanceMeters, state.cameraX, 16.67);
            respawnPlayer(targetCenterX);
            updateWorldMetrics();
            updateHud();
            logDev(`Jumped to ${state.distanceMeters} meters.`);
        }

        function cycleLevelOverride(step) {
            const currentIndex = state.dev.levelOverrideIndex === null
                ? getCurrentLevelInfo(state.distanceMeters).index
                : state.dev.levelOverrideIndex;
            state.dev.levelOverrideIndex = (currentIndex + step + LEVELS.length) % LEVELS.length;
            updateDevToolbar();
            logDev(`Forced level: ${LEVELS[state.dev.levelOverrideIndex].name}.`);
        }

        function clearLevelOverride() {
            state.dev.levelOverrideIndex = null;
            updateDevToolbar();
            logDev("Returned to automatic level progression.");
        }

        function showSummary() {
            dom.summaryDistance.textContent = `${state.distanceMeters} m`;
            dom.summaryCoins.textContent = String(state.coinsCollected);
            dom.summaryQuestions.textContent = String(state.questionsCorrect);
            dom.summaryInitials.value = "";
            dom.summarySaveButton.disabled = false;
            dom.summaryOverlay.classList.remove("hidden");
            dom.cornerControls.classList.add("hidden");
            renderScoreboard();
        }

        function endRun() {
            state.isGameOver = true;
            state.isQuestionActive = false;
            state.arrowHazards = [];
            state.dialogue.visible = false;
            state.dialogue.visibleUntilMs = 0;
            hidePlayerDialogueBubble();
            updateMobileControlsVisibility();
            pauseAllTracks();
            showSummary();
        }

        function saveScore() {
            if (state.scoreSaved) {
                return;
            }

            const entries = getScores();
            entries.push({
                initials: sanitizeInitials(dom.summaryInitials.value),
                distance: state.distanceMeters,
                questions: state.questionsCorrect,
                coins: state.coinsCollected
            });

            const topScores = sortScores(entries).slice(0, 10);
            setScores(topScores);
            state.scoreSaved = true;
            dom.summarySaveButton.disabled = true;
            renderScoreboard();
        }

        function togglePause(forceValue) {
            if (state.isGameOver || state.isQuestionActive) {
                return;
            }

            state.isPaused = typeof forceValue === "boolean" ? forceValue : !state.isPaused;
            dom.pauseOverlay.classList.toggle("hidden", !state.isPaused);

            if (state.isPaused) {
                clearInputState();
                pauseAllTracks();
            } else if (!state.isMuted) {
                resumeMusicPlayback();
            }

            updateMobileControlsVisibility();
        }

        function updateMobileControlsVisibility() {
            if (!dom.mobileControls) {
                return;
            }

            const shouldShow = useTouchUILayout() &&
                !state.isPaused &&
                !state.isQuestionActive &&
                !state.isGameOver;

            dom.mobileControls.classList.toggle("hidden", !shouldShow);
        }

        async function triggerQuestion(options) {
            if (state.isQuestionActive || state.isGameOver) {
                return;
            }

            const config = Object.assign({
                respawnTargetX: player.centerX,
                sinkPlayer: true
            }, options);
            const respawnTargetX = config.respawnTargetX;
            state.isQuestionActive = true;
            state.arrowHazards = [];
            resetArrowHazards(false);
            state.dialogue.visible = false;
            state.dialogue.visibleUntilMs = 0;
            hidePlayerDialogueBubble();
            setPlayerLavaState(!!config.sinkPlayer);
            clearInputState();
            dom.cornerControls.classList.add("hidden");
            updateMobileControlsVisibility();

            if (state.dev.enabled && state.dev.skipQuestions) {
                state.questionsAnswered += 1;
                state.questionsCorrect += 1;
                state.isQuestionActive = false;
                dom.cornerControls.classList.remove("hidden");
                respawnPlayer(respawnTargetX);
                updateHud();
                updateMobileControlsVisibility();
                logDev("Skipped question and respawned safely.");
                return;
            }

            const result = await questionEngine.ask({
                autoCorrect: state.dev.enabled && state.dev.autoCorrectQuestions
            });
            state.questionsAnswered += 1;
            state.isQuestionActive = false;
            dom.cornerControls.classList.remove("hidden");

            if (result.isCorrect) {
                state.questionsCorrect += 1;
                respawnPlayer(respawnTargetX);
            } else {
                endRun();
            }

            updateHud();
            updateMobileControlsVisibility();
        }

        function updateWorldMetrics() {
            state.maxWorldX = Math.max(state.maxWorldX, player.centerX);
            state.distancePixels = Math.max(0, state.maxWorldX - state.startWorldX);
            state.distanceMeters = Math.floor(state.distancePixels * PX_TO_METERS);
            state.cameraX = Math.max(0, player.centerX - canvas.width * 0.34);
        }

        function update(deltaMs, ambientDeltaMs, arrowDeltaMs) {
            const input = getMergedInput();
            const wasGrounded = player.isOnGround;
            const previousBottomY = player.bottomY;

            player.handleInput(input, deltaMs);
            state.jumpQueued = false;
            const jumpedThisFrame = wasGrounded && !player.isOnGround && player.dy < 0;
            player.x = Math.max(-20, player.x);
            player.applyPhysics(canvas.height, deltaMs);

            updateWorldMetrics();
            platformManager.update(state.distancePixels, state.distanceMeters, state.cameraX, deltaMs);

            if (wasGrounded) {
                carryPlayerWithMovingPlatform();
            }

            const landedPlatform = resolvePlatformCollisions(previousBottomY);
            if (landedPlatform) {
                updateSafeSpawn(landedPlatform);
            }

            updateWorldMetrics();
            const collectedCoins = collectCoins();

            if (jumpedThisFrame) {
                tryTriggerPlayerDialogue("jump", 0.36);
            }

            if (collectedCoins > 0) {
                tryTriggerPlayerDialogue("coin", collectedCoins > 1 ? 0.72 : 0.52);
            }

            const isNearLava = !player.isOnGround && player.bottomY >= getLavaSurfaceY() - PLAYER_DIALOGUE_NEAR_LAVA_BUFFER;
            if (isNearLava) {
                if (state.dialogue.nearLavaReady) {
                    if (!tryTriggerPlayerDialogue("near-lava", 0.82)) {
                        state.dialogue.nearLavaReady = false;
                    }
                }
            } else {
                state.dialogue.nearLavaReady = true;
            }

            updateAmbient(ambientDeltaMs);

            if (updateArrowHazards(arrowDeltaMs)) {
                void triggerQuestion({ sinkPlayer: false });
                return;
            }

            if (player.bottomY >= getLavaSurfaceY() + 4) {
                if (state.dev.enabled && state.dev.freezeLava) {
                    respawnPlayer(player.centerX);
                    logDev("Lava death prevented.");
                    updateHud();
                    return;
                }
                void triggerQuestion();
            }

            const levelInfo = getCurrentLevelInfo(state.distanceMeters);
            requestMusic(levelInfo.config.music);
            updateHud();
            updatePlayerDialogue(deltaMs);
        }

        function draw(timeMs) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!player) {
                drawBackgroundFallback(["#120f25", "#24132f", "#37130b"], 1);
                return;
            }

            drawBackground();
            drawLava(timeMs);
            drawLavaMonster(timeMs);
            drawLavaForeground(timeMs);
            drawLavaSputters();
            drawPlatforms();
            drawCoins(timeMs);
            drawFlyers(timeMs);
            drawPlayer();
            drawArrowHazards(timeMs);
            drawSmoke();
        }

        function frame(timeMs) {
            if (!state.started) {
                return;
            }

            const rawDeltaMs = state.lastFrameTime
                ? Math.min(50, Math.max(0, timeMs - state.lastFrameTime))
                : 16.67;
            const deltaMs = clamp(rawDeltaMs, 8, 33.34);
            state.lastFrameTime = timeMs;

            if (state.assetsReady && !state.isPaused && !state.isQuestionActive && !state.isGameOver) {
                state.sceneTimeMs += rawDeltaMs;
                update(deltaMs, rawDeltaMs, rawDeltaMs);
            }

            if (state.assetsReady) {
                updateLavaSputters(deltaMs);
                updateSmoke(deltaMs);
            }

            updateMusic(deltaMs);
            draw(state.sceneTimeMs);
            renderPlayerDialogueBubble();
            state.rafId = window.requestAnimationFrame(frame);
        }

        function handleKeyDown(event) {
            unlockAudio();

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(event.code) >= 0) {
                event.preventDefault();
            }

            if (event.code === "Escape" || event.code === "KeyP") {
                event.preventDefault();
                togglePause();
                return;
            }

            if (state.dev.enabled) {
                switch (event.code) {
                    case "F6":
                        event.preventDefault();
                        toggleDevSkipQuestions();
                        return;
                    case "F7":
                        event.preventDefault();
                        toggleDevAutoCorrect();
                        return;
                    case "F8":
                        event.preventDefault();
                        toggleDevFreezeLava();
                        return;
                    case "BracketLeft":
                        event.preventDefault();
                        if (!state.isGameOver) {
                            cycleLevelOverride(-1);
                        }
                        return;
                    case "BracketRight":
                        event.preventDefault();
                        if (!state.isGameOver) {
                            cycleLevelOverride(1);
                        }
                        return;
                    case "Digit0":
                    case "Numpad0":
                        event.preventDefault();
                        clearLevelOverride();
                        return;
                    case "Equal":
                    case "NumpadAdd":
                        event.preventDefault();
                        if (!state.isQuestionActive && !state.isGameOver) {
                            jumpToDistance(state.distanceMeters + 1000);
                        }
                        return;
                    case "Minus":
                    case "NumpadSubtract":
                        event.preventDefault();
                        if (!state.isQuestionActive && !state.isGameOver) {
                            jumpToDistance(Math.max(0, state.distanceMeters - 1000));
                        }
                        return;
                }
            }

            if (state.isPaused || state.isGameOver || state.isQuestionActive) {
                return;
            }

            state.keys[event.code] = true;
        }

        function handleKeyUp(event) {
            state.keys[event.code] = false;
        }

        function handleTouchStart(event) {
            event.preventDefault();
            unlockAudio();
        }

        function handleTouchMove(event) {
            event.preventDefault();
        }

        function handleTouchEnd(event) {
            event.preventDefault();
        }

        function bindTouchControlButton(button, onPress, onRelease) {
            if (!button) {
                return;
            }

            function handlePress(event) {
                event.preventDefault();
                unlockAudio();

                if (state.isPaused || state.isQuestionActive || state.isGameOver) {
                    return;
                }

                button.classList.add("is-active");
                if (typeof onPress === "function") {
                    onPress();
                }
            }

            function handleRelease(event) {
                event.preventDefault();
                button.classList.remove("is-active");
                if (typeof onRelease === "function") {
                    onRelease();
                }
            }

            button.addEventListener("pointerdown", handlePress);
            button.addEventListener("pointerup", handleRelease);
            button.addEventListener("pointercancel", handleRelease);
            button.addEventListener("pointerleave", handleRelease);
            button.addEventListener("lostpointercapture", handleRelease);
            button.addEventListener("contextmenu", function (event) {
                event.preventDefault();
            });
        }

        function bindEvents() {
            window.addEventListener("keydown", handleKeyDown);
            window.addEventListener("keyup", handleKeyUp);
            window.addEventListener("resize", resizeCanvas);
            if (window.visualViewport) {
                window.visualViewport.addEventListener("resize", resizeCanvas);
            }
            window.addEventListener("blur", function () {
                if (!state.isGameOver && !state.isQuestionActive) {
                    togglePause(true);
                }
            });

            canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
            canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
            canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
            canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });
            canvas.addEventListener("mousedown", unlockAudio);
            bindTouchControlButton(dom.touchLeftButton, function () {
                state.touch.left = true;
            }, function () {
                state.touch.left = false;
            });
            bindTouchControlButton(dom.touchRightButton, function () {
                state.touch.right = true;
            }, function () {
                state.touch.right = false;
            });
            bindTouchControlButton(dom.touchJumpButton, function () {
                state.jumpQueued = true;
            }, function () {});

            dom.pauseToggleButton.addEventListener("click", function () {
                unlockAudio();
                togglePause();
            });

            dom.soundToggleButton.addEventListener("click", function () {
                unlockAudio();
                toggleMute();
            });

            if (dom.devSkipButton) {
                dom.devSkipButton.addEventListener("click", function () {
                    if (state.dev.enabled) {
                        toggleDevSkipQuestions();
                    }
                });
                dom.devAutoButton.addEventListener("click", function () {
                    if (state.dev.enabled) {
                        toggleDevAutoCorrect();
                    }
                });
                dom.devFreezeButton.addEventListener("click", function () {
                    if (state.dev.enabled) {
                        toggleDevFreezeLava();
                    }
                });
                dom.devLevelDownButton.addEventListener("click", function () {
                    if (state.dev.enabled) {
                        cycleLevelOverride(-1);
                    }
                });
                dom.devLevelClearButton.addEventListener("click", function () {
                    if (state.dev.enabled) {
                        clearLevelOverride();
                    }
                });
                dom.devLevelUpButton.addEventListener("click", function () {
                    if (state.dev.enabled) {
                        cycleLevelOverride(1);
                    }
                });
                dom.devDistanceDownButton.addEventListener("click", function () {
                    if (state.dev.enabled && !state.isQuestionActive && !state.isGameOver) {
                        jumpToDistance(Math.max(0, state.distanceMeters - 1000));
                    }
                });
                dom.devDistanceUpButton.addEventListener("click", function () {
                    if (state.dev.enabled && !state.isQuestionActive && !state.isGameOver) {
                        jumpToDistance(state.distanceMeters + 1000);
                    }
                });
            }

            dom.resumeRunButton.addEventListener("click", function () {
                togglePause(false);
            });

            dom.restartRunButton.addEventListener("click", function () {
                resetRun();
            });

            dom.summaryRestartButton.addEventListener("click", function () {
                resetRun();
            });

            dom.summarySaveButton.addEventListener("click", saveScore);
            dom.summaryInitials.addEventListener("input", function () {
                dom.summaryInitials.value = sanitizeInitials(dom.summaryInitials.value).replace(/\?/g, "");
            });
        }

        function start() {
            if (state.started) {
                return;
            }

            state.started = true;
            resizeCanvas();
            bindEvents();
            drawBackgroundFallback(["#120f25", "#24132f", "#37130b"], 1);

            loadAssets().then(function () {
                resetRun();
            });

            state.rafId = window.requestAnimationFrame(frame);
        }

        return {
            start: start
        };
    }

    root.createGame = createGame;
})();
