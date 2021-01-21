import * as BABYLON from 'babylonjs';
import { Scene, BackEase, Mesh, GamepadManager, PhysicsEngine } from 'babylonjs';
import * as BABYLON_MATERIALS from 'babylonjs-materials'

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

interface IDisposable {
    onDispose: NamedEvent<() => void>;
}

// Observable object that fires events
class NamedEvent<T extends CallableFunction> {
    public addListener(callback: T, caller: IDisposable = null) {
        this.subscribers.add(callback);
        if (caller)
            caller.onDispose.addListener(() => this.subscribers.delete(callback));
    }
    public fire(...args) {
        this.subscribers.forEach(callback => callback(...args));
    }
    private subscribers: Set<T> = new Set();
}

class ResourceLoader {
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
        const ratioToAdd = bytes / ResourceLoader.TOTAL_RESOURCES_SIZE_IN_BYTES;
        this.loadedRatio += ratioToAdd;
        this.onLoadingProgress.fire(ratioToAdd);
        if (this.loadedRatio >= 1)
            this.finishLoading();
    }
    private finishLoading() {
        BABYLON.Texture.prototype.constructor = ((...args): any => { console.assert(false, "Attempted to load resource at runtime"); });
        BABYLON.Sound.prototype.constructor = ((...args): any => { console.assert(false, "Attempted to load resource at runtime"); });
        BABYLON.SceneLoader.ImportMesh = ((...args): any => { console.assert(false, "Attempted to load resource at runtime"); });
        this.onLoadingFinish.fire();
    }

    public onLoadingProgress: NamedEvent<(ratioToAdd: number) => void> = new NamedEvent();
    public onLoadingFinish: NamedEvent<() => void> = new NamedEvent();
    private loadedRatio: number = 0;
    private static instance: ResourceLoader = new ResourceLoader();
    private static TOTAL_RESOURCES_SIZE_IN_BYTES: number = 8022788 - 497646;
    private static RESOURCE_PATH = 'https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources';
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
    public forceFinish() {
        console.assert(this.running);
        this.stop();
        this.executeCallback();
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
    private constructor(instanceCount: number, poolType: number) {
        this.instances = new Array(instanceCount);
        this.poolType = poolType;
    }
    public static async FromResources(instanceCount: number, poolType: number, meshName: string, sizeInBytes: number = 0) : Promise<MeshPool> {
        const meshPool = new MeshPool(instanceCount, poolType);
        const loadedMesh = await ResourceLoader.getInstance().loadMesh(meshName, sizeInBytes);
        loadedMesh.isVisible = false;
        loadedMesh.receiveShadows = true;
        meshPool.populatePool(loadedMesh);
        return meshPool;
    }
    public static async FromExisting(instanceCount: number, poolType: number, mesh: BABYLON.Mesh, sizeInBytes: number = 0) : Promise<MeshPool> {
        const meshPool = new MeshPool(instanceCount, poolType);
        mesh.isVisible = false;
        mesh.receiveShadows = true;
        meshPool.populatePool(mesh);
        return meshPool;
    }
    private populatePool(templateMesh: BABYLON.Mesh) {
        for (let i = 0; i < this.instances.length; i++) {
            let instance: BABYLON.AbstractMesh;
            switch(this.poolType) {
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
    public getMesh() : BABYLON.AbstractMesh {
        console.assert(this.instances.length > 0);
        const instance = this.instances.pop();
        instance.isVisible = true;
        return instance;
    }
    public returnMesh(instance : BABYLON.AbstractMesh) {
        instance.isVisible = false;
        instance.unfreezeWorldMatrix();
        this.instances.push(instance);
    }
    private instances: Array<BABYLON.AbstractMesh> = [];
    private poolType: number;
    public static POOLTYPE_INSTANCE: number = 0;
    public static POOLTYPE_CLONE: number = 0;
    public static POOLTYPE_SPS: number = 0;
}

// Singleton input manager
class InputManager {
    private constructor() {
        this.registerActions();
    }
    private registerActions() {
        const keyboardkey_to_virtkey: Map<string, number> = new Map([
            [' ', InputManager.KEY_RIGHT], ['arrowleft', InputManager.KEY_LEFTTRIGGER], ['arrowright', InputManager.KEY_RIGHTTRIGGER],
            ['p', InputManager.KEY_START],
            ['w', InputManager.KEY_W], ['d', InputManager.KEY_D], ['s', InputManager.KEY_S], ['a', InputManager.KEY_A]
        ]);
        const gamepadkey_to_virtkey: Map<number, number> = new Map([
            [3, InputManager.KEY_UP],
            [1, InputManager.KEY_RIGHT],
            [0, InputManager.KEY_DOWN],
            [2, InputManager.KEY_LEFT],
            [9, InputManager.KEY_START],
            [12, InputManager.KEY_W],
            [15, InputManager.KEY_D],
            [13, InputManager.KEY_S],
            [14, InputManager.KEY_A],
            [4, InputManager.KEY_LEFTTRIGGER],
            [5, InputManager.KEY_RIGHTTRIGGER]
        ]);

        const handleGamepadkey = (keydown, virtkey) => {
            if (!virtkey)
                return;
            if (virtkey == 11)
                alert("TEST");
            this.inputMap.set(virtkey, keydown);
            (keydown ? this.onKeyDown : this.onKeyUp).fire(virtkey);
        };

        this.gamepadManager = new BABYLON.GamepadManager();
        this.gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
            if (gamepad instanceof BABYLON.Xbox360Pad || gamepad instanceof BABYLON.DualShockPad) {
                gamepad.ondpaddown((button) => handleGamepadkey(true, gamepadkey_to_virtkey.get(button)));
                gamepad.ondpadup((button) => handleGamepadkey(false, gamepadkey_to_virtkey.get(button)));
                gamepad.onButtonDownObservable.add((button, state) => handleGamepadkey(true, gamepadkey_to_virtkey.get(button)));
                gamepad.onButtonUpObservable.add((button, state) => handleGamepadkey(false, gamepadkey_to_virtkey.get(button)));
            }
            gamepad.onleftstickchanged((values) => { this.leftStickOffset.x = values.x; this.leftStickOffset.y = values.y; })
            gamepad.onrightstickchanged((values) => { this.rightStickOffset.x = values.x; this.rightStickOffset.y = values.y; })
        });

        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => 
            handleGamepadkey(true, keyboardkey_to_virtkey.get(evt.sourceEvent.key.toLowerCase()))));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => 
            handleGamepadkey(false, keyboardkey_to_virtkey.get(evt.sourceEvent.key.toLowerCase()))));
    }
    public static getInstance() : InputManager { return this.instance; }
    public isKeyPressed(key: number) : boolean { return this.inputMap.get(key); };

    public getDpadOffset(): BABYLON.Vector2 {
        const offset = new BABYLON.Vector2();
        if (this.isKeyPressed(InputManager.KEY_W)) offset.y = 1;
        if (this.isKeyPressed(InputManager.KEY_D)) offset.x = 1;
        if (this.isKeyPressed(InputManager.KEY_S)) offset.y = -1;
        if (this.isKeyPressed(InputManager.KEY_A)) offset.x = -1;
        return offset;
    }
    public getLeftStickOffset(): BABYLON.Vector2 {
        const offset = new BABYLON.Vector2();
        if (this.gamepadManager.gamepads.length == 0) {
            if (this.isKeyPressed(InputManager.KEY_W)) offset.y = 1;
            if (this.isKeyPressed(InputManager.KEY_D)) offset.x = 1;
            if (this.isKeyPressed(InputManager.KEY_S)) offset.y = -1;
            if (this.isKeyPressed(InputManager.KEY_A)) offset.x = -1;
        } else {
            offset.set(this.leftStickOffset.x, -this.leftStickOffset.y);
            if (offset.length() < 0.1)
                offset.set(0, 0);
        }
        return offset;
    }

    public onKeyDown: NamedEvent<(virtKey: number) => void> = new NamedEvent();
    public onKeyUp: NamedEvent<(virtKey: number) => void> = new NamedEvent();

    public static KEY_UP: number = 0; public static KEY_RIGHT: number = 1; public static KEY_DOWN: number = 2; public static KEY_LEFT: number = 3;
    public static KEY_LEFTTRIGGER: number = 4; public static KEY_RIGHTTRIGGER: number = 5;
    private static KEY_W: number = 6; private static KEY_D: number = 7; private static KEY_S: number = 8; private static KEY_A: number = 9;
    public static KEY_START: number = 10;

    private gamepadManager: GamepadManager;

    private leftStickOffset: BABYLON.Vector2 = new BABYLON.Vector2();
    private rightStickOffset: BABYLON.Vector2 = new BABYLON.Vector2();
    private inputMap: Map<number, boolean> = new Map();
    private static instance: InputManager = new InputManager();
}

