//import * as BABYLON from 'babylonjs';
window.addEventListener('DOMContentLoaded', () => {
    let vZero = BABYLON.Vector3.Zero();
    // Create canvas and engine.
    const canvas = (document.getElementById('renderCanvas'));
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.01;
    scene.fogStart = 20.0;
    scene.fogEnd = 60.0;
    scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
    scene.clearColor = new BABYLON.Color4(0.9, 0.9, 0.85, 1.0);
    // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
    const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, false);
    // create lava
    var sphere = BABYLON.Mesh.CreateGround("ground", 500, 500, 100, scene);
    var lavaMaterial = new BABYLON.LavaMaterial("lava", scene);
    lavaMaterial.noiseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/cloud.png", scene); // Set the bump texture
    lavaMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/lavatile.jpg", scene); // Set the diffuse texture
    lavaMaterial.speed = 0.1;
    lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
    lavaMaterial.unlit = true;
    sphere.material = lavaMaterial;
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
    class Game {
        constructor() {
            this.physBoxes = [];
            this.physBoxesY = [];
            this.yIndexes = new Map();
            scene.onBeforeRenderObservable.add(() => {
                this.physBoxes.forEach((pbox) => pbox.update(0));
            });
        }
        addPhysBox(box) {
            this.physBoxes.push(box);
            this.physBoxesY.push(box);
        }
        getPhysObjects() { return this.physBoxes; }
        initOrdering() {
            this.physBoxesY.sort((b, a) => a.getSide(Sides.Top) - b.getSide(Sides.Top)).forEach((pbox, idx) => this.yIndexes.set(pbox, idx));
        }
        updatePhysics(physBox) {
            // basic sweep and prune 
            const lastVelocity = physBox.getVelocity().y;
            if (lastVelocity != 0) {
                physBox.getPos().y += lastVelocity;
                if (lastVelocity < 0) {
                    let hit = null;
                    let yIndex = this.yIndexes.get(physBox);
                    for (let i = yIndex; i < this.physBoxesY.length; i++) {
                        let candiate = this.physBoxesY[i];
                        if (physBox.intersects(candiate)) {
                            hit = candiate;
                            break;
                        }
                        if (candiate.getSide(Sides.Top) < physBox.getSide(Sides.Bottom)) {
                            // if (Math.random() > 0.9)
                            //     console.log(i - yIndex);
                            break;
                        }
                    }
                    if (hit) {
                        physBox.setSide(Sides.Bottom, hit.getSide(Sides.Top) + 0.001);
                    }
                    while (((yIndex + 1) < this.physBoxesY.length) && (this.physBoxesY[yIndex].getSide(Sides.Top) < this.physBoxesY[yIndex + 1].getSide(Sides.Top))) {
                        const a = this.physBoxesY[yIndex];
                        const b = this.physBoxesY[yIndex + 1];
                        this.physBoxesY[yIndex] = b;
                        this.physBoxesY[yIndex + 1] = a;
                        this.yIndexes.set(a, yIndex + 1);
                        this.yIndexes.set(b, yIndex);
                        yIndex = yIndex + 1;
                    }
                }
            }
        }
    }
    const game = new Game();
    const cubeCount = 200;
    const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
    let idx = 0;
    var box = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
    const testMaterial = new BABYLON.StandardMaterial('', scene);
    testMaterial.diffuseTexture = new BABYLON.Texture('/resources/images/testBox.png', scene);
    SPS.addShape(box, cubeCount + 1); // 30 cubes
    box.dispose();
    var mesh = SPS.buildMesh(); // finally builds and displays the real mesh
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.material = testMaterial;
    SPS.updateParticle = (particle) => {
        const physBoxes = game.getPhysObjects();
        particle.position.copyFrom(physBoxes[idx].getPos());
        particle.scaling.copyFrom(physBoxes[idx].getSize());
        idx++;
        return particle;
    };
    scene.onBeforeRenderObservable.add(() => {
        idx = 0;
        SPS.setParticles();
    });
    class Sides {
        constructor(dim, direction) {
            this.dim = dim;
            this.direction = direction;
        }
    }
    Sides.Left = new Sides('x', -1);
    Sides.Right = new Sides('x', 1);
    Sides.Forward = new Sides('z', 1);
    Sides.Back = new Sides('z', -1);
    Sides.Top = new Sides('y', 1);
    Sides.Bottom = new Sides('y', -1);
    class BoundBox {
        constructor() {
            this.pos = BABYLON.Vector3.Zero();
            this.size = BABYLON.Vector3.One();
        }
        getPos() { return this.pos; }
        setPos(pos) { this.pos.copyFrom(pos); return this; }
        setSize(size) { this.size.copyFrom(size); return this; }
        getSize() { return this.size; }
        getSide(side) { return this.pos[side.dim] + (this.size[side.dim] * 0.5 * side.direction); }
        setSide(side, value) { this.pos[side.dim] = value - (this.size[side.dim] * 0.5 * side.direction); }
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
            this.velocity = BABYLON.Vector3.Zero();
        }
        setVelocity(velocity) { this.velocity = velocity.clone(); return this; }
        getVelocity() { return this.velocity; }
        freeze() { this.frozen = true; return this; }
        unfreeze() { this.frozen = false; return this; }
        isObstructed() { return (game.getPhysObjects().filter(y => y.intersects(this)).length != 0); }
        update(t) {
            if (this.frozen)
                return;
            game.updatePhysics(this);
        }
    }
    class FallBoxCluster {
        constructor(cubeCount) {
            const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
            const box = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
            SPS.addShape(box, cubeCount);
            box.dispose();
            const mesh = SPS.buildMesh();
            mesh.alwaysSelectAsActiveMesh = true;
            ;
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
        afterUpdate() {
        }
    }
    class Player extends PhysBox {
        constructor() {
            super();
            this.setSize(new BABYLON.Vector3(0.5, 0.75, 0.5));
            this.setPos(new BABYLON.Vector3(0, 3, 0));
            const mesh = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
            mesh.position = this.getPos();
            mesh.scaling = this.getSize();
        }
    }
    let bottomBox = new PhysBox();
    bottomBox
        .freeze()
        .setPos(new BABYLON.Vector3(0, 0, 0))
        .setSize(new BABYLON.Vector3(10, 0.3, 10));
    game.addPhysBox(bottomBox);
    for (let i = 0; i < cubeCount; i++) {
        let boxB = new PhysBox();
        while (true) {
            boxB.setSize(BABYLON.Vector3.One().scale(1 + Math.random() * 2));
            boxB.setVelocity(new BABYLON.Vector3(0, -0.1, 0));
            boxB.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, 1 + Math.random() * 500, -5 + Math.random() * 10));
            if (!boxB.isObstructed())
                break;
        }
        game.addPhysBox(boxB);
    }
    game.initOrdering();
});
