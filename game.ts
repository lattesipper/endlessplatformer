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

let game;

// GUI (to refactor into a class)
const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
gui.idealWidth = 1080;

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

const pauseContainer = new BABYLON.GUI.Rectangle();
pauseContainer.width = 1.0;
pauseContainer.height = 1.0;
pauseContainer.thickness = 0;
{
    const gameplayContainer = new BABYLON.GUI.Rectangle();
    gameplayContainer.width = 0.5
    gameplayContainer.height = 0.5;
    gameplayContainer.thickness = 0;
    gameplayContainer.background = "rgba(255,255,255,0.5)";
    {
        const textPaused = new BABYLON.GUI.TextBlock();
        textPaused.text = "PAUSED";
        textPaused.color = "black";
        textPaused.fontSize = "60px";
        gameplayContainer.addControl(textPaused);
        const btnMenu = BABYLON.GUI.Button.CreateSimpleButton("but", "Menu");
        btnMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        btnMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        btnMenu.left = 0.5;
        btnMenu.width = "130px";
        btnMenu.height = "60px";
        btnMenu.fontSize = "50px";
        btnMenu.color = "black";
        //btnMenu.thickness = 0;
        btnMenu.onPointerClickObservable.add(() => {
            game.dispose();
            gameplayContainer.isVisible = false;
            pauseContainer.isVisible = false;
            menuContainer.isVisible = true;
        });
        gameplayContainer.addControl(btnMenu);
    }
    pauseContainer.addControl(gameplayContainer);
}
gui.addControl(pauseContainer);

const menuContainer = new BABYLON.GUI.Rectangle();
menuContainer.width = 1.0;
menuContainer.height = 1.0;
menuContainer.background = "rgb(0,204,255)";
menuContainer.thickness = 0;
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
    //btnTutorial.thickness = 0;
    btnTutorial.onPointerClickObservable.add(() => {
        game = new Game();
        game.start();
        menuContainer.isVisible = false;
        gameplayContainer.isVisible = true;

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
    //btnPlay.thickness = 0;
    btnPlay.onPointerClickObservable.add(() => {
        game = new Game();
        game.start();
        menuContainer.isVisible = false;
        gameplayContainer.isVisible = true;

    });
    menuContainer.addControl(btnPlay);
}
gui.addControl(menuContainer);


// input manager (to refactor into a class)
const inputMap : Map<string, boolean> = new Map(); 
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
    const key = evt.sourceEvent.key.toLowerCase();
    inputMap.set(key, true);
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
    const key = evt.sourceEvent.key.toLowerCase();
    inputMap.set(key, false);
}));
const isKeyPressed = (key) => {
    return inputMap.get(key);
};

// Run the render loop.
engine.runRenderLoop(() => {
    scene.render();
});
window.addEventListener('resize', () => {
    engine.resize();
});

// observable object that fires events
class Observable {
    public onEvent(eventName, callback) {
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

// rotateable camera
class GameCamera {
    public static LoadResources() {
        GameCamera.rotateSound = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/rotateView.wav", scene, null, {
            loop: false,
            autoplay:  false,
            volume: 0.5
        });
    }
    public setFollower(follower: PhysBox) {
        this.follower = follower;
    }
    public constructor() {
        const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 25, new BABYLON.Vector3(0, 0, 0), scene);
        camera.setPosition(new BABYLON.Vector3(0, 0, 0));
        camera.beta = 0.65;
        camera.alpha = 4.71238898039;
        camera.radius = 25;
        camera.parent = this.node;
        this.camera = camera;

