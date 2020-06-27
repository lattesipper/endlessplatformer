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
    centerBox.width = 0.5
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
    public static LoadResources() : Promise<any> {
        return Promise.all([
            new Promise((resolve) => {
                GameCamera.rotateSound = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/rotateView.wav", scene, resolve, {
                    loop: false,
                    autoplay:  false,
                    volume: 0.5
                })
            })
        ]);
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
            if (InputManager.getInstance().isKeyPressed('arrowright') && !this.rotating) {
                var animationBox : BABYLON.Animation = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                animationBox.setKeys([ { frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha + (Math.PI / 2) } ]);
                camera.animations = [animationBox];
                scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1); });
                this.rotating = true;
                game.pause();
                GameCamera.rotateSound.play();
            } 
            // rotate camera left 90 degrees
            else if (InputManager.getInstance().isKeyPressed('arrowleft') && !this.rotating) {
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
    public flip() {
        switch(this) {
            case Sides.Left: return Sides.Right;    case Sides.Right: return Sides.Left;
            case Sides.Top: return Sides.Bottom;    case Sides.Bottom: return Sides.Top;
            case Sides.Forward: return Sides.Back;  case Sides.Back: return Sides.Forward;
        }
    }
    public static Left = new Sides('x', -1);        public static Right = new Sides('x', 1);
    public static Forward = new Sides('z', 1);      public static Back = new Sides('z', -1);
    public static Top = new Sides('y', 1);          public static Bottom = new Sides('y', -1);
    public dim : string;
    public direction : number;
}

