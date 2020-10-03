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
    scene.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    var light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 0), scene);
    light2.intensity = 2.0;
    light2.autoUpdateExtends = false;
    var shadowGenerator = new BABYLON.ShadowGenerator(2048, light2);
    shadowGenerator.usePoissonSampling = false;
    shadowGenerator.setDarkness(0);
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
    class ResourceLoader extends Observable {
        constructor() {
            super(...arguments);
            this.loadedRatio = 0;
        }
        static getInstance() { return this.instance; }
        loadSound(name, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                let loadedSound;
                yield new Promise((resolve) => {
                    loadedSound = new BABYLON.Sound("", ResourceLoader.RESOURCE_PATH + '/sounds/' + name, scene, resolve, {
                        loop: false,
                        autoplay: false,
                        volume: 0.5
                    });
                });
                this.updateLoadedBytes(sizeInBytes);
                return loadedSound;
            });
        }
        loadMesh(name, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                let loadedMesh;
                yield new Promise((resolve) => {
                    BABYLON.SceneLoader.ImportMesh("", ResourceLoader.RESOURCE_PATH + '/meshes/', name, scene, (meshes, particleSystems, skeletons) => {
                        loadedMesh = meshes[0];
                        resolve();
                    });
                });
                this.updateLoadedBytes(sizeInBytes);
                return loadedMesh;
            });
        }
        loadTexture(name, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                let loadedTexture = new BABYLON.Texture(ResourceLoader.RESOURCE_PATH + '/textures/' + name, scene);
                yield new Promise((resolve) => {
                    loadedTexture.onLoadObservable.addOnce(() => {
                        resolve();
                    });
                });
                this.updateLoadedBytes(sizeInBytes);
                return loadedTexture;
            });
        }
        loadImageIntoContainer(selector, name, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                const logo = document.getElementById(selector);
                logo.src = name;
                yield new Promise((resolve) => {
                    logo.onload = (() => resolve());
                });
                this.updateLoadedBytes(sizeInBytes);
            });
        }
        updateLoadedBytes(bytes) {
            const ratioToAdd = bytes / ResourceLoader.TOTAL_RESOURCES_SIZE_IN_BYTES;
            this.loadedRatio += ratioToAdd;
            this.fire('loadingProgress', ratioToAdd);
            if (this.loadedRatio == 1) {
                this.finishLoading();
            }
        }
        finishLoading() {
            BABYLON.Texture.prototype.constructor = ((...args) => { console.assert(false, "Attempted to load resource at runtime"); });
            BABYLON.Sound.prototype.constructor = ((...args) => { console.assert(false, "Attempted to load resource at runtime"); });
            BABYLON.SceneLoader.ImportMesh = ((...args) => { console.assert(false, "Attempted to load resource at runtime"); });
            this.fire('loadingFinish');
        }
    }
    ResourceLoader.instance = new ResourceLoader();
    ResourceLoader.TOTAL_RESOURCES_SIZE_IN_BYTES = 5608983;
    ResourceLoader.RESOURCE_PATH = 'https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources';
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
    let PoolType;
    (function (PoolType) {
        PoolType[PoolType["Instances"] = 0] = "Instances";
        PoolType[PoolType["Cloning"] = 1] = "Cloning";
        PoolType[PoolType["SolidParticle"] = 2] = "SolidParticle"; // unimplemented
    })(PoolType || (PoolType = {}));
    class GameTimer {
        constructor() {
            this.running = false;
            this.paused = false;
            this.repeats = false;
            this.currentT = 0;
            this.triggerT = 0;
        }
        update(deltaT) {
            if (!this.running || this.paused)
                return;
            this.currentT += deltaT;
            while (this.currentT >= this.triggerT) {
                this.currentT -= this.triggerT;
                this.executeCallback();
                if (!this.repeats) {
                    this.running = false;
                    break;
                }
            }
        }
        pause() { console.assert(this.running && !this.paused); this.paused = true; }
        resume() { console.assert(this.running && this.paused); this.paused = false; }
        start(callback, triggerT, repeats) {
            console.assert(!this.running);
            this.executeCallback = callback;
            this.triggerT = triggerT;
            this.currentT = 0;
            this.repeats = repeats;
            this.running = true;
        }
        stop() {
            console.assert(this.running);
            this.running = false;
        }
        forceFinish() {
            console.assert(this.running);
            this.stop();
            this.executeCallback();
        }
        isRunning() { return this.running; }
        isPaused() { return this.paused; }
    }
    class MeshPool {
        constructor(instanceCount, poolType) {
            this.instances = [];
            this.instances = new Array(instanceCount);
            this.poolType = poolType;
        }
        LoadResourcesFromPath(meshName, onMeshLoad = (mesh) => { }, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                this.templateMesh = yield ResourceLoader.getInstance().loadMesh(meshName, sizeInBytes);
                this.templateMesh.isVisible = false;
                this.templateMesh.receiveShadows = true;
                switch (this.poolType) {
                    case PoolType.Instances:
                        for (let i = 0; i < this.instances.length; i++) {
                            const instance = this.templateMesh.createInstance('');
                            instance.isVisible = false;
                            this.instances[i] = instance;
                            onMeshLoad(this.instances[i]);
                        }
                        break;
                    case PoolType.Cloning:
                        for (let i = 0; i < this.instances.length; i++) {
                            const instance = this.templateMesh.clone();
                            instance.isVisible = false;
                            this.instances[i] = instance;
                            onMeshLoad(this.instances[i]);
                        }
                        break;
                    case PoolType.SolidParticle:
                        console.assert(false);
                        break;
                }
            });
        }
        LoadResourcesFromMesh(mesh) {
            return __awaiter(this, void 0, void 0, function* () {
                yield new Promise((resolve) => {
                    mesh.isVisible = false;
                    for (let i = 0; i < this.instances.length; i++) {
                        const instance = mesh.createInstance('');
                        instance.isVisible = false;
                        this.instances[i] = instance;
                    }
                    resolve();
                });
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
        getTemplateMesh() {
            return this.templateMesh;
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
            return __awaiter(this, void 0, void 0, function* () {
                GameCamera.rotateSound = yield ResourceLoader.getInstance().loadSound("rotateView.wav", 17250);
            });
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
                case Sides.Unknown: return Sides.Unknown;
            }
        }
    }
    Sides.Left = new Sides('x', -1);
    Sides.Right = new Sides('x', 1);
    Sides.Forward = new Sides('z', 1);
    Sides.Back = new Sides('z', -1);
    Sides.Top = new Sides('y', 1);
    Sides.Bottom = new Sides('y', -1);
    Sides.Unknown = new Sides('', 0);
    Sides.All = [Sides.Left, Sides.Right, Sides.Forward, Sides.Back, Sides.Top, Sides.Bottom];
    // Game class, responsible for managing contained phys-objects
    let GameMode;
    (function (GameMode) {
        GameMode[GameMode["Playing"] = 0] = "Playing";
        GameMode[GameMode["Spectating"] = 1] = "Spectating";
        GameMode[GameMode["Paused"] = 2] = "Paused";
    })(GameMode || (GameMode = {}));
    class Game {
        constructor() {
            this.mode = GameMode.Playing;
            // shared mode variables
            this.canPause = true;
            this.running = true;
            // playing mode variables
            this.currentLevel = null;
            // spectate mode variables
            this.spectateDelayTimer = new GameTimer();
            this.towerFlyByComplte = false;
            this.cameraSpeed = 0;
            this.callbackFunctions = [];
            // sorted entities
            this.physBoxesSortedY = [];
            this.physBoxToYIndex = new Map();
            // observed entities
            this.observedEntitiesThisUpdate = new Set();
            this.observedEntitiesLastUpdate = new Set();
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                // load sounds
                //Game.BACKGROUND_MUSIC = await ResourceLoader.getInstance().loadSound("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/music/dreamsofabove.mp3");
                //Game.BACKGROUND_MUSIC.loop = true;
                Game.SOUND_PAUSE_IN = yield ResourceLoader.getInstance().loadSound("pauseIn.wav", 23028);
                Game.SOUND_PAUSE_OUT = yield ResourceLoader.getInstance().loadSound("pauseOut.wav", 22988);
                Game.SOUND_DRUMROLL_REPEAT = yield ResourceLoader.getInstance().loadSound("drumroll.mp3", 972077);
                Game.SOUND_DRUMROLL_STOP = yield ResourceLoader.getInstance().loadSound("drumrollStop.mp3", 25311);
                // load lava mesh
                const lava = BABYLON.Mesh.CreateGround("ground", 150, 150, 25, scene);
                lava.visibility = 0.5;
                lava.position.y = -20;
                const lavaMaterial = new BABYLON.LavaMaterial("lava", scene);
                lavaMaterial.noiseTexture = yield ResourceLoader.getInstance().loadTexture("cloud.png", 72018); // Set the bump texture
                lavaMaterial.diffuseTexture = yield ResourceLoader.getInstance().loadTexture("lavatile.jpg", 457155); // Set the diffuse texture
                lavaMaterial.speed = 0.5;
                lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
                lavaMaterial.unlit = true;
                lavaMaterial.freeze();
                lava.material = lavaMaterial;
                lava.isVisible = false;
                lavaMaterial.blendMode = BABYLON.Engine.ALPHA_MULTIPLY;
                Game.MESH_LAVA = lava;
            });
        }
        dispose() {
            Game.SOUND_DRUMROLL_REPEAT.stop();
            //Game.BACKGROUND_MUSIC.stop();
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
            this.updateCallbackFunc = (() => this.update(1 / 60));
            scene.onBeforeRenderObservable.add(this.updateCallbackFunc);
            // setup pause callback
            this.callbackFunctions.push(InputManager.getInstance().onEvent('keyDown', (key) => {
                if (this.canPause) {
                    switch (key) {
                        case 'p':
                            if (this.running) {
                                //Game.BACKGROUND_MUSIC.pause();
                                //pauseContainer.isVisible = true;
                                this.running = false;
                                Game.SOUND_PAUSE_IN.play();
                            }
                            else {
                                //Game.BACKGROUND_MUSIC.play();
                                //pauseContainer.isVisible = false;
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
                //UtilityFunctions.fadeOutSound(Game.BACKGROUND_MUSIC, 1);
                this.canPause = false;
                this.spectateDelayTimer.start(() => this.changeMode(GameMode.Spectating), Game.DEATH_SPECTATE_DELAY, false);
            }));
            this.player = player;
            this.ySortBoxes();
            // create initial cube cluster
            this.currentLevel = new StartLevel();
            // play background music
            //Game.BACKGROUND_MUSIC.loop = true;
            //Game.BACKGROUND_MUSIC.setVolume(0); // FINDME
            // Game.BACKGROUND_MUSIC.setVolume(0.5);
            //Game.BACKGROUND_MUSIC.play();
            camera.resetRotationindex();
            camera.setBeta(0.65);
            camera.setRadius(25);
        }
        addPhysBox(box) { this.physBoxesSortedY.push(box); this.physBoxToYIndex.set(box, this.getClosestYIndex(box.getPos().y)); }
        getPhysObjects() { return this.physBoxesSortedY; }
        getPlayer() { return this.player; }
        changeMode(mode) {
            switch (mode) {
                case GameMode.Playing:
                    // show only the gameplay container
                    //gameOverContainer.isVisible = false;
                    //gameplayContainer.isVisible = true;
                    break;
                case GameMode.Spectating:
                    console.assert(this.mode == GameMode.Playing);
                    // show only the game over container
                    //gameplayContainer.isVisible = false;
                    //gameOverContainer.isVisible = true;
                    // reset camera position to the start of the level, and orientate to side
                    camera.setY(0);
                    camera.setBeta(Math.PI / 2);
                    camera.setRadius(50);
                    // reset lava position to the beginning
                    this.lava.position.y = -15;
                    // start the drumroll as the spectator camera moves up
                    Game.SOUND_DRUMROLL_REPEAT.play();
                    break;
                case GameMode.Paused:
                    break;
            }
            this.mode = mode;
        }
        update(deltaT) {
            t++;
            if (!this.running)
                return;
            switch (this.mode) {
                case GameMode.Playing:
                    this.updatePlaying(deltaT);
                    break;
                case GameMode.Spectating:
                    this.updateSpectating(deltaT);
                    break;
            }
            this.updateVisiblePhysBoxes();
        }
        updateVisiblePhysBoxes() {
            const visiblePhysBoxes = this.getPhysBoxesInRange(camera.getY() - 50, camera.getY() + 50);
            visiblePhysBoxes.forEach((physbox) => {
                if (physbox.isObservable())
                    this.observedEntitiesThisUpdate.add(physbox);
            });
            this.observedEntitiesLastUpdate.forEach((physBox) => {
                if (!this.observedEntitiesThisUpdate.has(physBox))
                    physBox.endObservation();
            });
            this.observedEntitiesThisUpdate.forEach((physBox) => {
                if (!this.observedEntitiesLastUpdate.has(physBox))
                    physBox.startObservation();
            });
            const tmp = this.observedEntitiesLastUpdate;
            this.observedEntitiesLastUpdate = this.observedEntitiesThisUpdate;
            this.observedEntitiesThisUpdate = tmp;
            this.observedEntitiesThisUpdate.clear();
        }
        updatePlaying(deltaT) {
            // update lava position, moving at either a standard or fast pace depending on distance from player
            if ((this.player.getPos().y - this.lava.position.y) < Game.PLAYER_DISTANCE_FOR_FAST_LAVA) {
                this.lava.position.y += Game.LAVA_SPEED_STANDARD;
            }
            else {
                this.lava.position.y += Game.LAVA_SPEED_FAST;
            }
            // resolve physbox collisions
            this.ySortBoxes();
            const physboxes = this.getPhysBoxesInRange(this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA, 99999);
            physboxes.forEach(pbox => pbox.beforeCollisions(deltaT));
            physboxes.forEach(pbox => pbox.resolveCollisions(0));
            physboxes.forEach(pbox => pbox.afterCollisions(deltaT));
            // update level logic
            this.currentLevel.update(deltaT);
            // update timers
            this.spectateDelayTimer.update(deltaT);
        }
        updateSpectating(deltaT) {
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
        finishTowerFlyBy() {
            this.towerFlyByComplte = true;
            Game.SOUND_DRUMROLL_REPEAT.stop();
            Game.SOUND_DRUMROLL_STOP.play();
        }
        getPhysBoxesInRange(startYValue, endYValue) {
            const physBoxes = [];
            let searchYUp = this.getClosestYIndex(startYValue);
            while (searchYUp < this.physBoxesSortedY.length && (this.physBoxesSortedY[searchYUp].getPos().y <= endYValue)) {
                const physbox = this.physBoxesSortedY[searchYUp];
                searchYUp++;
                if (!physbox.isDisposed())
                    physBoxes.push(physbox);
            }
            return physBoxes;
        }
        // SWEEP AND PRUNE
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
        ySortBoxes() {
            // O(N) average case for insertion sort after physbox updates thanks to temporal coherence
            const cutoffYIndex = this.getClosestYIndex(this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA);
            for (let i = cutoffYIndex; i < this.physBoxesSortedY.length; i++) {
                let j = i - 1;
                let tmp = this.physBoxesSortedY[i];
                while (j >= 0 && this.physBoxesSortedY[j].getPos().y > tmp.getPos().y) {
                    this.physBoxesSortedY[j + 1] = this.physBoxesSortedY[j];
                    j--;
                }
                this.physBoxesSortedY[j + 1] = tmp;
                this.physBoxToYIndex.set(tmp, j + 1);
            }
        }
        getCollisions(physBox) {
            let yIndex = this.physBoxToYIndex.get(physBox);
            let collisions = [];
            let tests = 0;
            for (let i = yIndex; i >= 0; i--) {
                let candiate = this.physBoxesSortedY[i];
                tests++;
                if (!candiate.isDisposed() && physBox.physicallyIntersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + (PhysBox.MAXIMUM_HEIGHT / 2)))
                    break;
            }
            for (let i = yIndex; i < this.physBoxesSortedY.length; i++) {
                tests++;
                let candiate = this.physBoxesSortedY[i];
                if (!candiate.isDisposed() && physBox.physicallyIntersects(candiate))
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
    Game.DEATH_SPECTATE_DELAY = 3;
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
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()], [Sides.Unknown, new Set()]
            ]);
            this.collisionsThisUpdate = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()], [Sides.Unknown, new Set()]
            ]);
            this.collisionBuffers = new Map([[Sides.Left, 0], [Sides.Right, 0], [Sides.Top, 0], [Sides.Bottom, 0], [Sides.Forward, 0], [Sides.Back, 0]]);
            // momentum
            this.velocity = BABYLON.Vector3.Zero();
            this.terminalVelocity = 5;
            this.gravity = 0;
            // position & size
            this.position = new BABYLON.Vector3(0, 0, 0);
            this.size = BABYLON.Vector3.One();
            this.scaling = 1;
            this.instance = null;
        }
        // destructor
        dispose() { this.endObservation(); this.disposed = true; }
        isDisposed() { return this.disposed; }
        // physical properties
        setNormalizedSize(size) { this.size.copyFrom(size); return this; }
        setScale(scale) { this.scaling = scale; }
        getPos() { return this.position; }
        setPos(pos) { this.position.copyFrom(pos); return this; }
        getSide(side) { return this.position[side.dim] + (this.size[side.dim] * this.scaling * 0.5 * side.direction) + this.collisionBuffers.get(side); }
        setSide(side, value) { this.position[side.dim] = value - (this.size[side.dim] * this.scaling * 0.5 * side.direction); }
        // momentum
        setVelocity(velocity) { this.velocity = velocity.clone(); return this; }
        getVelocity() { return this.frozen ? PhysBox.FROZEN_VELOCITY : this.velocity; }
        setGravity(gravity) { this.gravity = gravity; }
        getGravity() { return this.gravity; }
        setTerminalVelocity(terminalVelocity) { this.terminalVelocity = terminalVelocity; }
        getTerminalVelocity() { return this.terminalVelocity; }
        // status flags
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
        freeze() { this.frozen = true; this.fire('freeze'); return this; }
        unfreeze() { this.frozen = false; this.fire('unfreeze'); return this; }
        isFrozen() { return this.frozen; }
        // collisions
        getCollisionGroup() { return this.collisionGroup; }
        setCollisionGroup(collisionGroup) { this.collisionGroup = collisionGroup; }
        getMoverLevel() { return this.moverLevel; }
        setMoverLevel(moverLevel) { this.moverLevel = moverLevel; }
        getCollisionBuffer(side) { return this.collisionBuffers.get(side); }
        setCollisionBuffer(side, extent) { return this.collisionBuffers.set(side, extent); }
        clearCollisionBuffer() { Sides.All.forEach(side => this.collisionBuffers.set(side, 0)); }
        logicallyIntersects(otherBox) { return this.getCollisionGroup().collides(otherBox.getCollisionGroup()); }
        physicallyIntersects(otherBox) {
            // physboxes can't collide with themselves
            if (otherBox == this)
                return false;
            // a collision occurs if there is no axis that seperates the two bounding boxes
            return (!((this.getSide(Sides.Left) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Right) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Right) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Left) + PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Back) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Forward) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Forward) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Back) + PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Bottom) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Top) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
                !((this.getSide(Sides.Top) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Bottom) + PhysBox.COLLISION_SAFETY_BUFFER)));
        }
        isObservable() { return true; }
        startObservation() {
            if (this.instance)
                return;
            this.instance = this.getMeshPool().getMesh();
            this.instance.scaling = BABYLON.Vector3.One().scale(this.scaling);
            this.instance.position = this.getPos();
            this.afterStartObservation();
        }
        endObservation() {
            if (!this.instance)
                return;
            this.beforeEndObservation();
            this.getMeshPool().returnMesh(this.instance);
            this.instance = null;
        }
        afterStartObservation() { }
        beforeEndObservation() { }
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
        beforeCollisions(deltaT) {
            // swap collision lists for last update and this update, and clear the later
            let tmp = this.collisionsThisUpdate;
            this.collisionsLastUpdate.forEach((collisions, side) => collisions.clear());
            this.collisionsThisUpdate = this.collisionsLastUpdate;
            this.collisionsLastUpdate = tmp;
        }
        afterCollisions(deltaT) {
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
            if (possibleCollisions.some(physbox => physbox.physicallyIntersects(this)))
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
            // sort collisions on axis to get the first physbox hit while moving on axis
            const otherHitSide = myHitSide.flip();
            const sortFunc = myHitSide.direction < 0 ? (b, a) => a.getSide(otherHitSide) - b.getSide(otherHitSide) : (a, b) => a.getSide(otherHitSide) - b.getSide(otherHitSide);
            possibleCollisions.sort(sortFunc);
            // get the first (closest) physbox which is both physically and logically hit
            const firstPhysicalHitIdx = possibleCollisions.findIndex((pbox) => pbox.physicallyIntersects(this) && pbox.logicallyIntersects(this));
            const firstPhysicalHit = firstPhysicalHitIdx != -1 ? possibleCollisions[firstPhysicalHitIdx] : null;
            // process collisions....
            possibleCollisions.forEach((pbox, idx) => {
                if (!pbox.physicallyIntersects(this))
                    return;
                const logicallyIntersects = pbox.logicallyIntersects(this);
                // physbox both logically and physically hit, register and resolve collision
                if (firstPhysicalHit && logicallyIntersects && pbox.getSide(otherHitSide) == firstPhysicalHit.getSide(otherHitSide)) {
                    this.collisionsThisUpdate.get(myHitSide).add(pbox);
                    pbox.notifyOfCollision(otherHitSide, this);
                    this.setSide(myHitSide, pbox.getSide(otherHitSide));
                    // physbox only physically hit, register but don't resolve
                }
                else if (!logicallyIntersects && (firstPhysicalHitIdx == -1 || idx <= firstPhysicalHitIdx)) {
                    this.collisionsThisUpdate.get(Sides.Unknown).add(pbox);
                    pbox.notifyOfCollision(Sides.Unknown, this);
                }
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
    let LevelState;
    (function (LevelState) {
        LevelState[LevelState["GeneratingTower"] = 0] = "GeneratingTower";
        LevelState[LevelState["FinishedTower"] = 1] = "FinishedTower";
        LevelState[LevelState["Boss"] = 2] = "Boss";
    })(LevelState || (LevelState = {}));
    class Level extends Observable {
        constructor() {
            super(...arguments);
            this.levelState = LevelState.GeneratingTower;
            this.myboxes = [];
        }
        getHighestBox() { return this.myboxes.length != 0 ? this.myboxes[this.myboxes.length - 1] : null; }
        update(deltaT) {
            switch (this.levelState) {
                case LevelState.GeneratingTower:
                    this.updateStateGeneratingTower();
                    break;
                case LevelState.FinishedTower:
                    this.updateStateFinishedTower();
                    break;
                case LevelState.Boss:
                    this.updateStateBoss();
                    break;
            }
        }
        updateStateGeneratingTower() {
            const topBoxY = this.getHighestBox() ? this.getHighestBox().getPos().y : Level.INITIAL_SPAWN_YOFFSET;
            const playerDistanceFromTopOfTower = (topBoxY - game.getPlayer().getPos().y);
            if (playerDistanceFromTopOfTower < Level.POPULATE_FALLBOXES_PLAYER_DISTANCE_THRESHOLD) {
                const fallBox = this.generateFallBox();
                fallBox.onEvent('freeze', () => {
                    if ((this.levelState == LevelState.GeneratingTower) && (fallBox.getSide(Sides.Top) >= this.getApproxTowerHeight()))
                        this.setState(LevelState.FinishedTower);
                    console.log(fallBox.getSide(Sides.Top));
                });
                game.addPhysBox(fallBox);
                this.myboxes.push(fallBox);
                do {
                    fallBox.setPos(new BABYLON.Vector3(-Level.XZSpread + Math.random() * (Level.XZSpread * 2), topBoxY + Level.SAFETY_BOX_Y_INCREMENT + this.getBoxYIncrement(), -Level.XZSpread + Math.random() * (Level.XZSpread * 2)));
                } while (game.getCollisions(fallBox).length != 0);
                this.afterFallBoxPositioning(fallBox);
            }
        }
        updateStateFinishedTower() {
        }
        updateStateBoss() {
        }
        setState(newState) {
            switch (newState) {
                case LevelState.FinishedTower:
                    const boxingRingBottom = new BoxingRingBottom();
                    boxingRingBottom.setSide(Sides.Bottom, this.getHighestBox().getSide(Sides.Top) + 2);
                    game.addPhysBox(boxingRingBottom);
                    const boxingRingTop = new BoxingRingTop();
                    boxingRingTop.setSide(Sides.Bottom, boxingRingBottom.getSide(Sides.Top) + 2);
                    game.addPhysBox(boxingRingTop);
                    break;
                default:
                    break;
            }
            this.levelState = newState;
        }
    }
    Level.POPULATE_FALLBOXES_PLAYER_DISTANCE_THRESHOLD = 60;
    Level.INITIAL_SPAWN_YOFFSET = 10;
    Level.SAFETY_BOX_Y_INCREMENT = 2;
    Level.XZSpread = 7;
    class StartLevel extends Level {
        constructor() {
            super();
        }
        getBoxYIncrement() { return Math.random() * 3; }
        getApproxTowerHeight() { return 300; }
        afterFallBoxPositioning(fallBox) {
            if (fallBox.getCollisionBuffer(Sides.Top) == 1) {
                fallBox.setCollisionBuffer(Sides.Top, 0);
                const coin = new Coin();
                coin.setPos(fallBox.getPos());
                coin.setSide(Sides.Bottom, fallBox.getSide(Sides.Top));
                coin.setGravity(0.05);
                game.addPhysBox(coin);
            }
            fallBox.clearCollisionBuffer();
        }
        generateFallBox() {
            const fallbox = new FallBoxBasic();
            const rnd = Math.random();
            if (rnd <= 0.33) {
                fallbox.setScale(2);
            }
            else if (rnd <= 0.66) {
                fallbox.setScale(3);
            }
            else {
                fallbox.setScale(5);
            }
            if (rnd <= 0.3) {
                fallbox.setCollisionBuffer(Sides.Top, 1);
            }
            fallbox.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
            return fallbox;
        }
    }
    // enum BoulderState {
    //     Waiting,
    //     GoingUp,
    //     GoingDown
    // }
    // class Boulder extends PhysBox {
    //     public getMeshPool() : MeshPool { return Boulder.MESH_POOL; }
    //     public static async LoadResouces() {
    //         const obj = BABYLON.MeshBuilder.CreateSphere('', {diameter: 3}, scene);
    //         const material = new BABYLON.StandardMaterial('', scene);
    //         material.diffuseTexture = new BABYLON.Texture('https://cdnb.artstation.com/p/assets/images/images/010/604/427/large/nick-rossi-gam322-nrossi-m11-lava.jpg', scene);
    //         material.disableLighting = true;
    //         material.emissiveColor = new BABYLON.Color3(1,1,1);
    //         obj.material = material;
    //         await Boulder.MESH_POOL.LoadResourcesFromMesh(obj);
    //     }
    //     public startObservation() {
    //         super.startObservation(); 
    //         this.smokeSystem.emitter = this.getMeshInstance();
    //         this.fireSystem.emitter = this.getMeshInstance();
    //     }
    //     public endObservation() {
    //         super.endObservation(); 
    //         this.smokeSystem.emitter = null;
    //         this.fireSystem.emitter = null;
    //     }
    //     public constructor() {
    //         super();
    //         this.setTerminalVelocity(0.3); 
    //         this.setNormalizedSize(new BABYLON.Vector3(3,3,3));
    //         this.setCollisionGroup(CollisionGroups.FloatEnemy);
    //         //Smoke
    //         var smokeSystem = new BABYLON.ParticleSystem("particles", 1000, scene);
    //         smokeSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
    //         //smokeSystem.emitter = obj; // the starting object, the emitter
    //         smokeSystem.minEmitBox = new BABYLON.Vector3(-0.75, 0, -0.75); // Starting all from
    //         smokeSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1); // To...
    //         smokeSystem.color1 = new BABYLON.Color4(0.02, 0.02, 0.02, .02);
    //         smokeSystem.color2 = new BABYLON.Color4(0.02, 0.02, 0.02, .02);
    //         smokeSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
    //         smokeSystem.minSize = 1;
    //         smokeSystem.maxSize = 3;
    //         smokeSystem.minLifeTime = 0.3;
    //         smokeSystem.maxLifeTime = 1.5;
    //         smokeSystem.emitRate = 700;
    //         smokeSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    //         smokeSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    //         smokeSystem.direction1 = new BABYLON.Vector3(-1.5, -1 + Math.random(), -1.5);
    //         smokeSystem.direction2 = new BABYLON.Vector3(1.5, -1 + Math.random(), 1.5);
    //         smokeSystem.minAngularSpeed = 0;
    //         smokeSystem.maxAngularSpeed = Math.PI;
    //         smokeSystem.minEmitPower = 0.5;
    //         smokeSystem.maxEmitPower = 1.5;
    //         smokeSystem.updateSpeed = 0.005;
    //         var fireSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
    //         fireSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
    //         //fireSystem.emitter = obj; // the starting object, the emitter
    //         fireSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1); // Starting all from
    //         fireSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1); // To...
    //         fireSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
    //         fireSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1.0);
    //         fireSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
    //         fireSystem.minSize = 0.3;
    //         fireSystem.maxSize = 1;
    //         fireSystem.minLifeTime = 0.2;
    //         fireSystem.maxLifeTime = 0.4;
    //         fireSystem.emitRate = 1200;
    //         fireSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    //         fireSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    //         fireSystem.direction1 = new BABYLON.Vector3(0, -1 + Math.random(), 0);
    //         fireSystem.direction2 = new BABYLON.Vector3(0, -1 + Math.random(), 0);
    //         fireSystem.minAngularSpeed = 0;
    //         fireSystem.maxAngularSpeed = Math.PI;
    //         fireSystem.minEmitPower = 1;
    //         fireSystem.maxEmitPower = 3;
    //         fireSystem.updateSpeed = 0.007;
    //         this.smokeSystem = smokeSystem;
    //         this.fireSystem = fireSystem;
    //         //this.obj.isVisible = false;
    //         this.disable();
    //     }
    //     public dispose() {
    //         super.dispose();
    //         this.smokeSystem.dispose();
    //         this.fireSystem.dispose();
    //     }
    //     public launch() : boolean {
    //         if (this.myState != BoulderState.Waiting)
    //             return false;
    //         this.enable();
    //         this.setGravity(0);
    //         this.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, game.getLavaLevel() - 30, -5 + Math.random() * 10));
    //         this.setVelocity(new BABYLON.Vector3(0, 0.3, 0));
    //         this.smokeSystem.start();
    //         this.fireSystem.start();
    //         this.myState = BoulderState.GoingUp;
    //         //this.obj.isVisible = true;
    //         return true;
    //     }
    //     public afterCollisions(deltaT: number) {
    //         super.afterCollisions(deltaT);
    //         switch(this.myState) {
    //             case BoulderState.Waiting:
    //                 this.getPos().y = game.getLavaLevel() - 30;
    //                 break;
    //             case BoulderState.GoingUp:
    //                 if ((this.getPos().y > game.getPlayer().getPos().y + 10)) {
    //                     this.setGravity(0.01);
    //                     this.myState = BoulderState.GoingDown;
    //                 }
    //                 break;
    //             case BoulderState.GoingDown:
    //                 if (this.getPos().y < (game.getLavaLevel() - 30)) {
    //                     this.myState = BoulderState.Waiting;
    //                     this.smokeSystem.stop();
    //                     this.fireSystem.stop();
    //                     //this.obj.isVisible = false;
    //                     this.disable();
    //                 }
    //                 break;
    //         }
    //     }
    //     private smokeSystem: BABYLON.ParticleSystem;
    //     private fireSystem: BABYLON.ParticleSystem;
    //     private myState: BoulderState = BoulderState.Waiting;
    //     private static MESH_POOL: MeshPool = new MeshPool(10, PoolType.Instances);
    // }
    class FloorBox extends PhysBox {
        constructor() {
            super();
            this.setCollisionGroup(CollisionGroups.Level);
            this.setMoverLevel(2);
            this.setNormalizedSize(new BABYLON.Vector3(14, 2, 14));
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                const mesh = BABYLON.MeshBuilder.CreateBox('', { width: 14, height: 2, depth: 14 }, scene);
                const material = new BABYLON.StandardMaterial('', scene);
                material.diffuseTexture = yield ResourceLoader.getInstance().loadTexture("floorBox.png", 7415);
                material.freeze();
                mesh.material = material;
                yield this.MESH_POOL.LoadResourcesFromMesh(mesh);
            });
        }
        getMeshPool() { return FloorBox.MESH_POOL; }
    }
    FloorBox.MESH_POOL = new MeshPool(1, PoolType.Instances);
    class BoxingRingBottom extends PhysBox {
        constructor() {
            super();
            super.setCollisionGroup(CollisionGroups.Level);
            this.setNormalizedSize(new BABYLON.Vector3(18, 3.2, 18));
            this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
            this.setMoverLevel(2);
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                yield BoxingRingBottom.MESH_POOL.LoadResourcesFromPath('boxingringbottom.obj', (mesh) => {
                    mesh.visibility = 0.5;
                }, 254548);
            });
        }
        getMeshPool() { return BoxingRingBottom.MESH_POOL; }
    }
    BoxingRingBottom.MESH_POOL = new MeshPool(3, PoolType.Cloning);
    class BoxingRingTop extends PhysBox {
        constructor() {
            super();
            super.setCollisionGroup(CollisionGroups.Level);
            this.setNormalizedSize(new BABYLON.Vector3(18, 8.3, 18));
            this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
            this.setMoverLevel(2);
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                yield BoxingRingTop.MESH_POOL.LoadResourcesFromPath('boxingringtop.obj', (mesh) => {
                    //mesh.visibility = 0.5;  
                }, 3145633);
            });
        }
        getMeshPool() { return BoxingRingTop.MESH_POOL; }
    }
    BoxingRingTop.MESH_POOL = new MeshPool(3, PoolType.Cloning);
    class Coin extends PhysBox {
        constructor() {
            super();
            super.setCollisionGroup(CollisionGroups.LevelOnly);
            this.setNormalizedSize(new BABYLON.Vector3(1, 1, 1));
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                Coin.SOUND_COIN = yield ResourceLoader.getInstance().loadSound("coinCollect.wav", 31074);
                yield Coin.MESH_POOL.LoadResourcesFromPath('coin.obj', () => { }, 6216);
            });
        }
        static getYRotation() { return (t / 60) * (Math.PI * 2) * this.REVS_PER_SECOND; }
        getMeshPool() { return Coin.MESH_POOL; }
        beforeCollisions(deltaT) {
            super.beforeCollisions(deltaT);
            const mesh = this.getMeshInstance();
            if (mesh) {
                mesh.rotation.y = Coin.getYRotation();
            }
        }
        onCollisionStart(side, physBox) {
            super.onCollisionStart(side, physBox);
            if (physBox instanceof Player) {
                this.dispose();
                Coin.SOUND_COIN.play();
            }
        }
        afterCollisions(deltaT) {
            super.afterCollisions(deltaT);
            if (this.getCollisions(Sides.Bottom).size != 0 && this.getCollisions(Sides.Top).size != 0) {
                this.dispose();
            }
        }
    }
    Coin.MESH_POOL = new MeshPool(50, PoolType.Instances);
    Coin.REVS_PER_SECOND = 0.5;
    class FallBox extends PhysBox {
        constructor() {
            super();
            this.setMoverLevel(2);
            this.setCollisionGroup(CollisionGroups.Level);
            this.color = new BABYLON.Color4(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1);
        }
        break() {
            this.unfreezeBoxesAbove();
            this.dispose();
        }
        unfreezeBoxesAbove() {
            this.unfreeze();
            this.getCollisions(Sides.Top).forEach(physBox => {
                if (physBox instanceof FallBox)
                    physBox.unfreezeBoxesAbove();
            });
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
                yield FallBoxBasic.MESH_POOL.LoadResourcesFromPath('basicbox.obj', () => { }, 397646);
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
            this.gravityDelayTimer = new GameTimer();
            this.invulnerabilityTimer = new GameTimer();
            this.setCollisionGroup(CollisionGroups.Player);
            this.setTerminalVelocity(Player.MAX_Y_SPEED);
            const particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
            //particleSystem.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/flare.png", scene);
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
            this.setNormalizedSize(new BABYLON.Vector3(0.6658418, 0.8655933, 0.6658418));
            this.setPos(new BABYLON.Vector3(0, 3, 0));
            this.setGravity(Player.GRAVITY);
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                Player.SOUND_DAMAGE = yield ResourceLoader.getInstance().loadSound("damage.wav", 12514);
                Player.SOUND_JUMP = yield ResourceLoader.getInstance().loadSound("jump.wav", 9928);
                Player.SOUND_HIT_HEAD = yield ResourceLoader.getInstance().loadSound("hitHead.wav", 8418);
                Player.SOUND_DEATH = yield ResourceLoader.getInstance().loadSound("death.wav", 138110);
                yield Player.MESH_POOL.LoadResourcesFromPath('player.obj', () => { }, 7654);
            });
        }
        getMeshPool() { return Player.MESH_POOL; }
        dispose() {
            super.dispose();
            this.explosionParticleSystem.dispose();
        }
        afterStartObservation() {
            this.explosionParticleSystem.emitter = this.getMeshInstance();
            shadowGenerator.addShadowCaster(this.getMeshInstance());
        }
        beforeEndObservation() {
            shadowGenerator.removeShadowCaster(this.getMeshInstance());
            this.explosionParticleSystem.emitter = null;
        }
        disable() {
            super.disable();
        }
        kill() {
            this.dispose();
            this.explosionParticleSystem.start();
            Player.SOUND_DEATH.play();
            this.fire('death', true);
            setTimeout(() => this.explosionParticleSystem.stop(), 150);
        }
        damadge(damadger = null) {
            // we may be damadged by multiple entities in the same frame, before invulnerability
            // has been applied. prevent multiple damadges in the same frame
            if (this.invulnerabilityTimer.isRunning())
                return false;
            this.health--;
            if (this.health == 0) {
                this.kill();
            }
            else {
                this.getMeshInstance().visibility = 0.5;
                this.setCollisionGroup(CollisionGroups.LevelOnly);
                this.invulnerabilityTimer.start(() => {
                    this.getMeshInstance().visibility = 1;
                    this.setCollisionGroup(CollisionGroups.Player);
                }, Player.INVULNERABILITY_DELAY_TIME_IN_SECONDS, false);
                if (damadger) {
                    this.setVelocity(this.getPos().subtract(damadger.getPos()).normalize().scale(Player.DAMAGE_MOVE_IMPULSE));
                }
                Player.SOUND_DAMAGE.play();
            }
            return true;
        }
        onCollisionStart(side, physBox) {
            if (side == Sides.Top && physBox instanceof FallBox) {
                if (!Player.SOUND_HIT_HEAD.isPlaying)
                    Player.SOUND_HIT_HEAD.play();
                this.setGravity(0);
                this.gravityDelayTimer.start(() => {
                    this.setGravity(Player.GRAVITY);
                }, Player.GRAVITY_DELAY_TIME_IN_SECONDS, false);
            }
            // if (physBox instanceof Boulder) {
            //     this.damadge(physBox);
            // }
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
            const mesh = this.getMeshInstance();
            // update rotation animation
            const maxLeanAngle = 0.15;
            const leanAngleSpeed = 0.025;
            if (mesh) {
                ['z', 'x'].forEach(velDim => {
                    const rotDim = velDim == 'z' ? 'x' : 'z';
                    if (this.getVelocity()[velDim] == 0)
                        mesh.rotation[rotDim] = (Math.abs(mesh.rotation[rotDim]) <= leanAngleSpeed) ? 0 : mesh.rotation[rotDim] + leanAngleSpeed * Math.sign(mesh.rotation[rotDim]) * -1;
                    else if (velDim == 'z')
                        mesh.rotation[rotDim] = (this.getVelocity()[velDim] > 0 ? Math.min(mesh.rotation[rotDim] + leanAngleSpeed, maxLeanAngle) : Math.max(mesh.rotation[rotDim] - leanAngleSpeed, -maxLeanAngle));
                    else if (velDim == 'x')
                        mesh.rotation[rotDim] = (this.getVelocity()[velDim] < 0 ? Math.min(mesh.rotation[rotDim] + leanAngleSpeed, maxLeanAngle) : Math.max(mesh.rotation[rotDim] - leanAngleSpeed, -maxLeanAngle));
                });
            }
            // test if the player is sliding along a physbox's wall
            let avgYSpeed = 0;
            let count = 0;
            if (this.getVelocity().y < 0 && this.getCollisions(Sides.Bottom).size == 0) {
                [Sides.Left, Sides.Right, Sides.Forward, Sides.Back].forEach(side => {
                    if (this.getCollisions(side).size) {
                        count += this.getCollisions(side).size;
                        this.getCollisions(side).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                        if (InputManager.getInstance().isKeyPressed(' ')) {
                            this.getVelocity()[side.dim] = Player.SIDE_XZ_IMPULSE * side.direction * -1;
                            this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                            if (!Player.SOUND_HIT_HEAD.isPlaying)
                                Player.SOUND_JUMP.play();
                            if (this.gravityDelayTimer.isRunning())
                                this.gravityDelayTimer.forceFinish();
                        }
                    }
                });
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
            else if (!this.gravityDelayTimer.isRunning()) {
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
        beforeCollisions(deltaT) {
            super.beforeCollisions(deltaT);
            this.determineVelocities();
        }
        afterCollisions(deltaT) {
            super.afterCollisions(deltaT);
            this.gravityDelayTimer.update(deltaT);
            camera.setY(this.getPos().y);
            light2.position.copyFrom(this.getPos()).addInPlaceFromFloats(0, 2, 0);
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
            $('#txtInGameFt').html(Math.round(this.getPos().y) + "ft");
        }
    }
    // CONSTANTS
    //  General movement
    Player.GROUND_MOVE_SPEED = 0.1;
    Player.AIR_MOVE_ACCELERATION = 0.01;
    //  Jump / Crush / Slide
    Player.JUMP_IMPULSE = 0.45;
    Player.CRUSH_IMPULSE = 0.5;
    Player.SIDE_JUMP_IMPULSE = 0.55;
    Player.SIDE_XZ_IMPULSE = 0.2;
    Player.SIDE_SLIDE_SPEED = 0.05;
    // Damage
    Player.DAMAGE_MOVE_IMPULSE = 0.4;
    // Gravity & Max speed
    Player.GRAVITY = 0.015;
    Player.MAX_Y_SPEED = 0.5;
    Player.GRAVITY_DELAY_TIME_IN_SECONDS = 0.2;
    Player.INVULNERABILITY_DELAY_TIME_IN_SECONDS = 2;
    Player.MESH_POOL = new MeshPool(2, PoolType.Cloning);
    class GUIState {
        constructor(context) { this.context = context; }
        onEnter(lastState) {
            this.getStateDiv()
                .css('z-index', (this.context.getActiveStateCount() + ''))
                .show();
        }
        onEnd() {
            this.getStateDiv()
                .hide();
        }
        onCoverStart(newState) { }
        onCoverEnd() { }
    }
    class GUIStateLoad extends GUIState {
        constructor() {
            super(...arguments);
            this.animationBarRatios = [];
            this.totalLoadedRatio = 0;
            this.isAnimating = false;
            this.loadingDotInterval = 0;
        }
        onEnter(lastState) {
            super.onEnter(lastState);
            //console.assert(lastState == null);
            let dotCount = 3;
            this.loadingDotInterval = setInterval(() => {
                dotCount++;
                if (dotCount > 3)
                    dotCount = 1;
                $('.txtLoadingDots').css("visibility", "hidden");
                if (dotCount >= 1)
                    $('#txtLoadingDots1').css("visibility", "visible");
                if (dotCount >= 2)
                    $('#txtLoadingDots2').css("visibility", "visible");
                if (dotCount >= 3)
                    $('#txtLoadingDots3').css("visibility", "visible");
            }, 500);
            ResourceLoader.getInstance().onEvent('loadingProgress', (ratioToAdd) => {
                this.animationBarRatios.push(ratioToAdd);
                if (!this.isAnimating)
                    this.updatePendingAnimations();
            });
        }
        onEnd() {
            super.onEnd();
            clearInterval(this.loadingDotInterval);
            this.loadingDotInterval = null;
        }
        getStateDiv() { return $('#divLoadingOverlay'); }
        updatePendingAnimations() {
            if (this.animationBarRatios.length) {
                const barRatioToAdd = this.animationBarRatios.shift();
                this.isAnimating = true;
                anime({
                    targets: '#imgLoadBottom',
                    easing: 'linear',
                    duration: GUIStateLoad.ANIMATION_TIME_MS * barRatioToAdd,
                    left: { value: '+=' + GUIManager.convertPixelToPercentage(928 * barRatioToAdd, 'x') + '%' },
                    complete: () => {
                        this.totalLoadedRatio += barRatioToAdd;
                        this.isAnimating = false;
                        this.updatePendingAnimations();
                        if (this.totalLoadedRatio == 1) {
                            $('#txtLoading').hide();
                            $('#txtPlay').show();
                        }
                    }
                });
            }
        }
    }
    // loading state
    GUIStateLoad.ANIMATION_TIME_MS = 2000;
    class GUIStateLogo extends GUIState {
        onEnter(lastState) {
            super.onEnter(lastState);
            //console.assert(lastState == GUIState.Load)
            anime
                .timeline({
                easing: 'easeOutExpo',
                duration: 750
            })
                .add({
                targets: '#imgCompanyLogo',
                left: GUIManager.convertPixelToPercentage(567, 'x')
            })
                .add({
                targets: '#imgCompanyLogo',
                left: GUIManager.convertPixelToPercentage(1920, 'x'),
                delay: 2000,
                complete: (anim) => { this.context.replaceState(this.context.STATE_MENU); }
            });
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divLogoOverlay'); }
    }
    class GUIStateMainMenu extends GUIState {
        onEnter(lastState) {
            super.onEnter(lastState);
            //console.assert(lastState == GUIState.Logo || lastState == GUIState.Load);
            anime({
                targets: '#imgLogoText',
                scale: 1.05,
                loop: true,
                duration: 500,
                delay: 300,
                direction: 'alternate',
                easing: 'easeInOutSine'
            });
            anime({
                targets: '#imgBackgroundTopLoopA',
                left: GUIManager.convertPixelToPercentage(0, 'x'),
                loop: true,
                duration: 10000,
                easing: 'linear'
            });
            anime({
                targets: '#imgBackgroundTopLoopB',
                left: GUIManager.convertPixelToPercentage(1920, 'x'),
                loop: true,
                duration: 10000,
                easing: 'linear'
            });
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divMenuOverlay'); }
    }
    class GUIStateInGame extends GUIState {
        onEnter(lastState) {
            super.onEnter(lastState);
            //console.assert(lastState == GUIState.Logo);
            game = new Game();
            game.start();
        }
        onEnd() {
            super.onEnd();
            game.dispose();
        }
        getStateDiv() { return $('#divInGameOverlay'); }
    }
    class GUIManager extends Observable {
        constructor() {
            super();
            this.STATE_LOAD = new GUIStateLoad(this);
            this.STATE_LOGO = new GUIStateLogo(this);
            this.STATE_MENU = new GUIStateMainMenu(this);
            this.STATE_INGAME = new GUIStateInGame(this);
            this.currentStates = [];
            $('.makeRelative').each(function () {
                const elm = $(this);
                elm.css("font-size", GUIManager.convertPixelToPercentage(elm.css('height'), 'y') + 'vh');
                elm.css("width", GUIManager.convertPixelToPercentage(elm.css('width'), 'x') + '%');
                elm.css("height", GUIManager.convertPixelToPercentage(elm.css('height'), 'y') + '%');
                elm.css("left", GUIManager.convertPixelToPercentage(elm.css('left'), 'x') + '%');
                elm.css("top", GUIManager.convertPixelToPercentage(elm.css('top'), 'y') + '%');
            });
            $('#txtPlay').on('click', () => { this.replaceState(this.STATE_LOGO); });
            $('#txtTutorial').on('click', () => { alert("UNIMPLEMENTED"); });
            $('#txtPlayGame').on('click', () => { this.replaceState(this.STATE_INGAME); });
            $('#txtAbout').on('click', () => { alert("UNIMPLEMENTED"); });
            this.pushState(this.STATE_LOAD);
            //this.pushState(GUIManager.STATE_MENU);
        }
        static getInstance() { return this.instance; }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                //await ResourceLoader.getInstance().loadImageIntoContainer('test', 'https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/guitextures/tmpbackground.png', 0);
            });
        }
        pushState(newState, replacedLastState = null) {
            console.assert(!this.currentStates.some(state => state == newState), "GUIManager: Attempted to push an already active state to the state list");
            const lastState = replacedLastState || this.getCurrentState();
            if (!replacedLastState && lastState)
                lastState.onCoverStart(newState);
            this.currentStates.push(newState);
            newState.onEnter(lastState);
            window.dispatchEvent(new Event('resize'));
        }
        popState() {
            const poppedState = this.currentStates.pop();
            poppedState.onEnd();
            const newCurrentState = this.getCurrentState();
            if (newCurrentState)
                newCurrentState.onCoverEnd();
        }
        replaceState(newState) {
            const replacedState = this.getCurrentState();
            if (this.currentStates.length)
                this.popState();
            this.pushState(newState, replacedState);
        }
        getActiveStateCount() { return this.currentStates.length; }
        getCurrentState() { return this.currentStates.length > 0 ? this.currentStates[this.currentStates.length - 1] : null; }
        static convertPixelToPercentage(pixelValue, axis) {
            return ((parseInt(pixelValue.toString().replace('px', '')) / (axis == 'x' ? GUIManager.REFERENCE_WIDTH : GUIManager.REFERENCE_HEIGHT)) * 100);
        }
    }
    GUIManager.REFERENCE_WIDTH = 1920;
    GUIManager.REFERENCE_HEIGHT = 1277;
    GUIManager.instance = new GUIManager();
    Promise.all([
        GUIManager.LoadResources(),
        Game.LoadResources(),
        Player.LoadResources(),
        GameCamera.LoadResources(),
        FallBoxBasic.LoadResources(),
        FloorBox.LoadResources(),
        // Boulder.LoadResouces(),
        Coin.LoadResources(),
        BoxingRingBottom.LoadResources(),
        BoxingRingTop.LoadResources(),
    ]).then(() => {
        // loadingContainer.isVisible = false;
        // menuContainer.isVisible = true;
    });
});
