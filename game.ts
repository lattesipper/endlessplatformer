import * as BABYLON from 'babylonjs';
import { Scene, BackEase } from 'babylonjs';


window.addEventListener('DOMContentLoaded', () => {

let vZero : BABYLON.Vector3 = BABYLON.Vector3.Zero();

// Create canvas and engine.
const canvas = <HTMLCanvasElement>(document.getElementById('renderCanvas'));
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
scene.fogDensity = 0.01;
scene.fogStart = 20.0;
scene.fogEnd = 60.0;
scene.fogColor = new BABYLON.Color3(0.2, 1.0, 1.0);
scene.clearColor = new BABYLON.Color4(0.2, 1.0, 1.0, 1.0);
scene.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);

// Parameters: alpha, beta, radius, target position, scene
const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, 20));
camera.attachControl(canvas, true);
camera.beta = 0.3700715949591232;
camera.alpha = 4.71238898039;
camera.lowerAlphaLimit = 4.71238898039;
camera.upperAlphaLimit = 4.71238898039;
camera.lowerBetaLimit = 0.3700715949591232;
camera.upperBetaLimit = Math.PI / 2;


// create lava
var sphere = BABYLON.Mesh.CreateGround("ground", 500, 500, 100, scene);
var lavaMaterial = new BABYLON.LavaMaterial("lava", scene);	
lavaMaterial.noiseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/cloud.png", scene); // Set the bump texture
lavaMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/lavatile.jpg", scene); // Set the diffuse texture
lavaMaterial.speed = 0.1;
lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
lavaMaterial.unlit = true;
sphere.material = lavaMaterial;

const inputMap : Map<string, boolean> = new Map(); 
scene.actionManager = new BABYLON.ActionManager(scene);

scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
    inputMap.set(evt.sourceEvent.key.toLowerCase(), true);

}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
    inputMap.set(evt.sourceEvent.key.toLowerCase(), false);
}));

const isKeyPressed = (key) => {
    return inputMap.get(key);
};

// Create a basic light, aiming 0,1,0 - meaning, to the sky.
const light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, 1), scene);

// Run the render loop.
engine.runRenderLoop(() => {
    scene.render();
});

// The canvas/window resize event handler.
window.addEventListener('resize', () => {
    engine.resize();
});


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
    public constructor() {  
        scene.onBeforeRenderObservable.add(() => {
            //this.physBoxes.forEach((pbox) => pbox.unmark());
            this.insertionSort();
            this.physBoxes.forEach((pbox) => pbox.update(0));
        });
    }
    public addPhysBox(box) {
        this.physBoxes.push(box);
        this.physBoxesY.push(box);
    }
    public getPhysObjects() { return this.physBoxes; }
    private insertionSort() { 
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

    public getCollisions(physBox: PhysBox, dim: string) {
        let yIndex = this.yIndexes.get(physBox);
        let collisions = [];
        let tests = 0;
        if (dim != 'y' || physBox.getVelocity().y < 0) {
            for (let i = yIndex; i >= 0; i--) {
                let candiate = this.physBoxesY[i];
                // if (physBox instanceof Player) {
                //     candiate.mark();
                // }
                tests++;
                if (physBox.intersects(candiate)) {
                    collisions.push(candiate);
                }
                if ((candiate.getSide(Sides.Top) + 3) < physBox.getPos().y) {
                    // if (Math.random() > 0.99)
                    //     console.log(yIndex - i);
                    break;
                }
            }
        }
        if (dim != 'y' || physBox.getVelocity().y > 0) {
            for (let i = yIndex; i < this.physBoxes.length; i++) {
                tests++;
                let candiate = this.physBoxesY[i];
                // if (physBox instanceof Player) {
                //     candiate.mark();
                // }
                if (physBox.intersects(candiate)) {
                    collisions.push(candiate);
                }
                if ((candiate.getSide(Sides.Bottom) - 3) > physBox.getPos().y) {
                    // if (Math.random() > 0.99)
                    //     console.log(yIndex - i);
                    break;
                }
            }
        }
        // if (Math.random() > 0.999) {
        //     console.log(tests);
        // }
        return collisions;
    }
    private yIndexes = new Map<PhysBox, number>();
    private physBoxes: Array<PhysBox> = [];
    private physBoxesY: Array<PhysBox> = [];    
}

const game = new Game();


const cubeCount = 200;

const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
let idx = 0;
var box = BABYLON.MeshBuilder.CreateBox('', {size: 1}, scene);
const testMaterial = new BABYLON.StandardMaterial('', scene);
testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/testBox.png', scene);
testMaterial.diffuseTexture.hasAlpha = true;
testMaterial.backFaceCulling = false;
SPS.addShape(box, cubeCount+1); // 30 cubes
box.dispose();
var mesh : BABYLON.Mesh = SPS.buildMesh(); // finally builds and displays the real mesh
mesh.alwaysSelectAsActiveMesh = true;
mesh.material = testMaterial;
SPS.updateParticle = (particle) => {
    const physBoxes = game.getPhysObjects();
    particle.position.copyFrom(physBoxes[idx].getPos());
    particle.scaling.copyFrom(physBoxes[idx].getSize());
    // if (physBoxes[idx].isMarked()) {
    //     particle.color.set(0, 1, 0, 1);
    // } else {
    //     particle.color.set(1, 1, 1, 1);
    // }
    idx++;
    return particle;
};