enum GameMode {
    Playing,
    Spectating
}
// Game class, responsible for managing contained phys-objects
class Game {
    public static LoadResources() : Promise<any> {
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
    public getHighestPhysBox() : PhysBox { return this.physBoxesSortedY[this.physBoxesSortedY.length - 1]; }
    private changeMode(mode: GameMode) {
        switch(mode) {
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
                    this.lava.position.y = -15;
                    this.deathDelayOver = true;
                    this.mode = GameMode.Spectating;
                    camera.setBeta(Math.PI / 2);
                    camera.setRadius(50);
                    Game.SOUND_DRUMROLL_REPEAT.play();
                }, 3000);
                this.canPause = false;
                break;
        }
    }
    private update() {
        t++;
        if (!this.running)
            return;
        // perform mode-specific update logic
        switch(this.mode) {
            case GameMode.Playing:
                if ((this.player.getPos().y - this.lava.position.y) < Game.PLAYER_DISTANCE_FOR_FAST_LAVA) {
                    this.lava.position.y += Game.LAVA_SPEED_STANDARD;
                } else {
                    this.lava.position.y += Game.LAVA_SPEED_FAST;
                }
                // update the sorted physbox list for sort&sweep collisions
                this.ySortBoxes();
                // resolve physbox collisions
                for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) 
                { const pbox = this.physBoxesSortedY[i]; if (pbox.isActive() && !pbox.isDisposed()) pbox.beforeCollisions(); }
                for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) 
                { const pbox = this.physBoxesSortedY[i]; if (pbox.isActive() && !pbox.isDisposed()) pbox.resolveCollisions(0); }
                for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) 
                { const pbox = this.physBoxesSortedY[i]; if (pbox.isActive() && !pbox.isDisposed()) pbox.afterCollisions(); }
                // update fallbox clusters
                this.fallboxClusters.forEach(cluster => { if (!cluster.isDisposed()) cluster.update(); });
                break;
            case GameMode.Spectating:
                if (!this.deathDelayOver)
                    break;
                this.testT += 1;
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
                break;
        }
    }
    private finishTowerFlyBy() {
        this.towerFlyByComplte = true;
        Game.SOUND_DRUMROLL_REPEAT.stop();
        Game.SOUND_DRUMROLL_STOP.play();
    }
    public dispose() {
        Game.BACKGROUND_MUSIC.stop();
        scene.onBeforeRenderObservable.removeCallback(this.updateCallbackFunc);
        this.physBoxesSortedY.forEach((physBox) => physBox.dispose());
        this.fallboxClusters.forEach((cluster) => cluster.dispose());
        this.lava.dispose();
        this.callbackFunctions.forEach((func) => func());
    }
    public getLavaLevel() : number { return this.lava.position.y - 1; }
    public pause() { this.running = false; }
    public play() { this.running = true; }
    public start() {
        // setup update callback
        this.updateCallbackFunc = (() => this.update());
        scene.onBeforeRenderObservable.add(this.updateCallbackFunc);

        // setup pause callback
        this.callbackFunctions.push(
            InputManager.getInstance().onEvent('keyDown', (key) => {
                if (this.canPause) {
                    switch(key) {
                        case 'p':
                            if (this.running) {
                                Game.BACKGROUND_MUSIC.pause();
                                pauseContainer.isVisible = true;
                                this.running = false;
                                Game.SOUND_PAUSE_IN.play();
                            } else {
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
            })
        );

        // create lava
        this.lava = Game.MESH_LAVA.createInstance('');

        // create frozen box at the bottom to catch them all
        let bottomBox = new FloorBox();
        bottomBox
                .freeze()
                .setPos(new BABYLON.Vector3(0, 0, 0))
                .setSize(new BABYLON.Vector3(10, 2, 10));
        this.addPhysBox(bottomBox);

        // create initial cube cluster
        this.createNewCluster(200, 20);

        // all is ready, create the player
        const player = new Player();
        player.setPos(new BABYLON.Vector3(0, 0, 0));
        player.setSide(Sides.Bottom, bottomBox.getSide(Sides.Top));
        this.addPhysBox(player);
        this.callbackFunctions.push(
            player.onEvent('death', () => {
                this.changeMode(GameMode.Spectating);
            })
        );
        this.player = player;

        // play background music
        Game.BACKGROUND_MUSIC.loop = true;
        Game.BACKGROUND_MUSIC.setVolume(0.5);
        Game.BACKGROUND_MUSIC.play();
        camera.resetRotationindex();
        camera.setBeta(0.65);
        camera.setRadius(25);
    }
    public createNewCluster(cubeCount, startY) { this.fallboxClusters.push(new FallBoxCluster(cubeCount, startY)); }

    public addPhysBox(box) { this.physBoxesSortedY.push(box); }

    public getPhysObjects() { return this.physBoxesSortedY; }
    public getPlayer() : Player { return this.player; }

    // SORT
    private ySortBoxes() { 
        // O(N) average case for insertion sort after physbox updates
        for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
            let j = i - 1;
            let tmp = this.physBoxesSortedY[i];
            while (j >= 0 && this.physBoxesSortedY[j].getPos().y > tmp.getPos().y) {
                this.physBoxesSortedY[j + 1] = this.physBoxesSortedY[j];
                j--
            }
            this.physBoxesSortedY[j+1] = tmp;
            this.physBoxToYIndex.set(tmp, j+1);
        }
        // Update cutoff y index (anything below is lost to the lava, and need not be resorted or updated)
        for (let i = this.updateCutoffYIndex; i < this.physBoxesSortedY.length; i++) {
            if (this.physBoxesSortedY[i].getPos().y < (this.lava.position.y - Game.MAXIMUM_YDISTANCE_UNDER_LAVA))
                this.updateCutoffYIndex = i;
        }
    }
    // SWEEP AND PRUNE
    public getCollisions(physBox: PhysBox, dim: string) {
        let yIndex = this.physBoxToYIndex.get(physBox);
        let collisions = [];
        let tests = 0;
        if (dim != 'y' || physBox.getVelocity().y < 0) {
            for (let i = yIndex; i >= 0; i--) {
                let candiate = this.physBoxesSortedY[i];
                tests++;
                if (candiate.isActive() && physBox.intersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + (PhysBox.MAXIMUM_HEIGHT/2)))
                    break;
            }
        }
        if (dim != 'y' || physBox.getVelocity().y > 0) {
            for (let i = yIndex; i < this.physBoxesSortedY.length; i++) {
                tests++;
                let candiate = this.physBoxesSortedY[i];
                if (candiate.isActive() && physBox.intersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Top) < (candiate.getPos().y - (PhysBox.MAXIMUM_HEIGHT/2)))
                    break;
            }
        }
        // if (physBox instanceof Player && Math.random() > 0.99) {
        //     console.log(tests);
        // }
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
    private static PLAYER_DISTANCE_FOR_FAST_LAVA: number = 75;
    private static LAVA_SPEED_STANDARD: number = 0.035;
    private static LAVA_SPEED_FAST: number = 0.2;
    private static MAXIMUM_YDISTANCE_UNDER_LAVA: number = 100;

    private cameraSpeed: number = 0;

    private mode: GameMode = GameMode.Playing;
    private deathDelayOver: boolean = false;
    private canPause: boolean = true;

    private updateCallbackFunc;
    private callbackFunctions : Array<CallableFunction> = [];

    private running : boolean = true;
    private fallboxClusters : Array<FallBoxCluster> = [];

    private physBoxesSortedY: Array<PhysBox> = [];
    private physBoxToYIndex = new Map<PhysBox, number>();
    private updateCutoffYIndex: number = 0;

    private testT: number = 0;
    private towerFlyByComplte: boolean = false;

    private player: Player;
    private lava: BABYLON.TransformNode;
}

