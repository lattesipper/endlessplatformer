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
//import * as BABYLON_MATERIALS from 'babylonjs-materials';
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
    class NamedEvent {
        constructor() {
            this.subscribers = new Set();
        }
        addListener(callback, caller = null) {
            this.subscribers.add(callback);
            if (caller)
                caller.onDispose.addListener(() => this.subscribers.delete(callback));
        }
        fire(...args) {
            this.subscribers.forEach(callback => callback(...args));
        }
    }
    class ResourceLoader {
        constructor() {
            this.onLoadingProgress = new NamedEvent();
            this.onLoadingFinish = new NamedEvent();
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
            this.onLoadingProgress.fire(ratioToAdd);
            if (this.loadedRatio == 1)
                this.finishLoading();
        }
        finishLoading() {
            BABYLON.Texture.prototype.constructor = ((...args) => { console.assert(false, "Attempted to load resource at runtime"); });
            BABYLON.Sound.prototype.constructor = ((...args) => { console.assert(false, "Attempted to load resource at runtime"); });
            BABYLON.SceneLoader.ImportMesh = ((...args) => { console.assert(false, "Attempted to load resource at runtime"); });
            this.onLoadingFinish.fire();
        }
    }
    ResourceLoader.instance = new ResourceLoader();
    ResourceLoader.TOTAL_RESOURCES_SIZE_IN_BYTES = 8022788;
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
        static FromResources(instanceCount, poolType, meshName, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                const meshPool = new MeshPool(instanceCount, poolType);
                const loadedMesh = yield ResourceLoader.getInstance().loadMesh(meshName, sizeInBytes);
                loadedMesh.isVisible = false;
                loadedMesh.receiveShadows = true;
                meshPool.populatePool(loadedMesh);
                return meshPool;
            });
        }
        static FromExisting(instanceCount, poolType, mesh, sizeInBytes = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                const meshPool = new MeshPool(instanceCount, poolType);
                mesh.isVisible = false;
                mesh.receiveShadows = true;
                meshPool.populatePool(mesh);
                return meshPool;
            });
        }
        populatePool(templateMesh) {
            for (let i = 0; i < this.instances.length; i++) {
                let instance;
                switch (this.poolType) {
                    case MeshPool.POOLTYPE_INSTANCE:
                        instance = templateMesh.createInstance('');
                        break;
                    case MeshPool.POOLTYPE_CLONE:
                        instance = templateMesh.clone('');
                        break;
                    default:
                        console.assert(false);
                        break;
                }
                instance.isVisible = false;
                this.instances[i] = instance;
            }
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
    MeshPool.POOLTYPE_INSTANCE = 0;
    MeshPool.POOLTYPE_CLONE = 0;
    MeshPool.POOLTYPE_SPS = 0;
    // Singleton input manager
    class InputManager {
        constructor() {
            this.onKeyDown = new NamedEvent();
            this.onKeyUp = new NamedEvent();
            this.inputMap = new Map();
            this.registerActions();
        }
        registerActions() {
            scene.actionManager = new BABYLON.ActionManager(scene);
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap.set(key, true);
                this.onKeyDown.fire(key);
            }));
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap.set(key, false);
                this.onKeyUp.fire(key);
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
            this.setupCamera();
            this.setupRotateKeyListener();
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                GameCamera.rotateSound = yield ResourceLoader.getInstance().loadSound("rotateView.wav", 17250);
            });
        }
        setY(y) { this.node.position.y = y; }
        getY() { return this.node.position.y; }
        setupCamera() {
            const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 25, new BABYLON.Vector3(0, 0, 0), scene);
            camera.setPosition(new BABYLON.Vector3(0, 0, 0));
            camera.beta = 0.65;
            camera.radius = 25;
            camera.parent = this.node;
            this.camera = camera;
        }
        setupRotateKeyListener() {
            scene.onBeforeRenderObservable.add(() => {
                const canRotate = !this.rotating && game && !game.isPaused();
                const rotateRight = InputManager.getInstance().isKeyPressed('arrowright');
                const rotateLeft = InputManager.getInstance().isKeyPressed('arrowleft');
                if ((rotateLeft || rotateRight) && canRotate) {
                    const animationBox = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    animationBox.setKeys([{ frame: 0, value: this.camera.alpha }, { frame: 20, value: this.camera.alpha + (Math.PI / 2) * (rotateRight ? 1 : -1) }]);
                    this.camera.animations = [animationBox];
                    scene.beginAnimation(this.camera, 0, 20, false, 1, () => this.onRotationEnd(rotateRight));
                    this.onRotationStart();
                }
            });
        }
        onRotationStart() {
            game.pause();
            this.rotating = true;
            GameCamera.rotateSound.play();
        }
        onRotationEnd(rotatedRight) {
            game.play();
            this.rotating = false;
            if (rotatedRight)
                this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1);
            else
                this.rotationIndex = (this.rotationIndex == 0 ? 3 : this.rotationIndex - 1);
        }
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
    class GameState {
        constructor(context) {
            this.onDispose = new NamedEvent();
            this.context = context;
        }
        dispose() { this.onDispose.fire(); }
    }
    class GameStandard extends GameState {
        constructor(context) {
            super(context);
            this.spectateDelayTimer = new GameTimer();
            this.canPause = true;
            this.currentLevel = new StartLevel();
            // setup pause callback
            InputManager.getInstance().onKeyDown.addListener((key) => {
                switch (key) {
                    case 'p':
                        if (!this.canPause)
                            break;
                        if (!this.context.isPaused()) {
                            //Game.BACKGROUND_MUSIC.pause();
                            //pauseContainer.isVisible = true;
                            this.context.pause();
                            GameStandard.SOUND_PAUSE_IN.play();
                        }
                        else {
                            //Game.BACKGROUND_MUSIC.play();
                            //pauseContainer.isVisible = false;
                            this.context.play();
                            GameStandard.SOUND_PAUSE_OUT.play();
                        }
                        break;
                }
            }, this);
            this.context.getPlayer().onDeath.addListener(() => {
                //UtilityFunctions.fadeOutSound(Game.BACKGROUND_MUSIC, 1);
                this.canPause = false;
                this.spectateDelayTimer.start(() => this.context.setState(new GameOver(this.context)), GameStandard.DEATH_SPECTATE_DELAY, false);
            }, this);
        }
        static LoadResouces() {
            return __awaiter(this, void 0, void 0, function* () {
                GameStandard.SOUND_PAUSE_IN = yield ResourceLoader.getInstance().loadSound("pauseIn.wav", 23028);
                GameStandard.SOUND_PAUSE_OUT = yield ResourceLoader.getInstance().loadSound("pauseOut.wav", 22988);
            });
        }
        update(deltaT) {
            const lavaSpeed = ((this.context.getPlayer().getPos().y - this.context.getLava().position.y) < GameStandard.PLAYER_DISTANCE_FOR_FAST_LAVA) ?
                GameStandard.LAVA_SPEED_STANDARD :
                GameStandard.LAVA_SPEED_FAST;
            this.context.getLava().position.y += lavaSpeed;
            this.currentLevel.update(deltaT);
            this.spectateDelayTimer.update(deltaT);
        }
    }
    GameStandard.DEATH_SPECTATE_DELAY = 3;
    GameStandard.PLAYER_DISTANCE_FOR_FAST_LAVA = 60;
    GameStandard.LAVA_SPEED_STANDARD = 0.0275;
    GameStandard.LAVA_SPEED_FAST = 0.1;
    class GameOver extends GameState {
        constructor(context) {
            super(context);
            this.towerFlyByComplte = false;
            camera.setY(0);
            this.context.getLava().position.y = -15;
            GameOver.SOUND_DRUMROLL_REPEAT.play();
        }
        static LoadResouces() {
            return __awaiter(this, void 0, void 0, function* () {
                GameOver.SOUND_DRUMROLL_REPEAT = yield ResourceLoader.getInstance().loadSound("drumroll.mp3", 972077);
                GameOver.SOUND_DRUMROLL_STOP = yield ResourceLoader.getInstance().loadSound("drumrollStop.mp3", 25311);
            });
        }
        dispose() {
            GameOver.SOUND_DRUMROLL_REPEAT.stop();
            GameOver.SOUND_DRUMROLL_STOP.stop();
        }
        update(deltaT) {
            if (!this.towerFlyByComplte) {
                const slowDownY = this.context.getPlayer().getPos().y - 32.256000000000014;
                if (camera.getY() < 32.256000000000014) {
                    this.cameraSpeed += 0.016;
                }
                else if (camera.getY() > slowDownY) {
                    this.cameraSpeed -= 0.016;
                }
                camera.setY(camera.getY() + this.cameraSpeed);
                if (this.cameraSpeed <= 0 || (camera.getY() >= this.context.getPlayer().getPos().y)) {
                    this.finishTowerFlyBy();
                }
            }
        }
        finishTowerFlyBy() {
            this.towerFlyByComplte = true;
            GameOver.SOUND_DRUMROLL_REPEAT.stop();
            GameOver.SOUND_DRUMROLL_STOP.play();
        }
    }
    class Game {
        constructor() {
            this.onDispose = new NamedEvent();
            this.running = true;
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
                //lavaMaterial.blendMode = BABYLON.Engine.ALPHA_MULTIPLY;
                Game.MESH_LAVA = lava;
                yield Promise.all([
                    GameStandard.LoadResouces(),
                    GameOver.LoadResouces()
                ]);
            });
        }
        dispose() {
            this.onDispose.fire();
            clearInterval(this.updateInterval);
            this.physBoxesSortedY.forEach((physBox) => physBox.dispose());
            this.lava.dispose();
        }
        createStartingEntities() {
            // create lava
            this.lava = Game.MESH_LAVA.createInstance('');
            // create frozen box at the bottom to catch them all
            let bottomBox = new FloorBox();
            bottomBox
                .freeze()
                .setPos(new BABYLON.Vector3(0, 0, 0));
            this.addPhysBox(bottomBox);
            // create the player
            const player = new Player();
            player.setPos(new BABYLON.Vector3(0, 0, 0));
            player.setSide(Sides.Bottom, bottomBox.getSide(Sides.Top) + 0.5);
            this.addPhysBox(player);
            this.player = player;
        }
        getLavaLevel() { return this.lava.position.y - 1; }
        pause() { this.running = false; }
        play() { this.running = true; }
        isPaused() { return !this.running; }
        start() {
            // setup update callback
            const updateDelta = 1 / Game.UPDATE_FREQUENCY_PER_SECOND;
            this.updateInterval = setInterval(() => {
                this.update(updateDelta);
            }, 1000 / Game.UPDATE_FREQUENCY_PER_SECOND);
            // create initial entities
            this.createStartingEntities();
            // set state to start with standard gameplay
            this.currentState = new GameStandard(this);
            // perform initial sorting of boxes
            this.ySortBoxes();
            camera.resetRotationindex();
        }
        addPhysBox(box) { this.physBoxesSortedY.push(box); this.physBoxToYIndex.set(box, this.getClosestYIndex(box.getPos().y)); }
        getPhysObjects() { return this.physBoxesSortedY; }
        getPlayer() { return this.player; }
        getLava() { return this.lava; }
        setState(state) {
            if (this.currentState)
                this.currentState.dispose();
            this.currentState = state;
        }
        update(deltaT) {
            if (!this.running)
                return;
            t++;
            if (this.currentState)
                this.currentState.update(deltaT);
            this.ySortBoxes();
            const physboxes = this.getPhysBoxesInRange(this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA, Number.POSITIVE_INFINITY);
            physboxes.forEach(pbox => pbox.beforeCollisions(deltaT));
            physboxes.forEach(pbox => pbox.resolveCollisions(0));
            physboxes.forEach(pbox => pbox.afterCollisions(deltaT));
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
    Game.UPDATE_FREQUENCY_PER_SECOND = 60;
    Game.MAXIMUM_YDISTANCE_UNDER_LAVA = 100;
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
    class PhysBox {
        constructor() {
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
            this.onFreezeStateChange = new NamedEvent();
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
        freeze() { this.frozen = true; this.onFreezeStateChange.fire(true); return this; }
        unfreeze() { this.frozen = false; this.onFreezeStateChange.fire(false); return this; }
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
    class Level {
        constructor() {
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
                fallBox.onFreezeStateChange.addListener((frozen) => {
                    if (frozen) {
                        if ((this.levelState == LevelState.GeneratingTower) && (fallBox.getSide(Sides.Top) >= this.getApproxTowerHeight()))
                            this.setState(LevelState.FinishedTower);
                        console.log(fallBox.getSide(Sides.Top));
                    }
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
                this.MESH_POOL = yield MeshPool.FromExisting(1, MeshPool.POOLTYPE_INSTANCE, mesh, 0);
            });
        }
        getMeshPool() { return FloorBox.MESH_POOL; }
    }
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
                this.MESH_POOL = yield MeshPool.FromResources(3, MeshPool.POOLTYPE_CLONE, 'boxingringbottom.obj', 254548);
            });
        }
        getMeshPool() { return BoxingRingBottom.MESH_POOL; }
    }
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
                this.MESH_POOL = yield MeshPool.FromResources(3, MeshPool.POOLTYPE_CLONE, 'boxingringbottom.obj', 3145633);
            });
        }
        getMeshPool() { return BoxingRingTop.MESH_POOL; }
    }
    class Coin extends PhysBox {
        constructor() {
            super();
            super.setCollisionGroup(CollisionGroups.LevelOnly);
            this.setNormalizedSize(new BABYLON.Vector3(1, 1, 1));
        }
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                this.SOUND_COIN = yield ResourceLoader.getInstance().loadSound("coinCollect.wav", 31074);
                this.MESH_POOL = yield MeshPool.FromResources(50, MeshPool.POOLTYPE_INSTANCE, 'coin.obj', 6216);
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
                this.MESH_POOL = yield MeshPool.FromResources(300, MeshPool.POOLTYPE_INSTANCE, 'basicbox.obj', 397646);
            });
        }
        getMeshPool() {
            return FallBoxBasic.MESH_POOL;
        }
    }
    class Player extends PhysBox {
        constructor() {
            super();
            this.onDeath = new NamedEvent();
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
                Player.MESH_POOL = yield MeshPool.FromResources(2, MeshPool.POOLTYPE_CLONE, 'player.obj', 7654);
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
            this.onDeath.fire();
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
        constructor(context) {
            super(context);
            this.animationBarRatios = [];
            this.totalLoadedRatio = 0;
            this.isAnimating = false;
            this.loadingDotInterval = 0;
            $('#txtPlay').on('click', () => {
                this.context.replaceState(this.context.STATE_LOGO);
            });
        }
        onEnter(lastState) {
            super.onEnter(lastState);
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
            ResourceLoader.getInstance().onLoadingProgress.addListener((ratioToAdd) => {
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
                        if (this.totalLoadedRatio >= 1) {
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
                complete: (anim) => {
                    this.context.replaceState(this.context.STATE_MENU);
                    this.context.pushState(this.context.STATE_MENUMAIN);
                }
            });
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divLogoOverlay'); }
    }
    class GUIStateMenu extends GUIState {
        static LoadResources() {
            return __awaiter(this, void 0, void 0, function* () {
                GUIStateMenu.backgroundSound = yield ResourceLoader.getInstance().loadSound("menuback.mp3", 2413805);
                GUIStateMenu.backgroundSound.loop = true;
            });
        }
        onEnter(lastState) {
            super.onEnter(lastState);
            GUIStateMenu.backgroundSound.play();
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
            GUIStateMenu.backgroundSound.stop();
        }
        getStateDiv() { return $('#divMenuOverlay'); }
    }
    class GUIStateMenuMain extends GUIState {
        constructor(context) {
            super(context);
            $('#txtPlayGame').on('click', () => {
                this.context.popState();
                this.context.replaceState(this.context.STATE_INGAME);
            });
            $('#txtTutorial').on('click', () => {
                this.context.popState();
                this.context.replaceState(this.context.STATE_INGAME);
            });
            $('#txtScores').on('click', () => {
                this.context.replaceState(this.context.STATE_MENUSCORES);
            });
            $('#txtAbout').on('click', () => {
                this.context.replaceState(this.context.STATE_MENUABOUT);
            });
            $('#txtSettings').on('click', () => {
                this.context.replaceState(this.context.STATE_MENUSETTINGS);
            });
            $('.txtMenuBack').on('click', () => {
                this.context.replaceState(this.context.STATE_MENUMAIN);
            });
        }
        onEnter(lastState) {
            super.onEnter(lastState);
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divMenuMainOverlay'); }
    }
    class GUIStateMenuScores extends GUIState {
        onEnter(lastState) {
            super.onEnter(lastState);
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divMenuScoresOverlay'); }
    }
    class GUIStateMenuAbout extends GUIState {
        onEnter(lastState) {
            super.onEnter(lastState);
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divMenuAboutOverlay'); }
    }
    class GUIStateMenuSettings extends GUIState {
        onEnter(lastState) {
            super.onEnter(lastState);
        }
        onEnd() {
            super.onEnd();
        }
        getStateDiv() { return $('#divMenuSettingsOverlay'); }
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
    class GUIManager {
        constructor() {
            this.STATE_LOAD = new GUIStateLoad(this);
            this.STATE_LOGO = new GUIStateLogo(this);
            this.STATE_MENU = new GUIStateMenu(this);
            this.STATE_MENUMAIN = new GUIStateMenuMain(this);
            this.STATE_INGAME = new GUIStateInGame(this);
            this.STATE_MENUSCORES = new GUIStateMenuScores(this);
            this.STATE_MENUABOUT = new GUIStateMenuAbout(this);
            this.STATE_MENUSETTINGS = new GUIStateMenuSettings(this);
            this.currentStates = [];
            $('.makeRelative').each(function () {
                const elm = $(this);
                elm.css("font-size", GUIManager.convertPixelToPercentage(elm.css('height'), 'y') + 'vh');
                elm.css("width", GUIManager.convertPixelToPercentage(elm.css('width'), 'x') + '%');
                elm.css("height", GUIManager.convertPixelToPercentage(elm.css('height'), 'y') + '%');
                elm.css("left", GUIManager.convertPixelToPercentage(elm.css('left'), 'x') + '%');
                elm.css("top", GUIManager.convertPixelToPercentage(elm.css('top'), 'y') + '%');
            });
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
        GUIStateMenu.LoadResources(),
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