// Singleton camera, rotates in 90 degree increments
class GameCamera {
    public static async LoadResources() : Promise<any> {
        GameCamera.rotateSound = await ResourceLoader.getInstance().loadSound("rotateView.wav", 17250);
    }

    public setY(y: number) { this.node.position.y = y }
    public getY() : number { return this.node.position.y }
    public constructor() {
        this.setupCamera();
        this.setupRotateKeyListener();
    }

    private setupCamera() {
        const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 25, new BABYLON.Vector3(0, 0, 0), scene);
        camera.setPosition(new BABYLON.Vector3(0, 0, 0));
        camera.beta = 0.65;
        camera.radius = 25;
        camera.parent = this.node;
        this.camera = camera;
    }
    private setupRotateKeyListener() {
        scene.onBeforeRenderObservable.add(() => {
            const canRotate : boolean = !this.rotating && game && !game.isPaused();
            const rotateRight : boolean = InputManager.getInstance().isKeyPressed(InputManager.KEY_RIGHTTRIGGER);
            const rotateLeft : boolean = InputManager.getInstance().isKeyPressed(InputManager.KEY_LEFTTRIGGER);
            if ((rotateLeft || rotateRight) && canRotate) {
                const animationBox : BABYLON.Animation = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                animationBox.setKeys([ { frame: 0, value: this.camera.alpha }, { frame: 20, value: this.camera.alpha + (Math.PI / 2) * (rotateRight ? 1 : -1)} ]);
                this.camera.animations = [animationBox];
                scene.beginAnimation(this.camera, 0, 20, false, 1, () => this.onRotationEnd(rotateRight));
                this.onRotationStart();
            }
        });
    }

    private onRotationStart() {
        game.pause();
        this.rotating = true;
        GameCamera.rotateSound.play();
    }
    private onRotationEnd(rotatedRight) {
        game.play();
        this.rotating = false;
        if (rotatedRight)
            this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1);
        else 
            this.rotationIndex = (this.rotationIndex == 0 ? 3 : this.rotationIndex - 1);
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
abstract class GameState implements IDisposable {
    public constructor(context: Game) { this.context = context; }
    public abstract update(deltaT: number);
    public dispose() { this.onDispose.fire(); }
    public onDispose: NamedEvent<() => void> = new NamedEvent();
    protected context: Game;
}
class GameStandard extends GameState {
    public static async LoadResouces() {
        GameStandard.SOUND_PAUSE_IN = await ResourceLoader.getInstance().loadSound("pauseIn.wav", 23028);
        GameStandard.SOUND_PAUSE_OUT = await ResourceLoader.getInstance().loadSound("pauseOut.wav", 22988);
    }
    public constructor(context: Game) { super(context); 
        this.currentLevel = new StartLevel();

        // setup pause callback
        InputManager.getInstance().onKeyDown.addListener((key: number) => {
            switch(key) {
                case InputManager.KEY_START:
                    alert("TEST");
                    if (!this.canPause)
                        break;
                    if (!this.context.isPaused()) {
                        //Game.BACKGROUND_MUSIC.pause();
                        //pauseContainer.isVisible = true;
                        this.context.pause();
                        GameStandard.SOUND_PAUSE_IN.play();
                    } else {
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
    public update(deltaT: number) {
        const lavaSpeed: number = ((this.context.getPlayer().getPos().y - this.context.getLava().position.y) < GameStandard.PLAYER_DISTANCE_FOR_FAST_LAVA) ?
            GameStandard.LAVA_SPEED_STANDARD :
            GameStandard.LAVA_SPEED_FAST;
        this.context.getLava().position.y += lavaSpeed;
        this.currentLevel.update(deltaT);
        this.spectateDelayTimer.update(deltaT);
    }
    
    private currentLevel: Level;
    
    private spectateDelayTimer: GameTimer = new GameTimer();
    private canPause: boolean = true;

    private static SOUND_PAUSE_IN: BABYLON.Sound;
    private static SOUND_PAUSE_OUT: BABYLON.Sound;
    
    private static DEATH_SPECTATE_DELAY: number = 3;
    private static PLAYER_DISTANCE_FOR_FAST_LAVA: number = 60;
    private static LAVA_SPEED_STANDARD: number = 0.0275;
    private static LAVA_SPEED_FAST: number = 0.1;
}
class GameOver extends GameState {
    public static async LoadResouces(): Promise<any> {
        GameOver.SOUND_DRUMROLL_REPEAT = await ResourceLoader.getInstance().loadSound("drumroll.mp3",972077);
        GameOver.SOUND_DRUMROLL_STOP = await ResourceLoader.getInstance().loadSound("drumrollStop.mp3", 25311);
    }
    public constructor(context: Game) { super(context);
        camera.setY(0);
        this.context.getLava().position.y = -15;
        GameOver.SOUND_DRUMROLL_REPEAT.play();
    }
    public dispose() {
        GameOver.SOUND_DRUMROLL_REPEAT.stop();
        GameOver.SOUND_DRUMROLL_STOP.stop();
    }
    public update(deltaT: number) {
        if (!this.towerFlyByComplte) {
            const slowDownY = this.context.getPlayer().getPos().y - 32.256000000000014;
            if (camera.getY() < 32.256000000000014) {
                this.cameraSpeed += 0.016;
            } else if (camera.getY() > slowDownY) {
                this.cameraSpeed -= 0.016;
            }
            camera.setY(camera.getY() + this.cameraSpeed);
            if (this.cameraSpeed <= 0 || (camera.getY() >= this.context.getPlayer().getPos().y)) {
                this.finishTowerFlyBy();
            }
        }
    }
    private finishTowerFlyBy() {
        this.towerFlyByComplte = true;
        GameOver.SOUND_DRUMROLL_REPEAT.stop();
        GameOver.SOUND_DRUMROLL_STOP.play();
    }

    private static SOUND_DRUMROLL_REPEAT: BABYLON.Sound;
    private static SOUND_DRUMROLL_STOP: BABYLON.Sound;
    private towerFlyByComplte: boolean = false;
    private cameraSpeed: number = 0;
}

class Game implements IDisposable {
    public static async LoadResources() : Promise<any> {
        // load sounds
        //Game.BACKGROUND_MUSIC = await ResourceLoader.getInstance().loadSound("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/music/dreamsofabove.mp3");
        //Game.BACKGROUND_MUSIC.loop = true;
        // load lava mesh
        const lava = BABYLON.Mesh.CreateGround("ground", 150, 150, 25, scene);
        lava.visibility = 0.5;
        lava.position.y = -20;
        const lavaMaterial = new BABYLON_MATERIALS.LavaMaterial("lava", scene);	
        lavaMaterial.noiseTexture = await ResourceLoader.getInstance().loadTexture("cloud.png", 72018); // Set the bump texture
        lavaMaterial.diffuseTexture = await ResourceLoader.getInstance().loadTexture("lavatile.jpg", 457155); // Set the diffuse texture
        lavaMaterial.speed = 0.5;
        lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
        lavaMaterial.unlit = true;
        lavaMaterial.freeze();
        lava.material = lavaMaterial;
        lava.isVisible = false;
        //lavaMaterial.blendMode = BABYLON.Engine.ALPHA_MULTIPLY;
        Game.MESH_LAVA = lava;

        await Promise.all([
            GameStandard.LoadResouces(),
            GameOver.LoadResouces()
        ]);
    }
    public dispose() {
        this.onDispose.fire();
        clearInterval(this.updateInterval);
        this.physBoxesSortedY.forEach((physBox) => physBox.dispose());
        this.lava.dispose();
    }

    private createStartingEntities() {
        // create lava
        this.lava = Game.MESH_LAVA.createInstance('');

        // create frozen box at the bottom to catch them all
        let bottomBox = new FloorBox();
        bottomBox
                .freeze()
                .setPos(new BABYLON.Vector3(0, 0, 0));

        // create the player
        const player = new Player();
        player.setPos(new BABYLON.Vector3(0, 0, 0));
        player.setSide(Sides.Bottom, bottomBox.getSide(Sides.Top));
        this.player = player;
    }

    public getLavaLevel() : number { return this.lava.position.y - 1; }
    public pause() { this.running = false; }
    public play() { this.running = true; }
    public isPaused() { return !this.running; }
    public start() {
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

    public addPhysBox(box) { this.physBoxesSortedY.push(box); this.physBoxToYIndex.set(box, this.getClosestYIndex(box.getPos().y)); }
    public getPhysObjects() { return this.physBoxesSortedY; }
    public getPlayer() : Player { return this.player; }
    public getLava(): BABYLON.TransformNode { return this.lava; }

    public setState(state: GameState) {
        if (this.currentState)
            this.currentState.dispose();
        this.currentState = state;
    }
    private update(deltaT: number) {
        if (!this.running)
            return;
        t++;
        if (this.currentState)
            this.currentState.update(deltaT);

        this.ySortBoxes();
        const physboxes = this.getPhysBoxesInRange(this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA, Number.POSITIVE_INFINITY);
        physboxes.forEach(pbox => pbox.beforeCollisions(deltaT));
        physboxes.forEach(pbox => pbox.resolveCollisions(deltaT));
        physboxes.forEach(pbox => pbox.afterCollisions(deltaT));
        this.updateVisiblePhysBoxes();
    }
    private updateVisiblePhysBoxes() {
        // TODO: Replace magic numbers 100 and 25 with calculated values based on the cameras pitch
        const visiblePhysBoxes = this.getPhysBoxesInRange(camera.getY() - 100, camera.getY() + 25);
        visiblePhysBoxes.forEach((physbox) => {
            if (physbox.isObservable()) this.observedEntitiesThisUpdate.add(physbox);
        });
        this.observedEntitiesLastUpdate.forEach((physBox) => {
            if (!this.observedEntitiesThisUpdate.has(physBox)) physBox.endObservation();
        });
        this.observedEntitiesThisUpdate.forEach((physBox) => {
            if (!this.observedEntitiesLastUpdate.has(physBox)) physBox.startObservation();
        });
        const tmp = this.observedEntitiesLastUpdate;
        this.observedEntitiesLastUpdate = this.observedEntitiesThisUpdate;
        this.observedEntitiesThisUpdate = tmp;
        this.observedEntitiesThisUpdate.clear();
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
    private static MESH_LAVA: BABYLON.Mesh;

    // GAME CONSTANTS
    private static UPDATE_FREQUENCY_PER_SECOND: number = 60;
    private static MAXIMUM_YDISTANCE_UNDER_LAVA: number = 100;

    // events
    public onDispose: NamedEvent<() => void> = new NamedEvent();

    // state
    private currentState: GameState;
    private running : boolean = true;

    // callbacks
    private updateInterval;

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

// Enum-like class for definining collision groups
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

abstract class PhysBox implements IDisposable {
    public constructor() {
        game.addPhysBox(this);
    }
    // destructor
    public dispose() { this.endObservation(); this.onDispose.fire(); this.disposed = true; }
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
    public freeze() : PhysBox { 
        this.frozen = true; 
        this.onFreezeStateChange.fire(true); 
        if (this.instance) this.instance.freezeWorldMatrix();
        return this; 
    }
    public unfreeze() : PhysBox { 
        this.frozen = false; 
        this.onFreezeStateChange.fire(false);
        if (this.instance) this.instance.unfreezeWorldMatrix(); 
        return this; }
    public isFrozen() : boolean { return this.frozen; }

    // collisions
    protected getCollisionGroup() : CollisionGroups { return this.collisionGroup; }
    protected setCollisionGroup(collisionGroup : CollisionGroups) { this.collisionGroup = collisionGroup; }
    public getMoverLevel() : number { return this.moverLevel; }
    public setMoverLevel(moverLevel: number) { this.moverLevel = moverLevel; }
    public getCollisionBuffer(side: Sides) : number { return this.collisionBuffers.get(side); }
    public setCollisionBuffer(side: Sides, extent: number) { return this.collisionBuffers.set(side, extent); }
    public clearCollisionBuffer() { Sides.All.forEach(side => this.collisionBuffers.set(side, 0)); }

    // should the physbox register a collision with the other? (ghost collision)
    public logicallyIntersects(otherBox: PhysBox) : boolean { return this.getCollisionGroup().collides(otherBox.getCollisionGroup()); }

    // does the physbox physically collide with another? (solid collision)
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
        if (this.frozen) this.instance.freezeWorldMatrix();
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
        this.velocity.y = Math.max(this.getVelocity().y - this.gravity * t, -this.terminalVelocity);

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

    public onDispose: NamedEvent<() => void> = new NamedEvent();

    public onFreezeStateChange: NamedEvent<(frozen: boolean) => void> = new NamedEvent();

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
abstract class Level {
    protected abstract getApproxTowerHeight(): number;
    protected abstract generateFallBox(lastY: number): FallBox;
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
            const fallBox = this.generateFallBox(topBoxY);
            fallBox.onFreezeStateChange.addListener((frozen: boolean) => {
                if (frozen) {
                    if ((this.levelState == LevelState.GeneratingTower) && (fallBox.getSide(Sides.Top) >= this.getApproxTowerHeight()))
                        this.setState(LevelState.FinishedTower);
                    console.log(fallBox.getSide(Sides.Top));
                }
            });
            this.myboxes.push(fallBox);
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
                const boxingRingTop = new BoxingRingTop();
                boxingRingTop.setSide(Sides.Bottom, boxingRingBottom.getSide(Sides.Top) + 2);
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
    public static XZSpread: number = 7;
}
class StartLevel extends Level {
    public constructor() {
        super();
    }
    protected getBoxYIncrement(): number { return Math.random() * 3; }
    protected getApproxTowerHeight(): number { return 300; }
    protected generateFallBox(lastY: number) : FallBox {
        const fallbox = new FallBoxBasic(lastY + PhysBox.MAXIMUM_HEIGHT + this.getBoxYIncrement());
        return fallbox;
    }
}

class FloorBox extends PhysBox {
    public static async LoadResources() {
        const mesh = BABYLON.MeshBuilder.CreateBox('', {width: 14, height: 2, depth: 14}, scene);
        const material = new BABYLON.StandardMaterial('', scene);
        material.diffuseTexture = await ResourceLoader.getInstance().loadTexture("floorBox.png", 7415);
        material.freeze();
        mesh.material = material;
        this.MESH_POOL = await MeshPool.FromExisting(1, MeshPool.POOLTYPE_INSTANCE, mesh, 0);
    }
    public getMeshPool() : MeshPool { return FloorBox.MESH_POOL; }
    public constructor() {
        super();
        this.setCollisionGroup(CollisionGroups.Level);
        this.setMoverLevel(2);
        this.setNormalizedSize(new BABYLON.Vector3(14, 2, 14));
    }
    private static MESH_POOL: MeshPool;
}

class BoxingRingBottom extends PhysBox{
    public static async LoadResources() {
        this.MESH_POOL = await MeshPool.FromResources(3, MeshPool.POOLTYPE_CLONE, 'boxingringbottom.obj', 254548);
    }
    public constructor() {
        super();
        super.setCollisionGroup(CollisionGroups.Level);
        this.setNormalizedSize(new BABYLON.Vector3(18,3.2,18));
        this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
        this.setMoverLevel(2);
    }
    public getMeshPool() : MeshPool { return BoxingRingBottom.MESH_POOL; }
    private static MESH_POOL: MeshPool;
}
class BoxingRingTop extends PhysBox{
    public static async LoadResources() {
        this.MESH_POOL = await MeshPool.FromResources(3, MeshPool.POOLTYPE_CLONE, 'boxingringbottom.obj', 3145633);
    }
    public constructor() {
        super();
        super.setCollisionGroup(CollisionGroups.Level);
        this.setNormalizedSize(new BABYLON.Vector3(18, 8.3, 18));
        this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
        this.setMoverLevel(2);
    }
    public getMeshPool() : MeshPool { return BoxingRingTop.MESH_POOL; }
    private static MESH_POOL: MeshPool;
}

class Coin extends PhysBox {
    public static async LoadResources() {
        this.SOUND_COIN = await ResourceLoader.getInstance().loadSound("coinCollect.wav", 31074);
        this.MESH_POOL = await MeshPool.FromResources(50, MeshPool.POOLTYPE_INSTANCE, 'coin.obj', 6216);
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
    private static MESH_POOL: MeshPool;
    private static REVS_PER_SECOND = 0.5;
    private static SOUND_COIN : BABYLON.Sound;
}

abstract class FallBox extends PhysBox {
    public constructor(yValue: number) {
        super();
        this.setMoverLevel(2);
        this.setCollisionGroup(CollisionGroups.Level);
        this.getPos().y = yValue;
    }
    public moveXZOutOfCollisions() {
        const yValue: number = this.getPos().y;
        do {
            this.setPos(new BABYLON.Vector3(-Level.XZSpread + Math.random() * (Level.XZSpread*2), yValue, -Level.XZSpread + Math.random() * (Level.XZSpread*2)));
        } while (game.getCollisions(this).length != 0)
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
        const mesh = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
        const material = new BABYLON.StandardMaterial('', scene);
        mesh.material = material;
        this.MESH_POOL = await MeshPool.FromExisting(300, MeshPool.POOLTYPE_INSTANCE, mesh, 0);
    }
    public constructor(yValue: number) {
        super(yValue);
        const rnd = Math.random();
        if (rnd <= 0.33) {
            this.setScale(2);
        } else if (rnd <= 0.66) {
            this.setScale(3);
        } else {
            this.setScale(5);
        }
        if (rnd <= 0.3) {
            this.setCollisionBuffer(Sides.Top, 1);
        }
        this.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
        this.moveXZOutOfCollisions();
        if (this.getCollisionBuffer(Sides.Top) == 1) {
            this.setCollisionBuffer(Sides.Top, 0);
            const coin = new Coin();
            coin.setPos(this.getPos());
            coin.setSide(Sides.Bottom, this.getSide(Sides.Top));
            coin.setGravity(9);
        }
        this.clearCollisionBuffer();
    }
    public getMeshPool() : MeshPool {
        return FallBoxBasic.MESH_POOL;
    }
    private static MESH_POOL: MeshPool;
}

class GoombaEnemy extends PhysBox {
    public getMeshPool() : MeshPool { return GoombaEnemy.MESH_POOL; }
    public static async LoadResources() {
        const mesh = BABYLON.MeshBuilder.CreateBox('', { size: 0.4 }, scene);
        const material = new BABYLON.StandardMaterial('', scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        mesh.material = material;
        GoombaEnemy.MESH_POOL = await MeshPool.FromExisting(30, MeshPool.POOLTYPE_INSTANCE, mesh, 0);
    }
    public constructor() {
        super();
        this.setCollisionGroup(CollisionGroups.Enemy);
        this.setGravity(7);
    }
    public beforeCollisions(deltaT: number) {
        super.beforeCollisions(deltaT);
        this.determineVelocities();
    }
    public determineVelocities() {
        //this.getCollisions(Sides.Bottom).size == 
    }
    private static MESH_POOL: MeshPool;
}

class Player extends PhysBox {
    public static async LoadResources() {
        Player.SOUND_DAMAGE = await ResourceLoader.getInstance().loadSound("damage.wav", 12514);
        Player.SOUND_JUMP = await ResourceLoader.getInstance().loadSound("jump.wav", 9928);
        Player.SOUND_HIT_HEAD = await ResourceLoader.getInstance().loadSound("hitHead.wav", 8418);
        Player.SOUND_DEATH = await ResourceLoader.getInstance().loadSound("death.wav", 138110);
        Player.MESH_POOL = await MeshPool.FromResources(2, MeshPool.POOLTYPE_CLONE, 'player.obj', 7654);
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
        this.onDeath.fire();
        setTimeout(() => this.explosionParticleSystem.stop(), 150);
    }

    public damadge(damadger: PhysBox = null) : boolean {
        // we may be damadged by multiple entities in the same frame, before invulnerability
        // has been applied. prevent multiple damadges in the same frame
        if (this.invulnerabilityTimer.isRunning())
            return false;
        this.health--;
        if (this.health == 0) {
            this.kill();
        } else {
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

    public onCollisionStart(side: Sides, physBox: PhysBox) { 
        if (side == Sides.Top && physBox instanceof FallBox) {
            if(!Player.SOUND_HIT_HEAD.isPlaying)
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

    private determineVelocities() {
        const offset = InputManager.getInstance().getLeftStickOffset();
        const movement = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(offset.x, 0, offset.y),
            BABYLON.Matrix.RotationYawPitchRoll(-(Math.PI / 2) * camera.getRotationIndex(), 0, 0)
        );

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
                    if (InputManager.getInstance().isKeyPressed(InputManager.KEY_RIGHT)) {
                        this.getVelocity()[side.dim] = Player.SIDE_XZ_IMPULSE * side.direction * -1; this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                        if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                        if (this.gravityDelayTimer.isRunning()) this.gravityDelayTimer.forceFinish();
                    }
                }
            });    
        }

        if (count && !InputManager.getInstance().isKeyPressed(InputManager.KEY_RIGHT)) {
            avgYSpeed /= count;                                 // find average speed of the boxes the player is pressing against
            avgYSpeed -= Player.SIDE_SLIDE_SPEED;               // and add the slide speed to find the players velocity when sliding  
            // only let the player slide if their velocity is already less than this speed (don't allow them to stick automatically, they have to fall a bit first)
            if (this.getVelocity().y <= avgYSpeed) {
                this.getVelocity().y = avgYSpeed;
                this.setGravity(0);
            }
        } else if (!this.gravityDelayTimer.isRunning()) {
            // not sliding, apply GRAVITY as normal
            this.setGravity(Player.GRAVITY);
        }

        // grounded, apply movement velocity instantaneously
        if (this.getCollisions(Sides.Bottom).size) {
            const xzMovement = movement.scale(Player.GROUND_MOVE_SPEED);
            this.getVelocity().copyFromFloats(xzMovement.x, this.getVelocity().y, xzMovement.z);
            if (InputManager.getInstance().isKeyPressed(InputManager.KEY_RIGHT)) {
                if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                this.getVelocity().y = Player.JUMP_IMPULSE;
            }    
        } 
        // in-air, apply movement velocity through acceleration
        else {
            const xzMovement = movement.scale(Player.AIR_MOVE_ACCELERATION).addInPlaceFromFloats(this.getVelocity().x, 0, this.getVelocity().z);
            const xzLen = xzMovement.length();
            // clamp the players velocity, don't allow them to move any faster in the air than on ground
            if (xzLen > Player.GROUND_MOVE_SPEED)
                xzMovement.normalize().scaleInPlace(Player.GROUND_MOVE_SPEED);
            // drift back into resting if the control stick isn't moving
            if (movement.lengthSquared() == 0 && xzLen <= (Player.AIR_MOVE_ACCELERATION / 2))
                xzMovement.setAll(0);
            else if (movement.lengthSquared() == 0)
                xzMovement.normalize().scaleInPlace(xzLen - Player.AIR_MOVE_ACCELERATION / 2);;
            this.getVelocity().copyFromFloats(xzMovement.x, this.getVelocity().y, xzMovement.z);

            // the player can ground-pound while in the air
            if (InputManager.getInstance().isKeyPressed(InputManager.KEY_DOWN)) {
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
    private static GRAVITY = 0.9;
    private static MAX_Y_SPEED = 0.5;

    public onDeath: NamedEvent<() => void> = new NamedEvent();

    private mesh: BABYLON.AbstractMesh;
    private bestHeight: number = 0;
    private explosionParticleSystem: BABYLON.ParticleSystem;
    private health: number = 5;

    private gravityDelayTimer: GameTimer = new GameTimer();     private static GRAVITY_DELAY_TIME_IN_SECONDS: number = 0.2;
    private invulnerabilityTimer: GameTimer = new GameTimer();  private static INVULNERABILITY_DELAY_TIME_IN_SECONDS: number = 2;

    private static MESH_POOL : MeshPool;
}

abstract class GUIState {
    public constructor(context: GUIManager) { this.context = context; }
    public onEnter(lastState: GUIState) {
        this.getStateDiv()
            .css('z-index', (this.context.getActiveStateCount() + ''))
            .show();
    }
    public onEnd() {
        this.getStateDiv()
            .hide();
    }
    public onCoverStart(newState: GUIState) { }
    public onCoverEnd() { } 
    public abstract getStateDiv(): any;
    protected context: GUIManager;
}

class GUIStateLoad extends GUIState {
    public constructor(context: GUIManager) {
        super(context);
        $('#txtPlay').on('click', () => { 
            this.context.replaceState(this.context.STATE_LOGO);  
        });
    }
    public onEnter(lastState: GUIState) {
        super.onEnter(lastState);

        let dotCount = 3;
        this.loadingDotInterval = setInterval(() => {
            dotCount++;
            if (dotCount > 3) dotCount = 1;
            $('.txtLoadingDots').css("visibility", "hidden");
            if (dotCount >= 1) $('#txtLoadingDots1').css("visibility", "visible");
            if (dotCount >= 2) $('#txtLoadingDots2').css("visibility", "visible");
            if (dotCount >= 3) $('#txtLoadingDots3').css("visibility", "visible");
        }, 500);

        ResourceLoader.getInstance().onLoadingProgress.addListener((ratioToAdd: number) => {
            this.animationBarRatios.push(ratioToAdd);
            if (!this.isAnimating)
                this.updatePendingAnimations();
        });
    }
    public onEnd() {
        super.onEnd();
        clearInterval(this.loadingDotInterval); this.loadingDotInterval = null;
    }
    public getStateDiv() { return $('#divLoadingOverlay'); }

    private updatePendingAnimations() {
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
            })
        }
    }

    // loading state
    private static ANIMATION_TIME_MS : number = 2000;
    private animationBarRatios: Array<number> = [];
    private totalLoadedRatio: number = 0;
    private isAnimating: boolean = false;
    private loadingDotInterval: number = 0;
}
class GUIStateLogo extends GUIState {
    public onEnter(lastState: GUIState) {
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
    public onEnd() { 
        super.onEnd();
    }
    public getStateDiv() { return $('#divLogoOverlay'); }
}
class GUIStateMenu extends GUIState {
    public static async LoadResources() {
        GUIStateMenu.backgroundSound = await ResourceLoader.getInstance().loadSound("menuback.mp3", 2413805);
        GUIStateMenu.backgroundSound.loop = true;
    }
    public onEnter(lastState: GUIState) {
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
    public onEnd() {
        super.onEnd();
        GUIStateMenu.backgroundSound.stop();
    }
    public getStateDiv() { return $('#divMenuOverlay'); }
    
    private static backgroundSound: BABYLON.Sound;
}
class GUIStateMenuMain extends GUIState {
    public constructor(context: GUIManager) {
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
    public onEnter(lastState: GUIState) {
        super.onEnter(lastState);
    }
    public onEnd() {
        super.onEnd();
    }
    public getStateDiv() { return $('#divMenuMainOverlay'); }
}

class GUIStateMenuScores extends GUIState {
    public onEnter(lastState: GUIState) {
        super.onEnter(lastState);
    }
    public onEnd() {
        super.onEnd();
    }
    public getStateDiv() { return $('#divMenuScoresOverlay'); }
}
class GUIStateMenuAbout extends GUIState {
    public onEnter(lastState: GUIState) {
        super.onEnter(lastState);
    }
    public onEnd() {
        super.onEnd();
    }
    public getStateDiv() { return $('#divMenuAboutOverlay'); }
}
class GUIStateMenuSettings extends GUIState {
    public onEnter(lastState: GUIState) {
        super.onEnter(lastState);
    }
    public onEnd() {
        super.onEnd();
    }
    public getStateDiv() { return $('#divMenuSettingsOverlay'); }
}

class GUIStateInGame extends GUIState {
    public onEnter(lastState: GUIState) {
        super.onEnter(lastState);
        //console.assert(lastState == GUIState.Logo);
        game = new Game();
        game.start();
    }
    public onEnd() {
        super.onEnd();
        game.dispose();
    }
    public getStateDiv() { return $('#divInGameOverlay'); }
}

class GUIManager {
    public static getInstance() : GUIManager { return this.instance; }
    public static async LoadResources() {
        //await ResourceLoader.getInstance().loadImageIntoContainer('test', 'https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/guitextures/tmpbackground.png', 0);
    }
    public pushState(newState: GUIState, replacedLastState: GUIState = null) {
        console.assert(!this.currentStates.some(state => state == newState), "GUIManager: Attempted to push an already active state to the state list");
        const lastState = replacedLastState || this.getCurrentState();
        if (!replacedLastState && lastState)
            lastState.onCoverStart(newState);
        this.currentStates.push(newState);
        newState.onEnter(lastState);
        window.dispatchEvent(new Event('resize'));

    }
    public popState() {
        const poppedState = this.currentStates.pop();
        poppedState.onEnd();
        const newCurrentState = this.getCurrentState();
        if (newCurrentState)
            newCurrentState.onCoverEnd();
    }
    public replaceState(newState: GUIState) {
        const replacedState = this.getCurrentState();
        if (this.currentStates.length)
            this.popState();
        this.pushState(newState, replacedState);
    }
    public getActiveStateCount() : number { return this.currentStates.length; }
    private getCurrentState() : GUIState { return this.currentStates.length > 0 ? this.currentStates[this.currentStates.length - 1] : null; }
    public constructor() {
        $('.makeRelative').each(function() {
            const elm = $(this);
            elm.css("font-size",GUIManager.convertPixelToPercentage(elm.css('height'), 'y')  + 'vh');
            elm.css("width",    GUIManager.convertPixelToPercentage(elm.css('width'), 'x')      + '%');
            elm.css("height",   GUIManager.convertPixelToPercentage(elm.css('height'), 'y')     + '%');
            elm.css("left",     GUIManager.convertPixelToPercentage(elm.css('left'), 'x')       + '%');
            elm.css("top",      GUIManager.convertPixelToPercentage(elm.css('top'), 'y')        + '%');
        });

        this.pushState(this.STATE_LOAD);
        //this.pushState(GUIManager.STATE_MENU);
    }

    public static convertPixelToPercentage(pixelValue: string|number, axis: string) : number {
        return ((parseInt(pixelValue.toString().replace('px', '')) / (axis == 'x' ? GUIManager.REFERENCE_WIDTH : GUIManager.REFERENCE_HEIGHT)) * 100);
    }

    public STATE_LOAD = new GUIStateLoad(this);
    public STATE_LOGO = new GUIStateLogo(this);
    public STATE_MENU = new GUIStateMenu(this);
    public STATE_MENUMAIN = new GUIStateMenuMain(this);
    public STATE_INGAME = new GUIStateInGame(this);
    public STATE_MENUSCORES = new GUIStateMenuScores(this);
    public STATE_MENUABOUT = new GUIStateMenuAbout(this);
    public STATE_MENUSETTINGS = new GUIStateMenuSettings(this);

    private static REFERENCE_WIDTH = 1920;
    private static REFERENCE_HEIGHT = 1277;

    private currentStates: Array<GUIState> = [];
    private static instance : GUIManager = new GUIManager();
}

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