class GameObj extends Observable {}
class BoundBox extends GameObj {
    public getPos() { return this.node.position; }
    public setPos(pos: BABYLON.Vector3) : BoundBox { this.node.position.copyFrom(pos); return this; }
    public setSize(size: BABYLON.Vector3) : BoundBox { this.node.scaling.copyFrom(size); return this; }
    public getSize() : BABYLON.Vector3 { return this.node.scaling; }
    public getSide(side : Sides) { return this.node.position[side.dim] + (this.node.scaling[side.dim] * 0.5 * side.direction) }
    public setSide(side : Sides, value : number) { this.node.position[side.dim] = value - (this.node.scaling[side.dim] * 0.5 * side.direction); }
    public intersects(otherBox: BoundBox) : boolean {
        // bounding boxes can't collide with themselves
        if (otherBox == this)
            return false;
        // a collision occurs if there is no axis that seperates the two bounding boxes
        return (
            !(this.getSide(Sides.Left) > otherBox.getSide(Sides.Right)) &&
            !(this.getSide(Sides.Right) < otherBox.getSide(Sides.Left)) &&
            !(this.getSide(Sides.Back) > otherBox.getSide(Sides.Forward)) &&
            !(this.getSide(Sides.Forward) < otherBox.getSide(Sides.Back)) &&
            !(this.getSide(Sides.Bottom) > otherBox.getSide(Sides.Top)) &&
            !(this.getSide(Sides.Top) < otherBox.getSide(Sides.Bottom))
        );
    }
    private node: BABYLON.TransformNode = new BABYLON.TransformNode('', scene);
}

class PhysBox extends BoundBox {
    public setVelocity(velocity: BABYLON.Vector3) : PhysBox { this.velocity = velocity.clone(); return this; }
    public getVelocity() { return this.frozen ? PhysBox.FROZEN_VELOCITY : this.velocity; }

    public isActive() : boolean { return this.active; }
    public disable() { this.active = false; }
    public enable() { this.active = true; }

    public freeze() : PhysBox { this.frozen = true; this.fire('freeze', true); return this; }
    public unfreeze() : PhysBox { this.frozen = false; this.fire('freeze', false); return this; }
    public isFrozen() : boolean { return this.frozen; }

    public getMoverLevel() : number { return 1; }

    public dispose() { this.disposed = true; }
    public isDisposed() : boolean { return this.disposed; }

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

