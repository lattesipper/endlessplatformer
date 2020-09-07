import * as BABYLON from 'babylonjs';
import { Scene, BackEase } from 'babylonjs';

window.addEventListener('DOMContentLoaded', () => {

// Create canvas and engine.
const canvas = <HTMLCanvasElement>(document.getElementById('renderCanvas'));
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
let game: Game;
let t: number = 0;

// Observable object that fires events
class Observable {
    public onEvent(eventName, callback) : CallableFunction {
        if (!this.subscribers.has(eventName))
            this.subscribers.set(eventName, new Set());
        this.subscribers.get(eventName).add(callback);
        return () => this.subscribers.get(eventName).delete(callback);
    }
    protected fire(eventName, ...args) {
        if (this.subscribers.has(eventName))
            this.subscribers.get(eventName).forEach(callback => callback(...args));
    }
    private subscribers : Map<string, Set<CallableFunction>> = new Map();
}

class ResourceLoader extends Observable{
    public static getInstance() : ResourceLoader { return this.instance; }
    public async loadSound(name: string, sizeInBytes: number = 0) : Promise<BABYLON.Sound> {
        let loadedSound: BABYLON.Sound;
        await new Promise((resolve) => {
            loadedSound = new BABYLON.Sound("", ResourceLoader.RESOURCE_PATH + '/sounds/' + name, scene, resolve, {
                loop: false,
                autoplay:  false,
                volume: 0.5
            });
        });
        this.updateLoadedBytes(sizeInBytes);
        return loadedSound;
    }
    public async loadMesh(name: string, sizeInBytes: number = 0) : Promise<BABYLON.Mesh> {
        let loadedMesh: BABYLON.Mesh;
        await new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh("", ResourceLoader.RESOURCE_PATH + '/meshes/', name, scene, (meshes, particleSystems, skeletons) => {
                loadedMesh = <BABYLON.Mesh>meshes[0];
                resolve();
            });
        });
        this.updateLoadedBytes(sizeInBytes);
        return loadedMesh;
    }
    public async loadTexture(name: string, sizeInBytes: number = 0) : Promise<BABYLON.Texture> {
        let loadedTexture: BABYLON.Texture = new BABYLON.Texture(ResourceLoader.RESOURCE_PATH + '/textures/' + name, scene);
        await new Promise((resolve) => {
            loadedTexture.onLoadObservable.addOnce(() => {
                resolve();
            });
        });
        this.updateLoadedBytes(sizeInBytes);
        return loadedTexture;
    }
    public async loadImageIntoContainer(selector: string, name: string, sizeInBytes: number = 0) : Promise<any> {
        const logo = <HTMLImageElement>document.getElementById(selector);
        logo.src = name;
        await new Promise((resolve) => {
            logo.onload = (() => resolve());
        });
        this.updateLoadedBytes(sizeInBytes);
    }
    private updateLoadedBytes(bytes) {
        this.animationBarPercentages.push((bytes / ResourceLoader.TOTAL_RESOURCES_SIZE_IN_BYTES) * 100);
        if (!this.isAnimating)
            this.updatePendingAnimations();
    }
    private updatePendingAnimations() {
        if (this.animationBarPercentages.length) {
            const barPToAdd = this.animationBarPercentages.shift();
            this.isAnimating = true;
            anime({
                targets: '#divLoadBar',
                width: {
                    value: '+=' + barPToAdd + '%',
                    duration: (barPToAdd / 100) * 1000,
                    easing: 'linear'
                },
                complete: (anim) => {
                    if ($('#divLoadBar')[0].style['width'] == '100%') {
                        this.finishLoading();
                    }
                    this.isAnimating = false;
                    this.updatePendingAnimations();
                }
            });
        }
    }
    private finishLoading() {
        BABYLON.Texture.prototype.constructor = ((...args): any => { console.assert(false, "Attempted to load resource at runtime"); });
        BABYLON.Sound.prototype.constructor = ((...args): any => { console.assert(false, "Attempted to load resource at runtime"); });
        BABYLON.SceneLoader.ImportMesh = ((...args): any => { console.assert(false, "Attempted to load resource at runtime"); });
        $('#txtLoading').hide();
        $('#txtPlay').show();
    }

    private static instance: ResourceLoader = new ResourceLoader();
    private static TOTAL_RESOURCES_SIZE_IN_BYTES: number = 5608983;
    private static RESOURCE_PATH = 'https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources';

    // loading bar animation properties
    private animationBarPercentages: Array<number> = [];
    private isAnimating: boolean = false;
}
class UtilityFunctions {
    public static fadeSound(sound: BABYLON.Sound, fadeTimeInSeconds : number, targetVolume: number, easingFunction = (t) => t, onDone = () => {}) {
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
            } else {
                sound.setVolume(originalVolume + easingFunction(t) * diffVolume);
            }
        };
        scene.onBeforeRenderObservable.add(callback);
    }
    public static fadeOutSound(sound: BABYLON.Sound, fadeOutTimeInSeconds : number, easingFunction = (t) => t) {
        UtilityFunctions.fadeSound(sound, fadeOutTimeInSeconds, 0, easingFunction);
    }
    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    public static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

enum PoolType {
    Instances,
    Cloning,
    SolidParticle // unimplemented
}