        scene.onBeforeRenderObservable.add(() => {
            // y-track the follower
            if (this.follower)
                this.node.position.y = this.follower.getPos().y;
            // wrap camera alpha
            if (camera.alpha < 0) {
                camera.alpha = (Math.PI * 2) + camera.alpha;
            } else if (camera.alpha > (Math.PI * 2))  {
                camera.alpha = camera.alpha - (Math.PI * 2);
            }
            // rotate camera right 90 degrees
            if (isKeyPressed('arrowright') && !this.rotating) {
                var animationBox : BABYLON.Animation = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                animationBox.setKeys([ { frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha + (Math.PI / 2) } ]);
                camera.animations = [animationBox];
                scene.beginAnimation(camera, 0, 20, false, 1, () => { this.rotating = false; game.play(); this.rotationIndex = (this.rotationIndex == 3 ? 0 : this.rotationIndex + 1); });
                this.rotating = true;
                game.pause();
                GameCamera.rotateSound.play();
            } 
            // rotate camera left 90 degrees
            else if (isKeyPressed('arrowleft') && !this.rotating) {
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
    private static rotateSound: BABYLON.Sound;
    private camera: BABYLON.Camera;
    private follower: PhysBox;
    private rotating: boolean = false;
    private rotationIndex: number = 0;
    private node: BABYLON.TransformNode = new BABYLON.TransformNode('', scene);
}
GameCamera.LoadResources();
const camera = new GameCamera();

// sides enum class
class Sides {
    private constructor (dim, direction) {
        this.dim = dim;
        this.direction = direction;
    }
    public flip() {
        switch(this) {
            case Sides.Left: return Sides.Right;
            case Sides.Right: return Sides.Left;
            case Sides.Top: return Sides.Bottom;
            case Sides.Bottom: return Sides.Top;
            case Sides.Forward: return Sides.Back;
            case Sides.Back: return Sides.Forward;
        }
    }
    public static Left = new Sides('x', -1);
    public static Right = new Sides('x', 1);
    public static Forward = new Sides('z', 1);
    public static Back = new Sides('z', -1);
    public static Top = new Sides('y', 1);
    public static Bottom = new Sides('y', -1);
    public dim : string;
    public direction : number;
}

class Game {
    public static LoadResources() {
        // load background music
        Game.backgroundMusic = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/music/dreamsofabove.mp3", scene, null, {
            loop: true,
            autoplay:  false,
            volume: 0.5
        });
        // load lava
        const lavaGround = BABYLON.Mesh.CreateGround("ground", 500, 500, 50, scene);
        lavaGround.visibility = 0.5;
        lavaGround.position.y = -10;
        const lavaMaterial = new BABYLON.LavaMaterial("lava", scene);	
        lavaMaterial.noiseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/cloud.png", scene); // Set the bump texture
        lavaMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/lavatile.jpg", scene); // Set the diffuse texture
        lavaMaterial.speed = 0.5;
        lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
        lavaMaterial.unlit = true;
        lavaGround.material = lavaMaterial;
        lavaGround.isVisible = false;
        Game.lavaTemplateMesh = lavaGround;
    }
    public constructor() {  
        this.updateCallbackFunc = (() => this.update());
        scene.onBeforeRenderObservable.add(this.updateCallbackFunc);
        this.lavaGround = Game.lavaTemplateMesh.createInstance('');
    }
    private update() {
        if (!this.running)
            return;
        if ((this.player.getPos().y - this.lavaGround.position.y) < Game.FAST_LAVA_SPEED_THRESHOLD) {
            this.lavaGround.position.y += Game.DEFAULT_LAVA_SPEED;
        } else {
            this.lavaGround.position.y += Game.FAST_LAVA_SPEED;
        }
        // update the sorted physbox list for sort&sweep collisions
        this.ySortBoxes();
        // resolve physbox collisions
        this.physBoxes.forEach(pbox => { if (pbox.isActive() && !pbox.isDisposed()) pbox.beforeCollisions(); });
        this.physBoxes.forEach(pbox => { if (pbox.isActive() && !pbox.isDisposed()) pbox.resolveCollisions(0); });
        this.physBoxes.forEach(pbox => { if (pbox.isActive() && !pbox.isDisposed()) pbox.afterCollisions(); });
        // update fallbox clusters
        this.fallboxClusters.forEach(cluster => { if (!cluster.isDisposed()) cluster.update(); });
    }
    public dispose() {
        scene.onBeforeRenderObservable.remove(this.updateCallbackFunc);
        this.physBoxes.forEach((physBox) => physBox.dispose());
        this.fallboxClusters.forEach((cluster) => cluster.dispose());
        this.lavaGround.dispose();
    }
    public getLavaLevel() : number {
        return this.lavaGround.position.y - 1;
    }
    public pause() { this.running = false; }
    public play() { this.running = true; }
    public start() {
        // create initial cube cluster
        this.createNewCluster(200, 20);
        // create frozen box at the bottom to catch them all
        let bottomBox = new FloorBox();
        bottomBox
                .freeze()
                .setPos(new BABYLON.Vector3(0, 0, 0))
                .setSize(new BABYLON.Vector3(10, 10, 10));
        this.addPhysBox(bottomBox);
        // all is ready, add the player
        const player = new Player();
        player.setPos(new BABYLON.Vector3(0, 7, 0));
        this.addPhysBox(player);
        this.player = player;
    }
    public createNewCluster(cubeCount, startY) { this.fallboxClusters.push(new FallBoxCluster(cubeCount, startY)); }

    public addPhysBox(box) { this.physBoxes.push(box); this.physBoxesY.push(box); }

    public getPhysObjects() { return this.physBoxes; }
    public getPlayer() : Player { return this.player; }

    // SORT
    private ySortBoxes() { 
        // O(N) average case for insertion sort after physbox updates
        for (let i = 1; i < this.physBoxesY.length; i++) {
            let j = i - 1;
            let tmp = this.physBoxesY[i];
            while (j >= 0 && this.physBoxesY[j].getPos().y > tmp.getPos().y) {
                this.physBoxesY[j + 1] = this.physBoxesY[j];
                j--
            }
            this.physBoxesY[j+1] = tmp;
            this.yIndexes.set(tmp, j+1);
        }
    }
    // SWEEP AND PRUNE
    public getCollisions(physBox: PhysBox, dim: string) {
        let yIndex = this.yIndexes.get(physBox);
        let collisions = [];
        let tests = 0;
        if (dim != 'y' || physBox.getVelocity().y < 0) {
            for (let i = yIndex; i >= 0; i--) {
                let candiate = this.physBoxesY[i];
                tests++;
                if (candiate.isActive() && physBox.intersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + (PhysBox.MAX_Y_SIZE/2)))
                    break;
            }
        }
        if (dim != 'y' || physBox.getVelocity().y > 0) {
            for (let i = yIndex; i < this.physBoxes.length; i++) {
                tests++;
                let candiate = this.physBoxesY[i];
                if (candiate.isActive() && physBox.intersects(candiate))
                    collisions.push(candiate);
                if (physBox.getSide(Sides.Top) < (candiate.getPos().y - (PhysBox.MAX_Y_SIZE/2)))
                    break;
            }
        }
        // if (physBox instanceof Player && Math.random() > 0.99) {
        //     console.log(tests);
        // }
        return collisions;
    }
    private static backgroundMusic: BABYLON.Sound;
    private static lavaTemplateMesh: BABYLON.Mesh;
    private static FAST_LAVA_SPEED_THRESHOLD: number = 75;
    private static DEFAULT_LAVA_SPEED: number = 0.035;
    private static FAST_LAVA_SPEED: number = 0.2;