    public beforeCollisions() {
        let tmp = this.collisionsThisUpdate;
        this.collisionsLastUpdate.forEach((collisions, side) => collisions.clear());
        this.collisionsThisUpdate = this.collisionsLastUpdate;
        this.collisionsLastUpdate = tmp;
    }
    public afterCollisions() {
        this.collisionsThisUpdate.forEach((collisions, side) => {
            collisions.forEach((collision) => {
                if (!this.collisionsLastUpdate.get(side).has(collision))
                    this.onCollisionStart(side, collision);
                else 
                    this.onCollisionHold(side, collision);
            });
        });
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
                    } else break;
                }
            } else if (yVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Bottom) - b.getSide(Sides.Bottom));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.collisionsThisUpdate.get(Sides.Top).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Bottom, this);
                        this.setSide(Sides.Top, hits[i].getSide(Sides.Bottom) - 0.001);
                    } else break;
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
                    } else break;
                }
            } else if (xVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Left) - b.getSide(Sides.Left));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.collisionsThisUpdate.get(Sides.Right).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Left, this);
                        this.setSide(Sides.Right, hits[i].getSide(Sides.Left) - 0.001);
                    } else break;
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
                        this.setSide(Sides.Back, hits[i].getSide(Sides.Forward) + 0.001);
                    } else break;
                }
            } else if (zVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Back) - b.getSide(Sides.Back));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.collisionsThisUpdate.get(Sides.Forward).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Back, this);
                        this.setSide(Sides.Forward, hits[i].getSide(Sides.Back) - 0.001);
                    } else break;
                }
            }
        }
    }
    private frozen: boolean = false;
    private active: boolean = true;
    private velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private disposed: boolean = false;

    // CONSTANTS
    private static FROZEN_VELOCITY: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public static MAXIMUM_HEIGHT: number = 5;

    private collisionsLastUpdate: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()]
    ]);
    private collisionsThisUpdate: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()]
    ]);
}

// creates and manages a cluster of fallboxes
class FallBoxCluster {
    public constructor(cubeCount: number, startY: number) {
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
            } else if (rnd <= 0.6) {
                boxB.setSize(BABYLON.Vector3.One().scale(3));
            } else {
                boxB.setSize(BABYLON.Vector3.One().scale(5));
            }
            while (obstructed) {
                boxB.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, startY + Math.random() * 750, -5 + Math.random() * 10));
                obstructed = false;
                for (let i = startIndex; i < physObjs.length; i++) {
                    if (physObjs[i].intersects(boxB)) { obstructed = true; break; }
                }
            }
            boxB.setVelocity(new BABYLON.Vector3(0, -0.075, 0));
            boxB.onEvent('freeze', (status) => {
                frozenCount += (status == true ? 1 : -1);
                this.active = (frozenCount != fallBoxes.length);
                // if (this.active) {
                //     SPS.mesh.unfreezeWorldMatrix();
                //     SPS.mesh.unfreezeNormals();
                // } else {
                //     SPS.mesh.freezeWorldMatrix();
                //     SPS.mesh.freezeNormals();
                // }
            });
            fallBoxes.push(boxB);
            game.addPhysBox(boxB);
        }
        const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
        const box = BABYLON.MeshBuilder.CreateBox('', {size: 1}, scene);
        const testMaterial = new BABYLON.StandardMaterial('', scene);
        testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/testBox.png', scene);
        testMaterial.diffuseTexture.hasAlpha = true;
        testMaterial.backFaceCulling = false;
        testMaterial.ambientColor = new BABYLON.Color3(1,1,1);
        SPS.addShape(box, cubeCount); 
        box.dispose();
        const mesh : BABYLON.Mesh = SPS.buildMesh(); 
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
    public isDisposed() : boolean { return this.disposed; }
    public dispose() {
        this.SPS.dispose();
        this.disposed = true;
    }
    public update() {
        if (this.disposed)
            return;
        // when to generate the next cluster.....
        const highestPhysBox = game.getHighestPhysBox();
        if (this.topCluster && (
            // If the player is getting too close to the top of the cluster
            ((highestPhysBox.getPos().y - game.getPlayer().getPos().y) < 200) ||
            // If the cluster has finished falling
            (!this.active))
        ) {
            game.createNewCluster(200, highestPhysBox.getPos().y);
            this.topCluster = false;
        }
        if (!this.active)
            return;
        this.iterIndex = 0;
        this.SPS.setParticles();
    }
    private SPS: BABYLON.SolidParticleSystem;
    private iterIndex: number = 0;
    private active: boolean = true;
    private disposed: boolean = false;
    private topCluster: boolean = true;
}