class GameTimer {
    public update(deltaT: number) {
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
    public pause() { console.assert(this.running && !this.paused); this.paused = true; }
    public resume() { console.assert(this.running && this.paused); this.paused = false; }
    public start(callback: CallableFunction, triggerT: number, repeats: boolean) {
        console.assert(!this.running);
        this.executeCallback = callback;
        this.triggerT = triggerT;
        this.currentT = 0;
        this.repeats = repeats;
        this.running = true;
    }
    public stop() {
        console.assert(this.running);
        this.running = false;
    }
    public isRunning() : boolean { return this.running; }
    public isPaused() : boolean { return this.paused; }

    private running: boolean = false;
    private paused: boolean = false;
    private repeats: boolean = false;
    private currentT: number = 0;
    private triggerT: number = 0;
    private executeCallback: CallableFunction;
}

class MeshPool {
    public constructor(instanceCount: number, poolType: PoolType) {
        this.instances = new Array(instanceCount);
        this.poolType = poolType;
    }
    public async LoadResourcesFromPath(meshName : string, onMeshLoad = (mesh) => {}, sizeInBytes: number = 0) {
        this.templateMesh = await ResourceLoader.getInstance().loadMesh(meshName, sizeInBytes);
        this.templateMesh.isVisible = false;
        this.templateMesh.receiveShadows = true;
        switch(this.poolType) {
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
    }
    public async LoadResourcesFromMesh(mesh: BABYLON.Mesh) : Promise<any> {
        await new Promise((resolve) => {
            mesh.isVisible = false;
            for (let i = 0; i < this.instances.length; i++) {
                const instance = mesh.createInstance('');
                instance.isVisible = false;
                this.instances[i] = instance;
            }
            resolve();
        });
    }
    public getMesh() : BABYLON.AbstractMesh {
        console.assert(this.instances.length > 0);
        const instance = this.instances.pop();
        instance.isVisible = true;
        return instance;
    }
    public returnMesh(instance : BABYLON.AbstractMesh) {
        instance.isVisible = false;
        this.instances.push(instance);
    }
    public getTemplateMesh() : BABYLON.Mesh {
        return this.templateMesh;
    }
    private templateMesh: BABYLON.Mesh;
    private instances: Array<BABYLON.AbstractMesh> = [];
    private poolType: PoolType;
}

// Singleton input manager
class InputManager extends Observable {
    private constructor() {
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
    public static getInstance() : InputManager { return this.instance; }
    public isKeyPressed(key) { return this.inputMap.get(key); };
    private inputMap: Map<string, boolean>;
    private static instance: InputManager = new InputManager();
}

// Singleton camera, rotates in 90 degree increments
class GameCamera {
    public static async LoadResources() : Promise<any> {
        GameCamera.rotateSound = await ResourceLoader.getInstance().loadSound("rotateView.wav", 17250);
    }
    public setY(y: number) { this.node.position.y = y }
    public getY() : number { return this.node.position.y }
    public setAlpha(alpha: number) { this.camera.alpha = alpha; }
    public setBeta(beta: number) { this.camera.beta = beta; }
    public setRadius(radius: number) { this.camera.radius = radius;}
    public getAlpha() : number { return this.camera.alpha; }
    public constructor() {
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
            } else if (camera.alpha > (Math.PI * 2))  {
                camera.alpha = camera.alpha - (Math.PI * 2);
            }
            // rotate camera right 90 degrees
            if (InputManager.getInstance().isKeyPressed('arrowright') && !this.rotating && !game.isPaused()) {
                var animationBox : BABYLON.Animation = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                animationBox.setKeys([ { frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha + (Math.PI / 2) } ]);
                camera.animations = [animationBox];
                scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1); });
                this.rotating = true;
                game.pause();
                GameCamera.rotateSound.play();
            } 
            // rotate camera left 90 degrees
            else if (InputManager.getInstance().isKeyPressed('arrowleft') && !this.rotating && !game.isPaused()) {
                var animationBox = new BABYLON.Animation("myAnimation2", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                animationBox.setKeys( [ { frame: 0, value: camera.alpha },  { frame: 20, value: camera.alpha - (Math.PI / 2) }]);
                camera.animations = [animationBox];
                scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 0 ? 3 : this.rotationIndex - 1); });
                game.pause();
                this.rotating = true;
                GameCamera.rotateSound.play();
            }
        });
    }
    public getRotationIndex() : number { return this.rotationIndex; }
    public resetRotationindex() {
        this.rotationIndex = 0;
        this.camera.alpha = 4.71238898039;
    }
    private static rotateSound: BABYLON.Sound;
    private camera: BABYLON.ArcRotateCamera;
    private rotating: boolean = false;
    private rotationIndex: number = 0;
    private node: BABYLON.TransformNode = new BABYLON.TransformNode('', scene);
}
const camera = new GameCamera();

// Enum class representing the 6 sides of a cube
class Sides {
    private constructor (dim, direction) {
        this.dim = dim;
        this.direction = direction;
    }
    public flip() : Sides {
        switch(this) {
            case Sides.Left: return Sides.Right;    case Sides.Right: return Sides.Left;
            case Sides.Top: return Sides.Bottom;    case Sides.Bottom: return Sides.Top;
            case Sides.Forward: return Sides.Back;  case Sides.Back: return Sides.Forward;
            case Sides.Unknown: return Sides.Unknown;
        }
    }
    public static Left = new Sides('x', -1);        public static Right = new Sides('x', 1);
    public static Forward = new Sides('z', 1);      public static Back = new Sides('z', -1);
    public static Top = new Sides('y', 1);          public static Bottom = new Sides('y', -1);
    public static Unknown = new Sides('', 0);
    public static All : Array<Sides> = [Sides.Left, Sides.Right, Sides.Forward, Sides.Back, Sides.Top, Sides.Bottom];
    public dim : string;
    public direction : number;
}