    private updateCallbackFunc;

    private running : boolean = true;                       // game running or paused?
    private fallboxClusters : Array<FallBoxCluster> = [];  

    private physBoxesY: Array<PhysBox> = [];                // sorted list of physboxes
    private physBoxes: Array<PhysBox> = [];                 // unsorted list of physboxes
    private yIndexes = new Map<PhysBox, number>();          // physbox -> sorted Y index    

    private player: Player;                                 // the player
    private lavaGround: BABYLON.TransformNode;              // the lava
}
Game.LoadResources();


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
    public getVelocity() { return this.frozen ? PhysBox.frozenVelocity : this.velocity; }

    public isActive() : boolean { return this.active; }
    public disable() { this.active = false; }
    public enable() { this.active = true; }
    public freeze() : PhysBox { this.frozen = true; this.fire('freeze', true); return this; }
    public unfreeze() : PhysBox { this.frozen = false; this.fire('freeze', false); return this; }
    public isFrozen() : boolean { return this.frozen; }
    public getMoverLevel() : number { return 1; }

    public dispose() { this.disposed = true; }
    public isDisposed() : boolean { return this.disposed; }

    public onCollisionStart(side: Sides, physBox: PhysBox) { 
        this.newCollisions.get(side).add(physBox);
    }
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
    public onCollisionStop(side: Sides, physBox: PhysBox) { 

    }

    public beforeCollisions() {
        let tmp = this.newCollisions;
        this.newCollisions = this.lastCollisions;
        this.newCollisions.forEach((collisions, side) => collisions.clear());
        this.lastCollisions = tmp;
    }
    public afterCollisions() {
        this.newCollisions.forEach((collisions, side) => {
            collisions.forEach((collision) => {
                if (!this.lastCollisions.get(side).has(collision)) {
                    this.onCollisionStart(side, collision);
                    collision.onCollisionStart(side.flip(), this);
                } else {
                    this.onCollisionHold(side, collision);
                    collision.onCollisionHold(side.flip(), this);
                }
            });
        });
        this.lastCollisions.forEach((collisions, side) => {
            collisions.forEach((collision) => {
                if (!this.newCollisions.get(side).has(collision)) {
                    this.onCollisionStop(side, collision);
                    collision.onCollisionStop(side.flip(), this);
                }
            });
        });
    }
    protected notifyOfCollision(side: Sides, physBox: PhysBox) {
        this.newCollisions.get(side).add(physBox);
    }
    
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
                        this.newCollisions.get(Sides.Bottom).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Top, this);
                        this.setSide(Sides.Bottom, hits[i].getSide(Sides.Top) + 0.001);
                    } else break;
                }
            } else if (yVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Bottom) - b.getSide(Sides.Bottom));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Top).add(hits[i]);
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
                        this.newCollisions.get(Sides.Left).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Right, this);
                        this.setSide(Sides.Left, hits[i].getSide(Sides.Right) + 0.001);
                    } else break;
                }
            } else if (xVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Left) - b.getSide(Sides.Left));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Right).add(hits[i]);
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
                        this.newCollisions.get(Sides.Back).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Forward, this);
                        this.setSide(Sides.Back, hits[i].getSide(Sides.Forward) + 0.0001);
                    } else break;
                }
            } else if (zVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Back) - b.getSide(Sides.Back));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Forward).add(hits[i]);
                        hits[i].notifyOfCollision(Sides.Back, this);
                        this.setSide(Sides.Forward, hits[i].getSide(Sides.Back) - 0.0001);
                    } else break;
                }
            }
        }
    }
    private frozen: boolean = false;
    private active: boolean = true;
    private velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private disposed: boolean = false;
    private static frozenVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    protected getCollisions(side) : Set<PhysBox> { return this.lastCollisions.get(side); }

    public static MAX_Y_SIZE: number = 5;

    // collisions on 6 sides of physbox
    private lastCollisions: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()]
    ]);
    private newCollisions: Map<Sides, Set<PhysBox>> = new Map([
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
                if (this.active) {
                    SPS.mesh.unfreezeWorldMatrix();
                    SPS.mesh.unfreezeNormals();
                } else {
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
        if (this.topCluster && ((this.topBox.getPos().y - game.getPlayer().getPos().y) < 200)) {
            game.createNewCluster(200, this.topBox.getPos().y);
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
    private topBox: FallBox;
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
        if (side == Sides.Bottom && (physBox instanceof FallBox) && physBox.isFrozen()) {
            this.freeze();
        }
    }
    public getColor() : BABYLON.Color4 { return this.color; }
    public getMoverLevel() : number { return 2; }
    private color: BABYLON.Color4;
}

class Player extends PhysBox {
    public static LoadResources() {
        Player.sndJump = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/jump.wav", scene, null, {
            loop: false,
            autoplay:  false,
            volume: 0.5
        });
        Player.sndHitHead = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/hitHead.wav", scene, null, {
            loop: false,
            autoplay:  false,
            volume: 0.5
        });
        Player.sndDeath = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/death.wav", scene, null, {
            loop: false,
            autoplay:  false,
            volume: 0.5
        });
        BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/", "player.obj", scene, (meshes, particleSystems, skeletons) => {
            const testMaterial = new BABYLON.StandardMaterial('', scene);
            testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/meshes/player.png', scene);
            testMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
            meshes[0].material = testMaterial;
            meshes[0].isVisible = false;
            Player.templateMesh = <BABYLON.Mesh>(meshes[0]);
        });
    }
    public dispose() {
        super.dispose();
        this.mesh.dispose();
        this.explosionParticleSystem.dispose();
    }
    public constructor() {
        super();

        this.mesh = Player.templateMesh.createInstance('');
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
        camera.setFollower(this);  
    }
    public disable() {
        super.disable();
        this.mesh.isVisible = false;
    }
    public kill() {
        this.disable();
        this.explosionParticleSystem.start();
        Player.sndDeath.play();
        setInterval(() => this.explosionParticleSystem.stop(), 150);
    }
    public onCollisionStart(side: Sides, physBox: PhysBox) { 
        if (!Player.sndHitHead.isPlaying && side == Sides.Top && physBox instanceof FallBox)
            Player.sndHitHead.play();
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
                if (isKeyPressed(' ')) {
                    this.getVelocity().x = Player.sideXZImpulse; this.getVelocity().y = Player.sideJumpImpulse;
                    if (!Player.sndHitHead.isPlaying) Player.sndJump.play();
                }
            }
            if (this.getCollisions(Sides.Right).size) {
                count += this.getCollisions(Sides.Right).size;
                this.getCollisions(Sides.Right).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (isKeyPressed(' ')) {
                    this.getVelocity().x = -Player.sideXZImpulse; this.getVelocity().y = Player.sideJumpImpulse;
                    if (!Player.sndHitHead.isPlaying) Player.sndJump.play();
                }
            }
            if (this.getCollisions(Sides.Forward).size) {
                count += this.getCollisions(Sides.Forward).size;
                this.getCollisions(Sides.Forward).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (isKeyPressed(' ')) {
                    this.getVelocity().z = -Player.sideXZImpulse; this.getVelocity().y = Player.sideJumpImpulse;
                    if (!Player.sndHitHead.isPlaying) Player.sndJump.play();
                }
            }
            if (this.getCollisions(Sides.Back).size) {
                count += this.getCollisions(Sides.Back).size;
                this.getCollisions(Sides.Back).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                if (isKeyPressed(' ')) {
                    this.getVelocity().z = Player.sideXZImpulse; this.getVelocity().y = Player.sideJumpImpulse;
                    if (!Player.sndHitHead.isPlaying) Player.sndJump.play();
                }
            }
        }
        if (count && !isKeyPressed(' ')) {
            // sliding, set players velocity to slide speed
            avgYSpeed /= count;
            avgYSpeed -= Player.sideSlideSpeed;
            this.getVelocity().y = avgYSpeed;
        } else {
            // not sliding, apply gravity as normal
            this.getVelocity().y = Math.max(this.getVelocity().y - Player.gravity, -Player.maxVerticalSpeed);
        }

        // grounded, apply movement velocity instantaneously
        if (this.getCollisions(Sides.Bottom).size) {
            if (isKeyPressed(wKey)) {
                this.getVelocity().z = Player.moveSpeed;
            } else if (isKeyPressed(sKey)) {
                this.getVelocity().z = -Player.moveSpeed;
            } else {
                this.getVelocity().z = 0;
            }
            if (isKeyPressed(aKey)) {
                this.getVelocity().x = -Player.moveSpeed;
            } else if (isKeyPressed(dKey)) {
                this.getVelocity().x = Player.moveSpeed;
            } else {
                this.getVelocity().x = 0;
            }
            if (isKeyPressed(' ')) {
                if (!Player.sndHitHead.isPlaying) Player.sndJump.play();
                this.getVelocity().y = Player.jumpImpulse;
            }    
        } 
        // in-air, apply movement velocity through acceleration
        else {
            if (isKeyPressed(wKey)) {
                this.getVelocity().z = Math.min(this.getVelocity().z + Player.airMoveAcceleration, Player.moveSpeed);
            } else if (isKeyPressed(sKey)) {
                this.getVelocity().z = Math.max(this.getVelocity().z - Player.airMoveAcceleration, -Player.moveSpeed);
            } else {
                this.getVelocity().z = (Math.abs(this.getVelocity().z) < Player.airMoveAcceleration) ? 0 : this.getVelocity().z + Player.airMoveAcceleration * Math.sign(this.getVelocity().z) * -1;
            }
            if (isKeyPressed(aKey)) {
                this.getVelocity().x = Math.max(this.getVelocity().x - Player.airMoveAcceleration, -Player.moveSpeed);
            } else if (isKeyPressed(dKey)) {
                this.getVelocity().x = Math.min(this.getVelocity().x + Player.airMoveAcceleration, Player.moveSpeed);
            } else {
                this.getVelocity().x = (Math.abs(this.getVelocity().x) < Player.airMoveAcceleration) ? 0 : this.getVelocity().x + Player.airMoveAcceleration * Math.sign(this.getVelocity().x) * -1;
            }
            if (isKeyPressed('e')) {
                this.getVelocity().y = -Player.crushImpulse;
            }
        }
    }
    public beforeCollisions() {
        super.beforeCollisions();
        this.determineVelocities();
    }
    public afterCollisions() {
        super.afterCollisions();

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
        gameplayContainer.getChildByName('currentheight').text = Math.round(this.getPos().y) + "ft";
        gameplayContainer.getChildByName('maxheight').text = Math.round(this.bestHeight) + "ft";
    }
    private mesh: BABYLON.AbstractMesh;

    private bestHeight: number = 0;

    private static moveSpeed = 0.1;
    private static airMoveAcceleration = 0.01;

    private static jumpImpulse = 0.3;
    private static crushImpulse = 0.5;

    private static sideJumpImpulse = 0.4;
    private static sideXZImpulse = 0.2;
    
    private static gravity = 0.008;
    private static sideSlideSpeed = 0.01;

    private static maxVerticalSpeed = 0.5;

    private static sndJump: BABYLON.Sound;
    private static sndHitHead: BABYLON.Sound;
    private static sndDeath: BABYLON.Sound;
    private static templateMesh: BABYLON.Mesh;
    private explosionParticleSystem: BABYLON.ParticleSystem;
}
Player.LoadResources();
});