class FloorBox extends PhysBox {
    public constructor() {
        super();
        const mesh = BABYLON.MeshBuilder.CreateBox('', {size: 1}, scene);
        const material = new BABYLON.StandardMaterial('', scene);
        material.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/floorBox.png", scene);
        mesh.material = material;
        mesh.position = this.getPos();
        mesh.scaling = this.getSize();
    }
}

class FallBox extends PhysBox {
    public constructor() {
        super();
        this.color = new BABYLON.Color4(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1);
    }
    public onCollisionStart(side: Sides, physBox : PhysBox) {
        super.onCollisionStart(side, physBox);
        if (side == Sides.Bottom && (physBox instanceof FallBox || physBox instanceof FloorBox) && physBox.isFrozen()) {
            this.freeze();
        }
    }
    public getColor() : BABYLON.Color4 { return this.color; }
    public getMoverLevel() : number { return 2; }
    private color: BABYLON.Color4;
}

class Player extends PhysBox {
    public static LoadResources() : Promise<any> {
        return Promise.all([
            new Promise((resolve) => {
                Player.SOUND_JUMP = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/jump.wav", scene, resolve, {
                    loop: false,
                    autoplay:  false,
                    volume: 0.5
                });
            }),
            new Promise((resolve) => {
                Player.SOUND_HIT_HEAD = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/hitHead.wav", scene, resolve, {
                    loop: false,
                    autoplay:  false,
                    volume: 0.5
                });
            }),
            new Promise((resolve) => {
                Player.SOUND_DEATH = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/death.wav", scene, resolve, {
                    loop: false,
                    autoplay:  false,
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
                    Player.MESH = <BABYLON.Mesh>(meshes[0]);
                    resolve();
                });
            })
        ]);
    }
    public dispose() {
        super.dispose();
        this.mesh.dispose();
        this.explosionParticleSystem.dispose();
    }
    public constructor() {
        super();

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
    }
    public disable() {
        super.disable();
        this.mesh.isVisible = false;
    }
    public kill() {
        this.disable();
        this.explosionParticleSystem.start();
        Player.SOUND_DEATH.play();
        this.fire('death', true);
        setTimeout(() => this.explosionParticleSystem.stop(), 150);
    }
    public onCollisionStart(side: Sides, physBox: PhysBox) { 
        if (!Player.SOUND_HIT_HEAD.isPlaying && side == Sides.Top && physBox instanceof FallBox)
            Player.SOUND_HIT_HEAD.play();
    }

    public determineVelocities() {
        let wKey; let aKey; let sKey; let dKey;
        switch(camera.getRotationIndex()) {
            case 1: wKey = 'd'; aKey = 'w'; sKey = 'a';  dKey = 's'; break;
            case 2: wKey = 's'; aKey = 'd'; sKey = 'w';  dKey = 'a'; break;
            case 3: wKey = 'a'; aKey = 's'; sKey = 'd';  dKey = 'w'; break;
            case 0: wKey = 'w'; aKey = 'a'; sKey = 's';  dKey = 'd'; break;
        }
        let avgYSpeed = 0;
        let count = 0;

        // update rotation animation
        if (this.mesh) {
            if (this.getVelocity().z > 0) {
                this.mesh.rotation.x = Math.min(this.mesh.rotation.x + 0.05, 0.15);
            } else if (this.getVelocity().z < 0) {
                this.mesh.rotation.x = Math.max(this.mesh.rotation.x - 0.05, -0.15);
            } else {
                this.mesh.rotation.x = (Math.abs(this.mesh.rotation.x) <= 0.05) ? 0 : this.mesh.rotation.x + 0.05 * Math.sign(this.mesh.rotation.x) * -1;
            }
            if (this.getVelocity().x < 0) {
                this.mesh.rotation.z = Math.min(this.mesh.rotation.z + 0.05, 0.15);
            } else if (this.getVelocity().x > 0) {
                this.mesh.rotation.z = Math.max(this.mesh.rotation.z - 0.05, -0.15);
            } else {
                this.mesh.rotation.z = (Math.abs(this.mesh.rotation.z) <= 0.05) ? 0 : this.mesh.rotation.z + 0.05 * Math.sign(this.mesh.rotation.z) * -1;
            }
        }

        // test if the player is sliding along a physbox's wall
        if (!this.getCollisions(Sides.Top).size && this.getVelocity().y < 0) {
            if (this.getCollisions(Sides.Left).size) {
                count += this.getCollisions(Sides.Left).size;
                this.getCollisions(Sides.Left).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (InputManager.getInstance().isKeyPressed(' ')) {
                    this.getVelocity().x = Player.SIDE_XZ_IMPULSE; this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                    if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                }
            }
            if (this.getCollisions(Sides.Right).size) {
                count += this.getCollisions(Sides.Right).size;
                this.getCollisions(Sides.Right).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (InputManager.getInstance().isKeyPressed(' ')) {
                    this.getVelocity().x = -Player.SIDE_XZ_IMPULSE; this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                    if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                }
            }
            if (this.getCollisions(Sides.Forward).size) {
                count += this.getCollisions(Sides.Forward).size;
                this.getCollisions(Sides.Forward).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (InputManager.getInstance().isKeyPressed(' ')) {
                    this.getVelocity().z = -Player.SIDE_XZ_IMPULSE; this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                    if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                }
            }
            if (this.getCollisions(Sides.Back).size) {
                count += this.getCollisions(Sides.Back).size;
                this.getCollisions(Sides.Back).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (InputManager.getInstance().isKeyPressed(' ')) {
                    this.getVelocity().z = Player.SIDE_XZ_IMPULSE; this.getVelocity().y = Player.SIDE_JUMP_IMPULSE;
                    if (!Player.SOUND_HIT_HEAD.isPlaying) Player.SOUND_JUMP.play();
                }
            }
        }
        if (count && !InputManager.getInstance().isKeyPressed(' ')) {
            // sliding, set players velocity to slide speed
            avgYSpeed /= count;
            avgYSpeed -= Player.SIDE_SLIDE_SPEED;
            this.getVelocity().y = avgYSpeed;
        } else {
            // not sliding, apply GRAVITY as normal
            this.getVelocity().y = Math.max(this.getVelocity().y - Player.GRAVITY, -Player.MAX_Y_SPEED);
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
    public beforeCollisions() {
        super.beforeCollisions();
        this.determineVelocities();
    }
    public afterCollisions() {
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

    // RESOURCES
    private static SOUND_JUMP: BABYLON.Sound;
    private static SOUND_HIT_HEAD: BABYLON.Sound;
    private static SOUND_DEATH: BABYLON.Sound;
    private static MESH: BABYLON.Mesh;

    // CONSTANTS
    //  General movement
    private static GROUND_MOVE_SPEED = 0.1;
    private static AIR_MOVE_ACCELERATION = 0.01;
    //  Jump / Crush / Slide
    private static JUMP_IMPULSE = 0.3;
    private static CRUSH_IMPULSE = 0.5;
    private static SIDE_JUMP_IMPULSE = 0.4;
    private static SIDE_XZ_IMPULSE = 0.2;
    private static SIDE_SLIDE_SPEED = 0.05;
    // Gravity & Max speed
    private static GRAVITY = 0.008;
    private static MAX_Y_SPEED = 0.5;

    private mesh: BABYLON.AbstractMesh;
    private bestHeight: number = 0;
    private explosionParticleSystem: BABYLON.ParticleSystem;
}

Promise.all([
    Game.LoadResources(),
    Player.LoadResources(),
    GameCamera.LoadResources()
]).then(() => {
    loadingContainer.isVisible = false;
    menuContainer.isVisible = true;
});

});