scene.onBeforeRenderObservable.add(() => {
    idx = 0;
    SPS.setParticles();
});

interface Update {
    update(t: number);
}

class BoundBox {
    public getPos() { return this.pos; }
    public setPos(pos: BABYLON.Vector3) : BoundBox { this.pos.copyFrom(pos); return this; }
    public setSize(size: BABYLON.Vector3) : BoundBox { this.size.copyFrom(size); return this; }
    public getSize() : BABYLON.Vector3 { return this.size; }

    public getSide(side : Sides) { return this.pos[side.dim] + (this.size[side.dim] * 0.5 * side.direction) }
    public setSide(side : Sides, value : number) { this.pos[side.dim] = value - (this.size[side.dim] * 0.5 * side.direction); }

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

    private pos : BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private size : BABYLON.Vector3 = BABYLON.Vector3.One();
}

class PhysBox extends BoundBox implements Update {
    public setVelocity(velocity: BABYLON.Vector3) : PhysBox { this.velocity = velocity.clone(); return this; }
    public getVelocity() { return this.velocity; }

    public freeze() : PhysBox { this.frozen = true; return this; }
    public unfreeze() : PhysBox { this.frozen = false; return this; }
    public isFrozen() : boolean { return this.frozen; }

    // public mark() { this.marked = true; }
    // public unmark() { this.marked = false; }
    // public isMarked() { return this.marked; }

    public isObstructed() : boolean { return (game.getPhysObjects().filter(y => y.intersects(this)).length != 0); }

    public onCollisionStart(side: Sides, physBox: PhysBox) { }
    public onCollisionStop(side: Sides, physBox: PhysBox) { }

    public update(t : number) {
        if (this.frozen)
            return;
        const yVelocity = this.getVelocity().y;
        if (yVelocity != 0) {
            this.getPos().y += yVelocity;
            let collisions = game.getCollisions(this, 'y');
            if (yVelocity < 0) {
                let hits = collisions.sort((b, a) => a.getSide(Sides.Top) - b.getSide(Sides.Top));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Bottom).add(hits[i]);
                        this.setSide(Sides.Bottom, hits[i].getSide(Sides.Top) + 0.01);
                        this.velocity.y = 0;
                    } else break;
                }
            } else if (yVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Bottom) - b.getSide(Sides.Bottom));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Top).add(hits[i]);
                        this.setSide(Sides.Top, hits[i].getSide(Sides.Bottom) - 0.01);
                        this.velocity.y = 0;
                    } else break;
                }
            }
        }
        const xVelocity = this.getVelocity().x;
        if (xVelocity != 0) {
            this.getPos().x += xVelocity;
            let collisions = game.getCollisions(this, 'x');
            if (xVelocity < 0) {
                let hits = collisions.sort((b, a) => a.getSide(Sides.Right) - b.getSide(Sides.Right));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Left).add(hits[i]);
                        this.setSide(Sides.Left, hits[i].getSide(Sides.Right) + 0.01);
                        this.velocity.x = 0;
                    } else break;
                }
            } else if (xVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Left) - b.getSide(Sides.Left));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Right).add(hits[i]);
                        this.setSide(Sides.Right, hits[i].getSide(Sides.Left) - 0.01);
                        this.velocity.x = 0;
                    } else break;
                }
            }
        }
        const zVelocity = this.getVelocity().z;
        if (zVelocity != 0) {
            this.getPos().z += zVelocity;
            let collisions = game.getCollisions(this, 'z');
            if (zVelocity < 0) {
                let hits = collisions.sort((b, a) => a.getSide(Sides.Forward) - b.getSide(Sides.Forward));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Back).add(hits[i]);
                        this.setSide(Sides.Back, hits[i].getSide(Sides.Forward) + 0.01);
                        this.velocity.z = 0;
                    } else break;
                }
            } else if (zVelocity > 0) {
                let hits = collisions.sort((a, b) => a.getSide(Sides.Back) - b.getSide(Sides.Back));
                for (let i = 0; i < hits.length; i++) {
                    if (hits[i].getPos().y == hits[0].getPos().y) {
                        this.newCollisions.get(Sides.Forward).add(hits[i]);
                        this.setSide(Sides.Forward, hits[i].getSide(Sides.Back) - 0.01);
                        this.velocity.z = 0;
                    } else break;
                }
            }
        }
        this.newCollisions.forEach((collisions, side) => {
            collisions.forEach((collision) => {
                if (!this.lastCollisions.get(side).has(collision)) {
                    this.onCollisionStart(side, collision);
                    collision.onCollisionStart(side.flip(), this);
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
        let tmp = this.newCollisions;
        this.newCollisions = this.lastCollisions;
        this.newCollisions.forEach((collisions, side) => collisions.clear());
        this.lastCollisions = tmp;
    }
    private frozen: boolean = false;
    private velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private marked: boolean = false;

    protected getCollisions(side) : Set<PhysBox> { return this.lastCollisions.get(side); }

    private lastCollisions: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()]
    ]);
    private newCollisions: Map<Sides, Set<PhysBox>> = new Map([
        [Sides.Left, new Set<PhysBox>()], [Sides.Right, new Set<PhysBox>()], [Sides.Top, new Set<PhysBox>()], [Sides.Bottom, new Set<PhysBox>()], [Sides.Forward, new Set<PhysBox>()], [Sides.Back, new Set<PhysBox>()]
    ]);
}