// Game class, responsible for managing contained phys-objects
enum GameMode {
    Playing,
    Spectating,
    Paused
}
class Game {
    public static async LoadResources() : Promise<any> {
        // load sounds
        //Game.BACKGROUND_MUSIC = await ResourceLoader.getInstance().loadSound("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/music/dreamsofabove.mp3");
        //Game.BACKGROUND_MUSIC.loop = true;
        Game.SOUND_PAUSE_IN = await ResourceLoader.getInstance().loadSound("pauseIn.wav", 23028);
        Game.SOUND_PAUSE_OUT = await ResourceLoader.getInstance().loadSound("pauseOut.wav", 22988);
        Game.SOUND_DRUMROLL_REPEAT = await ResourceLoader.getInstance().loadSound("drumroll.mp3",972077);
        Game.SOUND_DRUMROLL_STOP = await ResourceLoader.getInstance().loadSound("drumrollStop.mp3", 25311);
        // load lava mesh
        const lava = BABYLON.Mesh.CreateGround("ground", 150, 150, 25, scene);
        lava.visibility = 0.5;
        lava.position.y = -20;
        const lavaMaterial = new BABYLON.LavaMaterial("lava", scene);	
        lavaMaterial.noiseTexture = await ResourceLoader.getInstance().loadTexture("cloud.png", 72018); // Set the bump texture
        lavaMaterial.diffuseTexture = await ResourceLoader.getInstance().loadTexture("lavatile.jpg", 457155); // Set the diffuse texture
        lavaMaterial.speed = 0.5;
        lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
        lavaMaterial.unlit = true;
        lavaMaterial.freeze();
        lava.material = lavaMaterial;
        lava.isVisible = false;
        lavaMaterial.blendMode = BABYLON.Engine.ALPHA_MULTIPLY;
        Game.MESH_LAVA = lava;
    }
    public dispose() {
        Game.SOUND_DRUMROLL_REPEAT.stop();
        //Game.BACKGROUND_MUSIC.stop();
        scene.onBeforeRenderObservable.removeCallback(this.updateCallbackFunc);
        this.physBoxesSortedY.forEach((physBox) => physBox.dispose());
        this.lava.dispose();
        this.callbackFunctions.forEach((func) => func());
    }

