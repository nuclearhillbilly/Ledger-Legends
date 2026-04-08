(function () {
    class Player {
        constructor({ idleImage, runImage, sinkImage, spawnX, spawnY }) {
            this.idleImage = idleImage;
            this.runImage = runImage;
            this.sinkImage = sinkImage || runImage;
            this.width = 62;
            this.height = 96;
            this.hitboxOffsetY = 8;
            this.hitboxHeight = 68;
            this.spriteWidth = 96;
            this.spriteHeight = 96;
            this.spriteOffsetX = -17;
            this.spriteOffsetY = 4;
            this.lavaSpriteOffsetY = 12;
            this.moveSpeed = 6;
            this.jumpForce = 15;
            this.gravity = 0.55;
            this.maxFallSpeed = 18;
            this.animationInterval = 95;
            this.animationTimer = 0;
            this.currentFrame = 1;
            this.isMoving = false;
            this.isOnGround = true;
            this.inLava = false;
            this.reset(spawnX, spawnY);
        }

        reset(x, y) {
            this.x = x;
            this.y = y;
            this.dy = 0;
            this.jumping = false;
            this.facing = 1;
            this.isMoving = false;
            this.isOnGround = true;
            this.inLava = false;
            this.animationTimer = 0;
            this.currentFrame = 1;
        }

        setLavaState(isInLava) {
            this.inLava = isInLava;
            if (isInLava) {
                this.dy = 0;
                this.jumping = false;
                this.isOnGround = false;
                this.isMoving = false;
                this.animationTimer = 0;
                this.currentFrame = 1;
            }
        }

        get centerX() {
            return this.x + this.width / 2;
        }

        get hitboxTopY() {
            return this.y + this.hitboxOffsetY;
        }

        get hitboxCenterY() {
            return this.hitboxTopY + this.hitboxHeight / 2;
        }

        get leftX() {
            return this.x;
        }

        get rightX() {
            return this.x + this.width;
        }

        get bottomY() {
            return this.hitboxTopY + this.hitboxHeight;
        }

        handleInput(keys, deltaMs) {
            const timeScale = Math.min(2, Math.max(0.2, deltaMs / 16.67 || 1));
            let horizontal = 0;

            if (keys.ArrowRight || keys.KeyD) {
                horizontal += 1;
            }

            if (keys.ArrowLeft || keys.KeyA) {
                horizontal -= 1;
            }

            this.isMoving = horizontal !== 0;
            this.x += horizontal * this.moveSpeed * timeScale;

            if (horizontal !== 0) {
                this.facing = horizontal;
            }

            const wantsJump = keys.Space || keys.ArrowUp || keys.KeyW;
            if (wantsJump && this.isOnGround) {
                this.dy = -this.jumpForce;
                this.jumping = true;
                this.isOnGround = false;
                this.currentFrame = 1;
                this.animationTimer = 0;
            }

            this.updateAnimation(deltaMs);
        }

        updateAnimation(deltaMs) {
            if (!this.isOnGround) {
                this.currentFrame = 1;
                this.animationTimer = 0;
                return;
            }

            if (!this.isMoving) {
                this.currentFrame = 1;
                this.animationTimer = 0;
                return;
            }

            this.animationTimer += deltaMs;
            while (this.animationTimer >= this.animationInterval) {
                this.currentFrame = this.currentFrame === 1 ? 2 : 1;
                this.animationTimer -= this.animationInterval;
            }
        }

        applyPhysics(worldHeight, deltaMs) {
            const timeScale = Math.min(2, Math.max(0.2, (deltaMs || 16.67) / 16.67));
            this.isOnGround = false;
            this.dy = Math.min(this.dy + this.gravity * timeScale, this.maxFallSpeed);
            this.y += this.dy * timeScale;

            if (this.hitboxTopY > worldHeight + 400) {
                this.y = worldHeight + 400 - this.hitboxOffsetY;
            }
        }

        landOn(platform) {
            this.y = platform.y - this.hitboxHeight - this.hitboxOffsetY;
            this.dy = 0;
            this.jumping = false;
            this.isOnGround = true;
        }

        getCurrentSprite() {
            if (this.inLava) {
                return this.sinkImage || this.runImage;
            }

            if (!this.isOnGround) {
                return this.runImage;
            }

            if (this.currentFrame === 2) {
                return this.runImage;
            }

            if (!this.isMoving || this.currentFrame === 1) {
                return this.idleImage;
            }

            return this.runImage;
        }

        getRenderBounds(screenX, screenY) {
            return {
                x: screenX + this.spriteOffsetX,
                y: screenY + this.spriteOffsetY + (this.inLava ? this.lavaSpriteOffsetY : 0),
                width: this.spriteWidth,
                height: this.spriteHeight
            };
        }

        renderSpriteToContext(ctx, bounds) {
            const sprite = this.getCurrentSprite();
            const drawX = bounds.x;
            const drawY = bounds.y;

            if (!(sprite && sprite.complete && sprite.naturalWidth > 0)) {
                ctx.fillStyle = "#f59e0b";
                ctx.fillRect(drawX + 24, drawY + 12, 42, 66);
                return;
            }

            if (this.facing === -1) {
                ctx.save();
                ctx.translate(drawX + bounds.width, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, 0, 0, bounds.width, bounds.height);
                ctx.restore();
            } else {
                ctx.drawImage(sprite, drawX, drawY, bounds.width, bounds.height);
            }
        }

        draw(ctx, screenX, screenY) {
            this.renderSpriteToContext(ctx, this.getRenderBounds(screenX, screenY));
        }
    }

    window.LedgerLegends = window.LedgerLegends || {};
    window.LedgerLegends.Player = Player;
})();
