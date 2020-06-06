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
    scene.fogColor = new BABYLON.Color3(1, 0, 0);
    scene.clearColor = new BABYLON.Color4(1, 0, 0, 1.0);
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    // Parameters: alpha, beta, radius, target position, scene
    const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 20, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 0, 0));
    //camera.attachControl(canvas, true);
    camera.beta = 0.5;
    camera.alpha = 4.71238898039;
    camera.radius = 20;
    // camera.lowerAlphaLimit = 4.71238898039;
    // camera.upperAlphaLimit = 4.71238898039;
    camera.lowerBetaLimit = 0.5;
    camera.upperBetaLimit = Math.PI / 2;
    // create lava
    var sphere = BABYLON.Mesh.CreateGround("ground", 500, 500, 100, scene);
    sphere.visibility = 0.5;
    var lavaMaterial = new BABYLON.LavaMaterial("lava", scene);
    lavaMaterial.noiseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/cloud.png", scene); // Set the bump texture
    lavaMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/lava/lavatile.jpg", scene); // Set the diffuse texture
    lavaMaterial.speed = 0.5;
    lavaMaterial.fogColor = new BABYLON.Color3(1, 0, 0);
    lavaMaterial.unlit = true;
    sphere.material = lavaMaterial;
    const inputMap = new Map();
    scene.actionManager = new BABYLON.ActionManager(scene);
    let animPlaying = false;
    let rotateIndex = 0;
    const rotateSound = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/rotateView.wav", scene, null, {
        loop: false,
        autoplay: false,
        volume: 0.5
    });
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        const key = evt.sourceEvent.key.toLowerCase();
        inputMap.set(key, true);
        if (animPlaying)
            return;
        if (key == 'arrowright') {
            var animationBox = new BABYLON.Animation("myAnimation", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            animationBox.setKeys([{ frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha + (Math.PI / 2) }]);
            camera.animations = [animationBox];
            var anim = scene.beginAnimation(camera, 0, 20, false, 1, () => { animPlaying = false; rotateIndex = (rotateIndex == 3 ? 0 : rotateIndex + 1); });
            animPlaying = true;
            rotateSound.play();
        }
        else if (key == 'arrowleft') {
            var animationBox = new BABYLON.Animation("myAnimation2", "alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            animationBox.setKeys([{ frame: 0, value: camera.alpha }, { frame: 20, value: camera.alpha - (Math.PI / 2) }]);
            camera.animations = [animationBox];
            var anim = scene.beginAnimation(camera, 0, 20, false, 1, () => { animPlaying = false; rotateIndex = (rotateIndex == 0 ? 3 : rotateIndex - 1); });
            animPlaying = true;
            rotateSound.play();
        }
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        const key = evt.sourceEvent.key.toLowerCase();
        inputMap.set(key, false);
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
    class Game {
        constructor() {
            this.yIndexes = new Map();
            this.physBoxes = [];
            this.physBoxesY = [];
            scene.onBeforeRenderObservable.add(() => {
                //this.physBoxes.forEach((pbox) => pbox.unmark());
                sphere.position.y += 0.01;
                this.insertionSort();
                this.physBoxes.forEach((pbox) => pbox.update(0));
            });
        }
        addPhysBox(box) {
            this.physBoxes.push(box);
            this.physBoxesY.push(box);
        }
        getPhysObjects() { return this.physBoxes; }
        insertionSort() {
            for (let i = 1; i < this.physBoxesY.length; i++) {
                let j = i - 1;
                let tmp = this.physBoxesY[i];
                while (j >= 0 && this.physBoxesY[j].getPos().y > tmp.getPos().y) {
                    this.physBoxesY[j + 1] = this.physBoxesY[j];
                    j--;
                }
                this.physBoxesY[j + 1] = tmp;
                this.yIndexes.set(tmp, j + 1);
            }
        }
        getCollisions(physBox, dim) {
            let yIndex = this.yIndexes.get(physBox);
            let collisions = [];
            let tests = 0;
            if (dim != 'y' || physBox.getVelocity().y < 0) {
                for (let i = yIndex; i >= 0; i--) {
                    let candiate = this.physBoxesY[i];
                    tests++;
                    if (physBox.intersects(candiate)) {
                        collisions.push(candiate);
                    }
                    if (physBox.getSide(Sides.Bottom) > (candiate.getPos().y + 2.5)) {
                        break;
                    }
                }
            }
            if (dim != 'y' || physBox.getVelocity().y > 0) {
                for (let i = yIndex; i < this.physBoxes.length; i++) {
                    tests++;
                    let candiate = this.physBoxesY[i];
                    if (physBox.intersects(candiate)) {
                        collisions.push(candiate);
                    }
                    if (physBox.getSide(Sides.Top) < (candiate.getPos().y - 2.5)) {
                        break;
                    }
                }
            }
            return collisions;
        }
    }
    const game = new Game();
    const cubeCount = 200;
    const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
    let idx = 0;
    var box = BABYLON.MeshBuilder.CreateBox('', { size: 1 }, scene);
    const testMaterial = new BABYLON.StandardMaterial('', scene);
    testMaterial.diffuseTexture = new BABYLON.Texture('https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/images/testBox.png', scene);
    testMaterial.diffuseTexture.hasAlpha = true;
    testMaterial.backFaceCulling = false;
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
            this.lastCollisions = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()]
            ]);
            this.newCollisions = new Map([
                [Sides.Left, new Set()], [Sides.Right, new Set()], [Sides.Top, new Set()], [Sides.Bottom, new Set()], [Sides.Forward, new Set()], [Sides.Back, new Set()]
            ]);
        }
        setVelocity(velocity) { this.velocity = velocity.clone(); return this; }
        getVelocity() { return this.frozen ? PhysBox.frozenVelocity : this.velocity; }
        freeze() { this.frozen = true; return this; }
        unfreeze() { this.frozen = false; return this; }
        isFrozen() { return this.frozen; }
        getMoverLevel() { return 1; }
        isObstructed() { return (game.getPhysObjects().filter(y => y.intersects(this)).length != 0); }
        onCollisionStart(side, physBox) {
        }
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
        onCollisionStop(side, physBox) {
        }
        update(t) {
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
                            this.newCollisions.get(Sides.Top).add(hits[i]);
                            this.setSide(Sides.Top, hits[i].getSide(Sides.Bottom) - 0.001);
                        }
                        else
                            break;
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
                            this.newCollisions.get(Sides.Right).add(hits[i]);
                            this.setSide(Sides.Right, hits[i].getSide(Sides.Left) - 0.001);
                        }
                        else
                            break;
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
                            this.newCollisions.get(Sides.Forward).add(hits[i]);
                            this.setSide(Sides.Forward, hits[i].getSide(Sides.Back) - 0.0001);
                        }
                        else
                            break;
                    }
                }
            }
            this.newCollisions.forEach((collisions, side) => {
                collisions.forEach((collision) => {
                    if (!this.lastCollisions.get(side).has(collision)) {
                        this.onCollisionStart(side, collision);
                        collision.onCollisionStart(side.flip(), this);
                    }
                    else {
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
            let tmp = this.newCollisions;
            this.newCollisions = this.lastCollisions;
            this.newCollisions.forEach((collisions, side) => collisions.clear());
            this.lastCollisions = tmp;
        }
        getCollisions(side) { return this.lastCollisions.get(side); }
    }
    PhysBox.frozenVelocity = BABYLON.Vector3.Zero();
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
        onCollisionStart(side, physBox) {
            super.onCollisionStart(side, physBox);
            if (side == Sides.Bottom && (physBox instanceof FallBox) && physBox.isFrozen()) {
                this.freeze();
            }
        }
        getMoverLevel() { return 2; }
    }
    class Player extends PhysBox {
        constructor() {
            super();
            this.testNode = new BABYLON.TransformNode('', scene);
            this.setSize(new BABYLON.Vector3(0.5, 0.65, 0.5));
            this.setPos(new BABYLON.Vector3(0, 3, 0));
            const mesh = BABYLON.MeshBuilder.CreateCylinder("cone", { diameterTop: 1, height: 1, tessellation: 16 }, scene);
            mesh.position = this.getPos();
            mesh.scaling = this.getSize();
        }
        static LoadResources() {
            Player.sndJump = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/jump.wav", scene, null, {
                loop: false,
                autoplay: false,
                volume: 0.5
            });
            Player.sndHitHead = new BABYLON.Sound("", "https://raw.githubusercontent.com/lattesipper/endlessplatformer/master/resources/sounds/hitHead.wav", scene, null, {
                loop: false,
                autoplay: false,
                volume: 0.5
            });
        }
        onCollisionStart(side, physBox) {
            if (!Player.sndHitHead.isPlaying && side == Sides.Top && physBox instanceof FallBox)
                Player.sndHitHead.play();
        }
        update(t) {
            let wKey;
            let aKey;
            let sKey;
            let dKey;
            if (camera.alpha < 0) {
                camera.alpha = (Math.PI * 2) + camera.alpha;
            }
            else if (camera.alpha > (Math.PI * 2)) {
                camera.alpha = camera.alpha - (Math.PI * 2);
            }
            if (camera.alpha >= 5.49778714378 || camera.alpha <= 0.78539816339) {
                wKey = 'd';
                aKey = 'w';
                sKey = 'a';
                dKey = 's';
            }
            else if (camera.alpha >= 0.78539816339 && camera.alpha <= 2.35619449019) {
                wKey = 's';
                aKey = 'd';
                sKey = 'w';
                dKey = 'a';
            }
            else if (camera.alpha >= 2.35619449019 && camera.alpha <= 3.92699081699) {
                wKey = 'a';
                aKey = 's';
                sKey = 'd';
                dKey = 'w';
            }
            else if (camera.alpha >= 3.92699081699 && camera.alpha <= 5.49778714378) {
                wKey = 'w';
                aKey = 'a';
                sKey = 's';
                dKey = 'd';
            }
            let avgYSpeed = 0;
            let count = 0;
            if (!this.getCollisions(Sides.Top).size && this.getVelocity().y < 0) {
                if (this.getCollisions(Sides.Left).size) {
                    count += this.getCollisions(Sides.Left).size;
                    this.getCollisions(Sides.Left).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (isKeyPressed(' ')) {
                        this.getVelocity().x = 0.2;
                        this.getVelocity().y = 0.4;
                        if (!Player.sndHitHead.isPlaying)
                            Player.sndJump.play();
                    }
                }
                if (this.getCollisions(Sides.Right).size) {
                    count += this.getCollisions(Sides.Right).size;
                    this.getCollisions(Sides.Right).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (isKeyPressed(' ')) {
                        this.getVelocity().x = -0.2;
                        this.getVelocity().y = 0.4;
                        if (!Player.sndHitHead.isPlaying)
                            Player.sndJump.play();
                    }
                }
                if (this.getCollisions(Sides.Forward).size) {
                    count += this.getCollisions(Sides.Forward).size;
                    this.getCollisions(Sides.Forward).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (isKeyPressed(' ')) {
                        this.getVelocity().z = -0.2;
                        this.getVelocity().y = 0.4;
                        if (!Player.sndHitHead.isPlaying)
                            Player.sndJump.play();
                    }
                }
                if (this.getCollisions(Sides.Back).size) {
                    count += this.getCollisions(Sides.Back).size;
                    this.getCollisions(Sides.Back).forEach((physBox) => avgYSpeed += physBox.getVelocity().y);
                    if (isKeyPressed(' ')) {
                        this.getVelocity().z = 0.2;
                        this.getVelocity().y = 0.4;
                        if (!Player.sndHitHead.isPlaying)
                            Player.sndJump.play();
                    }
                }
            }
            if (count && !isKeyPressed(' ')) {
                avgYSpeed /= count;
                avgYSpeed -= 0.01;
                this.getVelocity().y = avgYSpeed;
            }
            else {
                this.getVelocity().y = Math.max(this.getVelocity().y - 0.008, -0.5);
            }
            if (this.getCollisions(Sides.Bottom).size) {
                if (isKeyPressed(wKey)) {
                    this.getVelocity().z = Player.moveSpeed;
                }
                else if (isKeyPressed(sKey)) {
                    this.getVelocity().z = -Player.moveSpeed;
                }
                else {
                    this.getVelocity().z = 0;
                }
                if (isKeyPressed(aKey)) {
                    this.getVelocity().x = -Player.moveSpeed;
                }
                else if (isKeyPressed(dKey)) {
                    this.getVelocity().x = Player.moveSpeed;
                }
                else {
                    this.getVelocity().x = 0;
                }
                if (isKeyPressed(' ')) {
                    if (!Player.sndHitHead.isPlaying)
                        Player.sndJump.play();
                    this.getVelocity().y = 0.3;
                }
            }
            else {
                if (isKeyPressed(wKey)) {
                    this.getVelocity().z = Math.min(this.getVelocity().z + 0.01, Player.moveSpeed);
                }
                else if (isKeyPressed(sKey)) {
                    this.getVelocity().z = Math.max(this.getVelocity().z - 0.01, -Player.moveSpeed);
                }
                else if (Math.abs(this.getVelocity().z) > 0.01) {
                    this.getVelocity().z += this.getVelocity().z > 0 ? -0.01 : 0.01;
                }
                else {
                    this.getVelocity().z = 0;
                }
                if (isKeyPressed(aKey)) {
                    this.getVelocity().x = Math.max(this.getVelocity().x - 0.01, -Player.moveSpeed);
                }
                else if (isKeyPressed(dKey)) {
                    this.getVelocity().x = Math.min(this.getVelocity().x + 0.01, Player.moveSpeed);
                }
                else if (Math.abs(this.getVelocity().x) > 0.01) {
                    this.getVelocity().x += this.getVelocity().x > 0 ? -0.01 : 0.01;
                }
                else {
                    this.getVelocity().x = 0;
                }
                if (isKeyPressed('control')) {
                    this.getVelocity().y = -0.5;
                }
            }
            super.update(t);
            this.testNode.position.copyFrom(this.getPos());
            camera.parent = this.testNode;
        }
    }
    Player.moveSpeed = 0.1;
    Player.LoadResources();
    let bottomBox = new FallBox();
    bottomBox
        .freeze()
        .setPos(new BABYLON.Vector3(0, 0, 0))
        .setSize(new BABYLON.Vector3(10, 5, 10));
    game.addPhysBox(bottomBox);
    for (let i = 0; i < cubeCount; i++) {
        let boxB = new FallBox();
        while (true) {
            boxB.setSize(BABYLON.Vector3.One().scale(2 + Math.random() * 3));
            boxB.setVelocity(new BABYLON.Vector3(0, -0.075, 0));
            boxB.setPos(new BABYLON.Vector3(-5 + Math.random() * 10, 20 + Math.random() * 1200, -5 + Math.random() * 10));
            if (!boxB.isObstructed())
                break;
        }
        game.addPhysBox(boxB);
    }
    let player = new Player();
    player.setPos(new BABYLON.Vector3(0, 7, 0));
    game.addPhysBox(player);
});
