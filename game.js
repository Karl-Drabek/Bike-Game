class BikeGameScene extends Phaser.Scene {
    constructor() {
        super('BikeGame');
    }

    create() {
        // Game state
        this.gameWidth = 1200;
        this.gameHeight = 700;
        this.levelDistance = 0;
        this.levelComplete = false;
        this.levelFailed = false;
        this.gameStartTime = this.time.now;
        this.levelDuration = 60000; // 60 seconds
        
        // Bike state
        this.bikeX = 100;
        this.bikeY = this.gameHeight / 2;
        this.bikeSpeed = 0;
        this.maxSpeed = 300;
        this.bikeVelocityY = 0;
        this.maxLateralSpeed = 200;
        this.lateralDrag = 0.6;
        this.speedDrag = .995;
        this.acceleration = 0.1;
        this.turnSpeed = 2.5;
        this.maxSpeed = 150;
        
        // Pedal state
        this.pedalRotation = 0; // 0-360 degrees
        this.pedalSpeed = 2; // degrees per frame
        this.pedalAcceleration = 0.5; // acceleration per frame when inputting correctly
        this.isAccelerating = false;
        this.currentGear = 1; // 1, 2, 3
        this.gearMultipliers = { 1: 3, 2: 2, 3: 1 };
        
        // Keys
        this.keys = {
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
        };
        
        // Gear keys
        for (let i = 1; i <= 3; i++) {
            const keyCode = Phaser.Input.Keyboard.KeyCodes[`NUMPAD_${i}`] || 
                           Phaser.Input.Keyboard.KeyCodes[`${i}`];
            if (!this.input.keyboard.keys[49 + i - 1]) {
                this.input.keyboard.addKey(49 + i - 1); // 49 is '1'
            }
        }
        
        // Camera setup
        this.cameras.main.setBounds(0, 0, this.gameWidth, this.gameHeight);
        
        // Create background layers (for scrolling effect)
        this.createBackground();
        
        // Create bike sprite
        this.createBike();
        
        // Create obstacles
        this.obstacles = this.physics.add.group();
        this.createObstacles();
        
        // Track last spawn distance for stationary obstacles
        this.lastStationarySpawnDistance = 0;
        
        // Create UI
        this.createUI();
        
        // Collision detection
        this.physics.add.overlap(this.bike, this.obstacles, this.handleObstacleCollision, null, this);
    }

    createBackground() {
        this.backgroundOffset = 0;
        this.roadY = 150;
        this.roadHeight = this.gameHeight - 300;
        
        // Create background graphics
        this.backgroundLayer = this.add.graphics();
        this.drawBackground();
    }

    drawBackground() {
        this.backgroundLayer.clear();
        
        // Sky
        this.backgroundLayer.fillStyle(0x87CEEB);
        this.backgroundLayer.fillRect(0, 0, this.gameWidth, this.roadY - 70);
        
        // Clouds
        this.backgroundLayer.fillStyle(0xFFFFFF, 0.7);
        for (let i = 0; i < 5; i++) {
            let cloudX = (i * 250 - this.backgroundOffset * 0.1) % this.gameWidth;
            if (cloudX < 0) cloudX += this.gameWidth;
            const cloudY = 30 + (i * 20) % 80;
            this.backgroundLayer.fillEllipse(cloudX, cloudY, 40, 20);
            this.backgroundLayer.fillEllipse(cloudX + 25, cloudY - 5, 35, 18);
            this.backgroundLayer.fillEllipse(cloudX - 20, cloudY + 3, 30, 15);
        }
        
        // Top grass strip (for trees)
        this.backgroundLayer.fillStyle(0x228B22);
        this.backgroundLayer.fillRect(0, this.roadY - 70, this.gameWidth, 70);
        
        // Road
        this.backgroundLayer.fillStyle(0x444444);
        this.backgroundLayer.fillRect(0, this.roadY, this.gameWidth, this.roadHeight);
        
        // Road markings
        this.backgroundLayer.fillStyle(0xFFFFFF);
        const markingWidth = 40;
        const markingHeight = 8;
        const spacing = 120;
        let offset = (-this.backgroundOffset) % spacing;
        if (offset < 0) offset += spacing;
        
        for (let i = 0; i < this.gameWidth / spacing + 2; i++) {
            const x = i * spacing + offset;
            this.backgroundLayer.fillRect(x, this.roadY + this.roadHeight / 2 - markingHeight / 2, markingWidth, markingHeight);
        }
        
        // Grass
        this.backgroundLayer.fillStyle(0x228B22);
        this.backgroundLayer.fillRect(0, this.roadY + this.roadHeight, this.gameWidth, this.gameHeight - this.roadY - this.roadHeight);
        
        // Trees in top grass
        for (let i = 0; i < 8; i++) {
            let treeX = (i * 180 - this.backgroundOffset * 1.0) % this.gameWidth;
            if (treeX < 0) treeX += this.gameWidth;
            const treeY = this.roadY - 60;
            // Trunk
            this.backgroundLayer.fillStyle(0x8B4513);
            this.backgroundLayer.fillRect(treeX - 5, treeY + 20, 10, 30);
            // Foliage
            this.backgroundLayer.fillStyle(0x2E7D32);
            this.backgroundLayer.fillCircle(treeX, treeY + 10, 25);
            this.backgroundLayer.fillCircle(treeX - 15, treeY + 20, 20);
            this.backgroundLayer.fillCircle(treeX + 15, treeY + 20, 20);
        }
        
        // Trees in bottom grass
        for (let i = 0; i < 8; i++) {
            let treeX = (i * 180 + 90 - this.backgroundOffset * 1.0) % this.gameWidth;
            if (treeX < 0) treeX += this.gameWidth;
            const treeY = this.roadY + this.roadHeight + 10;
            // Trunk
            this.backgroundLayer.fillStyle(0x8B4513);
            this.backgroundLayer.fillRect(treeX - 5, treeY, 10, 30);
            // Foliage
            this.backgroundLayer.fillStyle(0x2E7D32);
            this.backgroundLayer.fillCircle(treeX, treeY, 25);
            this.backgroundLayer.fillCircle(treeX - 15, treeY + 10, 20);
            this.backgroundLayer.fillCircle(treeX + 15, treeY + 10, 20);
        }
    }

    createBike() {
        // Create a detailed top-down bike sprite
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Front wheel
        graphics.fillStyle(0x333333);
        graphics.fillCircle(4, 12, 5);
        graphics.fillStyle(0x666666);
        graphics.fillCircle(4, 12, 3);
        
        // Back wheel
        graphics.fillStyle(0x333333);
        graphics.fillCircle(26, 12, 5);
        graphics.fillStyle(0x666666);
        graphics.fillCircle(26, 12, 3);
        
        // Frame - main tube
        graphics.lineStyle(3, 0xFF0000);
        graphics.lineBetween(8, 12, 22, 12);
        
        // Seat
        graphics.fillStyle(0x000000);
        graphics.fillRect(22, 10, 6, 4);
        
        // Handlebars
        graphics.lineStyle(2, 0xCCCCCC);
        graphics.lineBetween(4, 12, 4, 6);
        graphics.lineBetween(4, 12, 4, 18);
        graphics.lineBetween(2, 6, 6, 6);
        graphics.lineBetween(2, 18, 6, 18);
        
        // Pedals/Crank
        graphics.fillStyle(0xFFAA00);
        graphics.fillCircle(15, 12, 2);
        graphics.lineStyle(2, 0xFFAA00);
        graphics.lineBetween(15, 12, 15, 8);
        graphics.lineBetween(15, 12, 15, 16);
        
        const texture = graphics.generateTexture('bike', 30, 24);
        graphics.destroy();
        
        this.bike = this.physics.add.sprite(this.bikeX, this.bikeY, 'bike');
        this.bike.setDrag(0);
        this.bike.setBounce(0);
    }

    createObstacles() {
        // Clear existing obstacles
        this.obstacles.clear(true, true);
        this.obstacleTimer = 0;
        this.nextObstacleTime = 500;
        this.stationarySpawnInterval = 1000; // Distance between stationary obstacles
        
        // Pre-generate all obstacle textures once
        this.createObstacleTextures();
    }
    
    createObstacleTextures() {
        // Cone texture
        const coneGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        coneGraphics.fillStyle(0xFF6600);
        coneGraphics.fillCircle(15, 16, 15);
        coneGraphics.fillStyle(0xFFFFFF);
        coneGraphics.fillRect(5, 14, 20, 4);
        coneGraphics.generateTexture('cone_texture', 30, 32);
        coneGraphics.destroy();
        
        // Car texture
        const carGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        carGraphics.fillStyle(0xCC0000);
        carGraphics.fillRect(6, 2, 28, 28);
        carGraphics.fillStyle(0x87CEEB);
        carGraphics.fillRect(8, 4, 24, 6);
        carGraphics.fillStyle(0x990000);
        carGraphics.fillRect(8, 12, 24, 8);
        carGraphics.fillStyle(0x87CEEB);
        carGraphics.fillRect(8, 22, 24, 6);
        carGraphics.fillStyle(0x1A1A1A);
        carGraphics.fillCircle(2, 8, 4);
        carGraphics.fillCircle(2, 24, 4);
        carGraphics.fillCircle(38, 8, 4);
        carGraphics.fillCircle(38, 24, 4);
        carGraphics.fillStyle(0xAAAAAA);
        carGraphics.fillCircle(2, 8, 2);
        carGraphics.fillCircle(2, 24, 2);
        carGraphics.fillCircle(38, 8, 2);
        carGraphics.fillCircle(38, 24, 2);
        carGraphics.fillStyle(0xFFFF00);
        carGraphics.fillCircle(12, 2, 2);
        carGraphics.fillCircle(28, 2, 2);
        carGraphics.fillStyle(0xFF0000);
        carGraphics.fillCircle(12, 30, 2);
        carGraphics.fillCircle(28, 30, 2);
        carGraphics.generateTexture('car_texture', 40, 32);
        carGraphics.destroy();
        
        // Bird texture
        const birdGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        birdGraphics.fillStyle(0x654321);
        birdGraphics.fillEllipse(15, 14, 10, 14);
        birdGraphics.fillStyle(0x8B4513);
        birdGraphics.fillCircle(15, 6, 5);
        birdGraphics.fillStyle(0xFFAA00);
        birdGraphics.fillTriangle(15, 5, 18, 7, 15, 9);
        birdGraphics.fillStyle(0x654321);
        birdGraphics.beginPath();
        birdGraphics.moveTo(15, 12);
        birdGraphics.lineTo(3, 8);
        birdGraphics.lineTo(8, 16);
        birdGraphics.closePath();
        birdGraphics.fillPath();
        birdGraphics.beginPath();
        birdGraphics.moveTo(15, 12);
        birdGraphics.lineTo(27, 8);
        birdGraphics.lineTo(22, 16);
        birdGraphics.closePath();
        birdGraphics.fillPath();
        birdGraphics.beginPath();
        birdGraphics.moveTo(15, 20);
        birdGraphics.lineTo(12, 24);
        birdGraphics.lineTo(18, 24);
        birdGraphics.closePath();
        birdGraphics.fillPath();
        birdGraphics.generateTexture('bird_texture', 30, 28);
        birdGraphics.destroy();
        
        // Pedestrian texture
        const pedGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        pedGraphics.fillStyle(0xFFDBAC);
        pedGraphics.fillCircle(15, 7, 4);
        pedGraphics.fillStyle(0x654321);
        pedGraphics.fillEllipse(15, 5, 5, 3);
        pedGraphics.fillStyle(0x4169E1);
        pedGraphics.fillRect(11, 11, 8, 9);
        pedGraphics.fillStyle(0xFFDBAC);
        pedGraphics.fillRect(9, 13, 2, 6);
        pedGraphics.fillRect(19, 13, 2, 6);
        pedGraphics.fillStyle(0x2F4F4F);
        pedGraphics.fillRect(12, 20, 3, 7);
        pedGraphics.fillRect(17, 20, 3, 7);
        pedGraphics.fillStyle(0x000000);
        pedGraphics.fillRect(11, 27, 4, 2);
        pedGraphics.fillRect(16, 27, 4, 2);
        pedGraphics.lineStyle(1, 0x000000);
        pedGraphics.strokeCircle(15, 7, 4);
        pedGraphics.strokeRect(11, 11, 8, 9);
        pedGraphics.generateTexture('pedestrian_texture', 30, 32);
        pedGraphics.destroy();
        
        // Rock texture
        const rockGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        rockGraphics.fillStyle(0x787878);
        rockGraphics.beginPath();
        rockGraphics.moveTo(16, 4);
        rockGraphics.lineTo(26, 10);
        rockGraphics.lineTo(28, 20);
        rockGraphics.lineTo(20, 28);
        rockGraphics.lineTo(8, 26);
        rockGraphics.lineTo(4, 16);
        rockGraphics.lineTo(10, 8);
        rockGraphics.closePath();
        rockGraphics.fillPath();
        rockGraphics.fillStyle(0x505050);
        rockGraphics.beginPath();
        rockGraphics.moveTo(8, 26);
        rockGraphics.lineTo(4, 16);
        rockGraphics.lineTo(10, 8);
        rockGraphics.lineTo(16, 4);
        rockGraphics.lineTo(12, 18);
        rockGraphics.closePath();
        rockGraphics.fillPath();
        rockGraphics.fillStyle(0xA0A0A0);
        rockGraphics.fillCircle(18, 12, 3);
        rockGraphics.fillCircle(22, 18, 2);
        rockGraphics.lineStyle(2, 0x404040);
        rockGraphics.beginPath();
        rockGraphics.moveTo(16, 4);
        rockGraphics.lineTo(26, 10);
        rockGraphics.lineTo(28, 20);
        rockGraphics.lineTo(20, 28);
        rockGraphics.lineTo(8, 26);
        rockGraphics.lineTo(4, 16);
        rockGraphics.lineTo(10, 8);
        rockGraphics.closePath();
        rockGraphics.strokePath();
        rockGraphics.generateTexture('rock_texture', 32, 32);
        rockGraphics.destroy();
    }

    spawnObstacle(typeFilter = null) {
        // Define obstacle types with their texture names
        const types = [
            { type: 'cone', damage: 'slow', texture: 'cone_texture', label: 'Cone' },
            { type: 'bird', damage: 'slow', texture: 'bird_texture', label: 'Bird' },
            { type: 'pedestrian', damage: 'slow-heavy', texture: 'pedestrian_texture', label: 'Ped' },
            { type: 'rock', damage: 'crash', texture: 'rock_texture', label: 'Rock' },
            { type: 'car', damage: 'crash', texture: 'car_texture', label: 'Car' }
        ];
        
        // Filter by type if specified
        let filteredTypes = types;
        if (typeFilter) {
            if (Array.isArray(typeFilter)) {
                filteredTypes = types.filter(t => typeFilter.includes(t.type));
            } else {
                filteredTypes = types.filter(t => t.type === typeFilter);
            }
        }
        const obstacleData = filteredTypes[Math.floor(Math.random() * filteredTypes.length)];
        
        // Spawn distance ahead of the bike (adjusted so obstacles appear on screen)
        // Using formula: obstacle.x = bikeX + 150 + (spawnDistance - levelDistance)
        // Want obstacles at right edge (x~1200) so: 1200 = 100 + 150 + distanceBehind
        // Therefore distanceBehind should be ~950
        const spawnDistance = this.levelDistance + 950;
        
        // Choose Y position; pedestrians start at a road edge to cross
        let fromTop = null;
        let spawnY;
        if (obstacleData.type === 'pedestrian') {
            fromTop = Math.random() > 0.5;
            spawnY = fromTop ? (this.roadY + 10) : (this.roadY + this.roadHeight - 10);
        } else {
            // Random Y position in road for other obstacles
            spawnY = this.roadY + 20 + Math.random() * (this.roadHeight - 40);
        }
        
        // Create texture using sprite function
        const obstacle = this.obstacles.create(this.gameWidth + 100, spawnY, obstacleData.texture);
        // Rotate cars 90 degrees
        if (obstacleData.type === 'car') {
            obstacle.setRotation(Math.PI / 2);
        }
        obstacle.setData('type', obstacleData.type);
        obstacle.setData('damage', obstacleData.damage);
        obstacle.setData('spawnDistance', spawnDistance);
        obstacle.setData('baseY', spawnY); // Store original Y for stationary obstacles
        
        // Set up movement based on type
        switch(obstacleData.type) {
            case 'car':
                // Oncoming traffic - moves toward bike
                obstacle.setData('moveSpeed', 5);
                break;
            case 'pedestrian':
                // Crosses the street slowly; then walks along the side to exit
                obstacle.setData('moveSpeed', 1);
                obstacle.setData('direction', fromTop ? 1 : -1);
                obstacle.setData('phase', 'crossing');
                obstacle.setData('sidewalkSpeedX', 8);
                break;
            case 'bird':
                // Flies in a straight line across screen
                const angle = Math.random() * Math.PI * 2; // Random direction
                const speed = 3; // Slightly faster than pedestrians (1)
                obstacle.setData('moveSpeed', speed);
                obstacle.setData('vx', Math.cos(angle) * speed);
                obstacle.setData('vy', Math.sin(angle) * speed);
                break;
            case 'cone':
            case 'rock':
                // Stationary - don't move
                obstacle.setData('moveSpeed', 0);
                break;
        }
        
        // No labels for obstacles
    }

    createUI() {
        // Timer text
        this.timerText = this.add.text(20, 20, '', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'monospace'
        });
        this.timerText.setDepth(100);
        
        // Speed text
        this.speedText = this.add.text(20, 50, '', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'monospace'
        });
        this.speedText.setDepth(100);
        
        // Gear text
        this.gearText = this.add.text(20, 75, '', {
            fontSize: '16px',
            fill: '#FFFF00',
            fontFamily: 'monospace'
        });
        this.gearText.setDepth(100);
        
        // Distance text
        this.distanceText = this.add.text(20, 100, '', {
            fontSize: '16px',
            fill: '#00FF00',
            fontFamily: 'monospace'
        });
        this.distanceText.setDepth(100);
        
        // Pedal UI (above player's head)
        this.createPedalUI();
        
        // Status messages
        this.statusText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center'
        });
        this.statusText.setOrigin(0.5);
        this.statusText.setDepth(200);
        this.statusText.setVisible(false);
    }

    createPedalUI() {
        // Smaller radius and positioned above bike
        const pedalRadius = 25;
        const size = (pedalRadius + 5) * 2;
        
        // Background circle
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Draw dark background
        graphics.fillStyle(0x333333);
        graphics.fillCircle(pedalRadius + 5, pedalRadius + 5, pedalRadius + 5);
        graphics.lineStyle(2, 0x666666);
        graphics.strokeCircle(pedalRadius + 5, pedalRadius + 5, pedalRadius);
        
        // Left half - red (180 to 360 degrees / -90 to 90)
        graphics.fillStyle(0xCC0000);
        graphics.beginPath();
        graphics.arc(pedalRadius + 5, pedalRadius + 5, pedalRadius - 2, -Math.PI / 2, Math.PI / 2, false);
        graphics.lineTo(pedalRadius + 5, pedalRadius + 5);
        graphics.closePath();
        graphics.fillPath();
        
        // Right half - green (0 to 180 degrees / 90 to 270)
        graphics.fillStyle(0x00AA00);
        graphics.beginPath();
        graphics.arc(pedalRadius + 5, pedalRadius + 5, pedalRadius - 2, Math.PI / 2, -Math.PI / 2, false);
        graphics.lineTo(pedalRadius + 5, pedalRadius + 5);
        graphics.closePath();
        graphics.fillPath();
        
        const texture = graphics.generateTexture('pedalUI', size, size);
        graphics.destroy();
        
        // Position will be updated each frame to follow bike
        this.pedalUISprite = this.add.sprite(0, 0, 'pedalUI');
        this.pedalUISprite.setDepth(100);
        this.pedalUISprite.setOrigin(0.5, 0.5);
        
        // Add text labels
        this.pedalLabelA = this.add.text(0, 0, 'A', {
            fontSize: '12px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102);
        
        this.pedalLabelD = this.add.text(0, 0, 'D', {
            fontSize: '12px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102);
        
        // Pedal icon
        this.pedalIcon = this.add.graphics();
        this.pedalIcon.setDepth(101);
        this.pedalUIRadius = pedalRadius;
    }

    updatePedalIcon() {
        this.pedalIcon.clear();
        
        // Position UI above bike's head
        const pedalUIX = this.bikeX;
        const pedalUIY = this.bikeY - 50;
        
        // Update sprite positions
        this.pedalUISprite.x = pedalUIX;
        this.pedalUISprite.y = pedalUIY;
        
        // Update label positions
        this.pedalLabelA.x = pedalUIX - this.pedalUIRadius - 8;
        this.pedalLabelA.y = pedalUIY;
        
        this.pedalLabelD.x = pedalUIX + this.pedalUIRadius + 8;
        this.pedalLabelD.y = pedalUIY;
        
        // Draw pedal icon at current rotation
        const rad = Phaser.Math.DegToRad(this.pedalRotation);
        const iconX = pedalUIX + Math.cos(rad - Math.PI / 2) * this.pedalUIRadius;
        const iconY = pedalUIY + Math.sin(rad - Math.PI / 2) * this.pedalUIRadius;
        
        this.pedalIcon.fillStyle(0xFF6600);
        this.pedalIcon.fillCircle(iconX, iconY, 6);
        
        // Draw rotation indicator line
        this.pedalIcon.lineStyle(2, 0xFFFFFF);
        this.pedalIcon.lineBetween(pedalUIX, pedalUIY, iconX, iconY);
    }

    update(time, delta) {
        if (this.levelComplete || this.levelFailed) {
            return;
        }
        
        // Update timer
        const elapsedTime = this.time.now - this.gameStartTime;
        const remainingTime = Math.max(0, this.levelDuration - elapsedTime);
        this.timerText.setText(`Time: ${(remainingTime / 1000).toFixed(1)}s`);
        
        if (remainingTime <= 0) {
            this.endLevel(false);
            return;
        }
        
        // Handle input
        this.handleInput();
        
        // Update bike physics
        this.updateBikePhysics(delta);
        
        // Update pedal rotation
        this.updatePedalRotation();
        
        // Update background
        this.updateBackground();
        
        // Spawn obstacles
        // Time-based spawning for moving obstacles (cars, birds)
        this.obstacleTimer += delta;
        if (this.obstacleTimer > this.nextObstacleTime) {
            const movingTypes = ['car', 'bird', 'bird'];
            const type = movingTypes[Math.floor(Math.random() * movingTypes.length)];
            this.spawnObstacle(type);
            this.obstacleTimer = 0;
            this.nextObstacleTime = 307 + Math.random() * 320;
        }
        
        // Distance-based spawning for stationary obstacles (cones, rocks, pedestrians)
        if (this.levelDistance - this.lastStationarySpawnDistance > this.stationarySpawnInterval) {
            const stationaryTypes = ['cone', 'rock', 'pedestrian'];
            const type = stationaryTypes[Math.floor(Math.random() * stationaryTypes.length)];
            this.spawnObstacle(type);
            this.lastStationarySpawnDistance = this.levelDistance;
        }
        
        // Update obstacles
        this.obstacles.children.entries.forEach(obstacle => {
            const spawnDistance = obstacle.getData('spawnDistance');
            const type = obstacle.getData('type');
            const dt = delta / 16;
            
            // Different movement for different obstacle types
            if (type === 'cone' || type === 'rock') {
                // Stationary obstacles use parallax scrolling
                const distanceBehind = spawnDistance - this.levelDistance;
                obstacle.x = this.bikeX + 150 + distanceBehind;
            } else if (type === 'car') {
                // Cars move at uniform speed toward player (oncoming traffic)
                const carSpeed = obstacle.getData('moveSpeed') || 5;
                obstacle.x -= (this.bikeSpeed + carSpeed) * dt;
            } else if (type === 'pedestrian') {
                // Pedestrians: stay stationary while crossing, then remain stationary
                const phase = obstacle.getData('phase') || 'crossing';
                const distanceBehind = spawnDistance - this.levelDistance;
                obstacle.x = this.bikeX + 150 + distanceBehind;
                
                if (phase === 'crossing') {
                    // Cross the road slowly
                    const direction = obstacle.getData('direction');
                    const moveSpeed = obstacle.getData('moveSpeed');
                    obstacle.y += direction * moveSpeed * dt;
                    const topBound = this.roadY + 10;
                    const bottomBound = this.roadY + this.roadHeight - 10;
                    if ((direction > 0 && obstacle.y >= bottomBound) || (direction < 0 && obstacle.y <= topBound)) {
                        obstacle.setData('phase', 'stationary');
                    }
                }
                // After crossing: stay stationary (parallax handles X position)
            } else if (type === 'bird') {
                // Birds fly in a straight line, with parallax scrolling
                obstacle.x -= this.bikeSpeed * dt;
                const vx = obstacle.getData('vx');
                const vy = obstacle.getData('vy');
                obstacle.x += vx * dt;
                obstacle.y += vy * dt;
            }
            
            // Keep non-bird obstacles in road bounds
            if (type !== 'bird') {
                if (obstacle.y < this.roadY + 10) {
                    obstacle.y = this.roadY + 10;
                }
                if (obstacle.y > this.roadY + this.roadHeight - 10) {
                    obstacle.y = this.roadY + this.roadHeight - 10;
                }
            }
            
            // Remove obstacles that are far off-screen
            if (obstacle.x < -100 || obstacle.x > this.gameWidth + 100 ||
                obstacle.y < -100 || obstacle.y > this.gameHeight + 100) {
                obstacle.destroy();
            }
        });
        
        // Update bike position relative to camera
        this.bike.x = this.bikeX;
        this.bike.y = this.bikeY;
        
        // Keep bike in road bounds
        if (this.bikeY < this.roadY + 20) {
            this.bikeY = this.roadY + 20;
            this.bikeVelocityY = 0;
        }
        if (this.bikeY > this.roadY + this.roadHeight - 20) {
            this.bikeY = this.roadY + this.roadHeight - 20;
            this.bikeVelocityY = 0;
        }
        
        // Update UI
        this.speedText.setText(`Speed: ${(this.bikeSpeed * 0.6 * 5).toFixed(1)} mph`);
        this.gearText.setText(`Gear: ${this.currentGear}`);
        this.distanceText.setText(`Distance: ${(this.levelDistance / 100).toFixed(1)} m`);
        
        // Win condition
        if (this.levelDistance >= 10000) {
            this.endLevel(true);
        }
    }

    handleInput() {
        const isAPressed = this.keys.a.isDown;
        const isDPressed = this.keys.d.isDown;
        const isUPPressed = this.keys.up.isDown;
        const isDOWNPressed = this.keys.down.isDown;
        const isLEFTPressed = this.keys.left.isDown;
        const isRIGHTPressed = this.keys.right.isDown;
        
        // Lateral movement (UP/DOWN)
        if (isUPPressed) {
            this.bikeVelocityY -= this.turnSpeed;
        }
        if (isDOWNPressed) {
            this.bikeVelocityY += this.turnSpeed;
        }
        
        // Pedal input - align with visual
        // Left half (red): pedalRotation is 270-360 or 0-90 (visual left side) - press A
        // Right half (green): pedalRotation is 90-270 (visual right side) - press D
        const pedalAngle = this.pedalRotation % 360;
        
        const isAInZone = (pedalAngle >= 180 && pedalAngle < 360);  // Red zone (left)
        const isDInZone = (pedalAngle >= 0 && pedalAngle < 180);  // Green zone (right)
        
        let inputCorrect = false;
        if (isAPressed && isAInZone) {
            this.bikeSpeed = Math.min(this.bikeSpeed + this.acceleration, this.maxSpeed);
            inputCorrect = true;
        }
        if (isDPressed && isDInZone) {
            this.bikeSpeed = Math.min(this.bikeSpeed + this.acceleration, this.maxSpeed);
            inputCorrect = true;
        }
        
        // Decelerate if input is wrong
        if (!inputCorrect && (isAPressed || isDPressed)) {
            this.bikeSpeed = Math.max(0, this.bikeSpeed - this.acceleration * 0.5);
        }
        
        // Gear shifting with arrow keys
        if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
            // Downshift
            this.currentGear = Math.max(1, this.currentGear - 1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
            // Upshift
            this.currentGear = Math.min(3, this.currentGear + 1);
        }
        
        // Number keys still work for direct gear selection
        if (this.input.keyboard.checkDown(this.input.keyboard.keys[49], 100)) { // Key '1'
            this.currentGear = 1;
        }
        if (this.input.keyboard.checkDown(this.input.keyboard.keys[50], 100)) { // Key '2'
            this.currentGear = 2;
        }
        if (this.input.keyboard.checkDown(this.input.keyboard.keys[51], 100)) { // Key '3'
            this.currentGear = 3;
        }
    }

    updateBikePhysics(delta) {
        // Apply gentle drag to speed scaled by frame time
        const dt = delta / 16;
        this.bikeSpeed *= Math.pow(this.speedDrag, dt);
        this.bikeSpeed = Math.max(0, this.bikeSpeed);
        
        // Update distance
        this.levelDistance += this.bikeSpeed * dt;
        
        // Apply drag to lateral velocity
        this.bikeVelocityY *= Math.pow(this.lateralDrag, dt);
        
        // Update Y position
        this.bikeY += this.bikeVelocityY;
    }

    updatePedalRotation() {
        // Pedal rotation speed is based on gear and bike speed
        const gearFactor = this.gearMultipliers[this.currentGear]; // 3, 2, or 1
        const speedFactor = this.bikeSpeed / this.maxSpeed; // 0 to 1
        // Reduced rotation speed - decreased from 80 to 40
        // Gear 1 (3x): slower rotation
        // Gear 2 (2x): slower rotation
        // Gear 3 (1x): slower rotation
            const rotationSpeed = (speedFactor * 20 * gearFactor);
            const dt = this.game.loop.delta / 16 || 1;
            this.pedalRotation = (this.pedalRotation + rotationSpeed * dt) % 360;
        this.updatePedalIcon();
    }

    updateBackground() {
        this.backgroundOffset = this.levelDistance;
        this.backgroundLayer.clear();
        
        // Draw finish line at 100m distance (10000 levelDistance)
        const finishLineDistance = 10000;
        const finishLineBehind = finishLineDistance - this.levelDistance;
        const finishLineX = this.bikeX + 150 + finishLineBehind;
        if (finishLineX > -50 && finishLineX < this.gameWidth + 50) {
            this.backgroundLayer.fillStyle(0xFFFFFF);
            this.backgroundLayer.fillRect(finishLineX - 5, this.roadY, 10, this.roadHeight);
            this.backgroundLayer.fillStyle(0x000000);
            this.backgroundLayer.fillRect(finishLineX - 3, this.roadY, 3, this.roadHeight / 2);
            this.backgroundLayer.fillRect(finishLineX, this.roadY + this.roadHeight / 2, 3, this.roadHeight / 2);
        }
        
        this.drawBackground();
    }

    handleObstacleCollision(bike, obstacle) {
        const damageType = obstacle.getData('damage');
        
        if (damageType === 'crash') {
            this.endLevel(false);
        } else if (damageType === 'slow') {
            this.bikeSpeed *= 0.6;
        } else if (damageType === 'slow-heavy') {
            this.bikeSpeed *= 0.3;
        }
        
        // Remove the obstacle and its label
        if (obstacle.label) {
            obstacle.label.destroy();
        }
        obstacle.destroy();
    }

    endLevel(success) {
        if (success) {
            this.levelComplete = true;
            this.statusText.setText('LEVEL COMPLETE!\nPress R to restart');
            this.statusText.setVisible(true);
            this.statusText.setStyle({ fill: '#00FF00' });
        } else {
            this.levelFailed = true;
            this.statusText.setText('LEVEL FAILED!\nPress R to restart');
            this.statusText.setVisible(true);
            this.statusText.setStyle({ fill: '#FF0000' });
        }
        
        // Allow restart
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => {
            this.scene.restart();
        });
    }
}

// Initialize game after class is defined
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: BikeGameScene
};

const game = new Phaser.Game(config);