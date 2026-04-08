(function () {
    const PLAYER_BASE_MOVE_SPEED = 5.3 * 0.85;
    const PLAYER_BASE_JUMP_FORCE = 15;
    const PLAYER_GRAVITY = 0.55;
    const GREEN_PLATFORM_SURFACE_CORRECTION = 10;

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function createMovementProfile(distanceMeters) {
        const movementProgress = clamp((distanceMeters - 3000) / 3000, 0, 1);
        return {
            moveRange: randomBetween(60, 82 + movementProgress * 28),
            moveSpeed: randomBetween(52, 70 + movementProgress * 22)
        };
    }

    function getPlatformSurfaceY(platform) {
        return platform.y + platform.hitboxOffsetY;
    }

    function getReachableJumpWindow(playerSpeedBoost) {
        const travelSpeed = PLAYER_BASE_MOVE_SPEED + playerSpeedBoost;
        const framesToPeak = PLAYER_BASE_JUMP_FORCE / PLAYER_GRAVITY;
        const totalAirFrames = framesToPeak * 2.05;
        const theoreticalRise = (PLAYER_BASE_JUMP_FORCE * PLAYER_BASE_JUMP_FORCE) / (2 * PLAYER_GRAVITY);
        const theoreticalRunDistance = travelSpeed * totalAirFrames;

        return {
            maxGap: clamp(theoreticalRunDistance * 0.58, 148, 208),
            maxRise: clamp(theoreticalRise * 0.63, 110, 140),
            maxDrop: clamp(theoreticalRise * 0.78, 132, 176)
        };
    }

    function createPlatformManager(canvasWidth, canvasHeight) {
        const state = {
            platforms: [],
            coins: [],
            nextPlatformId: 0,
            nextCoinId: 0,
            nextSpawnX: 0,
            distance: 0,
            distanceMeters: 0,
            platformsSinceCoin: 0,
            totalPlatformsGenerated: 0
        };

        function createPlatform(x, y, w, h, distanceMeters) {
            const isMoving = distanceMeters >= 3000;
            const movementProfile = isMoving ? createMovementProfile(distanceMeters) : null;
            return {
                id: `platform-${state.nextPlatformId++}`,
                x: x,
                spawnX: x,
                y: y,
                w: w,
                h: h,
                hitboxOffsetY: Math.round(h * 0.34),
                hitboxHeight: Math.round(h * 0.44),
                isMoving: isMoving,
                moveRange: movementProfile ? movementProfile.moveRange : 0,
                moveSpeed: movementProfile ? movementProfile.moveSpeed : 0,
                moveDirection: Math.random() < 0.5 ? -1 : 1,
                lastDeltaX: 0
            };
        }

        function createCoin(x, y, platform) {
            return {
                id: `coin-${state.nextCoinId++}`,
                x: x,
                y: y,
                collected: false,
                anchorPlatformId: platform ? platform.id : null,
                offsetX: platform ? x - platform.x : 0,
                offsetY: platform ? y - platform.y : 0
            };
        }

        function difficultyFor(distance) {
            const progress = distance / 2500;
            const jumpWindow = getReachableJumpWindow(clamp(progress * 0.102, 0, 1.53));
            const intendedGapMin = 98 + progress * 12;
            const intendedGapMax = 130 + progress * 18;
            const safeGapMin = clamp(intendedGapMin, 92, jumpWindow.maxGap - 34);
            const safeGapMax = clamp(intendedGapMax, safeGapMin + 14, jumpWindow.maxGap);

            return {
                gapMin: safeGapMin,
                gapMax: safeGapMax,
                widthMin: clamp(190 - progress * 14, 130, 190),
                widthMax: clamp(290 - progress * 16, 180, 290),
                maxRise: jumpWindow.maxRise,
                maxDrop: jumpWindow.maxDrop,
                baseY: canvasHeight - 305,
                minY: canvasHeight - 495,
                maxY: canvasHeight - 205,
                platformHeight: clamp(92 - progress * 2, 78, 92),
                playerSpeedBoost: clamp(progress * 0.102, 0, 1.53)
            };
        }

        function startingPlatforms() {
            const firstPlatform = createPlatform(
                0,
                canvasHeight - randomBetween(248, 284),
                randomBetween(238, 282),
                92,
                0
            );

            state.platforms = [firstPlatform];
            state.coins = [];

            let previousPlatform = firstPlatform;
            for (let index = 0; index < 4; index += 1) {
                const difficulty = difficultyFor(index * 140);
                const platformHeight = clamp(difficulty.platformHeight + randomBetween(-4, 4), 82, 92);
                const hitboxOffsetY = Math.round(platformHeight * 0.34);
                const previousSurfaceY = getPlatformSurfaceY(previousPlatform);
                const minSurfaceY = Math.max(
                    difficulty.minY + hitboxOffsetY,
                    previousSurfaceY - Math.min(difficulty.maxRise, 84)
                );
                const maxSurfaceY = Math.min(
                    difficulty.maxY + hitboxOffsetY,
                    previousSurfaceY + Math.min(difficulty.maxDrop, 96)
                );
                const targetSurfaceY = randomBetween(minSurfaceY, maxSurfaceY);
                const width = randomBetween(
                    clamp(difficulty.widthMin + 18, 176, 230),
                    clamp(difficulty.widthMax - 24, 212, 286)
                );
                const gap = randomBetween(
                    clamp(difficulty.gapMin - 10, 82, 124),
                    clamp(difficulty.gapMax - 18, 104, 154)
                );
                const nextPlatform = createPlatform(
                    previousPlatform.spawnX + previousPlatform.w + gap,
                    clamp(targetSurfaceY - hitboxOffsetY, difficulty.minY, difficulty.maxY),
                    width,
                    platformHeight,
                    index * 140
                );

                state.platforms.push(nextPlatform);
                previousPlatform = nextPlatform;

                if (index < 3 && (index === 0 || Math.random() < 0.8)) {
                    state.coins.push(
                        createCoin(
                            nextPlatform.x + nextPlatform.w / 2,
                            nextPlatform.y - randomBetween(58, 74),
                            nextPlatform
                        )
                    );
                }
            }

            const lastPlatform = state.platforms[state.platforms.length - 1];
            state.nextSpawnX = lastPlatform.spawnX + lastPlatform.w;
            state.platformsSinceCoin = 2 + Math.floor(Math.random() * 2);
            state.totalPlatformsGenerated = state.platforms.length;
        }

        function maybeCreateCoin(platform) {
            state.platformsSinceCoin += 1;
            const targetSpacing = 4 + ((state.nextPlatformId + state.nextCoinId) % 2);

            if (state.platformsSinceCoin < targetSpacing) {
                return null;
            }

            state.platformsSinceCoin = 0;
            return createCoin(platform.x + platform.w / 2, platform.y - randomBetween(56, 74), platform);
        }

        function extendWorld(cameraX) {
            const targetX = cameraX + canvasWidth * 2.3;

            while (state.nextSpawnX < targetX) {
                const difficulty = difficultyFor(state.distance);
                const gap = randomBetween(difficulty.gapMin, difficulty.gapMax);
                const width = randomBetween(difficulty.widthMin, difficulty.widthMax);
                const platformHeight = difficulty.platformHeight;
                const hitboxOffsetY = Math.round(platformHeight * 0.34);
                const previousPlatform = state.platforms[state.platforms.length - 1];
                const previousSurfaceY = previousPlatform
                    ? getPlatformSurfaceY(previousPlatform)
                    : difficulty.baseY + hitboxOffsetY;
                const minSurfaceY = Math.max(difficulty.minY + hitboxOffsetY, previousSurfaceY - difficulty.maxRise);
                const maxSurfaceY = Math.min(difficulty.maxY + hitboxOffsetY, previousSurfaceY + difficulty.maxDrop);
                const targetSurfaceY = minSurfaceY <= maxSurfaceY
                    ? randomBetween(minSurfaceY, maxSurfaceY)
                    : clamp(previousSurfaceY, difficulty.minY + hitboxOffsetY, difficulty.maxY + hitboxOffsetY);
                const y = clamp(targetSurfaceY - hitboxOffsetY, difficulty.minY, difficulty.maxY);
                const platform = createPlatform(
                    state.nextSpawnX + gap,
                    y,
                    width,
                    platformHeight,
                    state.distanceMeters
                );

                state.platforms.push(platform);
                state.totalPlatformsGenerated += 1;
                state.nextSpawnX = platform.spawnX + platform.w;

                const coin = maybeCreateCoin(platform);
                if (coin) {
                    state.coins.push(coin);
                }
            }
        }

        function updateMovingPlatforms(deltaMs) {
            const deltaSeconds = (deltaMs || 16.67) / 1000;

            state.platforms.forEach(function (platform) {
                platform.lastDeltaX = 0;

                if (state.distanceMeters >= 3000 && !platform.isMoving) {
                    const movementProfile = createMovementProfile(state.distanceMeters);
                    platform.isMoving = true;
                    platform.moveRange = movementProfile.moveRange;
                    platform.moveSpeed = movementProfile.moveSpeed;
                }

                if (!platform.isMoving || state.distanceMeters < 3000) {
                    return;
                }

                const previousX = platform.x;
                const minX = platform.spawnX - platform.moveRange;
                const maxX = platform.spawnX + platform.moveRange;

                platform.x += platform.moveDirection * platform.moveSpeed * deltaSeconds;

                if (platform.x <= minX) {
                    platform.x = minX;
                    platform.moveDirection = 1;
                } else if (platform.x >= maxX) {
                    platform.x = maxX;
                    platform.moveDirection = -1;
                }

                platform.lastDeltaX = platform.x - previousX;
            });
        }

        function syncCoinsToPlatforms() {
            const platformById = new Map(state.platforms.map(function (platform) {
                return [platform.id, platform];
            }));

            state.coins.forEach(function (coin) {
                if (!coin.anchorPlatformId || coin.collected) {
                    return;
                }

                const platform = platformById.get(coin.anchorPlatformId);
                if (!platform) {
                    return;
                }

                coin.x = platform.x + coin.offsetX;
                coin.y = platform.y + coin.offsetY;
            });
        }

        function pruneWorld(cameraX) {
            const cutoff = cameraX - 320;
            state.platforms = state.platforms.filter(function (platform) {
                return platform.x + platform.w > cutoff;
            });
            state.coins = state.coins.filter(function (coin) {
                return coin.collected || coin.x > cutoff - 120;
            });
        }

        function update(distance, distanceMeters, cameraX, deltaMs) {
            state.distance = Math.max(state.distance, distance);
            state.distanceMeters = Math.max(state.distanceMeters, distanceMeters);
            extendWorld(cameraX);
            updateMovingPlatforms(deltaMs);
            syncCoinsToPlatforms();
            pruneWorld(cameraX);
        }

        function reset() {
            state.platforms = [];
            state.coins = [];
            state.nextPlatformId = 0;
            state.nextCoinId = 0;
            state.nextSpawnX = 0;
            state.distance = 0;
            state.distanceMeters = 0;
            state.platformsSinceCoin = 0;
            state.totalPlatformsGenerated = 0;
            startingPlatforms();
        }

        function resize(width, height) {
            canvasWidth = width;
            canvasHeight = height;
            reset();
        }

        reset();

        return {
            reset: reset,
            resize: resize,
            update: update,
            getPlatforms: function () {
                return state.platforms;
            },
            getCoins: function () {
                return state.coins;
            },
            getDifficulty: function () {
                return difficultyFor(state.distance);
            },
            getPlatformCount: function () {
                return state.totalPlatformsGenerated;
            },
            getStartSpawn: function () {
                const firstPlatform = state.platforms[0];
                const surfaceY = firstPlatform.y + firstPlatform.hitboxOffsetY + GREEN_PLATFORM_SURFACE_CORRECTION;
                return {
                    x: firstPlatform.x + 40,
                    y: surfaceY - 76
                };
            }
        };
    }

    window.LedgerLegends = window.LedgerLegends || {};
    window.LedgerLegends.createPlatformManager = createPlatformManager;
})();
