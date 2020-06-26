//import * as BABYLON from 'babylonjs';
window.addEventListener('DOMContentLoaded', () => {
    // Create canvas and engine.
    const canvas = (document.getElementById('renderCanvas'));
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    const light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, 1), scene);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.01;
    scene.fogStart = 20.0;
    scene.fogEnd = 60.0;
    scene.fogColor = new BABYLON.Color3(1, 0, 0);
    scene.clearColor = new BABYLON.Color4(1, 0, 0, 1.0);
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    // Run the render loop.
    engine.runRenderLoop(() => {
        scene.render();
    });
    window.addEventListener('resize', () => {
        engine.resize();
    });
    // Game instance
    let game;
    class UtilityFunctions {
        static fadeSound(sound, fadeTimeInSeconds, targetVolume, easingFunction = (t) => t, onDone = () => { }) {
            let t = 0;
            const originalVolume = sound.getVolume();
            const diffVolume = targetVolume - originalVolume;
            const callback = () => {
                t += (1 / (60 * fadeTimeInSeconds));
                if (t >= 1) {
                    t = 1;
                    sound.setVolume(targetVolume);
                    scene.onBeforeRenderObservable.removeCallback(callback);
                    onDone();
                }
                else {
                    sound.setVolume(originalVolume + easingFunction(t) * diffVolume);
                }
            };
            scene.onBeforeRenderObservable.add(callback);
        }
        static fadeOutSound(sound, fadeOutTimeInSeconds, easingFunction = (t) => t) {
            UtilityFunctions.fadeSound(sound, fadeOutTimeInSeconds, 0, easingFunction);
        }
    }
    // GUI
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    gui.idealWidth = 1080;
    //  LOADING SCREEN
    const loadingContainer = new BABYLON.GUI.Rectangle();
    loadingContainer.width = 1.0;
    loadingContainer.height = 1.0;
    loadingContainer.thickness = 0;
    loadingContainer.isVisible = true;
    loadingContainer.background = "rgb(0,0,0)";
    {
        const loadingText = new BABYLON.GUI.TextBlock();
        loadingText.text = "Loading";
        loadingText.color = "white";
        loadingText.fontSize = 100;
        loadingContainer.addControl(loadingText);
        let dotCount = 1;
        setInterval(() => {
            if (!loadingContainer.isVisible)
                return;
            dotCount = (dotCount + 1) % 4;
            let dotStr = '';
            for (let i = 0; i < dotCount; i++)
                dotStr += '.';
            loadingText.text = "Loading" + dotStr;
        }, 500);
    }
    gui.addControl(loadingContainer);
    //  GAME OVER SCREEN
    const gameOverContainer = new BABYLON.GUI.Rectangle();
    gameOverContainer.width = 1.0;
    gameOverContainer.height = 1.0;
    gameOverContainer.thickness = 0;
    gameOverContainer.isVisible = false;
    {
        const bottomBar = new BABYLON.GUI.Rectangle();
        bottomBar.width = 1.0;
        bottomBar.height = 0.2;
        bottomBar.thickness = 0;
        bottomBar.background = "rgb(0,204,255)";
        bottomBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        gameOverContainer.addControl(bottomBar);
        const btnMenu = BABYLON.GUI.Button.CreateSimpleButton("butb", "Menu");
        btnMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        btnMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        btnMenu.width = "130px";
        btnMenu.height = "60px";
        btnMenu.fontSize = "50px";
        btnMenu.color = "black";
        btnMenu.thickness = 0;
        btnMenu.onPointerClickObservable.add(() => {
            game.dispose();
            gameplayContainer.isVisible = false;
            pauseContainer.isVisible = false;
            menuContainer.isVisible = true;
            gameOverContainer.isVisible = false;
        });
        gameOverContainer.addControl(btnMenu);
    }
    gui.addControl(gameOverContainer);
    //  GAMEPLAY SCREEN
    const gameplayContainer = new BABYLON.GUI.Rectangle();
    gameplayContainer.width = 1.0;
    gameplayContainer.height = 1.0;
    gameplayContainer.thickness = 0;
    gameplayContainer.isVisible = false;
    {
        const text1 = new BABYLON.GUI.TextBlock();
        text1.text = "50ft";
        text1.color = "black";
        text1.fontSize = 40;
        text1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        text1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text1.left = -25;
        text1.top = 25;
        text1.resizeToFit = true;
        text1.outlineWidth = 4;
        text1.outlineColor = 'white';
        text1.name = 'currentheight';
        gameplayContainer.addControl(text1);
        const text2 = new BABYLON.GUI.TextBlock();
        text2.text = "50ft";
        text2.color = "black";
        text2.fontSize = 30;
        text2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        text2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text2.left = -25;
        text2.top = 65;
        text2.resizeToFit = true;
        text2.outlineWidth = 4;
        text2.outlineColor = 'white';
        text2.name = 'maxheight';
        gameplayContainer.addControl(text2);
    }
    gui.addControl(gameplayContainer);
    // PAUSE SCREEN
    const pauseContainer = new BABYLON.GUI.Rectangle();
    pauseContainer.width = 1.0;
    pauseContainer.height = 1.0;
    pauseContainer.thickness = 0;
    pauseContainer.isVisible = false;
    {
        const centerBox = new BABYLON.GUI.Rectangle();
        centerBox.width = 0.5;
        centerBox.height = 0.5;
        centerBox.thickness = 0;
        centerBox.background = "rgba(255,255,255,0.5)";
        {
            const textPaused = new BABYLON.GUI.TextBlock();
            textPaused.text = "PAUSED";
            textPaused.color = "black";
            textPaused.fontSize = "60px";
            textPaused.thickness = 0;
            centerBox.addControl(textPaused);
            const btnMenu = BABYLON.GUI.Button.CreateSimpleButton("but", "Menu");
            btnMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            btnMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            btnMenu.left = 0.5;
            btnMenu.width = "130px";
            btnMenu.height = "60px";
            btnMenu.fontSize = "50px";
            btnMenu.color = "black";
            btnMenu.thickness = 0;
            btnMenu.onPointerClickObservable.add(() => {
                game.dispose();
                gameplayContainer.isVisible = false;
                pauseContainer.isVisible = false;
                menuContainer.isVisible = true;
                gameOverContainer.isVisible = false;
            });
            centerBox.addControl(btnMenu);
        }
        pauseContainer.addControl(centerBox);
    }
    gui.addControl(pauseContainer);
    // MENU SCREEN
    const menuContainer = new BABYLON.GUI.Rectangle();
    menuContainer.width = 1.0;
    menuContainer.height = 1.0;
    menuContainer.background = "rgb(0,204,255)";
    menuContainer.thickness = 0;
    menuContainer.isVisible = false;
    {
        const backgroundImg = new BABYLON.GUI.Image("but", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/mainmenu.png");
        backgroundImg.width = 1.0;
        backgroundImg.height = 1.0;
        backgroundImg.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
        menuContainer.addControl(backgroundImg);
        var btnTutorial = BABYLON.GUI.Button.CreateSimpleButton("but", "Tutorial");
        btnTutorial.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        btnTutorial.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        btnTutorial.left = "150px";
        btnTutorial.top = "50px";
        btnTutorial.width = "360px";
        btnTutorial.height = "120px";
        btnTutorial.fontSize = "100px";
        btnTutorial.color = "red";
        btnTutorial.thickness = 0;
        btnTutorial.onPointerClickObservable.add(() => {
            alert("UNIMPLEMENTED");
        });
        menuContainer.addControl(btnTutorial);
        var btnPlay = BABYLON.GUI.Button.CreateSimpleButton("but", "Play");
        btnPlay.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        btnPlay.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        btnPlay.left = "150px";
        btnPlay.top = "170px";
        btnPlay.width = "230px";
        btnPlay.height = "120px";
        btnPlay.fontSize = "100px";
        btnPlay.color = "red";
        btnPlay.thickness = 0;
        btnPlay.onPointerClickObservable.add(() => {
            game = new Game();
            game.start();
            menuContainer.isVisible = false;
            gameplayContainer.isVisible = true;
        });
        menuContainer.addControl(btnPlay);
    }
    gui.addControl(menuContainer);
    // Observable object that fires events
    class Observable {
        constructor() {
            this.subscribers = new Map();
        }
        onEvent(eventName, callback) {
            if (!this.subscribers.has(eventName))
                this.subscribers.set(eventName, new Set());
            this.subscribers.get(eventName).add(callback);
            return () => this.subscribers.get(eventName).delete(callback);
        }
        fire(eventName, ...args) {
            if (this.subscribers.has(eventName))
                this.subscribers.get(eventName).forEach(callback => callback(...args));
        }
    }
    // Singleton input manager
    class InputManager extends Observable {
        constructor() {
            super();
            this.inputMap = new Map();
            scene.actionManager = new BABYLON.ActionManager(scene);
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap.set(key, true);
                this.fire('keyDown', key);
            }));
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap.set(key, false);
                this.fire('keyUp', key);
            }));
        }
        static getInstance() { return this.instance; }
        isKeyPressed(key) { return this.inputMap.get(key); }
        ;
    }
    InputManager.instance = new InputManager();
    // Singleton camera, rotates in 90 degree increments
    class GameCamera {
        constructor() {
            this.rotating = false;
            this.rotationIndex = 0;
            this.node = new BABYLON.TransformNode('', scene);
            // use an arc-rotate camera
            const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 25, new BABYLON.Vector3(0, 0, 0), scene);
            camera.setPosition(new BABYLON.Vector3(0, 0, 0));
            camera.beta = 0.65;
            camera.radius = 25;
            camera.parent = this.node;
            this.camera = camera;
            scene.onBeforeRenderObservable.add(() => {
                // wrap camera alpha
                if (camera.alpha < 0) {
                    camera.alpha = (Math.PI * 2) + camera.alpha;
                }
                else if (camera.alpha > (Math.PI * 2)) {
                    camera.alpha = camera.alpha - (Math.PI * 2);
                }
                // rotate camera right 90 degrees
                if (InputManager.getInstance().isKeyPressed('arrowright') && !this.rotating) {
                    var animationBox = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    animationBox.setKeys([{ frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha + (Math.PI / 2) }]);
                    camera.animations = [animationBox];
                    scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1); });
                    this.rotating = true;
                    game.pause();
                    GameCamera.rotateSound.play();
                }
                else if (InputManager.getInstance().isKeyPressed('arrowleft') && !this.rotating) {
                    var animationBox = new BABYLON.Animation("myAnimation2", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    animationBox.setKeys([{ frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha - (Math.PI / 2) }]);
                    camera.animations = [animationBox];
                    scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 0 ? 3 : this.rotationIndex - 1); });
                    game.pause();
                    this.rotating = true;
                    GameCamera.rotateSound.play();
                }
            });
        }
        static LoadResources() {
            return Promise.all([
                new Promise((resolve) => {
                    GameCamera.rotateSound = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/rotateView.wav", scene, resolve, {
                        loop: false,
                        autoplay: false,
                        volume: 0.5
                    });
                })
            ]);
        }
        setY(y) { this.node.position.y = y; }
        getY() { return this.node.position.y; }
        setAlpha(alpha) { this.camera.alpha = alpha; }
        getAlpha() { return this.camera.alpha; }
        getRotationIndex() { return this.rotationIndex; }
        resetRotationindex() {
            this.rotationIndex = 0;
            this.camera.alpha = 4.71238898039;
        }
    }
    const camera = new GameCamera();
    // Enum class representing the 6 sides of a cube
    class Sides {
        constructor(dim, direction) {
            this.dim = dim;
            this.direction = direction;
        }
        flip() {
            switch (this) {
                case Sides.Left: return Sides.Right;
                case Sides.Right: return Sides.Left;
                case Sides.Top: return Sides.Bottom;
                case Sides.Bottom: return Sides.Top;
                case Sides.Forward: return Sides.Back;
                case Sides.Back: return Sides.Forward;
            }
        }
    }
    Sides.Left = new Sides('x', -1);
    Sides.Right = new Sides('x', 1);
    Sides.Forward = new Sides('z', 1);
    Sides.Back = new Sides('z', -1);
    Sides.Top = new Sides('y', 1);
    Sides.Bottom = new Sides('y', -1);
    var GameMode;
    (function (GameMode) {
        GameMode[GameMode["Playing"] = 0] = "Playing";
        GameMode[GameMode["Spectating"] = 1] = "Spectating";
    })(GameMode || (GameMode = {}));
    // Game class, responsible for managing contained phys-objects
    class Game {
        constructor() {
            this.cameraSpeed = 0;
            this.mode = GameMode.Playing;
            this.deathDelayOver = false;
            this.canPause = true;
            this.callbackFunctions = [];
            this.running = true;
            this.fallboxClusters = [];
            this.physBoxesSortedY = [];
            this.physBoxToYIndex = new Map();
            this.updateCutoffYIndex = 0;
            this.testT = 0;
            this.towerFlyByComplte = false;
        }
        static LoadResources() {
            return Promise.all([
                new Promise((resolve) => {
                    Game.BACKGROUND_MUSIC = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/music/dreamsofabove.mp3", scene, resolve, {
                        loop: true, autoplay: false, volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    Game.SOUND_PAUSE_IN = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/pauseIn.wav", scene, resolve, {
                        loop: false, autoplay: false, volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    Game.SOUND_PAUSE_OUT = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/pauseOut.wav", scene, resolve, {
                        loop: false, autoplay: false, volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    Game.SOUND_DRUMROLL_IN = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/drumrollStart.mp3", scene, resolve, {
                        loop: false, autoplay: false, volume: 0.5
                    });
                    Game.SOUND_DRUMROLL_IN.onEndedObservable.add(() => {
                        Game.SOUND_DRUMROLL_REPEAT.play();
                    });
                }),
                new Promise((resolve) => {
                    Game.SOUND_DRUMROLL_REPEAT = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/drumrollRepeat.mp3", scene, resolve, {
                        loop: true, autoplay: false, volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    const lava = BABYLON.Mesh.CreateGround("ground", 500, 500, 50, scene);
                    lava.visibility = 0.5;
                    lava.position.y = -10;
                    const lavaMaterial = new BABYLON.LavaMaterial("lava", scene);
                    lavaMaterial.noiseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/cloud.png", scene); // Set the bump texture
                    lavaMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/lavatile.jpg", scene); // Set the diffuse texture
                    lavaMaterial.speed = 0.5;
                    lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
                    lavaMaterial.unlit = true;
                    lava.material = lavaMaterial;
                    lava.isVisible = false;
                    Game.MESH_LAVA = lava;
                    resolve();
                })
            ]);
        }
        changeMode(mode) {
            switch (mode) {
                case GameMode.Playing:
                    gameOverContainer.isVisible = false;
                    gameplayContainer.isVisible = true;
                    this.mode = GameMode.Playing;
                    break;
                case GameMode.Spectating:
                    console.assert(this.mode == GameMode.Playing && this.canPause);
                    UtilityFunctions.fadeOutSound(Game.BACKGROUND_MUSIC, 1);
                    setTimeout(() => {
                        gameplayContainer.isVisible = false;
                        gameOverContainer.isVisible = true;
                        camera.setY(0);
                        this.lava.position.y = -10;
                        this.deathDelayOver = true;
                        this.mode = GameMode.Spectating;
                        Game.SOUND_DRUMROLL_IN.play();
                    }, 3000);
                    this.canPause = false;
                    break;
            }
        }
        update() {
            if (!this.running)
                return;
            // perform mode-specific update logic
            switch (this.mode) {
                case GameMode.Playing:
                    if ((this.player.getPos().y - this.lava.position.y) < Game.PLAYER_DISTANCE_FOR_FAST_LAVA) {
                        this.lava.position.y += Game.LAVA_SPEED_STANDARD;
                    }
                    else {
                        this.lava.position.y += Game.LAVA_SPEED_FAST;
                    }
                    // update the sorted physbox list for sort&sweep collisions
                    this.ySortBoxes();
                    // resolve physbox collisions
                    for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                        const pbox = this.physBoxesSortedY[i];
                        if (pbox.isActive() && !pbox.isDisposed())
                            pbox.beforeCollisions();
                    }
                    for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                        const pbox = this.physBoxesSortedY[i];
                        if (pbox.isActive() && !pbox.isDisposed())
                            pbox.resolveCollisions(0);
                    }
                    for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                        const pbox = this.physBoxesSortedY[i];
                        if (pbox.isActive() && !pbox.isDisposed())
                            pbox.afterCollisions();
                    }
                    // update fallbox clusters
                    this.fallboxClusters.forEach(cluster => { if (!cluster.isDisposed())
                        cluster.update(); });
                    break;
                case GameMode.Spectating:
                    if (!this.deathDelayOver)
                        break;
                    this.testT += 1;
                    if (!this.towerFlyByComplte) {
                        const slowDownY = this.player.getPos().y - 32.256000000000014;
                        if (camera.getY() < 32.256000000000014) {
                            this.cameraSpeed += 0.016;
                        }
                        else if (camera.getY() > slowDownY) {
                            this.cameraSpeed -= 0.016;
                        }
                        camera.setY(camera.getY() + this.cameraSpeed);
                        if (this.cameraSpeed <= 0) {
                            this.towerFlyByComplte = true;
                            Game.SOUND_DRUMROLL_IN.stop();
                            Game.SOUND_DRUMROLL_REPEAT.stop();
                        }
                    }
                    break;
            }
        }
        dispose() {
            Game.BACKGROUND_MUSIC.stop();
            scene.onBeforeRenderObservable.removeCallback(this.updateCallbackFunc);
            this.physBoxesSortedY.forEach((physBox) => physBox.dispose());
            this.fallboxClusters.forEach((cluster) => cluster.dispose());
            this.lava.dispose();
            this.callbackFunctions.forEach((func) => func());
        }
        getLavaLevel() { return this.lava.position.y - 1; }
        pause() { this.running = false; }
        play() { this.running = true; }
        start() {
            // setup update callback
            this.updateCallbackFunc = (() => this.update());
            scene.onBeforeRenderObservable.add(this.updateCallbackFunc);
            // setup pause callback
            this.callbackFunctions.push(InputManager.getInstance().onEvent('keyDown', (key) => {
                if (this.canPause) {
                    switch (key) {
                        case 'p':
                            if (this.running) {
                                Game.BACKGROUND_MUSIC.pause();
                                pauseContainer.isVisible = true;
                                this.running = false;
                                Game.SOUND_PAUSE_IN.play();
                            }
                            else {
                                Game.BACKGROUND_MUSIC.play();
                                pauseContainer.isVisible = false;
                                this.running = true;
                                Game.SOUND_PAUSE_OUT.play();
                            }
                            break;
                    }
                }
            }));
            // create lava
            this.lava = Game.MESH_LAVA.createInstance('');
            // create frozen box at the bottom to catch them all
            let bottomBox = new FloorBox();
            bottomBox
                .freeze()
                .setPos(new BABYLON.Vector3(0, 0, 0))
                .setSize(new BABYLON.Vector3(10, 10, 10));
            this.addPhysBox(bottomBox);
            // create initial cube cluster
            this.createNewCluster(200, 20);
            // all is ready, create the player
            const player = new Player();
            player.setPos(new BABYLON.Vector3(0, 7, 0));
            this.addPhysBox(player);
            this.callbackFunctions.push(player.onEvent('death', () => {
                this.changeMode(GameMode.Spectating);
            }));
            this.player = player;
            // play background music
            Game.BACKGROUND_MUSIC.loop = true;
            Game.BACKGROUND_MUSIC.setVolume(0.5);
            Game.BACKGROUND_MUSIC.play();
            camera.resetRotationindex();
        }
        createNewCluster(cubeCount, startY) { this.fallboxClusters.push(new FallBoxCluster(cubeCount, startY)); }
        addPhysBox(box) { this.physBoxesSortedY.push(box); }
        getPhysObjects() { return this.physBoxesSortedY; }
        getPlayer() { return this.player; }
        // SORT
        ySortBoxes() {
            // O(N) average case for insertion sort after physbox updates
            for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                let j = i - 1;
                let tmp = this.physBoxesSortedY[i];
                while (j >= 0 && this.physBoxesSortedY[j].getPos().y > tmp.getPos().y) {
                    this.physBoxesSortedY[j + 1] = this.physBoxesSortedY[j];
                    j--;
                }
                this.physBoxesSortedY[j + 1] = tmp;
                this.physBoxToYIndex.set(tmp, j + 1);
            }
            // Update cutoff y index (anything below is lost to the lava, and need not be resorted or updated)
            for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                if (this.physBoxesSortedY[i].getPos().y < (this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA))
                    this.updateCutoffYIndex = i;
            }
        }
        // SWEEP AND PRUNE
        getCollisions(physBox, dim) {
            let yIndex = this.physBoxToYIndex.get(physBox);
            let collisions = [];
            let tests = 0;
            if (dim != 'y' || physBox.getVelocity().y < 0) {
                for (let i = yIndex; i >= 0; i--) {
                    let candiate = this.physBoxesSortedY[i];
                    tests++;
                    if (candiate.isActive() && physBox.intersects(candiate))
                        collisions.push(candiate);
                    if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + (PhysBox.MAXIMUM_HEIGHT / 2)))
                        break;
                }
            }
            if (dim != 'y' || physBox.getVelocity().y > 0) {
                for (let i = yIndex; i < this.physBoxesSortedY.length; i++) {
                    tests++;
                    let candiate = this.physBoxesSortedY[i];
                    if (candiate.isActive() && physBox.intersects(candiate))
                        collisions.push(candiate);
                    if (physBox.getSide(Sides.Top) < (candiate.getPos().y - (PhysBox.MAXIMUM_HEIGHT / 2)))
                        break;
                }
            }
            // if (physBox instanceof Player && Math.random() > 0.99) {
            //     console.log(tests);
            // }
            return collisions;
        }
    }
    // GAME CONSTANTS
    Game.PLAYER_DISTANCE_FOR_FAST_LAVA = 75;
    Game.LAVA_SPEED_STANDARD = 0.035;
    Game.LAVA_SPEED_FAST = 0.2;
    Game.MAXIMUM_YDISTANCE_UNDER_LAVA = 100;
    class GameObj extends Observable {
    }
    class BoundBox extends GameObj {
        constructor(...args) {
            super(...args);
            this.node = new BABYLON.TransformNode('', scene);
        }
        getPos() { return this.node.position; }
        setPos(pos) { this.node.position.copyFrom(pos); return this; }
        setSize(size) { this.node.scaling.copyFrom(size); return this; }
        getSize() { return this.node.scaling; }
        getSide(side) { return this.node.position[side.dim] + (this.node.scaling[side.dim] * 0.5 * side.direction); }
        setSide(side, value) { this.node.position[side.dim] = value - (this.node.scaling[side.dim] * 0.5 * side.direction); }
        intersects(otherBox) {
            // bounding boxes can't collide with themselves
            if (otherBox == this)
                return false;
            // a collision occurs if there is no axis that seperates the two bounding boxes
            return (!(this.getSide(Sides.Left) > otherBox.getSide(Sides.Right)) &&
                !(this.getSide(Sides.Right) < otherBox.getSide(Sides.Left)) &&
                !(this.getSide(Sides.Back) > otherBox.getSide(Sides.Forward)) &&
                !(this.getSide(Sides.Forward) < otherBox.getSide(Sides.Back)) &&
                !(this.getSide(Sides.Bottom) > otherBox.getSide(Sides.Top)) &&
                !(this.getSide(Sides.Top) < otherBox.getSide(Sides.Bottom)));
        }
    }
    class PhysBox extends BoundBox {
        constructor(...args) {
            super(...args);
            this.frozen = false;
            this.active = true;
            this.velocity = BABYLON.Vector3.Zero();
            this.disposed = false;
            this.collisionsLastUpdate = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()]
            ]);
            this.collisionsThisUpdate = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()]
            ]);
        }
        setVelocity(velocity) { this.velocity = velocity.clone(); return this; }
        getVelocity() { return this.frozen ? PhysBox.FROZEN_VELOCITY : this.velocity; }
        isActive() { return this.active; }
        disable() { this.active = false; }
        enable() { this.active = true; }
        freeze() { this.frozen = true; this.fire('freeze', true); return this; }
        unfreeze() { this.frozen = false; this.fire('freeze', false); return this; }
        isFrozen() { return this.frozen; }
        getMoverLevel() { return 1; }
        dispose() { this.disposed = true; }
        isDisposed() { return this.disposed; }
        onCollisionStart(side, physBox) { }
        onCollisionHold(side, physBox) {
            if (this.getMoverLevel() < physBox.getMoverLevel()) {
                if (side == Sides.Top || side == Sides.Bottom)
                    this.getVelocity().y = physBox.getVelocity().y;
                else if (side == Sides.Left || side == Sides.Right)
                    this.getVelocity().x = physBox.getVelocity().x;
                else if (side == Sides.Forward || side == Sides.Back)
                    this.getVelocity().z = physBox.getVelocity().z;
            }
        }
        onCollisionStop(side, physBox) { }
        beforeCollisions() {
            let tmp = this.collisionsThisUpdate;
            this.collisionsThisUpdate = this.collisionsLastUpdate;
            this.collisionsThisUpdate.forEach((collisions, side) => collisions.clear());
            this.collisionsLastUpdate = tmp;
        }
        afterCollisions() {
            this.collisionsThisUpdate.forEach((collisions, side) => {
                collisions.forEach((collision) => {
                    if (!this.collisionsLastUpdate.get(side).has(collision)) {
                        this.onCollisionStart(side, collision);
                        collision.onCollisionStart(side.flip(), this);
                    }
                    else {
                        this.onCollisionHold(side, collision);
                        collision.onCollisionHold(side.flip(), this);
                    }
                });
            });
            this.collisionsLastUpdate.forEach((collisions, side) => {
                collisions.forEach((collision) => {
                    if (!this.collisionsThisUpdate.get(side).has(collision)) {
                        this.onCollisionStop(side, collision);
                        collision.onCollisionStop(side.flip(), this);
                    }
                });
            });
        }
        notifyOfCollision(side, physBox) {
            this.collisionsThisUpdate.get(side).add(physBox);
        }
        getCollisions(side) { return this.collisionsLastUpdate.get(side); }
        resolveCollisions(t) {
            if (this.frozen || !this.active)
                return;
            // resolve in Y axis
            const yVelocity = this.getVelocity().y;
            if (yVelocity != 0) {
                this.getPos().y += yVelocity;
                let collisions = game.getCollisions(this, 'y');
                if (yVelocity < 0) {
                    let hits = collisions.sort((b, a) => a.getSide(Sides.Top) - b.getSide(Sides.Top));
                    for (let i = 0; i < hits.length; i++) {
                        if (hits[i].getPos().y == hits[0].getPos().y) {
                            this.collisionsThisUpdate.get(Sides.Bottom).add(hits[i]);
                            hits[i].notifyOfCollision(Sides.Top, this);
                            this.setSide(Sides.Bottom, hits[i].getSide(Sides.Top) + 0.001);
                        }
                        else
                            break;
                    }
                }
                else if (yVelocity > 0) {
                    let hits = collisions.sort((a, b) => a.getSide(Sides.Bottom) - b.getSide(Sides.Bottom));
                    for (let i = 0; i < hits.length; i++) {
                        if (hits[i].getPos().y == hits[0].getPos().y) {
                            this.collisionsThisUpdate.get(Sides.Top).add(hits[i]);
                            hits[i].notifyOfCollision(Sides.Bottom, this);
                            this.setSide(Sides.Top, hits[i].getSide(Sides.Bottom) - 0.001);
                        }
                        else
                            break;
                    }
                }
            }
            // resolve in X axis
            const xVelocity = this.getVelocity().x;
            if (xVelocity != 0) {
                this.getPos().x += xVelocity;
                let collisions = game.getCollisions(this, 'x');
                if (xVelocity < 0) {
                    let hits = collisions.sort((b, a) => a.getSide(Sides.Right) - b.getSide(Sides.Right));
                    for (let i = 0; i < hits.length; i++) {
                        if (hits[i].getPos().y == hits[0].getPos().y) {
                            this.collisionsThisUpdate.get(Sides.Left).add(hits[i]);
                            hits[i].notifyOfCollision(Sides.Right, this);
                            this.setSide(Sides.Left, hits[i].getSide(Sides.Right) + 0.001);
                        }
                        else
                            break;
                    }
                }
                else if (xVelocity > 0) {
                    let hits = collisions.sort((a, b) => a.getSide(Sides.Left) - b.getSide(Sides.Left));
                    for (let i = 0; i < hits.length; i++) {
                        if (hits[i].getPos().y == hits[0].getPos().y) {
                            this.collisionsThisUpdate.get(Sides.Right).add(hits[i]);
                            hits[i].notifyOfCollision(Sides.Left, this);
                            this.setSide(Sides.Right, hits[i].getSide(Sides.Left) - 0.001);
                        }
                        else
                            break;
                    }
                }
            }
            // resolve in Z axis
            const zVelocity = this.getVelocity().z;
            if (zVelocity != 0) {
                this.getPos().z += zVelocity;
                let collisions = game.getCollisions(this, 'z');
                if (zVelocity < 0) {
                    let hits = collisions.sort((b, a) => a.getSide(Sides.Forward) - b.getSide(Sides.Forward));
                    for (let i = 0; i < hits.length; i++) {
                        if (hits[i].getPos().y == hits[0].getPos().y) {
                            this.collisionsThisUpdate.get(Sides.Back).add(hits[i]);
                            hits[i].notifyOfCollision(Sides.Forward, this);
                            this.setSide(Sides.Back, hits[i].getSide(Sides.Forward) + 0.0001);
                        }
                        else
                            break;
                    }
                }
                else if (zVelocity > 0) {
                    let hits = collisions.sort((a, b) => a.getSide(Sides.Back) - b.getSide(Sides.Back));
                    for (let i = 0; i < hits.length; i++) {
                        if (hits[i].getPos().y == hits[0].getPos().y) {
                            this.collisionsThisUpdate.get(Sides.Forward).add(hits[i]);
                            hits[i].notifyOfCollision(Sides.Back, this);
                            this.setSide(Sides.Forward, hits[i].getSide(Sides.Back) - 0.0001);
                        }
                        else
                            break;
                    }
                }
            }
        }
    }
    // CONSTANTS
    PhysBox.FROZEN_VELOCITY = BABYLON.Vector3.Zero();
    PhysBox.MAXIMUM_HEIGHT = 5;
    // creates and manages a cluster of fallboxes
    class FallBoxCluster {
        constructor(cubeCount, startY) {
            this.iterIndex = 0;
            this.active = true;
            this.disposed = false;
            this.topCluster = true;
            const fallBoxes = [];
            let frozenCount = 0;
            let physObjs = game.getPhysObjects();
            let startIndex = physObjs.length;
            for (let i = 0; i < cubeCount; i++) {
                let boxB = new FallBox();
                let obstructed = true;
                const rnd = Math.random();
                if (rnd <= 0.3) {
                    boxB.setSize(BABYLON.Vector3.One().scale(2));
                }
                else if (rnd <= 0.6) {
                    boxB.setSize(BABYLON.Vector3.One().scale(3));
                }
                else {
                    boxB.setSize(BABYLON.Vector3.One().scale(5));
                }
                while (obstructed) {
                    boxB.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, startY + Math.random() * 750, -5 + Math.random() * 10));
                    obstructed = false;
                    for (let i = startIndex; i < physObjs.length; i++) {
                        if (physObjs[i].intersects(boxB)) {
                            obstructed = true;
                            break;
                        }
                    }
                }
                boxB.setVelocity(new BABYLON.Vector3(0, -0.075, 0));
                boxB.onEvent('freeze', (status) => {
                    frozenCount += (status == true ? 1 : -1);
                    this.active = (frozenCount != fallBoxes.length);
                    if (this.active) {
                        SPS.mesh.unfreezeWorldMatrix();
                        SPS.mesh.unfreezeNormals();
                    }
                    else {
                        SPS.mesh.freezeWorldMatrix();
                        SPS.mesh.freezeNormals();
                    }
                });
                if (!this.topBox || (boxB.getPos().y > this.topBox.getPos().y)) {
                    this.topBox = boxB;
                }
                fallBoxes.push(boxB);
                game.addPhysBox(boxB);
            }
            const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
            const box = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
            const testMaterial = new BABYLON.StandardMaterial('', scene);
            testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/testBox.png', scene);
            testMaterial.diffuseTexture.hasAlpha = true;
            testMaterial.backFaceCulling = false;
            testMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
            SPS.addShape(box, cubeCount);
            box.dispose();
            const mesh = SPS.buildMesh();
            mesh.alwaysSelectAsActiveMesh = true;
            mesh.material = testMaterial;
            SPS.computeParticleRotation = false;
            SPS.updateParticle = (particle) => {
                particle.position.copyFrom(fallBoxes[this.iterIndex].getPos());
                particle.scaling.copyFrom(fallBoxes[this.iterIndex].getSize());
                particle.color.copyFrom(fallBoxes[this.iterIndex].getColor());
                this.iterIndex++;
                return particle;
            };
            this.SPS = SPS;
        }
        isDisposed() { return this.disposed; }
        dispose() {
            this.SPS.dispose();
            this.disposed = true;
        }
        update() {
            if (this.disposed)
                return;
            if (this.topCluster && ((this.topBox.getPos().y - game.getPlayer().getPos().y) < 200)) {
                game.createNewCluster(200, this.topBox.getPos().y);
                this.topCluster = false;
            }
            if (!this.active)
                return;
            this.iterIndex = 0;
            this.SPS.setParticles();
        }
    }
    class FloorBox extends PhysBox {
        constructor() {
            super();
            const mesh = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
            const material = new BABYLON.StandardMaterial('', scene);
            material.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/floorBox.png", scene);
            mesh.material = material;
            mesh.position = this.getPos();
            mesh.scaling = this.getSize();
        }
    }
    class FallBox extends PhysBox {
        constructor() {
            super();
            this.color = new BABYLON.Color4(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1);
        }
        onCollisionStart(side, physBox) {
            super.onCollisionStart(side, physBox);
            if (side == Sides.Bottom && (physBox instanceof FallBox) && physBox.isFrozen()) {
                this.freeze();
            }
        }
        getColor() { return this.color; }
        getMoverLevel() { return 2; }
    }
    class Player extends PhysBox {
        constructor() {
            super();
            this.bestHeight = 0;
            this.mesh = Player.MESH.createInstance('');
            this.mesh.position = this.getPos();
            const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
            particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
            particleSystem.emitter = this.mesh; // the starting object, the emitter
            particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0); // Starting all from
            particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0); // To...
            particleSystem.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            particleSystem.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
            particleSystem.minSize = 0.1;
            particleSystem.maxSize = 0.5;
            particleSystem.minLifeTime = 0.4;
            particleSystem.maxLifeTime = 0.6;
            particleSystem.emitRate = 2000;
            particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            particleSystem.GRAVITY = new BABYLON.Vector3(0, 0, 0);
            particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
            particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
            particleSystem.minAngularSpeed = 0;
            particleSystem.maxAngularSpeed = Math.PI;
            particleSystem.minEmitPower = 6;
            particleSystem.maxEmitPower = 10;
            particleSystem.updateSpeed = 0.005;
            this.explosionParticleSystem = particleSystem;
            this.setSize(new BABYLON.Vector3(0.6658418, 0.8655933, 0.6658418));
            this.setPos(new BABYLON.Vector3(0, 3, 0));
        }
        static LoadResources() {
            return Promise.all([
                new Promise((resolve) => {
                    Player.SOUND_JUMP = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/jump.wav", scene, resolve, {
                        loop: false,
                        autoplay: false,
                        volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    Player.SOUND_HIT_HEAD = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/hitHead.wav", scene, resolve, {
                        loop: false,
                        autoplay: false,
                        volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    Player.SOUND_DEATH = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/death.wav", scene, resolve, {
                        loop: false,
                        autoplay: false,
                        volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/", "player.obj", scene, (meshes, particleSystems, skeletons) => {
                        const testMaterial = new BABYLON.StandardMaterial('', scene);
                        testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/player.png', scene);
                        testMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
                        meshes[0].material = testMaterial;
                        meshes[0].isVisible = false;
                        Player.MESH = (meshes[0]);
                        resolve();
                    });
                })
            ]);
        }
        dispose() {
            super.dispose();
            this.mesh.dispose();
            this.explosionParticleSystem.dispose();
        }
        disable() {
            super.disable();
            this.mesh.isVisible = false;
        }
        kill() {
            this.disable();
            this.explosionParticleSystem.start();
            Player.SOUND_DEATH.play();
            this.fire('death', true);
            setTimeout(() => this.explosionParticleSystem.stop(), 150);
        }
        onCollisionStart(side, physBox) {
            if (!Player.SOUND_HIT_HEAD.isPlaying && side == Sides.Top && physBox instanceof FallBox)
                Player.SOUND_HIT_HEAD.play();
        }
        determineVelocities() {
            let wKey;
            let aKey;
            let sKey;
            let dKey;
            switch (camera.getRotationIndex()) {
                case 1:
                    wKey = 'd';
                    aKey = 'w';
                    sKey = 'a';
                    dKey = 's';
                    break;
                case 2:
                    wKey = 's';
                    aKey = 'd';
                    sKey = 'w';
                    dKey = 'a';
                    break;
                case 3:
                    wKey = 'a';
                    aKey = 's';
                    sKey = 'd';
                    dKey = 'w';
                    break;
                case 0:
                    wKey = 'w';
                    aKey = 'a';
                    sKey = 's';
                    dKey = 'd';
                    break;
            }
            let avgYSpeed = 0;
            let count = 0;
            // update rotation animation
            if (this.mesh) {
                if (this.getVelocity().z > 0) {
                    this.mesh.rotation.x = Math.min(this.mesh.rotation.x + 0.05, 0.15);
                }
                else if (this.getVelocity().z < 0) {
                    this.mesh.rotation.x = Math.max(this.mesh.rotation.x - 0.05, -0.15);
                }
                else {
                    this.mesh.rotation.x = (Math.abs(this.mesh.rotation.x) <= 0.05) ? 0 : this.mesh.rotation.x + 0.05 * Math.sign(this.mesh.rotation.x) * -1;
                }
                if (this.getVelocity().x < 0) {
                    this.mesh.rotation.z = Math.min(this.mesh.rotation.z + 0.05, 0.15);
                }
                else if (this.getVelocity().x > 0) {
                    this.mesh.rotation.z = Math.max(this.mesh.rotation.z - 0.05, -0.15);
                }
                else {
                    this.mesh.rotation.z = (Math.abs(this.mesh.rotation.z) <= 0.05) ? 0 : this.mesh.rotation.z + 0.05 * Math.sign(this.mesh.rotation.z) * -1;
                }
            }
            // test if the player is sliding along a physbox's wall
            if (!this.getCollisions(Sides.Top).size && this.getVelocity().y < 0) {
                if (this.getCollisions(Sides.Left).size) {
                    count += this.getCollisions(Sides.Left).size;
                    this.getCollisions(Sides.Left).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (InputManager.getInstance().isKeyPressed(' ')) {
                        this.getVelocity().x = Player.SIDE_XZ_IMPULSE;
                        this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                        if (!Player.SOUND_HIT_HEAD.isPlaying)
                            Player.SOUND_JUMP.play();
                    }
                }
                if (this.getCollisions(Sides.Right).size) {
                    count += this.getCollisions(Sides.Right).size;
                    this.getCollisions(Sides.Right).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (InputManager.getInstance().isKeyPressed(' ')) {
                        this.getVelocity().x = -Player.SIDE_XZ_IMPULSE;
                        this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                        if (!Player.SOUND_HIT_HEAD.isPlaying)
                            Player.SOUND_JUMP.play();
                    }
                }
                if (this.getCollisions(Sides.Forward).size) {
                    count += this.getCollisions(Sides.Forward).size;
                    this.getCollisions(Sides.Forward).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (InputManager.getInstance().isKeyPressed(' ')) {
                        this.getVelocity().z = -Player.SIDE_XZ_IMPULSE;
                        this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                        if (!Player.SOUND_HIT_HEAD.isPlaying)
                            Player.SOUND_JUMP.play();
                    }
                }
                if (this.getCollisions(Sides.Back).size) {
                    count += this.getCollisions(Sides.Back).size;
                    this.getCollisions(Sides.Back).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (InputManager.getInstance().isKeyPressed(' ')) {
                        this.getVelocity().z = Player.SIDE_XZ_IMPULSE;
                        this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                        if (!Player.SOUND_HIT_HEAD.isPlaying)
                            Player.SOUND_JUMP.play();
                    }
                }
            }
            if (count && !InputManager.getInstance().isKeyPressed(' ')) {
                // sliding, set players velocity to slide speed
                avgYSpeed /= count;
                avgYSpeed -= Player.SIDE_SLIDE_SPEED;
                this.getVelocity().y = avgYSpeed;
            }
            else {
                // not sliding, apply GRAVITY as normal
                this.getVelocity().y = Math.max(this.getVelocity().y - Player.GRAVITY, -Player.MAX_Y_SPEED);
            }
            // grounded, apply movement velocity instantaneously
            if (this.getCollisions(Sides.Bottom).size) {
                if (InputManager.getInstance().isKeyPressed(wKey)) {
                    this.getVelocity().z = Player.GROUND_MOVE_SPEED;
                }
                else if (InputManager.getInstance().isKeyPressed(sKey)) {
                    this.getVelocity().z = -Player.GROUND_MOVE_SPEED;
                }
                else {
                    this.getVelocity().z = 0;
                }
                if (InputManager.getInstance().isKeyPressed(aKey)) {
                    this.getVelocity().x = -Player.GROUND_MOVE_SPEED;
                }
                else if (InputManager.getInstance().isKeyPressed(dKey)) {
                    this.getVelocity().x = Player.GROUND_MOVE_SPEED;
                }
                else {
                    this.getVelocity().x = 0;
                }
                if (InputManager.getInstance().isKeyPressed(' ')) {
                    if (!Player.SOUND_HIT_HEAD.isPlaying)
                        Player.SOUND_JUMP.play();
                    this.getVelocity().y = Player.JUMP_IMPULSE;
                }
            }
            else {
                if (InputManager.getInstance().isKeyPressed(wKey)) {
                    this.getVelocity().z = Math.min(this.getVelocity().z + Player.AIR_MOVE_ACCELERATION, Player.GROUND_MOVE_SPEED);
                }
                else if (InputManager.getInstance().isKeyPressed(sKey)) {
                    this.getVelocity().z = Math.max(this.getVelocity().z - Player.AIR_MOVE_ACCELERATION, -Player.GROUND_MOVE_SPEED);
                }
                else {
                    this.getVelocity().z = (Math.abs(this.getVelocity().z) < Player.AIR_MOVE_ACCELERATION) ? 0 : this.getVelocity().z + Player.AIR_MOVE_ACCELERATION * Math.sign(this.getVelocity().z) * -1;
                }
                if (InputManager.getInstance().isKeyPressed(aKey)) {
                    this.getVelocity().x = Math.max(this.getVelocity().x - Player.AIR_MOVE_ACCELERATION, -Player.GROUND_MOVE_SPEED);
                }
                else if (InputManager.getInstance().isKeyPressed(dKey)) {
                    this.getVelocity().x = Math.min(this.getVelocity().x + Player.AIR_MOVE_ACCELERATION, Player.GROUND_MOVE_SPEED);
                }
                else {
                    this.getVelocity().x = (Math.abs(this.getVelocity().x) < Player.AIR_MOVE_ACCELERATION) ? 0 : this.getVelocity().x + Player.AIR_MOVE_ACCELERATION * Math.sign(this.getVelocity().x) * -1;
                }
                if (InputManager.getInstance().isKeyPressed('e')) {
                    this.getVelocity().y = -Player.CRUSH_IMPULSE;
                }
            }
        }
        beforeCollisions() {
            super.beforeCollisions();
            this.determineVelocities();
        }
        afterCollisions() {
            super.afterCollisions();
            camera.setY(this.getPos().y);
            // Death conditions
            //  1) Death due to being crushed
            if (this.getCollisions(Sides.Bottom).size && this.getCollisions(Sides.Top).size) {
                this.kill();
            }
            //  2) Death due to falling in the lava
            if (this.getSide(Sides.Bottom) <= game.getLavaLevel()) {
                this.kill();
            }
            // Update GUI
            this.bestHeight = Math.max(this.getPos().y, this.bestHeight);
            // gameplayContainer.getChildByName('currentheight').text = Math.round(this.getPos().y) + "ft";
            // gameplayContainer.getChildByName('maxheight').text = Math.round(this.bestHeight) + "ft";
        }
    }
    // CONSTANTS
    //  General movement
    Player.GROUND_MOVE_SPEED = 0.1;
    Player.AIR_MOVE_ACCELERATION = 0.01;
    //  Jump / Crush / Slide
    Player.JUMP_IMPULSE = 0.3;
    Player.CRUSH_IMPULSE = 0.5;
    Player.SIDE_JUMP_IMPULSE = 0.4;
    Player.SIDE_XZ_IMPULSE = 0.2;
    Player.SIDE_SLIDE_SPEED = 0.01;
    // Gravity & Max speed
    Player.GRAVITY = 0.008;
    Player.MAX_Y_SPEED = 0.5;
    Promise.all([
        Game.LoadResources(),
        Player.LoadResources(),
        GameCamera.LoadResources()
    ]).then(() => {
        loadingContainer.isVisible = false;
        menuContainer.isVisible = true;
    });
});