    public getLavaLevel() : number { return this.lava.position.y - 1; }
    public pause() { this.running = false; }
    public play() { this.running = true; }
    public isPaused() { return !this.running; }
    public start() {
        // setup update callback
        this.updateCallbackFunc = (() => this.update(1/60));
        scene.onBeforeRenderObservable.add(this.updateCallbackFunc);

        // setup pause callback
        this.callbackFunctions.push(
            InputManager.getInstance().onEvent('keyDown', (key) => {
                if (this.canPause) {
                    switch(key) {
                        case 'p':
                            if (this.running) {
                                //Game.BACKGROUND_MUSIC.pause();
                                //pauseContainer.isVisible = true;
                                this.running = false;
                                Game.SOUND_PAUSE_IN.play();
                            } else {
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
            })
        );

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
        this.callbackFunctions.push(
            player.onEvent('death', () => {
                //UtilityFunctions.fadeOutSound(Game.BACKGROUND_MUSIC, 1);
                this.canPause = false;
                this.spectateDelayTimer.start(() => this.changeMode(GameMode.Spectating), Game.DEATH_SPECTATE_DELAY, false);
            })
        );
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

    public addPhysBox(box) { this.physBoxesSortedY.push(box); this.physBoxToYIndex.set(box, this.getClosestYIndex(box.getPos().y)); }
    public getPhysObjects() { return this.physBoxesSortedY; }
    public getPlayer() : Player { return this.player; }

    private changeMode(mode: GameMode) {
        switch(mode) {
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
    private update(deltaT: number) {
        t++;
        if (!this.running)
            return;
        switch(this.mode) {
            case GameMode.Playing:
                this.updatePlaying(deltaT);
                break;
            case GameMode.Spectating:
                this.updateSpectating(deltaT);
                break;
        }
        this.updateVisiblePhysBoxes();
    }
    private updateVisiblePhysBoxes() {
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
    private updatePlaying(deltaT: number) {
        // update lava position, moving at either a standard or fast pace depending on distance from player
        if ((this.player.getPos().y - this.lava.position.y) < Game.PLAYER_DISTANCE_FOR_FAST_LAVA) {
            this.lava.position.y += Game.LAVA_SPEED_STANDARD;
        } else {
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
    private updateSpectating(deltaT: number) {
        if (!this.towerFlyByComplte) {
            const slowDownY = this.player.getPos().y - 32.256000000000014;
            if (camera.getY() < 32.256000000000014) {
                this.cameraSpeed += 0.016;
            } else if (camera.getY() > slowDownY) {
                this.cameraSpeed -= 0.016;
            }
            camera.setY(camera.getY() + this.cameraSpeed);
            if (this.cameraSpeed <= 0 || (camera.getY() >= this.player.getPos().y)) {
                this.finishTowerFlyBy();
            }
        }
    }
    private finishTowerFlyBy() {
        this.towerFlyByComplte = true;
        Game.SOUND_DRUMROLL_REPEAT.stop();
        Game.SOUND_DRUMROLL_STOP.play();
    }

    private getPhysBoxesInRange(startYValue: number, endYValue: number) : Array<PhysBox> {
        const physBoxes : Array<PhysBox> = [];
        let searchYUp : number = this.getClosestYIndex(startYValue);
        while (searchYUp < this.physBoxesSortedY.length && (this.physBoxesSortedY[searchYUp].getPos().y <= endYValue)) {
            const physbox = this.physBoxesSortedY[searchYUp];
            searchYUp++;
            if (!physbox.isDisposed())
                physBoxes.push(physbox);
        }
        return physBoxes;
    }

    // SWEEP AND PRUNE
    private getClosestYIndex(yValue) {
        let low = 0;
        let high = this.physBoxesSortedY.length - 1;
        let mid;      
        while (low <= high){
            mid = Math.floor((low+high)/2);     
            if (this.physBoxesSortedY[mid].getPos().y==yValue) return mid; 
            else if (this.physBoxesSortedY[mid].getPos().y<yValue) low = mid+1;
            else high = mid-1;          
        }
        return Math.min(low, this.physBoxesSortedY.length-1);
    }
    private ySortBoxes() { 
        // O(N) average case for insertion sort after physbox updates thanks to temporal coherence
        const cutoffYIndex = this.getClosestYIndex(this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA);
        for (let i = cutoffYIndex; i < this.physBoxesSortedY.length; i++) {
            let j = i - 1;
            let tmp = this.physBoxesSortedY[i];
            while (j >= 0 && this.physBoxesSortedY[j].getPos().y > tmp.getPos().y) {
                this.physBoxesSortedY[j + 1] = this.physBoxesSortedY[j];
                j--
            }
            this.physBoxesSortedY[j+1] = tmp;
            this.physBoxToYIndex.set(tmp, j+1);
        }
    }
    public getCollisions(physBox: PhysBox) {
        let yIndex = this.physBoxToYIndex.get(physBox);
        let collisions = [];
        let tests = 0;
        for (let i = yIndex; i >= 0; i--) {
            let candiate = this.physBoxesSortedY[i];
            tests++;
            if (!candiate.isDisposed() && physBox.physicallyIntersects(candiate))
                collisions.push(candiate);
            if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + (PhysBox.MAXIMUM_HEIGHT/2)))
                break;
        }
        for (let i = yIndex; i < this.physBoxesSortedY.length; i++) {
            tests++;
            let candiate = this.physBoxesSortedY[i];
            if (!candiate.isDisposed() && physBox.physicallyIntersects(candiate))
                collisions.push(candiate);
            if (physBox.getSide(Sides.Top) < (candiate.getPos().y - (PhysBox.MAXIMUM_HEIGHT/2)))
                break;
        }
        return collisions;
    }

    // RESOURCES
    private static BACKGROUND_MUSIC: BABYLON.Sound;
    private static SOUND_PAUSE_IN: BABYLON.Sound;
    private static SOUND_PAUSE_OUT: BABYLON.Sound;
    private static SOUND_DRUMROLL_REPEAT: BABYLON.Sound;
    private static SOUND_DRUMROLL_STOP: BABYLON.Sound;
    private static MESH_LAVA: BABYLON.Mesh;
    // GAME CONSTANTS
    private static PLAYER_DISTANCE_FOR_FAST_LAVA: number = 60;
    private static LAVA_SPEED_STANDARD: number = 0.0275;
    private static LAVA_SPEED_FAST: number = 0.1;
    private static MAXIMUM_YDISTANCE_UNDER_LAVA: number = 100;
    private static DEATH_SPECTATE_DELAY: number = 3;


    private mode: GameMode = GameMode.Playing;

    // shared mode variables
    private canPause: boolean = true;
    private running : boolean = true;

    // playing mode variables
    private currentLevel: Level = null;

    // spectate mode variables
    private spectateDelayTimer: GameTimer = new GameTimer();
    private towerFlyByComplte: boolean = false;
    private cameraSpeed: number = 0;

    // callbacks
    private updateCallbackFunc;
    private callbackFunctions : Array<CallableFunction> = [];

    // sorted entities
    private physBoxesSortedY: Array<PhysBox> = [];
    private physBoxToYIndex = new Map<PhysBox, number>();

    // observed entities
    private observedEntitiesThisUpdate: Set<PhysBox> = new Set();
    private observedEntitiesLastUpdate: Set<PhysBox> = new Set();

    // important entities
    private player: Player;
    private lava: BABYLON.TransformNode;
}

class GameObj extends Observable {}

class CollisionGroups {
    public collides(otherGroup: CollisionGroups) : boolean { return CollisionGroups.collisionMap.get(this).has(otherGroup); }
    public static Level: CollisionGroups = new CollisionGroups();
    public static Player: CollisionGroups = new CollisionGroups();
    public static Enemy: CollisionGroups = new CollisionGroups();
    public static FloatEnemy: CollisionGroups = new CollisionGroups();
    public static LevelOnly: CollisionGroups = new CollisionGroups();
    public static Unknown: CollisionGroups = new CollisionGroups();
    private static collisionMap: Map<CollisionGroups, Set<CollisionGroups>> = new Map([
        [CollisionGroups.Level, new Set<CollisionGroups>([CollisionGroups.Level, CollisionGroups.Player, CollisionGroups.Enemy, CollisionGroups.LevelOnly])],
        [CollisionGroups.Player, new Set<CollisionGroups>([CollisionGroups.Level, CollisionGroups.Enemy, CollisionGroups.FloatEnemy])],
        [CollisionGroups.Enemy, new Set<CollisionGroups>([CollisionGroups.Level, CollisionGroups.Player])],
        [CollisionGroups.FloatEnemy, new Set<CollisionGroups>([CollisionGroups.Player])],
        [CollisionGroups.LevelOnly, new Set<CollisionGroups>([CollisionGroups.Level])],
        [CollisionGroups.Unknown, new Set<CollisionGroups>()]
    ]);
}

abstract class PhysBox extends GameObj {
    // destructor
    public dispose() { this.endObservation(); this.disposed = true; }
    public isDisposed() : boolean { return this.disposed; }

    // physical properties
    protected setNormalizedSize(size: BABYLON.Vector3) : PhysBox { this.size.copyFrom(size); return this; }
    public setScale(scale: number) { this.scaling = scale; }
    public getPos() { return this.position; }
    public setPos(pos: BABYLON.Vector3) : PhysBox { this.position.copyFrom(pos); return this; }
    public getSide(side : Sides) { return this.position[side.dim] + (this.size[side.dim] * this.scaling * 0.5 * side.direction) + this.collisionBuffers.get(side); }
    public setSide(side : Sides, value : number) { this.position[side.dim] = value - (this.size[side.dim] * this.scaling * 0.5 * side.direction); }

    // momentum
    public setVelocity(velocity: BABYLON.Vector3) : PhysBox { this.velocity = velocity.clone(); return this; }
    public getVelocity() { return this.frozen ? PhysBox.FROZEN_VELOCITY : this.velocity; }
    public setGravity(gravity: number) { this.gravity = gravity; }
    public getGravity() : number { return this.gravity; }
    public setTerminalVelocity(terminalVelocity: number) { this.terminalVelocity = terminalVelocity; }
    public getTerminalVelocity() : number { return this.terminalVelocity; }

    // status flags
    public disable() { 
        if (this.instance)
            this.instance.isVisible = false;
        this.active = false; 
    }
    public enable() { 
        if (this.instance)
            this.instance.isVisible = true;
        this.active = true; 
    }
    public freeze() : PhysBox { this.frozen = true; this.fire('freeze'); return this; }
    public unfreeze() : PhysBox { this.frozen = false; this.fire('unfreeze'); return this; }
    public isFrozen() : boolean { return this.frozen; }

    // collisions
    protected getCollisionGroup() : CollisionGroups { return this.collisionGroup; }
    protected setCollisionGroup(collisionGroup : CollisionGroups) { this.collisionGroup = collisionGroup; }
    public getMoverLevel() : number { return this.moverLevel; }
    public setMoverLevel(moverLevel: number) { this.moverLevel = moverLevel; }
    public getCollisionBuffer(side: Sides) : number { return this.collisionBuffers.get(side); }
    public setCollisionBuffer(side: Sides, extent: number) { return this.collisionBuffers.set(side, extent); }
    public clearCollisionBuffer() { Sides.All.forEach(side => this.collisionBuffers.set(side, 0)); }

    public logicallyIntersects(otherBox: PhysBox) : boolean { return this.getCollisionGroup().collides(otherBox.getCollisionGroup()); }
    public physicallyIntersects(otherBox: PhysBox) : boolean {
        // physboxes can't collide with themselves
        if (otherBox == this)
            return false;
        // a collision occurs if there is no axis that seperates the two bounding boxes
        return (
            !((this.getSide(Sides.Left) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Right) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
            !((this.getSide(Sides.Right) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Left) + PhysBox.COLLISION_SAFETY_BUFFER)) &&
            !((this.getSide(Sides.Back) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Forward) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
            !((this.getSide(Sides.Forward) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Back) + PhysBox.COLLISION_SAFETY_BUFFER)) &&
            !((this.getSide(Sides.Bottom) + PhysBox.COLLISION_SAFETY_BUFFER) > (otherBox.getSide(Sides.Top) - PhysBox.COLLISION_SAFETY_BUFFER)) &&
            !((this.getSide(Sides.Top) - PhysBox.COLLISION_SAFETY_BUFFER) < (otherBox.getSide(Sides.Bottom) + PhysBox.COLLISION_SAFETY_BUFFER))
        );
    }

    // observer callbacks
    public abstract getMeshPool() : MeshPool;
    public isObservable() : boolean { return true; }
    public startObservation() {
        if (this.instance)
            return;
        this.instance = this.getMeshPool().getMesh();
        this.instance.scaling = BABYLON.Vector3.One().scale(this.scaling);
        this.instance.position = this.getPos();
        this.afterStartObservation();
    }
    public endObservation() {
        if (!this.instance)
            return
        this.beforeEndObservation();
        this.getMeshPool().returnMesh(this.instance);
        this.instance = null;
    }
    protected afterStartObservation() {}
    protected beforeEndObservation() {}

    // collision callbacks
    public onCollisionStart(side: Sides, physBox: PhysBox) { }
    public onCollisionHold(side: Sides, physBox: PhysBox) {
        if (this.getMoverLevel() < physBox.getMoverLevel()) {
            if (side == Sides.Top || side == Sides.Bottom)
                this.getVelocity().y = physBox.getVelocity().y;
            else if (side == Sides.Left || side == Sides.Right)
                this.getVelocity().x = physBox.getVelocity().x;
            else if (side == Sides.Forward || side == Sides.Back)
                this.getVelocity().z = physBox.getVelocity().z;
        }
    }
    public onCollisionStop(side: Sides, physBox: PhysBox) { }

    // collision steps
    public beforeCollisions(deltaT: number) {
        // swap collision lists for last update and this update, and clear the later
        let tmp = this.collisionsThisUpdate;
        this.collisionsLastUpdate.forEach((collisions, side) => collisions.clear());
        this.collisionsThisUpdate = this.collisionsLastUpdate;
        this.collisionsLastUpdate = tmp;
    }
    public afterCollisions(deltaT: number) {
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

    protected notifyOfCollision(side: Sides, physBox: PhysBox) {
        this.collisionsThisUpdate.get(side).add(physBox);
    }
    protected getCollisions(side) : Set<PhysBox> { return this.collisionsLastUpdate.get(side); }

    public resolveCollisions(t : number) {
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
    private resolveCollisionsForSide(possibleCollisions : Array<PhysBox>, myHitSide: Sides) {
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
            } else if (!logicallyIntersects && (firstPhysicalHitIdx == -1 || idx <= firstPhysicalHitIdx)) {
                this.collisionsThisUpdate.get(Sides.Unknown).add(pbox);
                pbox.notifyOfCollision(Sides.Unknown, this);
            }
        });
    }

    protected getMeshInstance() : BABYLON.AbstractMesh { return this.instance; }

    // CONSTANTS
    private static FROZEN_VELOCITY: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public static MAXIMUM_HEIGHT: number = 5;

    // status flags
    private disposed: boolean = false;
    private frozen: boolean = false;
    private active: boolean = true;

    // collision vars
    private static COLLISION_SWEEP_SAFETY_BUFFER : number = 0.5;
    private static COLLISION_SAFETY_BUFFER : number = 0.0001;
    private collisionGroup: CollisionGroups = CollisionGroups.Unknown;
    private moverLevel: number = 1;
    private collisionsLastUpdate: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()], [Sides.Unknown, new Set<PhysBox>()]
    ]);
    private collisionsThisUpdate: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()], [Sides.Unknown, new Set<PhysBox>()]
    ]);
    private collisionBuffers: Map<Sides, number> = new Map([[Sides.Left, 0], [Sides.Right, 0], [Sides.Top, 0], [Sides.Bottom, 0], [Sides.Forward, 0], [Sides.Back, 0]]);

