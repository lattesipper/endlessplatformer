var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    let t = 0;
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
        // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
        static shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
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
    let PoolType;
    (function (PoolType) {
        PoolType[PoolType["Instances"] = 0] = "Instances";
        PoolType[PoolType["Cloning"] = 1] = "Cloning";
        PoolType[PoolType["SolidParticle"] = 2] = "SolidParticle"; // unimplemented
    })(PoolType || (PoolType = {}));
    class MeshPool {
        constructor(instanceCount, poolType) {
            this.instances = [];
            this.instances = new Array(instanceCount);
            this.poolType = poolType;
        }
        LoadResourcesFromPath(meshName) {
            return new Promise((resolve) => {
                BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/", meshName, scene, (meshes, particleSystems, skeletons) => {
                    const box = meshes[0];
                    box.isVisible = false;
                    switch (this.poolType) {
                        case PoolType.Instances:
                            for (let i = 0; i < this.instances.length; i++) {
                                const instance = box.createInstance('');
                                instance.isVisible = false;
                                this.instances[i] = instance;
                            }
                            break;
                        case PoolType.Cloning:
                            for (let i = 0; i < this.instances.length; i++) {
                                const instance = box.clone();
                                instance.isVisible = false;
                                this.instances[i] = instance;
                            }
                            break;
                        case PoolType.SolidParticle:
                            console.assert(false);
                            break;
                    }
                    resolve();
                });
            });
        }
        LoadResourcesFromMesh(mesh) {
            return new Promise((resolve) => {
                mesh.isVisible = false;
                for (let i = 0; i < this.instances.length; i++) {
                    const instance = mesh.createInstance('');
                    instance.isVisible = false;
                    this.instances[i] = instance;
                }
                resolve();
            });
        }
        getMesh() {
            console.assert(this.instances.length > 0);
            const instance = this.instances.pop();
            instance.isVisible = true;
            return instance;
        }
        returnMesh(instance) {
            instance.isVisible = false;
            this.instances.push(instance);
        }
    }
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
                if (InputManager.getInstance().isKeyPressed('arrowright') && !this.rotating && !game.isPaused()) {
                    var animationBox = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    animationBox.setKeys([{ frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha + (Math.PI / 2) }]);
                    camera.animations = [animationBox];
                    scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1); });
                    this.rotating = true;
                    game.pause();
                    GameCamera.rotateSound.play();
                }
                // rotate camera left 90 degrees
                else if (InputManager.getInstance().isKeyPressed('arrowleft') && !this.rotating && !game.isPaused()) {
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
        setBeta(beta) { this.camera.beta = beta; }
        setRadius(radius) { this.camera.radius = radius; }
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
    Sides.All = [Sides.Left, Sides.Right, Sides.Forward, Sides.Back, Sides.Top, Sides.Bottom];
    // Game class, responsible for managing contained phys-objects
    let GameMode;
    (function (GameMode) {
        GameMode[GameMode["Playing"] = 0] = "Playing";
        GameMode[GameMode["Spectating"] = 1] = "Spectating";
    })(GameMode || (GameMode = {}));
    class Game {
        constructor() {
            this.cameraSpeed = 0;
            this.mode = GameMode.Playing;
            this.canPause = true;
            this.callbackFunctions = [];
            this.running = true;
            this.currentLevel = null;
            this.physBoxesSortedY = [];
            this.physBoxToYIndex = new Map();
            this.updateCutoffYIndex = 0;
            this.towerFlyByComplte = false;
            this.observedEntitiesThisUpdate = new Set();
            this.observedEntitiesLastUpdate = new Set();
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
                    Game.SOUND_DRUMROLL_REPEAT = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/drumroll.mp3", scene, resolve, {
                        loop: false, autoplay: false, volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    Game.SOUND_DRUMROLL_STOP = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/drumrollStop.mp3", scene, resolve, {
                        loop: false, autoplay: false, volume: 0.5
                    });
                }),
                new Promise((resolve) => {
                    const lava = BABYLON.Mesh.CreateGround("ground", 150, 150, 25, scene);
                    lava.visibility = 0.5;
                    lava.position.y = -20;
                    const lavaMaterial = new BABYLON.LavaMaterial("lava", scene);
                    lavaMaterial.noiseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/cloud.png", scene); // Set the bump texture
                    lavaMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/lavatile.jpg", scene); // Set the diffuse texture
                    lavaMaterial.speed = 0.5;
                    lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
                    lavaMaterial.unlit = true;
                    lavaMaterial.freeze();
                    lava.material = lavaMaterial;
                    lava.isVisible = false;
                    Game.MESH_LAVA = lava;
                    resolve();
                })
            ]);
        }
        getHighestPhysBox() { return this.physBoxesSortedY[this.physBoxesSortedY.length - 1]; }
        changeMode(mode) {
            switch (mode) {
                case GameMode.Playing:
                    // show only the gameplay container
                    gameOverContainer.isVisible = false;
                    gameplayContainer.isVisible = true;
                    this.mode = GameMode.Playing; // set mode1
                    break;
                    2;
                case GameMode.Spectating:
                    console.assert(this.mode == GameMode.Playing && this.canPause);
                    // fade out background music, the game is over
                    UtilityFunctions.fadeOutSound(Game.BACKGROUND_MUSIC, 1);
                    // we don't want pausing during the delay between playing and spectating
                    this.canPause = false;
                    // delay transition to spectator mode by 3 seconds, creating an effective death-cam hang
                    setTimeout(() => {
                        // show only the game over container
                        gameplayContainer.isVisible = false;
                        gameOverContainer.isVisible = true;
                        // reset camera position to the start of the level, and orientate to side
                        camera.setY(0);
                        camera.setBeta(Math.PI / 2);
                        camera.setRadius(50);
                        // reset lava position to the beginning
                        this.lava.position.y = -15;
                        // start the drumroll as the spectator camera moves up
                        Game.SOUND_DRUMROLL_REPEAT.play();
                        this.mode = GameMode.Spectating; // set mode
                    }, 3000);
                    break;
            }
        }
        update() {
            t++;
            // paused games don't update
            if (!this.running)
                return;
            // perform state-specific update
            switch (this.mode) {
                case GameMode.Playing:
                    this.updatePlaying();
                    break;
                case GameMode.Spectating:
                    this.updateSpectating();
                    break;
            }
            // update visible phys-boxes based on camera location
            this.updateVisiblePhysBoxes();
        }
        updatePlaying() {
            // update lava position, moving at either a standard or fast pace depending on distance from player
            if ((this.player.getPos().y - this.lava.position.y) < Game.PLAYER_DISTANCE_FOR_FAST_LAVA) {
                this.lava.position.y += Game.LAVA_SPEED_STANDARD;
            }
            else {
                this.lava.position.y += Game.LAVA_SPEED_FAST;
            }
            // sort the physbox list for efficient sort&sweep collisions as well as visibility checking
            this.ySortBoxes();
            // resolve physbox collisions
            for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                const pbox = this.physBoxesSortedY[i];
                if (pbox.isActive())
                    pbox.beforeCollisions();
            }
            for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                const pbox = this.physBoxesSortedY[i];
                if (pbox.isActive())
                    pbox.resolveCollisions(0);
            }
            for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                const pbox = this.physBoxesSortedY[i];
                if (pbox.isActive())
                    pbox.afterCollisions();
            }
            // update level logic
            this.currentLevel.update();
        }
        updateSpectating() {
            if (!this.towerFlyByComplte) {
                const slowDownY = this.player.getPos().y - 32.256000000000014;
                if (camera.getY() < 32.256000000000014) {
                    this.cameraSpeed += 0.016;
                }
                else if (camera.getY() > slowDownY) {
                    this.cameraSpeed -= 0.016;
                }
                camera.setY(camera.getY() + this.cameraSpeed);
                if (this.cameraSpeed <= 0 || (camera.getY() >= this.player.getPos().y)) {
                    this.finishTowerFlyBy();
                }
            }
        }
        updateVisiblePhysBoxes() {
            const startYValue = camera.getY() - 50;
            const endYValue = camera.getY() + 50;
            const cameraYIndex = this.getClosestYIndex(camera.getY());
            let searchYDown = cameraYIndex;
            while (searchYDown >= 0 && (this.physBoxesSortedY[searchYDown].getPos().y >= startYValue)) {
                const physbox = this.physBoxesSortedY[searchYDown];
                if (!this.observedEntitiesLastUpdate.has(physbox))
                    physbox.startObservation();
                searchYDown--;
                this.observedEntitiesThisUpdate.add(physbox);
            }
            let searchYUp = cameraYIndex;
            while (searchYUp < this.physBoxesSortedY.length && (this.physBoxesSortedY[searchYUp].getPos().y <= endYValue)) {
                const physbox = this.physBoxesSortedY[searchYUp];
                if (!this.observedEntitiesLastUpdate.has(physbox))
                    physbox.startObservation();
                searchYUp++;
                this.observedEntitiesThisUpdate.add(physbox);
            }
            this.observedEntitiesLastUpdate.forEach((physBox) => {
                if (!this.observedEntitiesThisUpdate.has(physBox))
                    physBox.endObservation();
            });
            const tmp = this.observedEntitiesLastUpdate;
            this.observedEntitiesLastUpdate = this.observedEntitiesThisUpdate;
            this.observedEntitiesThisUpdate = tmp;
            this.observedEntitiesThisUpdate.clear();
        }
        finishTowerFlyBy() {
            this.towerFlyByComplte = true;
            Game.SOUND_DRUMROLL_REPEAT.stop();
            Game.SOUND_DRUMROLL_STOP.play();
        }
        dispose() {
            Game.SOUND_DRUMROLL_REPEAT.stop();
            Game.BACKGROUND_MUSIC.stop();
            scene.onBeforeRenderObservable.removeCallback(this.updateCallbackFunc);
            this.physBoxesSortedY.forEach((physBox) => physBox.dispose());
            this.lava.dispose();
            this.callbackFunctions.forEach((func) => func());
        }
        getLavaLevel() { return this.lava.position.y - 1; }
        pause() { this.running = false; }
        play() { this.running = true; }
        isPaused() { return !this.running; }
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
                        case 'space':
                            if (this.mode == GameMode.Spectating && !this.towerFlyByComplte) {
                                this.finishTowerFlyBy();
                            }
                    }
                }
            }));
            // create lava
            this.lava = Game.MESH_LAVA.createInstance('');
            // create frozen box at the bottom to catch them all
            let bottomBox = new FloorBox();
            bottomBox
                .freeze()
                .setPos(new BABYLON.Vector3(0, 0, 0));
            this.addPhysBox(bottomBox);
            // all is ready, create the player
            const player = new Player();
            player.setPos(new BABYLON.Vector3(0, 0, 0));
            player.setSide(Sides.Bottom, bottomBox.getSide(Sides.Top) + 0.5);
            this.addPhysBox(player);
            this.callbackFunctions.push(player.onEvent('death', () => {
                this.changeMode(GameMode.Spectating);
            }));
            this.player = player;
            this.ySortBoxes();
            // create initial cube cluster
            this.currentLevel = new StartLevel();
            // play background music
            Game.BACKGROUND_MUSIC.loop = true;
            Game.BACKGROUND_MUSIC.setVolume(0); // FINDME
            // Game.BACKGROUND_MUSIC.setVolume(0.5);
            Game.BACKGROUND_MUSIC.play();
            camera.resetRotationindex();
            camera.setBeta(0.65);
            camera.setRadius(25);
        }
        addPhysBox(box) { this.physBoxesSortedY.push(box); this.physBoxToYIndex.set(box, this.getClosestYIndex(box.getPos().y)); }
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
        getClosestYIndex(yValue) {
            let low = 0;
            let high = this.physBoxesSortedY.length - 1;
            let mid;
            while (low <= high) {
                mid = Math.floor((low + high) / 2);
                if (this.physBoxesSortedY[mid].getPos().y == yValue)
                    return mid;
                else if (this.physBoxesSortedY[mid].getPos().y < yValue)
                    low = mid + 1;
                else
                    high = mid - 1;
            }
            return Math.min(low, this.physBoxesSortedY.length - 1);
        }
        // SWEEP AND PRUNE
        getCollisions(physBox) {
            let yIndex = this.physBoxToYIndex.get(physBox);
            let collisions = [];
            let tests = 0;
            for (let i = yIndex; i >= 0; i--) {
                let candiate = this.physBoxesSortedY[i];
                tests++;
                if (candiate.isActive() && physBox.intersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + (PhysBox.MAXIMUM_HEIGHT / 2)))
                    break;
            }
            for (let i = yIndex; i < this.physBoxesSortedY.length; i++) {
                tests++;
                let candiate = this.physBoxesSortedY[i];
                if (candiate.isActive() && physBox.intersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Top) < (candiate.getPos().y - (PhysBox.MAXIMUM_HEIGHT / 2)))
                    break;
            }
            return collisions;
        }
    }
    // GAME CONSTANTS
    Game.PLAYER_DISTANCE_FOR_FAST_LAVA = 60;
    Game.LAVA_SPEED_STANDARD = 0.0275;
    Game.LAVA_SPEED_FAST = 0.1;
    Game.MAXIMUM_YDISTANCE_UNDER_LAVA = 100;
    class GameObj extends Observable {
    }
    class CollisionGroups {
        collides(otherGroup) { return CollisionGroups.collisionMap.get(this).has(otherGroup); }
    }
    CollisionGroups.Level = new CollisionGroups();
    CollisionGroups.Player = new CollisionGroups();
    CollisionGroups.Enemy = new CollisionGroups();
    CollisionGroups.FloatEnemy = new CollisionGroups();
    CollisionGroups.LevelOnly = new CollisionGroups();
    CollisionGroups.Unknown = new CollisionGroups();
    CollisionGroups.collisionMap = new Map([
        [CollisionGroups.Level, new Set([CollisionGroups.Level, CollisionGroups.Player, CollisionGroups.Enemy, CollisionGroups.LevelOnly])],
        [CollisionGroups.Player, new Set([CollisionGroups.Level, CollisionGroups.Enemy, CollisionGroups.FloatEnemy])],
        [CollisionGroups.Enemy, new Set([CollisionGroups.Level, CollisionGroups.Player])],
        [CollisionGroups.FloatEnemy, new Set([CollisionGroups.Player])],
        [CollisionGroups.LevelOnly, new Set([CollisionGroups.Level])],
        [CollisionGroups.Unknown, new Set()]
    ]);
    class PhysBox extends GameObj {
        constructor() {
            super(...arguments);
            // status flags
            this.disposed = false;
            this.frozen = false;
            this.active = true;
            this.collisionGroup = CollisionGroups.Unknown;
            this.moverLevel = 1;
            this.collisionsLastUpdate = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()]
            ]);
            this.collisionsThisUpdate = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()]
            ]);
            this.collisionBuffers = new Map([[Sides.Left, 0], [Sides.Right, 0], [Sides.Top, 0], [Sides.Bottom, 0], [Sides.Forward, 0], [Sides.Back, 0]]);
            // momentum
            this.velocity = BABYLON.Vector3.Zero();
            this.terminalVelocity = 5;
            this.gravity = 0;
            // position & size
            this.node = new BABYLON.TransformNode('', scene);
            this.instance = null;
            this.linkMeshWithSize = false;
        }
        // destructor
        dispose() { this.endObservation(); this.disposed = true; }
        isDisposed() { return this.disposed; }
        // physical properties
        getPos() { return this.node.position; }
        setPos(pos) { this.node.position.copyFrom(pos); return this; }
        setSize(size) { this.node.scaling.copyFrom(size); return this; }
        getSize() { return this.node.scaling; }
        getSide(side) { return this.node.position[side.dim] + (this.node.scaling[side.dim] * 0.5 * side.direction) + this.collisionBuffers.get(side); }
        setSide(side, value) { this.node.position[side.dim] = value - (this.node.scaling[side.dim] * 0.5 * side.direction); }
        setLinkMeshWithSize(link) { this.linkMeshWithSize = link; }
        // momentum
        setVelocity(velocity) { this.velocity = velocity.clone(); return this; }
        getVelocity() { return this.frozen ? PhysBox.FROZEN_VELOCITY : this.velocity; }
        setGravity(gravity) { this.gravity = gravity; }
        getGravity() { return this.gravity; }
        setTerminalVelocity(terminalVelocity) { this.terminalVelocity = terminalVelocity; }
        getTerminalVelocity() { return this.terminalVelocity; }
        // status flags
        isActive() { return this.active; }
        disable() {
            if (this.instance)
                this.instance.isVisible = false;
            this.active = false;
        }
        enable() {
            if (this.instance)
                this.instance.isVisible = true;
            this.active = true;
        }
        freeze() { this.frozen = true; this.fire('freeze', true); return this; }
        unfreeze() { this.frozen = false; this.fire('freeze', false); return this; }
        isFrozen() { return this.frozen; }
        // collisions
        getCollisionGroup() { return this.collisionGroup; }
        setCollisionGroup(collisionGroup) { this.collisionGroup = collisionGroup; }
        getMoverLevel() { return this.moverLevel; }
        setMoverLevel(moverLevel) { this.moverLevel = moverLevel; }
        getCollisionBuffer(side) { return this.collisionBuffers.get(side); }
        setCollisionBuffer(side, extent) { return this.collisionBuffers.set(side, extent); }
        clearCollisionBuffer() { Sides.All.forEach(side => this.collisionBuffers.set(side, 0)); }
        intersects(otherBox) {
            // physboxes can't collide with themselves
            if (otherBox == this)
                return false;
            // the collision groups of the two physboxes must collide
            if (!this.collisionGroup.collides(otherBox.collisionGroup))
                return false;
            // a collision occurs if there is no axis that seperates the two bounding boxes
            return (!((this.getSide(Sides.Left) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Right) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Right) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Left) + PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Back) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Forward) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Forward) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Back) + PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Bottom) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Top) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Top) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Bottom) + PhysBox.COLLISION_SAFETY_BUFFER)));
        }
        startObservation() {
            if (this.instance)
                return;
            this.instance = this.getMeshPool().getMesh();
            this.instance.scaling = this.linkMeshWithSize ? this.getSize() : BABYLON.Vector3.One();
            this.instance.position = this.getPos();
            this.instance.isVisible = this.isActive();
        }
        endObservation() {
            if (!this.instance)
                return;
            this.getMeshPool().returnMesh(this.instance);
            this.instance = null;
        }
        // collision callbacks
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
        // collision steps
        beforeCollisions() {
            // swap collision lists for last update and this update, and clear the later
            let tmp = this.collisionsThisUpdate;
            this.collisionsLastUpdate.forEach((collisions, side) => collisions.clear());
            this.collisionsThisUpdate = this.collisionsLastUpdate;
            this.collisionsLastUpdate = tmp;
        }
        afterCollisions() {
            // determine collisions started and held
            this.collisionsThisUpdate.forEach((collisions, side) => {
                collisions.forEach((collision) => {
                    if (!this.collisionsLastUpdate.get(side).has(collision))
                        this.onCollisionStart(side, collision);
                    else
                        this.onCollisionHold(side, collision);
                });
            });
            // determine collisions stopped
            this.collisionsLastUpdate.forEach((collisions, side) => {
                collisions.forEach((collision) => {
                    if (!this.collisionsThisUpdate.get(side).has(collision))
                        this.onCollisionStop(side, collision);
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
            // update velocity
            this.velocity.y = Math.max(this.getVelocity().y - this.gravity, -this.terminalVelocity);
            // extend our collision boundaries so they encompass all physboxes we may collide with after the velocity has been applied
            if (this.getVelocity().x >= 0)
                this.setCollisionBuffer(Sides.Right, this.getVelocity().x + PhysBox.COLLISION_SWEEP_SAFETY_BUFFER);
            else
                this.setCollisionBuffer(Sides.Left, this.getVelocity().x - PhysBox.COLLISION_SWEEP_SAFETY_BUFFER);
            if (this.getVelocity().y >= 0)
                this.setCollisionBuffer(Sides.Top, this.getVelocity().y + PhysBox.COLLISION_SWEEP_SAFETY_BUFFER);
            else
                this.setCollisionBuffer(Sides.Bottom, this.getVelocity().y - PhysBox.COLLISION_SWEEP_SAFETY_BUFFER);
            if (this.getVelocity().z >= 0)
                this.setCollisionBuffer(Sides.Forward, this.getVelocity().z + PhysBox.COLLISION_SWEEP_SAFETY_BUFFER);
            else
                this.setCollisionBuffer(Sides.Back, this.getVelocity().z - PhysBox.COLLISION_SWEEP_SAFETY_BUFFER);
            const possibleCollisions = game.getCollisions(this);
            this.clearCollisionBuffer();
            // if we are already colliding with a physbox before applying velocity, we are stuck within one. Don't apply velocities
            if (possibleCollisions.some(physbox => physbox.intersects(this)))
                return;
            // resolve in Y axis
            const yVelocity = this.getVelocity().y;
            this.getPos().y += yVelocity;
            if (yVelocity > 0)
                this.resolveCollisionsForSide(possibleCollisions, Sides.Top);
            else if (yVelocity < 0)
                this.resolveCollisionsForSide(possibleCollisions, Sides.Bottom);
            // resolve in X axis
            const xVelocity = this.getVelocity().x;
            this.getPos().x += xVelocity;
            if (xVelocity > 0)
                this.resolveCollisionsForSide(possibleCollisions, Sides.Right);
            else if (xVelocity < 0)
                this.resolveCollisionsForSide(possibleCollisions, Sides.Left);
            // resolve in Z axis
            const zVelocity = this.getVelocity().z;
            this.getPos().z += zVelocity;
            if (zVelocity > 0)
                this.resolveCollisionsForSide(possibleCollisions, Sides.Forward);
            else if (zVelocity < 0)
                this.resolveCollisionsForSide(possibleCollisions, Sides.Back);
        }
        resolveCollisionsForSide(possibleCollisions, myHitSide) {
            let otherHitSide = myHitSide.flip();
            let sortFunc = myHitSide.direction < 0 ? (b, a) => a.getSide(otherHitSide) - b.getSide(otherHitSide) : (a, b) => a.getSide(otherHitSide) - b.getSide(otherHitSide);
            possibleCollisions
                .sort(sortFunc)
                .filter(a => a.intersects(this))
                .forEach((collision, idx, arr) => {
                if (collision.getSide(otherHitSide) != arr[0].getSide(otherHitSide))
                    return;
                this.collisionsThisUpdate.get(myHitSide).add(collision);
                collision.notifyOfCollision(otherHitSide, this);
                this.setSide(myHitSide, collision.getSide(otherHitSide));
            });
        }
        getMeshInstance() { return this.instance; }
    }
    // CONSTANTS
    PhysBox.FROZEN_VELOCITY = BABYLON.Vector3.Zero();
    PhysBox.MAXIMUM_HEIGHT = 5;
    // collision vars
    PhysBox.COLLISION_SWEEP_SAFETY_BUFFER = 0.5;
    PhysBox.COLLISION_SAFETY_BUFFER = 0.0001;
    class Level {
        constructor() {
            this.initial = true;
            this.myboxes = [];
        }
        update() {
            const topBoxY = game.getHighestPhysBox().getPos().y;
            const spawnOffset = topBoxY + (this.initial ? Level.INITIAL_SPAWN_YOFFSET : 0);
            const playerDistanceFromTopOfTower = (topBoxY - game.getPlayer().getPos().y);
            if ((playerDistanceFromTopOfTower < Level.POPULATE_FALLBOXES_PLAYER_DISTANCE_THRESHOLD) || this.initial) {
                const fallBox = this.generateFallBox();
                game.addPhysBox(fallBox);
                this.myboxes.push(fallBox);
                fallBox.setPos(new BABYLON.Vector3(-Level.XZSpread + Math.random() * (Level.XZSpread * 2), spawnOffset + 2 + Math.random() * 3, -Level.XZSpread + Math.random() * (Level.XZSpread * 2)));
                do {
                    fallBox.setPos(new BABYLON.Vector3(-Level.XZSpread + Math.random() * (Level.XZSpread * 2), spawnOffset + 2 + Math.random() * 3, -Level.XZSpread + Math.random() * (Level.XZSpread * 2)));
                } while (game.getCollisions(fallBox).length != 0);
                this.afterFallBoxPositioning(fallBox);
                this.initial = false;
            }
        }
    }
    Level.POPULATE_FALLBOXES_PLAYER_DISTANCE_THRESHOLD = 60;
    Level.INITIAL_SPAWN_YOFFSET = 10;
    Level.XZSpread = 7;
    class StartLevel extends Level {
        constructor() {
            super();
            this.boulders = [];
            for (var i = 0; i < 3; i++) {
                const boulder = new Boulder();
                this.boulders.push(boulder);
                game.addPhysBox(boulder);
            }
            setInterval(() => {
                if (Math.random() > 0.5) {
                    const launchCount = Math.floor(Math.random() / 0.334) + 1;
                    let launched = 0;
                    for (let i = 0; (i < 3) && (launched < launchCount); i++) {
                        if (this.boulders[i].launch())
                            launched++;
                    }
                }
            }, 5000);
        }
        afterFallBoxPositioning(fallBox) {
            if (fallBox.getCollisionBuffer(Sides.Top) == 1) {
                fallBox.setCollisionBuffer(Sides.Top, 0);
                console.log("CREATED COIN BOX");
            }
            fallBox.clearCollisionBuffer();
        }
        generateFallBox() {
            const fallbox = new FallBoxBasic();
            const rnd = Math.random();
            if (rnd <= 0.33) {
                fallbox.setSize(BABYLON.Vector3.One().scale(2));
            }
            else if (rnd <= 0.66) {
                fallbox.setSize(BABYLON.Vector3.One().scale(3));
            }
            else {
                fallbox.setSize(BABYLON.Vector3.One().scale(5));
            }
            if (rnd <= 0.1) {
                fallbox.setCollisionBuffer(Sides.Top, 1);
            }
            fallbox.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
            return fallbox;
        }
    }
    let BoulderState;
    (function (BoulderState) {
        BoulderState[BoulderState["Waiting"] = 0] = "Waiting";
        BoulderState[BoulderState["GoingUp"] = 1] = "GoingUp";
        BoulderState[BoulderState["GoingDown"] = 2] = "GoingDown";
    })(BoulderState || (BoulderState = {}));
    class Boulder extends PhysBox {
        constructor() {
            super();
            this.myState = BoulderState.Waiting;
            this.setTerminalVelocity(0.3);
            this.setSize(new BABYLON.Vector3(3, 3, 3));
            this.setCollisionGroup(CollisionGroups.FloatEnemy);
            //Smoke
            var smokeSystem = new BABYLON.ParticleSystem("particles", 1000, scene);
            smokeSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
            //smokeSystem.emitter = obj; // the starting object, the emitter
            smokeSystem.minEmitBox = new BABYLON.Vector3(-0.75, 0, -0.75); // Starting all from
            smokeSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1); // To...
            smokeSystem.color1 = new BABYLON.Color4(0.02, 0.02, 0.02, .02);
            smokeSystem.color2 = new BABYLON.Color4(0.02, 0.02, 0.02, .02);
            smokeSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
            smokeSystem.minSize = 1;
            smokeSystem.maxSize = 3;
            smokeSystem.minLifeTime = 0.3;
            smokeSystem.maxLifeTime = 1.5;
            smokeSystem.emitRate = 700;
            smokeSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            smokeSystem.gravity = new BABYLON.Vector3(0, 0, 0);
            smokeSystem.direction1 = new BABYLON.Vector3(-1.5, -1 + Math.random(), -1.5);
            smokeSystem.direction2 = new BABYLON.Vector3(1.5, -1 + Math.random(), 1.5);
            smokeSystem.minAngularSpeed = 0;
            smokeSystem.maxAngularSpeed = Math.PI;
            smokeSystem.minEmitPower = 0.5;
            smokeSystem.maxEmitPower = 1.5;
            smokeSystem.updateSpeed = 0.005;
            var fireSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
            fireSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
            //fireSystem.emitter = obj; // the starting object, the emitter
            fireSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1); // Starting all from
            fireSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1); // To...
            fireSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
            fireSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1.0);
            fireSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
            fireSystem.minSize = 0.3;
            fireSystem.maxSize = 1;
            fireSystem.minLifeTime = 0.2;
            fireSystem.maxLifeTime = 0.4;
            fireSystem.emitRate = 1200;
            fireSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            fireSystem.gravity = new BABYLON.Vector3(0, 0, 0);
            fireSystem.direction1 = new BABYLON.Vector3(0, -1 + Math.random(), 0);
            fireSystem.direction2 = new BABYLON.Vector3(0, -1 + Math.random(), 0);
            fireSystem.minAngularSpeed = 0;
            fireSystem.maxAngularSpeed = Math.PI;
            fireSystem.minEmitPower = 1;
            fireSystem.maxEmitPower = 3;
            fireSystem.updateSpeed = 0.007;
            this.smokeSystem = smokeSystem;
            this.fireSystem = fireSystem;
            //this.obj.isVisible = false;
            this.disable();
        }
        getMeshPool() { return Boulder.MESH_POOL; }
        static LoadResouces() {
            return __awaiter(this, void 0, void 0, function* () {
                const obj = BABYLON.MeshBuilder.CreateSphere('', { diameter: 3 }, scene);
                const material = new BABYLON.StandardMaterial('', scene);
                material.diffuseTexture = new BABYLON.Texture('https://cdnb.artstation.com/p/assets/images/images/010/604/427/large/nick-rossi-gam322-nrossi-m11-lava.jpg', scene);
                material.disableLighting = true;
                material.emissiveColor = new BABYLON.Color3(1, 1, 1);
                obj.material = material;
                yield Boulder.MESH_POOL.LoadResourcesFromMesh(obj);
            });
        }
        startObservation() {
            super.startObservation();
            this.smokeSystem.emitter = this.getMeshInstance();
            this.fireSystem.emitter = this.getMeshInstance();
        }
        endObservation() {
            super.endObservation();
            this.smokeSystem.emitter = null;
            this.fireSystem.emitter = null;
        }
        dispose() {
            super.dispose();
            this.smokeSystem.dispose();
            this.fireSystem.dispose();
        }
        launch() {
            if (this.myState != BoulderState.Waiting)
                return false;
            this.enable();
            this.setGravity(0);
            this.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, game.getLavaLevel() - 30, -5 + Math.random() * 10));
            this.setVelocity(new BABYLON.Vector3(0, 0.3, 0));
            this.smokeSystem.start();
            this.fireSystem.start();
            this.myState = BoulderState.GoingUp;
            //this.obj.isVisible = true;
            return true;
        }
        afterCollisions() {
            super.afterCollisions();
            switch (this.myState) {
                case BoulderState.Waiting:
                    this.getPos().y = game.getLavaLevel() - 30;
                    break;
                case BoulderState.GoingUp:
                    if ((this.getPos().y > game.getPlayer().getPos().y + 10)) {
                        this.setGravity(0.01);
                        this.myState = BoulderState.GoingDown;
                    }
                    break;
                case BoulderState.GoingDown:
                    if (this.getPos().y < (game.getLavaLevel() - 30)) {
                        this.myState = BoulderState.Waiting;
                        this.smokeSystem.stop();
                        this.fireSystem.stop();
                        //this.obj.isVisible = false;
                        this.disable();
                    }
                    break;
            }
        }
    }
    Boulder.MESH_POOL = new MeshPool(10, PoolType.Instances);
    class FloorBox extends PhysBox {
        constructor() {
            super();
            this.setCollisionGroup(CollisionGroups.Level);
            this.setMoverLevel(2);
            this.setSize(new BABYLON.Vector3(14, 2, 14));
            const mesh = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
            const material = new BABYLON.StandardMaterial('', scene);
            material.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/floorBox.png", scene);
            material.freeze();
            mesh.material = material;
            mesh.position = this.getPos();
            mesh.scaling = this.getSize();
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                const mesh = BABYLON.MeshBuilder.CreateBox('', { width: 14, height: 2, depth: 14 }, scene);
                const material = new BABYLON.StandardMaterial('', scene);
                material.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/floorBox.png", scene);
                material.freeze();
                mesh.material = material;
                yield this.MESH_POOL.LoadResourcesFromMesh(mesh);
            });
        }
        getMeshPool() { return FloorBox.MESH_POOL; }
    }
    FloorBox.MESH_POOL = new MeshPool(1, PoolType.Instances);
    class Coin extends PhysBox {
        constructor() {
            super();
            this.setSize(new BABYLON.Vector3(1, 1, 1));
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                yield Coin.MESH_POOL.LoadResourcesFromPath('coin.obj');
            });
        }
        getMeshPool() { return Coin.MESH_POOL; }
    }
    Coin.MESH_POOL = new MeshPool(30, PoolType.Instances);
    class FallBox extends PhysBox {
        constructor() {
            super();
            this.setMoverLevel(2);
            this.setCollisionGroup(CollisionGroups.Level);
            this.setLinkMeshWithSize(true);
            this.color = new BABYLON.Color4(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1);
        }
        onCollisionStart(side, physBox) {
            super.onCollisionStart(side, physBox);
            if (side == Sides.Bottom && (physBox instanceof FallBox || physBox instanceof FloorBox) && physBox.isFrozen()) {
                this.freeze();
            }
        }
        getColor() { return this.color; }
    }
    class FallBoxBasic extends FallBox {
        constructor() {
            super();
            this.setMoverLevel(2);
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                yield FallBoxBasic.MESH_POOL.LoadResourcesFromPath('basicbox.obj');
            });
        }
        getMeshPool() {
            return FallBoxBasic.MESH_POOL;
        }
    }
    FallBoxBasic.MESH_POOL = new MeshPool(300, PoolType.Instances);
    class Player extends PhysBox {
        constructor() {
            super();
            this.bestHeight = 0;
            this.health = 5;
            this.setCollisionGroup(CollisionGroups.Player);
            const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
            particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
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
            particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
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
            this.setGravity(Player.GRAVITY);
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                yield Promise.all([
                    new Promise((resolve) => {
                        Player.SOUND_DAMAGE = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/damage.wav", scene, resolve, {
                            loop: false, autoplay: false, volume: 0.5
                        });
                    }),
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
                    })
                    // ,new Promise((resolve) => {
                    //     BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/", "player.obj", scene, (meshes, particleSystems, skeletons) => {
                    //         const testMaterial = new BABYLON.StandardMaterial('', scene);
                    //         testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/player.png', scene);
                    //         testMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
                    //         //testMaterial.freeze();
                    //         meshes[0].material = testMaterial;
                    //         meshes[0].isVisible = false;
                    //         Player.MESH = <BABYLON.Mesh>(meshes[0]);
                    //         resolve();
                    //     });
                    // })
                ]);
                yield Player.MESH_POOL.LoadResourcesFromPath('player.obj');
            });
        }
        getMeshPool() { return Player.MESH_POOL; }
        dispose() {
            super.dispose();
            this.explosionParticleSystem.dispose();
        }
        startObservation() {
            super.startObservation();
            this.explosionParticleSystem.emitter = this.getMeshInstance();
        }
        endObservation() {
            super.endObservation();
            this.explosionParticleSystem.emitter = null;
        }
        disable() {
            super.disable();
        }
        kill() {
            this.disable();
            this.explosionParticleSystem.start();
            Player.SOUND_DEATH.play();
            this.fire('death', true);
            setTimeout(() => this.explosionParticleSystem.stop(), 150);
        }
        damadge(damadger = null) {
            // we may be damadged by multiple entities in the same frame, before invulnerability
            // has been applied. prevent multiple damadges in the same frame
            if (this.getCollisionGroup() == CollisionGroups.LevelOnly)
                return false;
            this.health--;
            if (this.health == 0) {
                this.kill();
            }
            else {
                this.getMeshInstance().visibility = 0.5;
                this.setCollisionGroup(CollisionGroups.LevelOnly);
                setTimeout(() => {
                    this.getMeshInstance().visibility = 1;
                    this.setCollisionGroup(CollisionGroups.Player);
                }, 2000);
                if (damadger) {
                    this.setVelocity(this.getPos().subtract(damadger.getPos()).normalize().scale(Player.DAMAGE_MOVE_IMPULSE));
                }
                Player.SOUND_DAMAGE.play();
            }
            return true;
        }
        onCollisionStart(side, physBox) {
            if (!Player.SOUND_HIT_HEAD.isPlaying && side == Sides.Top && physBox instanceof FallBox) {
                Player.SOUND_HIT_HEAD.play();
            }
            if (physBox instanceof Boulder) {
                this.damadge(physBox);
            }
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
            const mesh = this.getMeshInstance();
            if (mesh) {
                if (this.getVelocity().z > 0) {
                    mesh.rotation.x = Math.min(mesh.rotation.x + 0.05, 0.15);
                }
                else if (this.getVelocity().z < 0) {
                    mesh.rotation.x = Math.max(mesh.rotation.x - 0.05, -0.15);
                }
                else {
                    mesh.rotation.x = (Math.abs(mesh.rotation.x) <= 0.05) ? 0 : mesh.rotation.x + 0.05 * Math.sign(mesh.rotation.x) * -1;
                }
                if (this.getVelocity().x < 0) {
                    mesh.rotation.z = Math.min(mesh.rotation.z + 0.05, 0.15);
                }
                else if (this.getVelocity().x > 0) {
                    mesh.rotation.z = Math.max(mesh.rotation.z - 0.05, -0.15);
                }
                else {
                    mesh.rotation.z = (Math.abs(mesh.rotation.z) <= 0.05) ? 0 : mesh.rotation.z + 0.05 * Math.sign(mesh.rotation.z) * -1;
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
                avgYSpeed /= count; // find average speed of the boxes the player is pressing against
                avgYSpeed -= Player.SIDE_SLIDE_SPEED; // and add the slide speed to find the players velocity when sliding
                // only let the player slide if their velocity is already less than this speed (don't allow them to stick automatically, they have to fall a bit first)
                if (this.getVelocity().y <= avgYSpeed) {
                    this.getVelocity().y = avgYSpeed;
                    this.setGravity(0);
                }
            }
            else {
                // not sliding, apply GRAVITY as normal
                this.setGravity(Player.GRAVITY);
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
            // in-air, apply movement velocity through acceleration
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
    Player.SIDE_SLIDE_SPEED = 0.05;
    // Damage
    Player.DAMAGE_MOVE_IMPULSE = 0.4;
    // Gravity & Max speed
    Player.GRAVITY = 0.008;
    Player.MAX_Y_SPEED = 0.5;
    Player.MESH_POOL = new MeshPool(2, PoolType.Cloning);
    Promise.all([
        Game.LoadResources(),
        Player.LoadResources(),
        GameCamera.LoadResources(),
        FallBoxBasic.LoadResources(),
        FloorBox.LoadResources(),
        Boulder.LoadResouces()
    ]).then(() => {
        loadingContainer.isVisible = false;
        menuContainer.isVisible = true;
    });
});