class FallBoxCluster {
    public constructor(cubeCount: number) {
        const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
        const box = BABYLON.MeshBuilder.CreateBox('', {size: 1}, scene);
        SPS.addShape(box, cubeCount);
        box.dispose()
        const mesh : BABYLON.Mesh = SPS.buildMesh();
        mesh.alwaysSelectAsActiveMesh = true;;

        let idx = 0;
        SPS.updateParticle = (particle) => {
            const physBoxes = game.getPhysObjects();
            particle.position.copyFrom(physBoxes[idx].getPos());
            particle.scaling.copyFrom(physBoxes[idx].getSize());
            idx++;
            return particle;
        };
        scene.onBeforeRenderObservable.add(() => {
            const physBoxes = game.getPhysObjects();
            physBoxes.forEach((pbox, idx) => {
                pbox.update(0);
            });
            idx = 0;
            SPS.setParticles();
        });
    }
}

class FallBox extends PhysBox {
    public onCollisionStart(side: Sides, physBox : PhysBox) {
        if (side == Sides.Bottom && (physBox instanceof FallBox) && physBox.isFrozen()) {
            this.freeze();
        }
    }
}

class Player extends PhysBox {
    public constructor() {
        super();
        this.setSize(new BABYLON.Vector3(0.5, 0.75, 0.5));
        this.setPos(new BABYLON.Vector3(0, 3, 0));
        const mesh = BABYLON.MeshBuilder.CreateBox('', {size: 1}, scene);
        mesh.position = this.getPos();
        mesh.scaling = this.getSize();    
    }
    public update(t: number) {
        let wKey; let aKey; let sKey; let dKey;
        if (camera.alpha >= 5.49778714378 || camera.alpha <= 0.78539816339) {
            wKey = 'd'; aKey = 'w'; sKey = 'a';  dKey = 's';
        } else if (camera.alpha >= 0.78539816339 && camera.alpha <= 2.35619449019) {
            wKey = 's'; aKey = 'd'; sKey = 'w';  dKey = 'a';
        } else if (camera.alpha >= 2.35619449019 && camera.alpha <= 3.92699081699) {
            wKey = 'a'; aKey = 's'; sKey = 'd';  dKey = 'w';
        } else if (camera.alpha >= 3.92699081699 && camera.alpha <= 5.49778714378) {
            wKey = 'w'; aKey = 'a'; sKey = 's';  dKey = 'd';
        }

        this.getVelocity().y -= 0.005;

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
        if (isKeyPressed(' ') && this.getCollisions(Sides.Bottom).size > 0) {
            this.getVelocity().y = 0.2;
        }

        if (camera.alpha < 0) {
            camera.alpha = (Math.PI * 2) + camera.alpha;
        } else if (camera.alpha > (Math.PI * 2))  {
            camera.alpha = camera.alpha - (Math.PI * 2);
        }

        super.update(t);

        this.testNode.position.copyFrom(this.getPos());
        camera.parent = this.testNode;

    }
    private testNode: BABYLON.TransformNode = new BABYLON.TransformNode('', scene);
    private static moveSpeed = 0.06;
}


let bottomBox = new FallBox();
bottomBox
        .freeze()
        .setPos(new BABYLON.Vector3(0, 0, 0))
        .setSize(new BABYLON.Vector3(10, 5, 10));
game.addPhysBox(bottomBox);

for (let i = 0; i < cubeCount; i++) {
    let boxB = new FallBox();
    while (true) {
        boxB.setSize(BABYLON.Vector3.One().scale(2 + Math.random() * 1));
        boxB.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
        boxB.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, 20 + Math.random() * 1000, -5 + Math.random() * 10));
        if (!boxB.isObstructed())
            break;
    }
    game.addPhysBox(boxB);
}

let player = new Player();
player.setPos(new BABYLON.Vector3(0, 7, 0));
game.addPhysBox(player);

});