    // momentum
    private velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private terminalVelocity: number = 5;
    private gravity: number = 0;

    // position & size
    private position: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
    private size: BABYLON.Vector3 = BABYLON.Vector3.One();
    private scaling: number = 1;
    private instance: BABYLON.AbstractMesh = null;
}

enum LevelState {
    GeneratingTower,
    FinishedTower,
    Boss
}
abstract class Level extends Observable {
    protected abstract getApproxTowerHeight(): number;
    protected abstract generateFallBox(): FallBox;
    protected abstract afterFallBoxPositioning(fallBox: FallBox);
    protected getHighestBox(): FallBox { return this.myboxes.length != 0 ? this.myboxes[this.myboxes.length - 1] : null; }
    protected abstract getBoxYIncrement(): number;
    public update(deltaT: number) {
        switch(this.levelState) {
            case LevelState.GeneratingTower: this.updateStateGeneratingTower(); break;
            case LevelState.FinishedTower: this.updateStateFinishedTower(); break;
            case LevelState.Boss: this.updateStateBoss(); break;
        }
    }
    public updateStateGeneratingTower() {
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
                fallBox.setPos(new BABYLON.Vector3(-Level.XZSpread + Math.random() * (Level.XZSpread*2), topBoxY + Level.SAFETY_BOX_Y_INCREMENT + this.getBoxYIncrement(), -Level.XZSpread + Math.random() * (Level.XZSpread*2)));
            } while (game.getCollisions(fallBox).length != 0)
            this.afterFallBoxPositioning(fallBox);
        }
    }
    public updateStateFinishedTower() {

    }
    public updateStateBoss() {

    }
    private setState(newState) {
        switch(newState) {
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
    private levelState: LevelState = LevelState.GeneratingTower;
    private myboxes : Array<FallBox> = [];
    private static POPULATE_FALLBOXES_PLAYER_DISTANCE_THRESHOLD: number = 60;
    private static INITIAL_SPAWN_YOFFSET: number = 10;
    private static SAFETY_BOX_Y_INCREMENT: number = 2;
    protected static XZSpread: number = 7;
}
class StartLevel extends Level {
    public constructor() {
        super();
    }
    protected getBoxYIncrement(): number { return Math.random() * 3; }
    protected getApproxTowerHeight(): number { return 300; }
    protected afterFallBoxPositioning(fallBox: FallBox) {
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
    protected generateFallBox() : FallBox {
        const fallbox = new FallBoxBasic();
        const rnd = Math.random();
        if (rnd <= 0.33) {
            fallbox.setScale(2);
        } else if (rnd <= 0.66) {
            fallbox.setScale(3);
        } else {
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
    public static async LoadResources() {
        const mesh = BABYLON.MeshBuilder.CreateBox('', {width: 14, height: 2, depth: 14}, scene);
        const material = new BABYLON.StandardMaterial('', scene);
        material.diffuseTexture = await ResourceLoader.getInstance().loadTexture("floorBox.png", 7415);
        material.freeze();
        mesh.material = material;
        await this.MESH_POOL.LoadResourcesFromMesh(mesh);
    }
    public getMeshPool() : MeshPool { return FloorBox.MESH_POOL; }
    public constructor() {
        super();
        this.setCollisionGroup(CollisionGroups.Level);
        this.setMoverLevel(2);
        this.setNormalizedSize(new BABYLON.Vector3(14, 2, 14));
    }
    private static MESH_POOL: MeshPool = new MeshPool(1, PoolType.Instances);
}

class BoxingRingBottom extends PhysBox{
    public static async LoadResources() {
        await BoxingRingBottom.MESH_POOL.LoadResourcesFromPath('boxingringbottom.obj', (mesh) => {
            mesh.visibility = 0.5;  
        }, 254548);
    }
    public constructor() {
        super();
        super.setCollisionGroup(CollisionGroups.Level);
        this.setNormalizedSize(new BABYLON.Vector3(18,3.2,18));
        this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
        this.setMoverLevel(2);
    }
    public getMeshPool() : MeshPool { return BoxingRingBottom.MESH_POOL; }
    private static MESH_POOL: MeshPool = new MeshPool(3, PoolType.Cloning);
}
class BoxingRingTop extends PhysBox{
    public static async LoadResources() {
        await BoxingRingTop.MESH_POOL.LoadResourcesFromPath('boxingringtop.obj', (mesh) => {
            //mesh.visibility = 0.5;  
        }, 3145633);
    }
    public constructor() {
        super();
        super.setCollisionGroup(CollisionGroups.Level);
        this.setNormalizedSize(new BABYLON.Vector3(18, 8.3, 18));
        this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
        this.setMoverLevel(2);
    }
    public getMeshPool() : MeshPool { return BoxingRingTop.MESH_POOL; }
    private static MESH_POOL: MeshPool = new MeshPool(3, PoolType.Cloning);
}

class Coin extends PhysBox {
    public static async LoadResources() {
        Coin.SOUND_COIN = await ResourceLoader.getInstance().loadSound("coinCollect.wav", 31074);
        await Coin.MESH_POOL.LoadResourcesFromPath('coin.obj', () => {}, 6216);
    }
    private static getYRotation() : number { return (t / 60) * (Math.PI * 2) * this.REVS_PER_SECOND; }
    public constructor() {
        super();
        super.setCollisionGroup(CollisionGroups.LevelOnly);
        this.setNormalizedSize(new BABYLON.Vector3(1,1,1));
    }
    public getMeshPool() : MeshPool { return Coin.MESH_POOL; }
    public beforeCollisions(deltaT: number) {
        super.beforeCollisions(deltaT);
        const mesh = this.getMeshInstance();
        if (mesh) {
            mesh.rotation.y = Coin.getYRotation();
        }
    }
    public onCollisionStart(side: Sides, physBox : PhysBox) {
        super.onCollisionStart(side, physBox);
        if (physBox instanceof Player) {
            this.dispose();
            Coin.SOUND_COIN.play();
        }
    }
    public afterCollisions(deltaT: number) {
        super.afterCollisions(deltaT);
        if (this.getCollisions(Sides.Bottom).size != 0 && this.getCollisions(Sides.Top).size != 0) {
            this.dispose();
        }
    }
    private static MESH_POOL: MeshPool = new MeshPool(50, PoolType.Instances);
    private static REVS_PER_SECOND = 0.5;
    private static SOUND_COIN : BABYLON.Sound;
}

abstract class FallBox extends PhysBox {
    public constructor() {
        super();
        this.setMoverLevel(2);
        this.setCollisionGroup(CollisionGroups.Level);
        this.color = new BABYLON.Color4(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1);
    }
    public break() {
        this.unfreezeBoxesAbove();
        this.dispose();
    }
    private unfreezeBoxesAbove() {
        this.unfreeze();
        this.getCollisions(Sides.Top).forEach(physBox => {
            if (physBox instanceof FallBox)
                (<FallBox>physBox).unfreezeBoxesAbove();
        });
    }
    public onCollisionStart(side: Sides, physBox : PhysBox) {
        super.onCollisionStart(side, physBox);
        if (side == Sides.Bottom && (physBox instanceof FallBox || physBox instanceof FloorBox) && physBox.isFrozen()) {
            this.freeze();
        }
    }
    public getColor() : BABYLON.Color4 { return this.color; }
    private color: BABYLON.Color4;
}

class FallBoxBasic extends FallBox {
    public static async LoadResources() {
        await FallBoxBasic.MESH_POOL.LoadResourcesFromPath('basicbox.obj', () => {}, 397646);
    }
    public constructor() {
        super();
        this.setMoverLevel(2);
    }
    public getMeshPool() : MeshPool {
        return FallBoxBasic.MESH_POOL;
    }
    private static MESH_POOL: MeshPool = new MeshPool(300, PoolType.Instances);
}

class Player extends PhysBox {
    public static async LoadResources() {
        Player.SOUND_DAMAGE = await ResourceLoader.getInstance().loadSound("damage.wav", 12514);
        Player.SOUND_JUMP = await ResourceLoader.getInstance().loadSound("jump.wav", 9928);
        Player.SOUND_HIT_HEAD = await ResourceLoader.getInstance().loadSound("hitHead.wav", 8418);
        Player.SOUND_DEATH = await ResourceLoader.getInstance().loadSound("death.wav", 138110);
        await Player.MESH_POOL.LoadResourcesFromPath('player.obj', () => {}, 7654);
    }
    public getMeshPool() : MeshPool { return Player.MESH_POOL; }
    public dispose() {
        super.dispose();
        this.explosionParticleSystem.dispose();
    }
    public afterStartObservation() {
        this.explosionParticleSystem.emitter = this.getMeshInstance();
        shadowGenerator.addShadowCaster(this.getMeshInstance());
    }
    public beforeEndObservation() {
        shadowGenerator.removeShadowCaster(this.getMeshInstance());
        this.explosionParticleSystem.emitter = null;
    }

    public constructor() {
        super();
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
    public disable() {
        super.disable();
    }
    public kill() {
        this.dispose();
        this.explosionParticleSystem.start();
        Player.SOUND_DEATH.play();
        this.fire('death', true);
        setTimeout(() => this.explosionParticleSystem.stop(), 150);
    }

    public damadge(damadger: PhysBox = null) : boolean {
        // we may be damadged by multiple entities in the same frame, before invulnerability
        // has been applied. prevent multiple damadges in the same frame
        if (this.getCollisionGroup() == CollisionGroups.LevelOnly)
            return false;
        this.health--;
        if (this.health == 0) {
            this.kill();
        } else {
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

    public onCollisionStart(side: Sides, physBox: PhysBox) { 
        if (side == Sides.Top && physBox instanceof FallBox) {
            if(!Player.SOUND_HIT_HEAD.isPlaying)
                Player.SOUND_HIT_HEAD.play();
            this.setGravity(0);
            this.fallDelayTimer.start(() => {
                this.setGravity(Player.GRAVITY);
            }, 0.2, false);
        }
        // if (physBox instanceof Boulder) {
        //     this.damadge(physBox);
        // }
    }

    private determineVelocities() {
        let wKey; let aKey; let sKey; let dKey;
        switch(camera.getRotationIndex()) {
            case 1: wKey = 'd'; aKey = 'w'; sKey = 'a';  dKey = 's'; break;
            case 2: wKey = 's'; aKey = 'd'; sKey = 'w';  dKey = 'a'; break;
            case 3: wKey = 'a'; aKey = 's'; sKey = 'd';  dKey = 'w'; break;
            case 0: wKey = 'w'; aKey = 'a'; sKey = 's';  dKey = 'd'; break;
        }

        const mesh = this.getMeshInstance();

        // update rotation animation
        const maxLeanAngle = 0.15;
        const leanAngleSpeed = 0.025;
        if (mesh) {
            ['z', 'x'].forEach(velDim => {
                const rotDim = velDim == 'z' ? 'x': 'z';
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
                        this.getVelocity()[side.dim] = Player.SIDE_XZ_IMPULSE * side.direction * -1; this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                        if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                    }
                }
            });    
        }

        if (count && !InputManager.getInstance().isKeyPressed(' ')) {
            avgYSpeed /= count;                                 // find average speed of the boxes the player is pressing against
            avgYSpeed -= Player.SIDE_SLIDE_SPEED;               // and add the slide speed to find the players velocity when sliding  
            // only let the player slide if their velocity is already less than this speed (don't allow them to stick automatically, they have to fall a bit first)
            if (this.getVelocity().y <= avgYSpeed) {
                this.getVelocity().y = avgYSpeed;
                this.setGravity(0);
            }
        } else if (!this.fallDelayTimer.isRunning()) {
            // not sliding, apply GRAVITY as normal
            this.setGravity(Player.GRAVITY);
        }

        // grounded, apply movement velocity instantaneously
        if (this.getCollisions(Sides.Bottom).size) {
            if (InputManager.getInstance().isKeyPressed(wKey)) {
                this.getVelocity().z = Player.GROUND_MOVE_SPEED;
            } else if (InputManager.getInstance().isKeyPressed(sKey)) {
                this.getVelocity().z = -Player.GROUND_MOVE_SPEED;
            } else {
                this.getVelocity().z = 0;
            }
            if (InputManager.getInstance().isKeyPressed(aKey)) {
                this.getVelocity().x = -Player.GROUND_MOVE_SPEED;
            } else if (InputManager.getInstance().isKeyPressed(dKey)) {
                this.getVelocity().x = Player.GROUND_MOVE_SPEED;
            } else {
                this.getVelocity().x = 0;
            }
            if (InputManager.getInstance().isKeyPressed(' ')) {
                if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                this.getVelocity().y = Player.JUMP_IMPULSE;
            }    
        } 
        // in-air, apply movement velocity through acceleration
        else {
            if (InputManager.getInstance().isKeyPressed(wKey)) {
                this.getVelocity().z = Math.min(this.getVelocity().z + Player.AIR_MOVE_ACCELERATION, Player.GROUND_MOVE_SPEED);
            } else if (InputManager.getInstance().isKeyPressed(sKey)) {
                this.getVelocity().z = Math.max(this.getVelocity().z - Player.AIR_MOVE_ACCELERATION, -Player.GROUND_MOVE_SPEED);
            } else {
                this.getVelocity().z = (Math.abs(this.getVelocity().z) < Player.AIR_MOVE_ACCELERATION) ? 0 : this.getVelocity().z + Player.AIR_MOVE_ACCELERATION * Math.sign(this.getVelocity().z) * -1;
            }
            if (InputManager.getInstance().isKeyPressed(aKey)) {
                this.getVelocity().x = Math.max(this.getVelocity().x - Player.AIR_MOVE_ACCELERATION, -Player.GROUND_MOVE_SPEED);
            } else if (InputManager.getInstance().isKeyPressed(dKey)) {
                this.getVelocity().x = Math.min(this.getVelocity().x + Player.AIR_MOVE_ACCELERATION, Player.GROUND_MOVE_SPEED);
            } else {
                this.getVelocity().x = (Math.abs(this.getVelocity().x) < Player.AIR_MOVE_ACCELERATION) ? 0 : this.getVelocity().x + Player.AIR_MOVE_ACCELERATION * Math.sign(this.getVelocity().x) * -1;
            }
            if (InputManager.getInstance().isKeyPressed('e')) {
                this.getVelocity().y = -Player.CRUSH_IMPULSE;
            }
        }
    }
    public beforeCollisions(deltaT: number) {
        super.beforeCollisions(deltaT);
        this.determineVelocities();
    }
    public afterCollisions(deltaT: number) {
        super.afterCollisions(deltaT);

        this.fallDelayTimer.update(deltaT);

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

    // RESOURCES
    private static SOUND_JUMP: BABYLON.Sound;
    private static SOUND_HIT_HEAD: BABYLON.Sound;
    private static SOUND_DEATH: BABYLON.Sound;
    private static SOUND_DAMAGE: BABYLON.Sound;

    // CONSTANTS
    //  General movement
    private static GROUND_MOVE_SPEED = 0.1;
    private static AIR_MOVE_ACCELERATION = 0.01;
    //  Jump / Crush / Slide
    private static JUMP_IMPULSE = 0.45;
    private static CRUSH_IMPULSE = 0.5;
    private static SIDE_JUMP_IMPULSE = 0.55;
    private static SIDE_XZ_IMPULSE = 0.2;
    private static SIDE_SLIDE_SPEED = 0.05;
    // Damage
    private static DAMAGE_MOVE_IMPULSE = 0.4;
    // Gravity & Max speed
    private static GRAVITY = 0.015;
    private static MAX_Y_SPEED = 0.5;

    private mesh: BABYLON.AbstractMesh;
    private bestHeight: number = 0;
    private explosionParticleSystem: BABYLON.ParticleSystem;
    private health: number = 5;
    private fallDelayTimer: GameTimer = new GameTimer();

    private static MESH_POOL : MeshPool = new MeshPool(2, PoolType.Cloning);
}

enum GUIState {Load, Logo, MainMenu, Ingame}
class GUIManager {
    public static getInstance() : GUIManager { return this.instance; }
    public static async LoadResources() {
        await ResourceLoader.getInstance().loadImageIntoContainer('test', 'https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/guitextures/tmpbackground.png', 0);
    }
    public pushState(newState: GUIState) {
        console.assert(!this.currentStates.some(currentState => currentState == newState));
        this.currentStates.push(newState);
        this.overlayDivs.get(newState)
            .css('z-index', this.currentStates.length + '')
            .show();
        switch(newState) {
            case GUIState.Load:
                let dotCount = 1;
                this.loadingDotInterval = setInterval(() => {
                    dotCount++;
                    if (dotCount > 3)
                        dotCount = 1;
                    let dotStr = '';
                    for (let i = 0; i < dotCount; i++)
                        dotStr += '.';
                    $('#txtLoadingDots').text(dotStr);
                }, 500);
                break;
            case GUIState.Logo:
                var tl = anime.timeline({
                    easing: 'easeOutExpo',
                    duration: 750
                });
                tl
                .add({
                    targets: '#imgCompanyLogo',
                    left: '35%'
                })
                .add({
                    targets: '#imgCompanyLogo',
                    left: '100%',
                    delay: 2000,
                    complete: (anim) => { this.replaceState(GUIState.MainMenu); }
                });
                break;
            case GUIState.Ingame:
                game = new Game();
                game.start();
                break;
            default:
                break;
        }
        window.dispatchEvent(new Event('resize'));

    }
    public popState() {
        const topState = this.currentStates.pop();
        this.overlayDivs.get(topState).hide();
        switch(topState) {
            case GUIState.Load:
                clearInterval(this.loadingDotInterval); this.loadingDotInterval = null;
                break;
            case GUIState.Ingame:
                game.dispose();
                break;
            default:
                break;
        }
    }
    public replaceState(newState: GUIState) {
        if (this.currentStates.length)
            this.popState();
        this.pushState(newState);
    }
    public constructor() {
        $('#txtPlay').on('click', () => { this.replaceState(GUIState.Logo); });
        $('#txtTutorial').on('click', () => { alert("UNIMPLEMENTED"); });
        $('#txtPlayGame').on('click', () => { this.replaceState(GUIState.Ingame); });
        $('#txtAbout').on('click', () => { alert("UNIMPLEMENTED"); });
    }
    private overlayDivs : Map<GUIState, any> = new Map([ 
        [GUIState.Load,$('#divLoadingOverlay')], 
        [GUIState.Logo,$('#divLogoOverlay')],
        [GUIState.MainMenu,$('#divMenuOverlay')],
        [GUIState.Ingame,$('#divInGameOverlay')]
    ]);

    private loadingDotInterval;

    private currentStates: Array<GUIState> = [GUIState.Load];
    private static instance : GUIManager = new GUIManager();
}

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