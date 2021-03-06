//strictuse
'use strict';
var d = document.getElementById("debug"),
    miniGlCanvas = document.getElementById("miniGlCanvas"),
    simulation_timestep = 30,
    stats = null,
    tilesData = null,
    spriteData = null,
    gameData = null,
    powerData = null,
    isMobile = !1,
    trans = !1,
    newup = !1,
    powerup = !1,
    cityWorker = new Worker("js/worker.city.js"),
    view3d, hub, im, isWithMiniMap = !1,
    storage;

function debug(a) {
    d.innerHTML += "<br>" + a
}

function testMobile() {
    return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i) ? !0 : !1
}

function init() {
    isMobile = testMobile();
    storage = window.localStorage;
    hub = new HUB.Base;
    view3d = new V3D.Base(isMobile);
    isWithMiniMap && view3d.initMiniRender()
}

function loop() {
    requestAnimationFrame(loop);
    newup && (view3d.paintMap(), view3d.moveSprite(), newup = !1);
    powerup && (view3d.showPower(), powerup = !1);
    view3d.mouse.dragView || 3 === view3d.mouse.button ? view3d.dragCenterposition() : isMobile || view3d.updateKey();
    view3d.renderer.render(view3d.scene, view3d.camera);
    view3d.isWithStats && view3d.runStats();
    isWithMiniMap && (view3d.miniCheck(), view3d.miniRenderer.render(view3d.miniScene, view3d.topCamera))
}

function saveGame() {
    var a = [];
    view3d.saveCityBuild(a);
    a = JSON.stringify(a);
    cityWorker.postMessage({
        tell: "SAVEGAME",
        saveCity: a
    })
}

function loadGame(a) {
    cityWorker.postMessage({
        tell: "LOADGAME",
        isStart: a || !1
    })
}

function makeGameSave(a, b) {
    window.localStorage.setItem(b, a);
    console.log("game is save")
}

function makeLoadGame(a, b) {
    var c = b || !1;
    b && hub.initGameHub();
    var e = window.localStorage.getItem(a);
    e ? (cityWorker.postMessage({
        tell: "MAKELOADGAME",
        savegame: e,
        isStart: c
    }), console.log("game is load")) : console.log("No loading game found")
}

function newGameMap() {
    console.log("new map")
}

function displayStats() {
    view3d.isWithStats = !0
}

function hideStats() {
    view3d.isWithStats = !1
}
var ARRAY_TYPE;
ARRAY_TYPE || (ARRAY_TYPE = "undefined" !== typeof Float32Array ? Float32Array : Array);

function start() {
    initCity()
}

function setTimeColors(a) {
    view3d.setTimeColors(a)
}

function newMap() {
    view3d.isWithHeight && view3d.resetHeight();
    cityWorker.postMessage({
        tell: "NEWMAP"
    })
}

function newHeightMap() {
    view3d.isWithHeight = !0;
    cityWorker.postMessage({
        tell: "NEWMAP"
    })
}

function playMap() {
    hub.initGameHub();
    view3d.startZoom();
    cityWorker.postMessage({
        tell: "PLAYMAP"
    })
}

function selectTool(a) {
    view3d.selectTool(a)
}

function sendTool(a) {
    cityWorker.postMessage({
        tell: "TOOL",
        name: a
    })
}

function setDifficulty(a) {
    cityWorker.postMessage({
        tell: "DIFFICULTY",
        n: a
    })
}

function setSpeed(a) {
    cityWorker.postMessage({
        tell: "SPEED",
        n: a
    })
}

function getBudjet() {
    cityWorker.postMessage({
        tell: "BUDGET"
    })
}

function setBudjet(a) {
    cityWorker.postMessage({
        tell: "NEWBUDGET",
        budgetData: a
    })
}

function getEval() {
    cityWorker.postMessage({
        tell: "EVAL"
    })
}

function setDisaster(a) {
    console.log(a);
    cityWorker.postMessage({
        tell: "DISASTER",
        disaster: a
    })
}

function setOverlays(a) {}

function destroy(a, b) {
    cityWorker.postMessage({
        tell: "DESTROY",
        x: a,
        y: b
    })
}

function mapClick() {
    var a = view3d.pos;
    0 < a.x && 0 < a.z && cityWorker.postMessage({
        tell: "MAPCLICK",
        x: a.x,
        y: a.z
    })
}

function initCity() {
    hub.subtitle.innerHTML = "Generating world...";
    loop();
    cityWorker.postMessage = cityWorker.webkitPostMessage || cityWorker.postMessage;
    cityWorker.postMessage({
        tell: "INIT",
        url: document.location.href.replace(/\/[^/]*$/, "/") + "build/city.3d.min.js",
        timestep: simulation_timestep
    })
}
cityWorker.onmessage = function(a) {
    var b = a.data.tell;
    "NEWMAP" == b && (tilesData = a.data.tilesData, view3d.paintMap(a.data.mapSize, a.data.island, !0), hub.start());
    "FULLREBUILD" == b && (a.data.isStart && view3d.startZoom(), view3d.fullRedraw = !0, tilesData = a.data.tilesData, view3d.paintMap(a.data.mapSize, a.data.island, !0, !0), view3d.loadCityBuild(a.data.cityData));
    "BUILD" == b && view3d.build(a.data.x, a.data.y);
    "RUN" == b && (tilesData = a.data.tilesData, powerData = a.data.powerData, spriteData = a.data.sprites, hub.updateCITYinfo(a.data.infos),
        newup = !0, powerData && (powerup = !0));
    "BUDGET" == b && hub.openBudget(a.data.budgetData);
    "QUERY" == b && hub.openQuery(a.data.queryTxt);
    "EVAL" == b && hub.openEval(a.data.evalData);
    "SAVEGAME" == b && makeGameSave(a.data.gameData, a.data.key);
    "LOADGAME" == b && makeLoadGame(a.data.key, a.data.isStart)
};
var Audio, THREE, V3D = {
    REVISION: "0.4",
    Base: function(a, b, c) {
        this.metalness = 0.8;
        this.roughness = 0.5;
        this.wireframe = !1;
        this.envType = "base";
        this.M_list = ["treeLists", "townLists", "houseLists", "buildingLists"];
        this.M_temp = ["tempTreeLayers", "temptownLayers", "tempHouseLayers", "tempBuildingLayers"];
        this.M_geom = ["treeGeo", "buildingGeo", "houseGeo", "X"];
        this.M_mesh = ["treeMeshs", "townMeshs", "houseMeshs", "buildingMeshs"];
        this.M_mats = ["townMaterial", "townMaterial", "buildingMaterial", "buildingMaterial"];
        this.pix = b ||
            1;
        this.isLow = c || !1;
        this.container = document.getElementById("container");
        this.isMobile = a || !1;
        this.isWithEnv = this.isWithLight = this.isWithTree = !0;
        this.isWithNormal = !1;
        this.isWithFog = !0;
        this.isWinter = this.isIsland = !1;
        this.isTransGeo = this.isComputeVertex = !0;
        this.key = [0, 0, 0, 0, 0, 0, 0];
        if (this.isMobile || this.isLow) this.isWithLight = this.isWithNormal = this.isWithEnv = this.isWithTree = !1;
        this.f = [0, 0, 0];
        this.stats = [0, 0];
        this.isWithStats = !1;
        this.dayTime = 0;
        this.tcolor = {
            r: 10,
            g: 15,
            b: 80,
            a: 0.9
        };
        this.snd_layzone = new Audio("./sound/layzone.mp3");
        this.imgSrc = ["img/tiles32.png", "img/town.jpg", "img/building.jpg", "img/w_building.png", "img/w_town.png", "img/env/" + this.envType + ".jpg"];
        this.imgSrcPlus = ["img/tiles32_w.png", "img/town_w.jpg", "img/building_w.jpg"];
        this.snd_winterMapLoaded = new Audio("./sound/startup1.wav");
        this.rootModel = "img/world.sea";
        this.imgs = [];
        this.num = 0;
        this.fullRedraw = !1;
        this.isWithBackground = !0;
        this.deepthTest = this.isColorTest = this.isWithHeight = !1;
        this.mu = 2;
        this.ToRad = Math.PI / 180;
        this.topCamera = this.camera = null;
        this.topCameraDistance = 100;
        this.miniRenderer = this.mapCanvas =
            this.imageSrc = this.timer = this.renderer = this.scene = null;
        this.miniSize = {
            w: 200,
            h: 200
        };
        this.miniCanvas = [];
        this.miniCtx = [];
        this.miniCanvasN = [];
        this.miniCtxN = [];
        this.txtNeedUpdate = [];
        this.miniTerrain = [];
        this.terrainTxt = [];
        this.forceUpdate = {
            x: -1,
            y: -1
        };
        this.Bulldoze = !1;
        this.cam = {
            horizontal: 90,
            vertical: 45,
            distance: 120
        };
        this.vsize = {
            x: window.innerWidth,
            y: window.innerHeight,
            z: window.innerWidth / window.innerHeight
        };
        this.mouse = {
            ox: 0,
            oy: 0,
            h: 0,
            v: 0,
            mx: 0,
            my: 0,
            dx: 0,
            dy: 0,
            down: !1,
            over: !1,
            drag: !1,
            click: !1,
            move: !0,
            dragView: !1,
            button: 0
        };
        this.pos = {
            x: -1,
            y: 0,
            z: -1
        };
        this.select = "";
        this.meshs = {};
        this.mapSize = [128, 128];
        this.nlayers = 64;
        this.tool = this.terrain = null;
        this.toolSet = [{
            id: 0,
            tool: "none",
            geo: 0,
            name: "",
            build: 0,
            size: 0,
            sy: 0,
            price: 0,
            color: "none",
            drag: 0
        }, {
            id: 1,
            tool: "residential",
            geo: 1,
            name: "R",
            build: 1,
            size: 3,
            sy: 0.2,
            price: 100,
            color: "lime",
            drag: 0
        }, {
            id: 2,
            tool: "commercial",
            geo: 2,
            name: "C",
            build: 1,
            size: 3,
            sy: 0.2,
            price: 100,
            color: "blue",
            drag: 0
        }, {
            id: 3,
            tool: "industrial",
            geo: 3,
            name: "I",
            build: 1,
            size: 3,
            sy: 0.2,
            price: 100,
            color: "yellow",
            drag: 0
        }, {
            id: 4,
            tool: "police",
            geo: 4,
            name: "",
            build: 1,
            size: 3,
            sy: 1.2,
            price: 500,
            color: "blue",
            drag: 0
        }, {
            id: 5,
            tool: "park",
            geo: 5,
            name: "",
            build: 1,
            size: 1,
            sy: 0.02,
            price: 10,
            color: "darkgreen",
            drag: 0
        }, {
            id: 6,
            tool: "fire",
            geo: 7,
            name: "",
            build: 1,
            size: 3,
            sy: 1.2,
            price: 500,
            color: "red",
            drag: 0
        }, {
            id: 7,
            tool: "road",
            geo: 0,
            name: "",
            build: 0,
            size: 1,
            sy: 0.1,
            price: 10,
            color: "black",
            drag: 1
        }, {
            id: 8,
            tool: "bulldozer",
            geo: 0,
            name: "",
            build: 0,
            size: 1,
            sy: 0,
            price: 1,
            color: "deeppink",
            drag: 1
        }, {
            id: 9,
            tool: "rail",
            geo: 0,
            name: "",
            build: 0,
            size: 1,
            sy: 0.15,
            price: 20,
            color: "brown",
            drag: 1
        }, {
            id: 10,
            tool: "coal",
            geo: 8,
            name: "",
            build: 1,
            size: 4,
            sy: 2,
            price: 3E3,
            color: "gray",
            drag: 0
        }, {
            id: 11,
            tool: "wire",
            geo: 0,
            name: "",
            build: 0,
            size: 1,
            sy: 0.05,
            price: 5,
            color: "khaki",
            drag: 1
        }, {
            id: 12,
            tool: "nuclear",
            geo: 9,
            name: "",
            build: 1,
            size: 4,
            sy: 2,
            price: 5E3,
            color: "orange",
            drag: 0
        }, {
            id: 13,
            tool: "port",
            geo: 10,
            name: "",
            build: 1,
            size: 4,
            sy: 0.5,
            price: 3E3,
            color: "dodgerblue",
            drag: 0
        }, {
            id: 14,
            tool: "stadium",
            geo: 11,
            name: "",
            build: 1,
            size: 4,
            sy: 2,
            price: 5E3,
            color: "yellowgreen",
            drag: 0
        }, {
            id: 15,
            tool: "airport",
            geo: 12,
            name: "",
            build: 1,
            size: 6,
            sy: 0.5,
            price: 1E4,
            color: "lightblue",
            drag: 0
        }, {
            id: 16,
            tool: "none",
            geo: 0,
            name: "",
            build: 0,
            size: 0,
            sy: 0,
            price: 0,
            color: "none",
            drag: 0
        }, {
            id: 17,
            tool: "query",
            geo: 0,
            name: "?",
            build: 0,
            size: 1,
            sy: 0,
            price: 0,
            color: "cyan",
            drag: 0
        }, {
            id: 18,
            tool: "none",
            geo: 0,
            name: "",
            build: 0,
            size: 0,
            sy: 0,
            price: 0,
            color: "none",
            drag: 0
        }];
        this.heightData = this.currentTool = null;
        this.tempHeightLayers = [];
        this.houseGeo = this.treeGeo = this.spriteGeo = this.industrialGeo = this.commercialGeo = this.residentialGeo = this.buildingGeo = this.buildingMap = this.townMap =
            this.buildingHeigth = this.townHeigth = this.skyCanvasBasic = this.skyCanvas = this.groundCanvas = this.buildingCanvas = this.townCanvas = this.buildingMaterial = this.townMaterial = this.skyTexture = this.buildingTexture = this.serviceTexture = this.centralTexture = this.worldTexture = null;
        this.treeMeshs = [];
        this.treeLists = [];
        this.tempTreeLayers = [];
        this.treeDeepMeshs = [];
        this.treeValue = [];
        this.powerMeshs = [];
        this.powerMaterial = null;
        this.buildingMeshs = [];
        this.buildingLists = [];
        this.tempBuildingLayers = [];
        this.townMeshs = [];
        this.townLists = [];
        this.temptownLayers = [];
        this.houseMeshs = [];
        this.houseLists = [];
        this.tempHouseLayers = [];
        this.buildingStaticMeshs = [];
        this.buildingStaticLists = [];
        this.H = [249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260];
        this.R = [244, 265, 274, 283, 292, 301, 310, 319, 328, 337, 346, 355, 364, 373, 382, 391, 400, 409, 418];
        this.C = [427, 436, 445, 454, 463, 475, 481, 490, 499, 508, 517, 526, 535, 544, 553, 562, 571, 580, 589, 598, 607];
        this.I = [616, 625, 634, 643, 652, 661, 670, 679, 688];
        this.tilesUpdateList = [];
        this.tempDestruct = [];
        this.currentLayer = 0;
        this.spriteLists =
            "train elico plane boat monster tornado sparks".split(" ");
        this.spriteMeshs = [];
        this.spriteObjs = {};
        this.loadImages()
    }
};
V3D.Base.prototype = {
    constructor: V3D.Base,
    init: function() {
        this.clock = new THREE.Clock;
        this.scene = new THREE.Scene;
        this.camera = new THREE.PerspectiveCamera(55, this.vsize.z, 0.1, 1E3);
        this.scene.add(this.camera);
        this.rayVector = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster;
        this.land = new THREE.Group;
        this.scene.add(this.land);
        this.isWithFog && (this.fog = new THREE.Fog(13401958, 1, 100), this.scene.fog = this.fog);
        this.center = new THREE.Vector3;
        this.center.x = 0.5 * this.mapSize[0];
        this.center.z = 0.5 * this.mapSize[1];
        this.moveCamera();
        this.ease = new THREE.Vector3;
        this.easeRot = new THREE.Vector3;
        this.powerMaterial = new THREE.SpriteMaterial({
            map: this.powerTexture(),
            transparent: !0
        });
        var a = new THREE.WebGLRenderer({
            precision: "mediump",
            antialias: !1
        });
        a.setSize(this.vsize.x, this.vsize.y);
        a.setPixelRatio(this.pix || window.devicePixelRatio);
        a.sortObjects = !1;
        a.sortElements = !1;
        a.autoClear = this.isWithBackground;
        a.gammaInput = !0;
        a.gammaOutput = !0;
        this.container.appendChild(a.domElement);
        this.renderer = a;
        this.isWithLight && (a = new THREE.DirectionalLight(16777214,
            0.6), a.position.set(this.center.x + 100, 300, this.center.z - 100), a.target.position.set(this.center.x, this.center.y, this.center.z), this.scene.add(a), a = new THREE.HemisphereLight(6711014, 251658239, 1), a.position.set(0, 20, 0), this.scene.add(a), this.hemiLight = a);
        this.isWithBackground ? (this.skyCanvasBasic = this.gradTexture([
                [0.51, 0.49, 0.3],
                ["#cc7f66", "#A7DCFA", "deepskyblue"]
            ]), this.skyCanvas = this.gradTexture([
                [0.51, 0.49, 0.3],
                ["#cc7f66", "#A7DCFA", "deepskyblue"]
            ]), this.skyTexture = new THREE.Texture(this.skyCanvas),
            this.skyTexture.needsUpdate = !0, this.back = new THREE.Mesh(new THREE.IcosahedronGeometry(300, 1), new THREE.MeshBasicMaterial({
                map: this.skyTexture,
                side: THREE.BackSide,
                depthWrite: !1,
                fog: !1
            })), this.scene.add(this.back), this.renderer.autoClear = !1) : this.renderer.setClearColor(13401958, 1);
        window.addEventListener("resize", function(a) {
            this.resize()
        }.bind(this), !1);
        document.addEventListener("contextmenu", function(a) {
            a.preventDefault()
        }, !1);
        document.addEventListener("mousewheel", this, !1);
        this.container.addEventListener("mousemove",
            this, !1);
        this.container.addEventListener("mousedown", this, !1);
        this.container.addEventListener("touchmove", this, !1);
        this.container.addEventListener("touchstart", this, !1);
        this.container.addEventListener("touchend", this, !1);
        document.addEventListener("mouseup", this, !1);
        this.isMobile || this.bindKeys();
        start();
        this.loadImagesPlus()
    },
    handleEvent: function(a) {
        switch (a.type) {
            case "mouseup":
            case "mouseout":
            case "touchend":
                this.onMouseUp(a);
                break;
            case "mousedown":
            case "touchstart":
                this.onMouseDown(a);
                break;
            case "mousemove":
            case "touchmove":
                this.onMouseMove(a);
                break;
            case "mousewheel":
                this.onMouseWheel(a)
        }
    },
    runStats: function() {
        this.f[1] = Date.now();
        this.f[1] - 1E3 > this.f[0] && (this.f[0] = this.f[1], hub.upStats(this.f[2], this.renderer.info.memory.geometries), this.f[2] = 0);
        this.f[2]++
    },
    render: function() {
        this.isWithStats && this.runStats();
        this.renderer.render(this.scene, this.camera);
        this.deepthTest && this.miniRender()
    },
    initMiniRender: function() {
        this.minibuilding = this.miniTree = null;
        this.miniTreeUpdate = 0;
        this.townHeigth = this.customShader();
        this.miniScene = new THREE.Scene;
        this.topCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 200);
        this.topCameraDistance = 10;
        this.miniScene.add(this.topCamera);
        this.miniRenderer = new THREE.WebGLRenderer({
            canvas: miniGlCanvas,
            precision: "lowp",
            antialias: !1
        });
        this.miniRenderer.setSize(this.miniSize.w, this.miniSize.h, !0);
        this.miniRenderer.sortObjects = !1;
        this.miniRenderer.sortElements = !1;
        this.deepthTest = !0
    },
    customShader: function() {
        return new THREE.ShaderMaterial({
            uniforms: {
                deep: {
                    type: "f",
                    value: 0.1
                }
            },
            attributes: {},
            vertexShader: "uniform float deep;\nvarying float dy;\nvarying vec4 vc;\nvoid main(void) {\ngl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\ndy = position.y*deep;\nvc = vec4(dy,dy,dy, 1.0);\n}",
            fragmentShader: "precision lowp float;\nvarying vec4 vc;\nvoid main(void) { gl_FragColor = vc; }"
        })
    },
    miniClear: function() {
        for (var a = this.miniScene.children.length, b; a--;) b = this.miniScene.children[a], b.geometry && (b.geometry.dispose(), this.miniScene.remove(b))
    },
    miniClearMesh: function(a) {
        a.geometry.dispose();
        this.miniScene.remove(a)
    },
    miniCheck: function() {
        var a = this.findLayer(this.center.x, this.center.z);
        a !== this.currentLayer ? (this.currentLayer = a, this.miniUpTree(a), this.miniUpBuilding(a)) : 1 == this.miniTreeUpdate &&
            (this.miniUpTree(a), this.miniTreeUpdate = 0)
    },
    miniUpTree: function(a) {
        null !== this.miniTree && this.miniClearMesh(this.miniTree);
        this.miniTree = new THREE.Mesh(this.treeMeshs[a].geometry.clone(), this.townHeigth);
        this.miniScene.add(this.miniTree)
    },
    miniUpBuilding: function(a) {
        this.buildingMeshs[a] && (null !== this.minibuilding && this.miniClearMesh(this.minibuilding), this.minibuilding = new THREE.Mesh(this.buildingMeshs[a].geometry.clone(), this.townHeigth), this.miniScene.add(this.minibuilding))
    },
    miniRender: function() {
        this.deepthTest &&
            (this.miniCheck(), this.miniRenderer.render(this.miniScene, this.topCamera))
    },
    resize: function() {
        this.vsize = {
            x: window.innerWidth,
            y: window.innerHeight,
            z: window.innerWidth / window.innerHeight
        };
        this.camera.aspect = this.vsize.z;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.vsize.x, this.vsize.y)
    },
    startZoom: function() {
        this.timer = setInterval(this.faddingZoom, 1E3 / 60, this)
    },
    faddingZoom: function(a) {
        20 < a.cam.distance ? (a.cam.distance--, a.moveCamera()) : clearInterval(a.timer)
    },
    loadImages: function() {
        var a =
            this,
            b = this.num;
        this.imgs[b] = new Image;
        this.imgs[b].onload = function() {
            a.num++;
            1 === a.num && null !== hub && (hub.subtitle.innerHTML = "Loading textures ...");
            a.num === a.imgSrc.length ? (a.changeTextures(), a.num = 0) : a.loadImages()
        };
        this.imgs[b].src = this.imgSrc[b]
    },
    loadImagesPlus: function() {
        var a = this,
            b = this.num + 5;
        this.imgs[b] = new Image;
        this.imgs[b].src = this.imgSrcPlus[this.num];
        this.imgs[b].onload = function() {
            a.num++;
            a.num === a.imgSrcPlus.length ? a.winterMapLoaded = !0 : a.loadImagesPlus()
        }
    },
    winterSwitch: function() {
        this.isWinter = !this.isWinter && this.winterMapLoaded ? !0 : !1;
        this.updateBackground();
        this.setTimeColors(this.dayTime)
    },
    changeTextures: function() {
        this.envCanvas = document.createElement("canvas");
        this.groundCanvas = document.createElement("canvas");
        this.townCanvas = document.createElement("canvas");
        this.buildingCanvas = document.createElement("canvas");
        this.envCanvas.width = this.envCanvas.height = this.imgs[5].width;
        this.groundCanvas.width = this.groundCanvas.height = this.imgs[0].width;
        this.townCanvas.width = this.townCanvas.height =
            this.imgs[1].width;
        this.buildingCanvas.width = this.buildingCanvas.height = this.imgs[2].width;
        this.tint(this.envCanvas, this.imgs[5]);
        this.tint(this.groundCanvas, this.imgs[0]);
        this.tint(this.townCanvas, this.imgs[1], this.imgs[4]);
        this.tint(this.buildingCanvas, this.imgs[2], this.imgs[3]);
        this.imageSrc = this.groundCanvas;
        this.createTextures()
    },
    createTextures: function() {
        this.isWithEnv && (this.environment = new THREE.Texture(this.envCanvas), this.environment.mapping = THREE.SphericalReflectionMapping, this.environment.needsUpdate = !0);
        this.townTexture = new THREE.Texture(this.townCanvas);
        this.townTexture.flipY = !1;
        this.townTexture.needsUpdate = !0;
        this.buildingTexture = new THREE.Texture(this.buildingCanvas);
        this.buildingTexture.flipY = !1;
        this.buildingTexture.needsUpdate = !0;
        this.isWithLight ? (new THREE.Vector2(2, 2), this.townMaterial = new THREE.MeshStandardMaterial({
            map: this.townTexture,
            metalness: this.metalness,
            roughness: this.roughness,
            wireframe: this.wireframe
        }), this.buildingMaterial = new THREE.MeshStandardMaterial({
            map: this.buildingTexture,
            metalness: this.metalness,
            roughness: this.roughness,
            wireframe: this.wireframe
        })) : (this.townMaterial = new THREE.MeshBasicMaterial({
            map: this.townTexture
        }), this.buildingMaterial = new THREE.MeshBasicMaterial({
            map: this.buildingTexture
        }));
        this.isWithEnv && (this.townMaterial.envMap = this.environment, this.buildingMaterial.envMap = this.environment);
        this.isWithNormal && this.addNormalMap();
        this.loadSea3d()
    },
    addNormalMap: function() {
        this.buildingTexture_n = new THREE.Texture(this.imgs[6]);
        this.buildingTexture_n.flipY = !1;
        this.buildingTexture_n.needsUpdate = !0;
        this.townTexture_n = new THREE.Texture(this.imgs[7]);
        this.townTexture_n.flipY = !1;
        this.townTexture_n.needsUpdate = !0;
        this.ground_n = this.imgs[8];
        this.townMaterial.normalMap = this.townTexture_n;
        this.buildingMaterial.normalMap = this.buildingTexture_n
    },
    textureSwitch: function(a) {
        switch (a) {
            case "normal":
                this.townMaterial.map = this.townTexture, this.buildingMaterial.map = this.buildingTexture
        }
    },
    setTimeColors: function(a) {
        this.dayTime = a;
        1 == this.dayTime && (this.tcolor = {
            r: 100,
            g: 15,
            b: 80,
            a: 0.3
        });
        2 == this.dayTime && (this.tcolor = {
            r: 10,
            g: 15,
            b: 80,
            a: 0.8
        });
        3 == this.dayTime && (this.tcolor = {
            r: 10,
            g: 15,
            b: 80,
            a: 0.6
        });
        this.tint(this.skyCanvas);
        this.isWinter ? (this.tint(this.groundCanvas, this.imgs[5]), this.tint(this.townCanvas, this.imgs[6], this.imgs[4]), this.tint(this.buildingCanvas, this.imgs[7], this.imgs[3])) : (this.tint(this.groundCanvas, this.imgs[0]), this.tint(this.townCanvas, this.imgs[1], this.imgs[4]), this.tint(this.buildingCanvas, this.imgs[2], this.imgs[3]));
        this.isWithFog && (this.isIsland ? this.isWinter ?
            (0 == this.dayTime && this.fog.color.setHex(11529966), 1 == this.dayTime && this.fog.color.setHex(10005439), 2 == this.dayTime && this.fog.color.setHex(2833520), 3 == this.dayTime && this.fog.color.setHex(5007503)) : (0 == this.dayTime && this.fog.color.setHex(6711014), 1 == this.dayTime && this.fog.color.setHex(6638777), 2 == this.dayTime && this.fog.color.setHex(1843310), 3 == this.dayTime && this.fog.color.setHex(3093132)) : this.isWinter ? (0 == this.dayTime && this.fog.color.setHex(15134975), 1 == this.dayTime && this.fog.color.setHex(12561610),
                2 == this.dayTime && this.fog.color.setHex(3554419), 3 == this.dayTime && this.fog.color.setHex(6449558)) : (0 == this.dayTime && this.fog.color.setHex(14849133), 1 == this.dayTime && this.fog.color.setHex(12348516), 2 == this.dayTime && this.fog.color.setHex(3484246), 3 == this.dayTime && this.fog.color.setHex(6308956)));
        this.buildingTexture.needsUpdate = !0;
        this.townTexture.needsUpdate = !0;
        this.fullRedraw = this.skyTexture.needsUpdate = !0
    },
    loadSea3d: function() {
        var a = this,
            b = new THREE.SEA3D;
        b.onComplete = function(c) {
            for (var e = b.meshes.length; e--;) c =
                b.meshes[e], c.material.dispose(), a.meshs[c.name] = c;
            a.defineGeometry()
        };
        b.load(this.rootModel);
        null !== hub && (hub.subtitle.innerHTML = "Loading 3d model ...")
    },
    defineGeometry: function() {
        var a, b = this.meshs;
        this.buildingGeo = [];
        this.buildingGeo[0] = null;
        this.buildingGeo[1] = null;
        this.buildingGeo[2] = null;
        this.buildingGeo[3] = null;
        this.buildingGeo[4] = b.police.geometry;
        this.buildingGeo[5] = b.park_1.geometry;
        this.buildingGeo[6] = b.park_2.geometry;
        this.buildingGeo[7] = b.fire.geometry;
        this.buildingGeo[8] = b.coal.geometry;
        this.buildingGeo[9] = b.nuclear.geometry;
        this.buildingGeo[10] = b.port.geometry;
        this.buildingGeo[11] = b.stadium.geometry;
        this.buildingGeo[12] = b.airport.geometry;
        this.residentialGeo = [];
        this.commercialGeo = [];
        this.industrialGeo = [];
        this.houseGeo = [];
        for (a = 9; a--;) this.industrialGeo[a] = b["i_0" + a].geometry;
        for (a = 19; a--;) this.residentialGeo[a] = 10 > a ? b["r_0" + a].geometry : b["r_" + a].geometry;
        for (a = 21; a--;) this.commercialGeo[a] = 10 > a ? b["c_0" + a].geometry : b["c_" + a].geometry;
        for (a = 12; a--;) this.houseGeo[a] = 10 > a ? b["rh_0" +
            a].geometry : b["rh_" + a].geometry;
        this.spriteGeo = [];
        this.spriteGeo[0] = b.train.geometry;
        this.spriteGeo[1] = b.elico.geometry.clone();
        this.spriteGeo[2] = b.plane.geometry.clone();
        this.treeGeo = [];
        this.treeGeo[0] = b.ttt3.geometry;
        this.treeGeo[1] = b.ttt3.geometry.clone();
        this.treeGeo[2] = b.ttt4.geometry;
        this.treeGeo[3] = b.ttt4.geometry.clone();
        this.treeGeo[4] = b.ttt0.geometry;
        this.treeGeo[5] = b.ttt1.geometry;
        this.treeGeo[6] = b.ttt2.geometry;
        this.treeGeo[7] = b.ttt5.geometry;
        this.init()
    },
    getRandomObject: function() {
        var a,
            b;
        switch (this.randRange(0, 6)) {
            case 0:
                a = this.buildingGeo[this.randRange(4, 12)];
                b = this.townMaterial;
                break;
            case 1:
                a = this.residentialGeo[this.randRange(1, this.residentialGeo.length - 1)];
                b = this.buildingMaterial;
                break;
            case 2:
                a = this.commercialGeo[this.randRange(1, this.commercialGeo.length - 1)];
                b = this.buildingMaterial;
                break;
            case 3:
                a = this.industrialGeo[this.randRange(1, this.industrialGeo.length - 1)];
                b = this.buildingMaterial;
                break;
            case 4:
                a = this.houseGeo[this.randRange(0, this.houseGeo.length - 1)];
                b = this.buildingMaterial;
                break;
            case 5:
                a = this.spriteGeo[this.randRange(0, this.spriteGeo.length - 1)];
                b = this.townMaterial;
                break;
            case 6:
                a = this.randRange(0, 2), b = 0, 1 == a && (b = 4), 2 == a && (b = 6), a = this.treeGeo[b], b = this.townMaterial
        }
        b = new THREE.Mesh(a.clone(), b.clone());
        b.name = a.name;
        return b
    },
    randRange: function(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a
    },
    buildMeshLayer: function(a, b) {
        b = b || "tree";
        var c = 0;
        "tree" === b && (c = 0);
        "town" === b && (c = 1);
        "house" === b && (c = 2);
        "building" === b && (c = 3);
        var e = this.M_list[c],
            f = this.M_temp[c],
            h = this.M_geom[c],
            g = this.M_mesh[c],
            l = this.M_mats[c],
            k, p, q, n, m, v, s, t, u, r, w = 0;
        if (this[e][a]) {
            v = this[e][a].length;
            p = [];
            n = [];
            for (q = []; v--;) {
                r = this[e][a][v];
                if (3 === c) {
                    for (m = this.R.length; m--;) r[3] === this.R[m] && (k = this.residentialGeo[m], 0 === m && 0 === r[5] ? (this.buildingLists[a][v][5] = 1, this.addBaseHouse(r[0], r[1], r[2])) : 0 < m && 1 === r[5] && (this.buildingLists[a][v][5] = 0, this.removeBaseHouse(r[0], r[1], r[2])));
                    for (m = this.C.length; m--;) r[3] === this.C[m] && (k = this.commercialGeo[m]);
                    for (m = this.I.length; m--;) r[3] === this.I[m] && (k = this.industrialGeo[m])
                } else if (2 ===
                    c)
                    for (m = this.H.length; m--;) r[3] === this.H[m] && (k = this.houseGeo[m]);
                else {
                    if (8 === r[3] || 9 === r[3] || 10 === r[3] || 11 === r[3]) w = 1;
                    12 === r[3] && (w = 3);
                    k = this[h][r[3]]
                }
                if (k) {
                    m = k.attributes.position.array;
                    t = m.length / 3;
                    for (s = 0; s < t; s++) u = 3 * s, p.push(m[u] + r[0]), p.push(m[u + 1] + r[1]), p.push(-m[u + 2] + r[2] + w);
                    m = k.attributes.normal.array;
                    t = m.length / 3;
                    for (s = 0; s < t; s++) u = 3 * s, q.push(m[u]), q.push(m[u + 1]), q.push(-m[u + 2]);
                    m = k.attributes.uv.array;
                    t = m.length;
                    for (s = 0; s < t; s++) n.push(m[s])
                }
            }
            this[g][a] && (this.scene.remove(this[g][a]), this[g][a].geometry.dispose());
            0 < p.length && (c = new THREE.BufferGeometry, c.addAttribute("position", new THREE.BufferAttribute(new Float32Array(p), 3)), c.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(q), 3)), c.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(n), 2)), this[g][a] = new THREE.Mesh(c, this[l]), this.scene.add(this[g][a]));
            this[f][a] = 0
        }
    },
    addTree: function(a, b, c, e, f) {
        this.isWithTree && (this.treeLists[f] || (this.treeLists[f] = []), this.treeLists[f].push([a, b, c, e]))
    },
    populateTree: function() {
        if (this.isWithTree)
            for (var a =
                    this.nlayers; a--;) this.buildMeshLayer(a)
    },
    clearAllTrees: function() {
        if (this.isWithTree) {
            for (var a = this.nlayers; a--;) this.treeMeshs[a] && (this.scene.remove(this.treeMeshs[a]), this.treeMeshs[a].geometry && this.treeMeshs[a].geometry.dispose());
            this.treeMeshs = [];
            this.treeLists = [];
            this.tempTreeLayers = []
        }
    },
    removeTreePack: function(a) {
        if (this.isWithTree) {
            for (var b = a.length; b--;) this.removeTree(a[b][0], a[b][1], !0);
            for (b = this.tempTreeLayers.length; b--;) 1 === this.tempTreeLayers[b] && this.rebuildTreeLayer(b)
        }
    },
    removeTree: function(a,
        b, c) {
        var e = this.findLayer(a, b),
            f;
        if (this.treeLists[e])
            for (var h = this.treeLists[e].length; h--;)
                if (f = this.treeLists[e][h], f[0] == a && f[2] == b)
                    if (this.treeLists[e].splice(h, 1), c) this.tempTreeLayers[e] = 1;
                    else {
                        this.rebuildTreeLayer(e);
                        break
                    }
    },
    rebuildTreeLayer: function(a) {
        this.isWithTree && (this.scene.remove(this.treeMeshs[a]), this.treeMeshs[a].geometry.dispose(), this.buildMeshLayer(a), a == this.currentLayer && (this.miniTreeUpdate = 1))
    },
    updateBackground: function() {
        var a, b;
        this.isWithBackground ? (this.isIsland ? (a =
            "#6666e6", b = 6711014, this.isWinter && (a = "#AFEEEE", b = 11529966)) : (a = "#E2946D", b = 14849133, this.isWinter && (a = "#E6F0FF", b = 15134975)), this.skyCanvasBasic = this.gradTexture([
            [0.51, 0.49, 0.3],
            [a, "#BFDDFF", "#4A65FF"]
        ]), this.skyCanvas = this.gradTexture([
            [0.51, 0.49, 0.3],
            [a, "#BFDDFF", "#4A65FF"]
        ]), this.isWithFog && this.fog.color.setHex(b), this.skyTexture = new THREE.Texture(this.skyCanvas), this.skyTexture.needsUpdate = !0, this.back.material.map = this.skyTexture) : this.isIsland ? this.renderer.setClearColor(6711014, 1) : this.renderer.setClearColor(13401958,
            1);
        this.isWithLight && this.hemiLight.groundColor.setHex(b)
    },
    updateTerrain: function(a) {
        this.isIsland = a || !1;
        this.center.x = 0.5 * this.mapSize[0];
        this.center.z = 0.5 * this.mapSize[1];
        this.updateBackground();
        if (0 === this.miniTerrain.length) {
            a = 0;
            for (var b = [0, 2228224, 4456448, 6684672, 8912896, 11141120, 13369344, 16711680], c = [0, 8704, 17408, 26112, 34816, 43520, 52224, 65280], e = 0; 8 > e; e++)
                for (var f = 0; 8 > f; f++) {
                    var h;
                    h = this.isWithHeight ? new THREE.PlaneBufferGeometry(16, 16, 16, 16) : new THREE.PlaneBufferGeometry(16, 16, 1, 1);
                    h.rotateX(0.5 *
                        -Math.PI);
                    for (var g = h.attributes.position.array, l = g.length / 3; l--;) {
                        var k = 3 * l;
                        g[k] += 8 + 16 * f - 0.5;
                        g[k + 2] += 8 + 16 * e - 0.5
                    }
                    this.miniTerrain[a] = this.isColorTest ? new THREE.Mesh(h, new THREE.MeshBasicMaterial({
                        color: b[e] + c[f]
                    })) : this.isWithLight ? new THREE.Mesh(h, new THREE.MeshStandardMaterial({
                        color: 16777215,
                        metalness: this.metalness,
                        roughness: this.roughness,
                        wireframe: this.wireframe
                    })) : new THREE.Mesh(h, new THREE.MeshBasicMaterial({
                        color: 16777215
                    }));
                    this.isWithEnv && (this.miniTerrain[a].material.envMap = this.environment);
                    this.land.add(this.miniTerrain[a]);
                    a++
                }
        }
        for (a = this.miniTerrain.length; a--;) b = new THREE.Texture(this.miniCanvas[a]), b.needsUpdate = !0, this.miniTerrain[a].material.map = b, this.isWithNormal && (c = new THREE.Texture(this.miniCanvasN[a]), c.needsUpdate = !0, this.miniTerrain[a].material.normalMap = c), this.terrainTxt[a] = b;
        this.isWithHeight ? (this.applyHeight(), this.center.y = this.heightData[this.findHeightId(this.center.x, this.center.z)]) : this.center.y = 0;
        this.moveCamera();
        this.back.position.copy(this.center)
    },
    generateHeight: function() {
        if (0 !=
            this.miniTerrain.length) {
            for (var a = this.miniTerrain.length; a--;) this.land.remove(this.miniTerrain[a]);
            this.miniTerrain = []
        }
        this.bigG = new THREE.PlaneBufferGeometry(128, 128, 128, 128);
        this.bigG.rotateX(0.5 * -Math.PI);
        for (var a = this.bigG.attributes.position.array, b = a.length / 3; b--;) {
            var c = 3 * b;
            a[c] += this.center.x;
            a[c + 2] += this.center.z
        }
        for (var e, f, b = new ARRAY_TYPE(16641), c = new Perlin, h = 1 / 129, g = 3 + 2 * Math.random(), a = 16641; a--;) e = a % 129, f = ~~(a * h), e = c.noise(0.05 * e, 0.05 * f), b[a] = (0.5 + 0.5 * e) * g;
        return b
    },
    resetHeight: function() {
        for (var a =
                this.heightData.length; a--;) this.heightData[a] = 0;
        this.applyHeight();
        this.isWithHeight = !1
    },
    findHeightId: function(a, b) {
        return this.findSamePoint(a, b)
    },
    findSamePoint: function(a, b) {
        var c;
        c = this.bigG ? this.bigG.attributes.position.array : this.positionRef;
        for (var e = c.length / 3, f, h = 0; e--;)
            if (f = 3 * e, c[f] === a && c[f + 2] === b) {
                h = e;
                break
            }
        return h
    },
    applyHeight: function() {
        var a, b, c, e, f, h;
        this.Gtmp = [];
        c = this.bigG.attributes.position.array;
        for (a = c.length / 3; a--;) f = 3 * a, c[f + 1] = this.heightData[a];
        this.bigG.attributes.position.needUpdate = !0;
        this.bigG.computeVertexNormals();
        this.positionRef = new Float32Array(c.length);
        for (a = c.length; a--;) this.positionRef[a] = c[a];
        var g = this.bigG.attributes.normal.array;
        for (a = 64; a--;) this.Gtmp[a] = new ARRAY_TYPE(289);
        for (a = 64; a--;) {
            c = this.miniTerrain[a].geometry.attributes.position.array;
            e = this.miniTerrain[a].geometry.attributes.normal.array;
            for (b = c.length / 3; b--;) f = 3 * b, h = this.findSamePoint(c[f] + 0.5, c[f + 2] + 0.5), this.Gtmp[b] = this.heightData[h], c[f + 1] = this.Gtmp[b], h *= 3, e[f] = g[h], e[f + 1] = g[h + 1], e[f + 2] = g[h +
                2];
            this.miniTerrain[a].geometry.attributes.position.needUpdate = !0;
            this.miniTerrain[a].geometry.attributes.normal.needUpdate = !0
        }
        this.bigG.dispose();
        this.bigG = null
    },
    makePlanar: function(a, b) {},
    updateVertices: function(a, b) {
        for (var c = a.attributes.position.array, e = b.length, f; e--;) f = 3 * e, c[f + 1] = b[e];
        a.attributes.position.needUpdate = !0
    },
    findPositionDisp: function(a) {
        var b = Math.floor(a / 129);
        return [a - Math.floor(129 * b), b]
    },
    findLayerDisp: function(a, b) {
        return Math.floor(a / 16) + 8 * Math.floor(b / 16)
    },
    findVerticesDisp: function(a,
        b) {
        var c = 0,
            c = Math.floor(a / 8);
        return c = b[0] - 16 * Math.floor(a - 8 * c) + 16 * (b[1] - 16 * c)
    },
    findLayer: function(a, b) {
        return Math.floor(a / 16) + 8 * Math.floor(b / 16)
    },
    findLayerPos: function(a, b, c) {
        var e = Math.floor(c / 8);
        return [a - 16 * Math.floor(c - 8 * e), b - 16 * e]
    },
    findPosition: function(a) {
        var b = Math.floor(a / this.mapSize[1]);
        return [a - b * this.mapSize[1], b]
    },
    findId: function(a, b) {
        return a + b * this.mapSize[1]
    },
    findVertices: function(a, b) {
        var c = 0,
            c = Math.floor(a / 8);
        return c = b[0] - 16 * Math.floor(a - 8 * c) + 16 * (b[1] - 16 * c)
    },
    rayTest: function() {
        this.raycaster.setFromCamera(this.rayVector,
            this.camera);
        if (0 < this.land.children.length) {
            var a = this.raycaster.intersectObjects(this.land.children);
            0 < a.length ? (this.pos.x = Math.round(a[0].point.x), this.pos.z = Math.round(a[0].point.z), this.pos.y = this.isWithHeight ? Math.round(a[0].point.y) : 0, this.currentTool && (this.tool.position.set(this.pos.x, this.pos.y, this.pos.z), (this.mouse.click || this.mouse.drag) && mapClick(), this.mouse.click = !1)) : (this.pos.x = -1, this.pos.z = -1)
        }
    },
    selectTool: function(a) {
        this.pos.x = -1;
        this.pos.z = -1;
        null !== this.tool && this.removeTool();
        0 === a || 18 === a ? (this.currentTool = null, this.mouse.dragView = !1, this.mouse.move = !0) : 16 === a ? (this.currentTool = null, this.mouse.move = !1, this.mouse.dragView = !0) : (this.currentTool = this.toolSet[a], this.mouse.move = !1, this.mouse.dragView = !1, this.tool = this.customTool(), this.scene.add(this.tool));
        sendTool(this.toolSet[a].tool)
    },
    customTool: function() {
        var a = this.currentTool.size,
            b = this.currentTool.color,
            c = 0.5 * a,
            e = 0;
        4 == a ? e = 0.5 : 6 == a && (e = 1.5);
        a = new THREE.Geometry;
        c = [new THREE.Vector3(-c + e, 0.02, -c + e), new THREE.Vector3(-c +
            e, 0.02, c + e), new THREE.Vector3(c + e, 0.02, c + e), new THREE.Vector3(c + e, 0.02, -c + e)];
        a.vertices.push(c[0], c[1], c[1], c[2], c[2], c[3], c[3], c[0]);
        b = new THREE.LineSegments(a, new THREE.LineBasicMaterial({
            color: b,
            linewidth: 3,
            depthWrite: !1,
            depthTest: !1
        }));
        b.overdraw = !0;
        return b
    },
    build: function(a, b) {
        if ("query" !== this.currentTool.tool)
            if (this.currentTool.build) {
                var c = this.currentTool.size,
                    e = 0;
                this.isWithHeight && (e = this.heightData[this.findHeightId(a, b)]);
                var f;
                1 == c ? f = [
                    [a, b]
                ] : 3 == c ? f = [
                    [a, b],
                    [a - 1, b],
                    [a + 1, b],
                    [a, b - 1],
                    [a - 1, b - 1],
                    [a + 1, b - 1],
                    [a, b + 1],
                    [a - 1, b + 1],
                    [a + 1, b + 1]
                ] : 4 == c ? f = [
                    [a, b],
                    [a - 1, b],
                    [a + 1, b],
                    [a, b - 1],
                    [a - 1, b - 1],
                    [a + 1, b - 1],
                    [a, b + 1],
                    [a - 1, b + 1],
                    [a + 1, b + 1],
                    [a + 2, b - 1],
                    [a + 2, b],
                    [a + 2, b + 1],
                    [a + 2, b + 2],
                    [a - 1, b + 2],
                    [a, b + 2],
                    [a + 1, b + 2]
                ] : 6 == c && (f = [
                    [a, b],
                    [a - 1, b],
                    [a + 1, b],
                    [a, b - 1],
                    [a - 1, b - 1],
                    [a + 1, b - 1],
                    [a, b + 1],
                    [a - 1, b + 1],
                    [a + 1, b + 1],
                    [a + 2, b - 1],
                    [a + 2, b],
                    [a + 2, b + 1],
                    [a + 2, b + 2],
                    [a - 1, b + 2],
                    [a, b + 2],
                    [a + 1, b + 2],
                    [a + 3, b - 1],
                    [a + 4, b - 1],
                    [a + 3, b],
                    [a + 4, b],
                    [a + 3, b + 1],
                    [a + 4, b + 1],
                    [a + 3, b + 2],
                    [a + 4, b + 2],
                    [a + 3, b + 3],
                    [a + 4, b + 3],
                    [a + 3, b + 4],
                    [a + 4, b + 4],
                    [a - 1, b + 3],
                    [a - 1, b + 4],
                    [a, b + 3],
                    [a,
                        b + 4
                    ],
                    [a + 1, b + 3],
                    [a + 1, b + 4],
                    [a + 2, b + 3],
                    [a + 2, b + 4]
                ]);
                this.removeTreePack(f);
                this.cleanGround(f);
                this.isWithHeight && this.makePlanar(f, e);
                c = this.currentTool.geo;
                4 > c && 0 !== c && (this.addBaseBuilding(a, e, b, c, f), this.snd_layzone.play());
                if (8 == c || 9 == c || 4 == c || 5 == c || 7 == c || 10 == c || 11 == c || 12 == c) this.addBaseTown(a, e, b, c, f), this.snd_layzone.play()
            } else this.removeTree(a, b), this.isWithHeight && (e = this.heightData[this.findHeightId(a, b)], this.makePlanar([
                [a, b]
            ], e)), "bulldozer" == this.currentTool.tool && (this.forceUpdate.x = a,
                this.forceUpdate.y = b, this.testDestruct(a, b))
    },
    removeTool: function() {
        this.scene.remove(this.tool);
        this.tool.geometry.dispose();
        this.currentTool = this.tool = null
    },
    testLayer: function(a, b) {
        var c = this.findLayer(a, b),
            e = [c],
            f = this.findLayerPos(a, b, c),
            h = 0,
            g = 0;
        4 > f[0] ? h = 1 : 13 < f[0] && (h = 2);
        4 > f[1] ? g = 1 : 13 < f[1] && (g = 2);
        1 == g && -1 < c - 8 && e.push(c - 8);
        2 == g && 64 > c + 8 && e.push(c + 8);
        1 == h && -1 < c - 1 && e.push(c - 1);
        2 == h && 64 > c + 1 && e.push(c + 1);
        1 == h && 1 == g && -1 < c - 9 && e.push(c - 9);
        2 == h && 2 == g && 64 > c + 9 && e.push(c + 9);
        1 == h && 2 == g && 64 > c + 7 && e.push(c + 7);
        2 == h && 1 == g && -1 < c - 7 && e.push(c - 7);
        return e
    },
    testDestruct: function(a, b) {
        for (var c, e, f, h, g, l = this.testLayer(a, b), k = 0; k < l.length; k++) {
            g = l[k];
            if (this.townLists[g])
                for (c = this.townLists[g].length; c--;)
                    for (f = this.townLists[g][c], h = f[4], e = h.length; e--;)
                        if (a == h[e][0] && b == h[e][1]) {
                            this.showDestruct(f);
                            destroy(h[0][0], h[0][1]);
                            this.townLists[g].splice(c, 1);
                            this.rebuildTownLayer(g);
                            return
                        }
            if (this.buildingLists[g])
                for (c = this.buildingLists[g].length; c--;)
                    for (f = this.buildingLists[g][c], h = f[4], e = h.length; e--;)
                        if (a ==
                            h[e][0] && b == h[e][1]) {
                            this.showDestruct(f);
                            destroy(h[0][0], h[0][1]);
                            1 === f[5] && this.removeBaseHouse(f[0], f[1], f[2]);
                            this.buildingLists[g].splice(c, 1);
                            this.rebuildBuildingLayer(g);
                            return
                        }
        }
    },
    showDestruct: function(a) {
        this.tempDestruct = a[4]
    },
    addBaseTown: function(a, b, c, e, f) {
        var h = this.findLayer(a, c);
        this.townLists[h] || (this.townLists[h] = []);
        this.townLists[h].push([a, b, c, e, f]);
        this.rebuildTownLayer(h)
    },
    rebuildTownLayer: function(a) {
        this.buildMeshLayer(a, "town")
    },
    addBaseHouse: function(a, b, c) {
        var e = this.findLayer(a,
            c);
        a = [
            [a, c],
            [a - 1, c],
            [a + 1, c],
            [a, c - 1],
            [a - 1, c - 1],
            [a + 1, c - 1],
            [a, c + 1],
            [a - 1, c + 1],
            [a + 1, c + 1]
        ];
        this.houseLists[e] || (this.houseLists[e] = []);
        for (c = 9; c--;) this.houseLists[e].push([a[c][0], b, a[c][1], 0])
    },
    removeBaseHouse: function(a, b, c) {
        b = this.findLayer(a, c);
        a = [
            [a, c],
            [a - 1, c],
            [a + 1, c],
            [a, c - 1],
            [a - 1, c - 1],
            [a + 1, c - 1],
            [a, c + 1],
            [a - 1, c + 1],
            [a + 1, c + 1]
        ];
        c = this.houseLists[b].length;
        for (var e, f; c--;)
            for (e = this.houseLists[b][c], f = 9; f--;) e[0] === a[f][0] && e[2] === a[f][1] && this.houseLists[b].splice(c, 1);
        this.rebuildHouseLayer(b)
    },
    rebuildHouseLayer: function(a) {
        this.buildMeshLayer(a,
            "house")
    },
    addBaseBuilding: function(a, b, c, e, f) {
        var h = this.findLayer(a, c),
            g = 244;
        2 == e && (g = 427);
        3 == e && (g = 616);
        this.buildingLists[h] || (this.buildingLists[h] = []);
        this.buildingLists[h].push([a, b, c, g, f, 0]);
        this.rebuildBuildingLayer(h)
    },
    rebuildBuildingLayer: function(a) {
        this.buildMeshLayer(a, "building")
    },
    saveCityBuild: function(a) {
        for (var b = this.nlayers; b--;) a[b] = [0, 0, 0], void 0 !== this.townLists[b] && (a[b][0] = this.townLists[b]), void 0 !== this.houseLists[b] && (a[b][1] = this.houseLists[b]), void 0 !== this.buildingLists[b] &&
            (a[b][2] = this.buildingLists[b])
    },
    loadCityBuild: function(a) {
        a = JSON.parse(a);
        for (var b = this.nlayers, c; b--;) c = a[b], 0 !== c[0] && (this.townLists[b] = c[0], this.rebuildTownLayer(b)), 0 !== c[1] && (this.houseLists[b] = c[1], this.rebuildHouseLayer(b)), 0 !== c[2] && (this.buildingLists[b] = c[2], this.rebuildBuildingLayer(b))
    },
    Orbit: function(a, b, c, e) {
        var f = new THREE.Vector3;
        87 < c && (c = 87);
        1 > c && (c = 1);
        c *= this.ToRad;
        b *= this.ToRad;
        f.x = e * Math.sin(c) * Math.cos(b) + a.x;
        f.z = e * Math.sin(c) * Math.sin(b) + a.z;
        f.y = e * Math.cos(c) + a.y;
        return f
    },
    unwrapDegrees: function(a) {
        a %= 360;
        180 < a && (a -= 360); - 180 > a && (a += 360);
        return a
    },
    moveCamera: function() {
        this.camera.position.copy(this.Orbit(this.center, this.cam.horizontal, this.cam.vertical, this.cam.distance));
        this.camera.lookAt(this.center);
        this.isWithFog && (this.fog.far = 4 * this.cam.distance, 20 > this.fog.far && (this.fog.far = 20));
        this.deepthTest && (this.topCamera.position.set(this.center.x, this.topCameraDistance, this.center.z), this.topCamera.lookAt(this.center))
    },
    dragCenterposition: function() {
        if (0 != this.ease.x ||
            0 != this.ease.z) this.easeRot.y = this.cam.horizontal * this.ToRad, this.unwrapDegrees(Math.round(this.cam.horizontal)), this.easeRot.x = Math.sin(this.easeRot.y) * this.ease.x + Math.cos(this.easeRot.y) * this.ease.z, this.easeRot.z = Math.cos(this.easeRot.y) * this.ease.x - Math.sin(this.easeRot.y) * this.ease.z, this.center.x += this.easeRot.x, this.center.z -= this.easeRot.z, 0 > this.center.x && (this.center.x = 0), 128 < this.center.x && (this.center.x = 128), 0 > this.center.z && (this.center.z = 0), 128 < this.center.z && (this.center.z = 128), this.moveCamera()
    },
    onMouseDown: function(a) {
        a.preventDefault();
        var b, c;
        a.touches ? (b = a.clientX || a.touches[0].pageX, c = a.clientY || a.touches[0].pageY) : (b = a.clientX, c = a.clientY, this.mouse.button = a.which);
        this.mouse.ox = b;
        this.mouse.oy = c;
        this.rayVector.x = b / this.vsize.x * 2 - 1;
        this.rayVector.y = 2 * -(c / this.vsize.y) + 1;
        this.mouse.h = this.cam.horizontal;
        this.mouse.v = this.cam.vertical;
        this.mouse.down = !0;
        this.currentTool && 2 > this.mouse.button && (this.mouse.click = !0, this.currentTool.drag && (this.mouse.drag = !0))
    },
    onMouseUp: function(a) {
        a.preventDefault();
        this.mouse.button = 0;
        this.mouse.down = !1;
        this.mouse.drag = !1;
        null == this.currentTool && (this.mouse.move = !0);
        this.ease.x = 0;
        this.ease.z = 0;
        document.body.style.cursor = "auto"
    },
    onMouseMove: function(a) {
        a.preventDefault();
        var b;
        a.touches ? (b = a.clientX || a.touches[0].pageX, a = a.clientY || a.touches[0].pageY) : (b = a.clientX, a = a.clientY);
        if (this.mouse.down) {
            if (this.mouse.move || 2 === this.mouse.button) this.mouse.dragView = !1, document.body.style.cursor = "crosshair", this.cam.horizontal = 0.3 * (b - this.mouse.ox) + this.mouse.h, this.cam.vertical =
                0.3 * -(a - this.mouse.oy) + this.mouse.v, this.moveCamera();
            if (this.mouse.dragView || 3 === this.mouse.button) document.body.style.cursor = "move", this.mouse.move = !1, this.ease.x = (b - this.mouse.ox) / 1E3, this.ease.z = (a - this.mouse.oy) / 1E3
        }
        null !== this.currentTool && (this.rayVector.x = b / this.vsize.x * 2 - 1, this.rayVector.y = 2 * -(a / this.vsize.y) + 1, this.rayTest())
    },
    onMouseWheel: function(a) {
        a.preventDefault();
        var b = 0;
        a.wheelDelta ? b = -1 * a.wheelDelta : a.detail && (b = 20 * a.detail);
        this.cam.distance += b / 80;
        1 > this.cam.distance && (this.cam.distance =
            1);
        150 < this.cam.distance && (this.cam.distance = 150);
        this.moveCamera()
    },
    cleanGround: function(a) {
        for (var b = a.length, c, e, f, h, g; b--;) e = a[b][0], f = a[b][1], h = Math.floor(e / 16), g = Math.floor(f / 16), c = h + 8 * g, this.miniCtx[c].drawImage(this.imageSrc, 0, 0, 16 * this.mu, 16 * this.mu, 16 * (e - 16 * h) * this.mu, 16 * (f - 16 * g) * this.mu, 16 * this.mu, 16 * this.mu), this.txtNeedUpdate[c] = 1
    },
    paintMap: function(a, b, c, e) {
        if (tilesData) {
            a && (this.mapSize = a);
            c ? (this.treeValue = [], this.clearAllTrees(), this.isWithHeight && (this.heightData = this.generateHeight())) :
                (this.tempBuildingLayers = [], this.tempHouseLayers = []);
            if (0 === this.miniCanvas.length)
                for (var f = 0; f < this.nlayers; f++) this.miniCanvas[f] = document.createElement("canvas"), this.miniCanvas[f].width = this.miniCanvas[f].height = 256 * this.mu, this.miniCtx[f] = this.miniCanvas[f].getContext("2d"), this.isWithNormal && (this.miniCanvasN[f] = document.createElement("canvas"), this.miniCanvasN[f].width = this.miniCanvasN[f].height = 256 * this.mu, this.miniCtxN[f] = this.miniCanvasN[f].getContext("2d")), this.txtNeedUpdate[f] = 0;
            a = !1;
            e = this.mapSize[1];
            for (var h, g, l, k, p = tilesData.length, q, n, m = 0; e--;)
                for (h = this.mapSize[0]; h--;)
                    if (f = Math.floor(e / 16), q = Math.floor(h / 16), n = q + 8 * f, p--, g = tilesData[p], c && (1 < g && 5 > g && this.isWithHeight && (this.heightData[this.findHeightId(h, e)] = -0.1), 5 < g && 21 > g && this.isWithHeight && (this.heightData[this.findHeightId(h, e)] *= 0.5), 20 < g && 44 > g && (this.isWithHeight && (m = this.heightData[this.findHeightId(h, e)] - 0.1), l = Math.floor(4 * Math.random()), 36 <= g && (l += 4), c && this.addTree(h, m, e, l, n), g = this.isWithTree ? 21 + l : 29 + l, this.treeValue[p] =
                            g)), this.fullRedraw && 20 < g && 44 > g && (g = this.treeValue[p]), l = g % 32 * 16, k = 16 * Math.floor(g / 32), c || this.fullRedraw) this.miniCtx[n].drawImage(this.imageSrc, l * this.mu, k * this.mu, 16 * this.mu, 16 * this.mu, 16 * (h - 16 * q) * this.mu, 16 * (e - 16 * f) * this.mu, 16 * this.mu, 16 * this.mu), this.isWithNormal && this.miniCtxN[n].drawImage(this.ground_n, l * this.mu, k * this.mu, 16 * this.mu, 16 * this.mu, 16 * (h - 16 * q) * this.mu, 16 * (e - 16 * f) * this.mu, 16 * this.mu, 16 * this.mu);
                    else if (h === this.forceUpdate.x && e === this.forceUpdate.y && (a = !0, this.forceUpdate.x = -1, this.forceUpdate.y = -1), 43 < g && 240 > g || a) a && (a = !1, 20 < g && 44 > g && (k = l = 0)), this.miniCtx[n].drawImage(this.imageSrc, l * this.mu, k * this.mu, 16 * this.mu, 16 * this.mu, 16 * (h - 16 * q) * this.mu, 16 * (e - 16 * f) * this.mu, 16 * this.mu, 16 * this.mu), this.isWithNormal && this.miniCtxN[n].drawImage(this.ground_n, l * this.mu, k * this.mu, 16 * this.mu, 16 * this.mu, 16 * (h - 16 * q) * this.mu, 16 * (e - 16 * f) * this.mu, 16 * this.mu, 16 * this.mu), this.txtNeedUpdate[n] = 1;
            else if (240 < g || 0 == g)
                if (248 < g && 261 > g || 0 == g) {
                    if (this.houseLists[n])
                        for (f = this.houseLists[n].length; f--;) q = this.houseLists[n][f],
                            q[0] === h && q[2] === e && q[3] !== g && (this.houseLists[n][f][3] = g, this.tempHouseLayers[n] = 1)
                } else if (this.buildingLists[n])
                for (f = this.buildingLists[n].length; f--;) q = this.buildingLists[n][f], q[0] === h && q[2] === e && q[3] !== g && (this.buildingLists[n][f][3] = g, this.tempBuildingLayers[n] = 1);
            if (c) this.updateTerrain(b), this.populateTree();
            else {
                for (f = this.nlayers; f--;)
                    if (this.txtNeedUpdate[f] || this.fullRedraw) this.terrainTxt[f].needsUpdate = !0, this.txtNeedUpdate[f] = 0;
                for (f = this.tempHouseLayers.length; f--;) 1 === this.tempHouseLayers[f] &&
                    this.rebuildHouseLayer(f);
                for (f = this.tempBuildingLayers.length; f--;) 1 === this.tempBuildingLayers[f] && this.rebuildBuildingLayer(f)
            }
            this.fullRedraw && (this.fullRedraw = !1)
        }
    },
    moveSprite: function() {
        if (spriteData)
            for (var a = spriteData.length, b = new THREE.Vector3, c = 0, e = 0; a--;) {
                var f = spriteData[a],
                    c = f[1],
                    e = f[0];
                b.x = Math.round((f[2] - 8) / 16);
                b.z = Math.round((f[3] - 8) / 16);
                b.y = 0;
                this.isWithHeight && (b.y = this.heightData[this.findHeightId(b.x, b.z)]);
                2 == f[0] && (b.y += 5);
                3 == f[0] && (b.y = 11 == c ? b.y + 0 : 10 == c ? b.y + 1 : 9 == c ? b.y + 3 : b.y +
                    6);
                null == this.spriteObjs[this.spriteLists[e]] && (this.spriteObjs[this.spriteLists[e]] = this.addSprite(e, b));
                this.spriteObjs[this.spriteLists[e]].visible = 1 === e && 5 === c ? !1 : !0;
                this.spriteObjs[this.spriteLists[e]].position.lerp(b, 0.6);
                this.spriteObjs[this.spriteLists[e]].rotation.y = this.rotationSprite(f[0], c)
            }
    },
    rotationSprite: function(a, b) {
        var c = 0;
        if (1 === a) 1 === b ? c = 0 : 2 === b ? c = 90 * this.ToRad : 3 === b ? c = 45 * this.ToRad : 4 === b && (c = -45 * this.ToRad);
        else if (2 === a || 3 === a) 1 === b ? c = 0 : 2 === b ? c = -45 * this.ToRad : 3 === b ? c = -90 * this.ToRad :
            4 === b ? c = -135 * this.ToRad : 5 === b ? c = -180 * this.ToRad : 6 === b ? c = -225 * this.ToRad : 7 === b ? c = -270 * this.ToRad : 8 === b ? c = -315 * this.ToRad : 9 === b ? c = -90 * this.ToRad : 10 === b ? c = -90 * this.ToRad : 11 === b && (c = -90 * this.ToRad);
        return c
    },
    addSprite: function(a, b) {
        var c;
        c = 1 === a ? new THREE.Mesh(this.spriteGeo[0], this.townMaterial) : 2 === a ? new THREE.Mesh(this.spriteGeo[1], this.townMaterial) : 3 === a ? new THREE.Mesh(this.spriteGeo[2], this.townMaterial) : new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.townMaterial);
        c.position.copy(b);
        this.scene.add(c);
        return c
    },
    showPower: function() {
        if (powerData)
            for (var a = powerData.length; a--;) 2 == powerData[a] ? null == this.powerMeshs[a] && this.addPowerMesh(a, this.findPosition(a)) : 1 == powerData[a] && null !== this.powerMeshs[a] && this.removePowerMesh(a)
    },
    addPowerMesh: function(a, b) {
        var c = 0;
        this.isWithHeight && (c = this.heightData[this.findHeightId(b[0], b[1])]);
        var e = new THREE.Sprite(this.powerMaterial);
        e.position.set(b[0], c + 1, b[1]);
        this.scene.add(e);
        this.powerMeshs[a] = e
    },
    removePowerMesh: function(a) {
        this.scene.remove(this.powerMeshs[a]);
        this.powerMeshs[a] = null
    },
    powerTexture: function() {
        var a = document.createElement("canvas"),
            b = a.getContext("2d");
        a.width = a.height = 64;
        var c = b.createLinearGradient(0, 0, 64, 64);
        c.addColorStop(0.3, "yellow");
        c.addColorStop(1, "red");
        b.beginPath();
        b.moveTo(44, 0);
        b.lineTo(10, 34);
        b.lineTo(34, 34);
        b.lineTo(20, 64);
        b.lineTo(54, 30);
        b.lineTo(30, 30);
        b.lineTo(44, 0);
        b.closePath();
        b.strokeStyle = "red";
        b.stroke();
        b.fillStyle = c;
        b.fill();
        a = new THREE.Texture(a);
        a.needsUpdate = !0;
        return a
    },
    gradTexture: function(a) {
        var b = document.createElement("canvas"),
            c = b.getContext("2d");
        b.width = 16;
        b.height = 256;
        for (var e = c.createLinearGradient(0, 0, 0, 256), f = a[0].length; f--;) e.addColorStop(a[0][f], a[1][f]);
        c.fillStyle = e;
        c.fillRect(0, 0, 16, 256);
        return b
    },
    tint: function(a, b, c) {
        var e, f, h = a.width * a.height,
            g = a.getContext("2d"),
            l = null,
            l = null;
        if (c && 0 !== this.dayTime && 1 !== this.dayTime) {
            g.clearRect(0, 0, a.width, a.height);
            g.drawImage(c, 0, 0);
            l = g.getImageData(0, 0, a.width, a.height);
            c = l.data;
            for (e = h; e--;) f = e << 2, 0 !== c[f + 3] && (0 == c[f + 0] && 0 == c[f + 1] && 0 == c[f + 2] && (c[f + 3] = 60), 0 == c[f + 1] &&
                (3 == this.dayTime && (c[f + 1] = 255), 2 == this.dayTime && (c[f + 0] = 0, c[f + 3] = 60)));
            g.putImageData(l, 0, 0);
            l = document.createElement("img");
            l.src = a.toDataURL("image/png")
        }
        b ? (g.clearRect(0, 0, a.width, a.height), g.drawImage(b, 0, 0)) : g.drawImage(this.skyCanvasBasic, 0, 0);
        if (0 !== this.dayTime) {
            a = g.getImageData(0, 0, a.width, a.height);
            c = a.data;
            e = h;
            for (h = this.tcolor; e--;) f = e << 2, c[f + 0] = c[f + 0] * (1 - h.a) + h.r * h.a, c[f + 1] = c[f + 1] * (1 - h.a) + h.g * h.a, c[f + 2] = c[f + 2] * (1 - h.a) + h.b * h.a;
            g.putImageData(a, 0, 0);
            l && g.drawImage(l, 0, 0)
        }
    },
    updateKey: function() {
        var a = !1;
        1 == this.key[0] || 1 == this.key[1] ? (1 == this.key[0] && (this.ease.z = -0.3), 1 == this.key[1] && (this.ease.z = 0.3), a = !0) : this.ease.z = 0;
        1 == this.key[2] || 1 == this.key[3] ? (1 == this.key[2] && (this.ease.x = -0.3), 1 == this.key[3] && (this.ease.x = 0.3), a = !0) : this.ease.x = 0;
        a && this.dragCenterposition()
    },
    bindKeys: function() {
        var a = this;
        document.onkeydown = function(b) {
            b = b || window.event;
            switch (b.keyCode) {
                case 38:
                case 87:
                case 90:
                    a.key[0] = 1;
                    break;
                case 40:
                case 83:
                    a.key[1] = 1;
                    break;
                case 37:
                case 65:
                case 81:
                    a.key[2] = 1;
                    break;
                case 39:
                case 68:
                    a.key[3] =
                        1
            }
        };
        document.onkeyup = function(b) {
            b = b || window.event;
            switch (b.keyCode) {
                case 38:
                case 87:
                case 90:
                    a.key[0] = 0;
                    break;
                case 40:
                case 83:
                    a.key[1] = 0;
                    break;
                case 37:
                case 65:
                case 81:
                    a.key[2] = 0;
                    break;
                case 39:
                case 68:
                    a.key[3] = 0
            }
        };
        self.focus()
    }
};
var HUB = {
    REVISION: "1",
    round: '<svg height="66" width="66">\n<circle cx="33" cy="33" r="27" stroke="rgb(255,255,255)" stroke-width="1" stroke-opacity="0.0" fill="rgb(0,0,0)" fill-opacity="0.1"/>\n</svg>',
    roundSelected: '<svg height="66" width="66">\n<circle cx="33" cy="33" r="27" stroke="rgb(255,255,255)" stroke-width="2" stroke-opacity="0.5" fill="rgb(0,0,0)" fill-opacity="0.3"/>\n</svg>',
    roundSelect: '<svg height="66" width="66">\n<circle cx="33" cy="33" r="30" stroke="rgb(255,255,255)" stroke-width="4" stroke-opacity="1" fill="rgb(0,0,0)" fill-opacity="0.5"/>\n</svg>',
    Base: function() {
        this.hub = document.getElementById("hub");
        this.title = this.full = null;
        this.isIntro = !0;
        this.timer = null;
        this.bg = 1;
        this.I = this.C = this.R = null;
        this.colors = "rgba(255,255,255,1) rgba(0,0,0,0.2) rgba(0,0,0,1) rgba(7,62,85,0.5) rgba(0,0,0,0.8) rgba(255,255,255,0.5)".split(" ");
        this.radius = "-moz-border-radius: 6px; -webkit-border-radius: 6px; border-radius: 6px;";
        this.radiusL = "-moz-border-top-left-radius: 6px; -webkit-border-top-left-radius: 6px; border-top-left-radius: 6px;";
        this.radiusL += "-moz-border-bottom-left-radius: 6px; -webkit-border-bottom-left-radius: 6px; border-bottom-left-radius: 6px;";
        this.radiusR = "-moz-border-top-right-radius: 6px; -webkit-border-top-right-radius: 6px; border-top-right-radius: 6px;";
        this.radiusR += "-moz-border-bottom-right-radius: 6px; -webkit-border-bottom-right-radius: 6px; border-bottom-right-radius: 6px;";
        this.radiusB = "-moz-border-bottom-left-radius: 6px; -webkit-border-bottom-left-radius: 6px; border-bottom-left-radius: 6px;";
        this.radiusB += "-moz-border-bottom-right-radius: 6px; -webkit-border-bottom-right-radius: 6px; border-bottom-right-radius: 6px;";
        this.windowsStyle =
            " top:40px; left:10px; border:1px solid " + this.colors[1] + "; background:" + this.colors[3] + ";";
        this.select = this.selector = this.aboutWindow = this.overlaysWindow = this.queryWindow = this.exitWindow = this.disasterWindow = this.evaluationWindow = this.budgetWindow = null;
        this.currentToolName = 0;
        this.disasterTypes = "None Monster Fire Flood Crash Meltdown Tornado".split(" ");
        this.disasterButtons = [];
        this.overlaysTypes = "None;Density;Growth;Land value;Crime Rate;Pollution;Traffic;Power Grid;Fire;Police".split(";");
        this.overlaysButtons = [];
        this.intro()
    }
};
HUB.Base.prototype = {
    constructor: HUB.Base,
    init: function() {},
    intro: function() {
        this.full = document.createElement("div");
        this.full.style.cssText = "position:absolute; top:0px; left:0px; width:100%; height:100%; pointer-events:none; display:block; background:rgba(0,0,0,1); ";
        this.fullMid = document.createElement("div");
        this.fullMid.style.cssText = "position:absolute; top:10px; left:50%; width:300px; height:300px; margin-left:-150px; pointer-events:none; display:block;";
        this.title = document.createElement("div");
        this.title.innerHTML =
            "VidCity";
        this.title.style.cssText = "position:absolute; font-size:70px; top:50%; left:0; margin-top:-90px; width:300px; height:60px; pointer-events:none; text-align:center;";
        this.subtitle = document.createElement("div");
        this.subtitle.style.cssText = "position:absolute; font-size:14px; top:50%; left:0; margin-top:20px; width:300px; height:80px; pointer-events:none; text-align:center;";
        this.subtitle.innerHTML = "";
        this.logo = document.getElementById("logo");
        this.logo.style.display = "block";
        this.full.appendChild(this.fullMid);
        this.fullMid.appendChild(this.logo);
        this.fullMid.appendChild(this.title);
        this.fullMid.appendChild(this.subtitle);
        this.hub.appendChild(this.full)
    },
    start: function() {
        this.isIntro && (this.timer = setInterval(this.fadding, 100, this))
    },
    fadding: function(a) {
        a.bg -= 0.1;
        a.full.style.background = "rgba(48,122,143," + a.bg + ")";
        0 >= a.bg && (clearInterval(a.timer), a.full.removeChild(a.fullMid), a.fullMid.removeChild(a.logo), a.fullMid.removeChild(a.title), a.fullMid.removeChild(a.subtitle),
            a.hub.removeChild(a.full), a.initStartHub(), a.isIntro = !1)
    },
    initStartHub: function() {
        this.full = document.createElement("div");
        this.full.style.cssText = "position:absolute; top:10px; left:50%; margin-left:-150px; width:300px; height:300px; pointer-events:none;";
        this.full.id = "fullStart";
        this.hub.appendChild(this.full);
        var a = this.addButton(this.full, "Play", [276, 48, 40], "position:absolute; top:10px; left:0px;"),
            z = this.addButton(this.full, "Mods", [276, 48, 40], "position:absolute; top:80px; left:0px;"),
            b = this.addButton(this.full, "New Map", [120, 26, 22], "position:absolute; top:270px; left:0px;"),
            c = this.addButton(this.full, "Terraform", [120, 26, 22], "position:absolute; top:270px; right:0px;"),
            e = this.addButton(this.full, "Load", [276, 26, 22], "position:absolute; top:150px; left:0px;");
        this.addSelector("DIFFICULTY", ["LOW", "MEDIUM", "HARD"], setDifficulty, 0);
        a.addEventListener("click", function(a) {
            a.preventDefault();
            playMap()
        }, !1);
        b.addEventListener("click", function(a) {
            a.preventDefault();
            newMap()
        }, !1);
        c.addEventListener("click", function(a) {
            a.preventDefault();
            newHeightMap()
        }, !1);
        e.addEventListener("click",
            function(a) {
                a.preventDefault();
                loadGame(!0)
            }, !1)
    },
    initGameHub: function() {
        var a = this;
        this.removeSelector("DIFFICULTY");
        this.clearElement("fullStart");
        this.toolSet = document.createElement("div");
        this.toolSet.style.cssText = "position:absolute; margin:0px; padding:0px; top:60px; right:12px; width:198px; height:456px; pointer-events:none;";
        this.hub.appendChild(this.toolSet);
        this.toolInfo = document.createElement("div");
        this.toolInfo.style.cssText = "position:absolute; top:15px; right:12px; width:198px; height:50px; pointer-events:none; font-size:16px;";
        this.hub.appendChild(this.toolInfo);
        this.toolInfo.innerHTML = "Selecte<br>Tool";
        for (var b, c = 0; 18 > c; c++) b = this.addSVGButton(this.toolSet), b.name = c + 1;
        this.selector = document.createElement("div");
        this.selector.style.cssText = "position:absolute; top:0px; left:0px; pointer-events:none; display:none;";
        this.selector.innerHTML = HUB.roundSelected;
        this.toolSet.appendChild(this.selector);
        this.select = document.createElement("div");
        this.select.style.cssText = "position:absolute; top:0px; left:0px; pointer-events:none; display:none;";
        this.select.innerHTML = HUB.roundSelect;
        this.toolSet.appendChild(this.select);
        c = document.createElement("img");
        c.src = "img/interface.png";
        this.toolSet.appendChild(c);
        c.style.cssText = "position:absolute; margin:0px; padding:0px; top:0px; right:0px; width:198px; height:396px; pointer-events:none;";
        this.addSelector("Speed", ["II", ">", ">>", ">>>", ">>>>"], setSpeed, 2, [20, 20, 20, 20, 20]);
        this.addButton(this.hub, "Budget", [75, 16, 14], "position:absolute; left:10px; top:-7px; font-weight:bold;", !0).addEventListener("click",
            function(a) {
                a.preventDefault();
                getBudjet()
            }, !1);
        this.addButton(this.hub, "Utilities", [75, 16, 14], "position:absolute; left:510px; top:-7px; font-weight:bold;", !0).addEventListener("click",
            function(a) {
                a.preventDefault();
                getBudjet()
            }, !1);
        this.addButton(this.hub, "Menu", [75, 16, 14], "position:absolute; left:610px; top:-7px; font-weight:bold;", !0).addEventListener("click",
            function(a) {
                a.preventDefault();
                openExit()
            }, !1);
        this.addButton(this.hub, "Eval", [75, 16, 14], "position:absolute; left:110px; top:-7px; font-weight:bold;", !0).addEventListener("click", function(a) {
            a.preventDefault();
            getEval()
        }, !1);
        this.addButton(this.hub, "Options", [75, 16, 14], "position:absolute; left:310px; top:-7px; font-weight:bold;", !0).addEventListener("click", function(b) {
            b.preventDefault();
            a.openExit()
        }, !1);
        this.addButton(this.hub, "Editor", [75, 16, 14], "position:absolute; left:410px; top:-7px; font-weight:bold;", !0).addEventListener("click", function(b) {
            b.preventDefault();
            a.openAbout()
        }, !1);
        this.H = [];
        this.roo = document.createElement("div");
        this.roo.style.cssText = "position:absolute; bottom:11px; left:10px; width:60px; height:60px; pointer-events:none; transform:rotate(45deg); ";
        this.roo.style.cssText += "-moz-border-radius: 30px; -webkit-border-radius: 30px; border-radius: 30px; overflow:hidden; ";
        this.hub.appendChild(this.roo);
        for (c = 0; 4 > c; c++) b = document.createElement("div"), 0 == c && (b.style.cssText = "position:absolute; top:0px; left:0px; width:30px; height:30px; pointer-events:auto; cursor:pointer; background:#ffffff;"),
            1 == c && (b.style.cssText = "position:absolute; top:0px; right:0px; width:30px; height:30px; pointer-events:auto; cursor:pointer;"), 2 == c && (b.style.cssText = "position:absolute; bottom:0px; right:0px; width:30px; height:30px; pointer-events:auto; cursor:pointer;"), 3 == c && (b.style.cssText = "position:absolute; bottom:0px; left:0px; width:30px; height:30px; pointer-events:auto; cursor:pointer;"), b.name = c, this.roo.appendChild(b), b.addEventListener("click", function(b) {
                b.preventDefault();
                a.hideoldSel();
                a.H[this.name].style.background =
                    "#ffffff";
                setTimeColors(this.name)
            }, !1), this.H[c] = b;
        c = document.createElement("div");
        c.style.cssText = "position:absolute; bottom:80px; left:25px; width:30px; height:30px; pointer-events:auto; cursor:pointer; background:rgba(0,0,0,0); ";
        c.style.cssText += "-moz-border-radius: 30px; -webkit-border-radius: 30px; border-radius: 30px; ";
        this.hub.appendChild(c);
        c.addEventListener("click", function(a) {
            view3d.winterSwitch();
            this.style.background = view3d.isWinter ? "rgba(255,255,255,0.5);" : "rgba(0,0,0,0);"
        }, !1);
        c =
            document.createElement("img");
        c.src = "img/basemenu.png";
        this.hub.appendChild(c);
        c.style.cssText = "position:absolute; margin:0px; padding:0px; bottom:0px; left:0px; width:630px; height:120px; pointer-events:none;";
        this.initCITYinfo()
    },
    hideoldSel: function() {
        for (var a = 0; 4 > a; a++) this.H[a].style.background = "none"
    },
    initCITYinfo: function() {
        this.date = document.createElement("div");
        this.date.style.cssText = "font-size:14px; position:absolute; width:70px; height:19px; bottom:15px; left:65px; text-align:right; font-weight:bold;";
        this.money = document.createElement("div");
        this.money.style.cssText = "font-size:14px; position:absolute; width:70px; height:19px; bottom:15px; left:295px; text-align:right; font-weight:bold;";
        this.population = document.createElement("div");
        this.population.style.cssText = "font-size:14px; position:absolute; width:70px; height:19px; bottom:15px; left:180px; text-align:right; font-weight:bold;";
        this.score = document.createElement("div");
        this.score.style.cssText = "font-size:14px; position:absolute; width:70px; height:19px; bottom:15px; left:410px; text-align:right; font-weight:bold;";
        this.msg = document.createElement("div");
        this.msg.style.cssText = "font-size:14px; letter-spacing:0.02em; position:absolute; width:420px; height:20px; bottom:44px; left:76px; text-align:left; color:" + this.colors[4] + "; font-weight:bold;";
        this.hub.appendChild(this.date);
        this.hub.appendChild(this.money);
        this.hub.appendChild(this.population);
        this.hub.appendChild(this.score);
        this.hub.appendChild(this.msg);
        this.initRCI()
    },
    updateCITYinfo: function(a) {
        this.date.innerHTML = a[0];
        this.money.innerHTML = a[4];
        this.population.innerHTML =
            a[3];
        this.score.innerHTML = a[2];
        this.msg.innerHTML = a[8];
        this.updateRCI(a[5], a[6], a[7])
    },
    testOpen: function() {
        var a = "";
        null !== this.budgetWindow && "open" == this.budgetWindow.className && (this.closeBudget(), a = "Budget");
        null !== this.evaluationWindow && "open" == this.evaluationWindow.className && (this.closeEval(), a = "evaluation");
        null !== this.disasterWindow && "open" == this.disasterWindow.className && (this.closeDisaster(), a = "disaster");
        null !== this.exitWindow && "open" == this.exitWindow.className && (this.closeExit(), a = "Options");
        null !== this.queryWindow && "open" == this.queryWindow.className && (this.closeQuery(), a = "query");
        null !== this.overlaysWindow && "open" == this.overlaysWindow.className && (this.closeOverlays(), a = "overlays");
        null !== this.aboutWindow && "open" == this.aboutWindow.className && (this.closeAbout(), a = "Editor");
        return a
    },
    openAbout: function(a) {
        var b = this;
        "about" != this.testOpen() && (null == this.aboutWindow ? (this.aboutWindow = document.createElement("div"), this.aboutWindow.style.cssText = this.radius + "position:absolute; width:200px; height:210px; pointer-events:none; display:block;" +
            this.windowsStyle, this.hub.appendChild(this.aboutWindow), this.addButton(this.aboutWindow, "X", [16, 16, 14], "position:absolute; left:10px; top:10px;").addEventListener("click", function(a) {
                a.preventDefault();
                b.closeAbout()
            }, !1), this.fps = document.createElement("div"), this.fps.style.cssText = "position:absolute; top:20px; left:60px; width:120px; height:20px; pointer-events:none; font-size:12px; text-align:center; color:" + this.colors[0] + ";", this.aboutWindow.appendChild(this.fps), this.abb = document.createElement("div"),
            this.abb.style.cssText = "position:absolute; top:60px; left:10px; width:180px; height:180px; pointer-events:none; font-size:12px; text-align:center; color:" + this.colors[0] + ";", this.aboutWindow.appendChild(this.abb), this.linke = document.createElement("div"), this.linke.style.cssText = "position:absolute; top:160px; left:10px; width:180px; height:20px; pointer-events:auto; font-size:12px; text-align:center; color:" + this.colors[0] + ";", this.aboutWindow.appendChild(this.linke), this.abb.innerHTML = "<br><br>VidCity 17<br>",
            this.linke.innerHTML = "<a href='http://avixsoft.github.io/vidcity17' target='_blank'>Last Year's BETA") : this.aboutWindow.style.display = "block", displayStats(), this.aboutWindow.className = "open")
    },
    upStats: function(a, b) {
        this.fps.innerHTML = "Fps: " + a + " <br> geometry: " + b
    },
    closeAbout: function() {
        hideStats();
        this.aboutWindow.style.display = "none";
        this.aboutWindow.className = "close"
    },
    openOverlays: function(a) {
        if ("overlays" != this.testOpen()) {
            if (null == this.overlaysWindow)
                for (this.overlaysWindow = document.createElement("div"),

                    this.overlaysWindow.style.cssText = this.radius + "position:absolute; width:140px; height:420px; pointer-events:none; display:block;" + this.windowsStyle, this.hub.appendChild(this.overlaysWindow), a = 0; a < this.overlaysTypes.length; a++) this.overlaysButtons[a] = this.addButton(this.overlaysWindow, this.overlaysTypes[a].toUpperCase(), [96, 16, 14], "position:absolute; left:10px; top:" + (10 + 40 * a) + "px;"), this.overlaysButtons[a].name = this.overlaysTypes[a], this.overlaysButtons[a].addEventListener("click", function(a) {
                    a.preventDefault();
                    setOverlays(this.name)
                }, !1);
            else this.overlaysWindow.style.display = "block";
            this.overlaysWindow.className = "open"
        }
    },
    closeOverlays: function() {
        this.overlaysWindow.style.display = "none";
        this.overlaysWindow.className = "close"
    },
    openQuery: function(a) {
        var b = this;
        null == this.queryWindow ? (this.queryWindow = document.createElement("div"), this.queryWindow.style.cssText = this.radius + "position:absolute; width:140px; height:180px; pointer-events:none; display:block;" + this.windowsStyle, this.hub.appendChild(this.queryWindow),
            this.addButton(this.queryWindow, "X", [16, 16, 14], "position:absolute; left:50px; top:10px;").addEventListener("click", function(a) {
                a.preventDefault();
                b.closeQuery()
            }, !1), this.queryResult = document.createElement("div"), this.queryResult.style.cssText = "position:absolute; top:60px; left:10px; width:110px; height:100px; pointer-events:none; font-size:12px; text-align:center; color:" + this.colors[0] + ";", this.queryWindow.appendChild(this.queryResult)) : this.queryWindow.style.display = "block";
        this.queryResult.innerHTML =
            a;
        this.queryWindow.className = "open"
    },
    closeQuery: function() {
        this.queryWindow.style.display = "none";
        this.queryWindow.className = "close"
    },
    openEval: function(a) {
        "evaluation" != this.testOpen() && (null == this.evaluationWindow ? (this.evaluationWindow = document.createElement("div"), this.evaluationWindow.style.cssText = this.radius + "position:absolute; width:200px; height:300px; pointer-events:none; display:block;" + this.windowsStyle, this.hub.appendChild(this.evaluationWindow), this.evaltOpinion = document.createElement("div"),
                this.evaltOpinion.style.cssText = "position:absolute; top:10px; left:10px; width:180px; height:100px; pointer-events:none; color:" + this.colors[0] + ";", this.evaluationWindow.appendChild(this.evaltOpinion), this.evaltYes = document.createElement("div"), this.evaltYes.style.cssText = "position:absolute; top:46px; left:26px; width:60px; height:20px; pointer-events:none; color:#33FF33; font-size:16px; font-weight:bold;", this.evaluationWindow.appendChild(this.evaltYes), this.evaltNo = document.createElement("div"),
                this.evaltNo.style.cssText = "position:absolute; top:46px; right:26px; width:60px; height:20px; pointer-events:none; color:#FF3300;  font-size:16px; font-weight:bold;", this.evaluationWindow.appendChild(this.evaltNo), this.evaltProb = document.createElement("div"), this.evaltProb.style.cssText = "position:absolute; top:100px; left:10px; width:180px; height:60px; pointer-events:none; color:" + this.colors[0] + "; font-size:16px; ", this.evaluationWindow.appendChild(this.evaltProb), this.evaltOpinion.innerHTML = "<b>Public opinion</b><br>YOU_____________OTHER<br> <br> <br> <br><br>") :
            this.evaluationWindow.style.display = "block", this.evaltYes.innerHTML = "YES:" + a[0] + "%", this.evaltNo.innerHTML = "NO:" + (100 - a[0]) + "%", this.evaltProb.innerHTML = a[1], this.evaluationWindow.className = "open")
    },
    closeEval: function() {
        this.evaluationWindow.style.display = "none";
        this.evaluationWindow.className = "close"
    },
    openExit: function(a) {
        var b = this;
        if ("exit" != this.testOpen()) {
            if (null == this.exitWindow) {
                this.exitWindow = document.createElement("div");
                this.exitWindow.style.cssText = this.radius + "position:absolute; width:140px; height:180px; pointer-events:none; display:block;" +
                    this.windowsStyle;
                this.hub.appendChild(this.exitWindow);
                a = this.addButton(this.exitWindow, "X", [16, 16, 14], "position:absolute; left:50px; top:10px;");
                var c = this.addButton(this.exitWindow, "NEW MAP", [96, 16, 14], "position:absolute; left:10px; top:50px;"),
                    e = this.addButton(this.exitWindow, "SAVE", [96, 16, 14], "position:absolute; left:10px; top:90px;"),
                    f = this.addButton(this.exitWindow, "LOAD", [96, 16, 14], "position:absolute; left:10px; top:130px;");
                a.addEventListener("click", function(a) {
                    a.preventDefault();
                    b.closeExit()
                }, !1);
                c.addEventListener("click", function(a) {
                    a.preventDefault();
                    newGameMap()
                }, !1);
                e.addEventListener("click", function(a) {
                    a.preventDefault();
                    saveGame()
                }, !1);
                f.addEventListener("click", function(a) {
                    a.preventDefault();
                    loadGame()
                }, !1)
            } else this.exitWindow.style.display = "block";
            this.exitWindow.className = "open"
        }
    },
    closeExit: function() {
        this.exitWindow.style.display = "none";
        this.exitWindow.className = "close"
    },
    openBudget: function(a) {
        var b = this;
        if ("budget" != this.testOpen()) {
            this.dataKeys = "roadFund roadRate fireFund fireRate policeFund policeRate taxRate totalFunds taxesCollected".split(" ");
            for (var c = this.dataKeys.length; c--;) this[this.dataKeys[c]] = a[this.dataKeys[c]];
            a = a.taxesCollected;
            c = a - this.roadFund - this.fireFund - this.policeFund;
            if (null == this.budgetWindow) {
                this.budgetWindow = document.createElement("div");
                this.budgetWindow.style.cssText = this.radius + "position:absolute; width:200px; height:300px; pointer-events:none; display:block;" + this.windowsStyle;
                this.hub.appendChild(this.budgetWindow);
                this.addSlider(this.budgetWindow, 10, "Tax", this.taxRate, null, "green", 20);
                this.addSlider(this.budgetWindow,
                    70, "Roads", this.roadRate, this.roadFund, "red", 100);
                this.addSlider(this.budgetWindow, 110, "Fire", this.fireRate, this.fireFund, "red", 100);
                this.addSlider(this.budgetWindow, 150, "Police", this.policeRate, this.policeFund, "red", 100);
                this.budgetResult = document.createElement("div");
                this.budgetResult.style.cssText = "position:absolute; top:200px; left:10px; width:180px; height:300px; pointer-events:none; color:" + this.colors[0] + ";";
                this.budgetWindow.appendChild(this.budgetResult);
                var e = this.addButton(this.budgetWindow,
                        "CLOSE", [70, 16, 14], "position:absolute; left:10px; bottom:10px;"),
                    f = this.addButton(this.budgetWindow, "APPLY", [70, 16, 14], "position:absolute; rigth:10px; bottom:10px;");
                e.addEventListener("click", function(a) {
                    a.preventDefault();
                    b.closeBudget()
                }, !1);
                f.addEventListener("click", function(a) {
                    a.preventDefault();
                    b.applyBudget()
                }, !1)
            } else this.budgetWindow.style.display = "block", this.setBudgetValue();
            this.budgetResult.innerHTML = "Annual receipts:" + c + "$<br>Taxes collected:" + a + "$";
            this.budgetWindow.className = "open"
        }
    },
    applyBudget: function() {
        this.budgetWindow.style.display = "none";
        this.budgetWindow.className = "close";
        setBudjet([this.taxRate, this.roadRate, this.fireRate, this.policeRate])
    },
    closeBudget: function() {
        this.budgetWindow.style.display = "none";
        this.budgetWindow.className = "close"
    },
    setBudgetValue: function() {
        this.setSliderValue("Tax", this.taxRate, 20, null);
        this.setSliderValue("Roads", this.roadRate, 100, this.roadFund);
        this.setSliderValue("Fire", this.fireRate, 100, this.fireFund);
        this.setSliderValue("Police", this.policeRate,
            100, this.policeFund)
    },
    openDisaster: function() {
        if ("disaster" != this.testOpen()) {
            if (null == this.disasterWindow) {
                this.disasterWindow = document.createElement("div");
                this.disasterWindow.style.cssText = this.radius + "position:absolute; width:140px; height:300px; pointer-events:none; display:block;" + this.windowsStyle;
                this.hub.appendChild(this.disasterWindow);
                for (var a = 0; a < this.disasterTypes.length; a++) this.disasterButtons[a] = this.addButton(this.disasterWindow, this.disasterTypes[a].toUpperCase(), [96, 16, 14], "position:absolute; left:10px; top:" +
                    (10 + 40 * a) + "px;"), this.disasterButtons[a].name = this.disasterTypes[a], this.disasterButtons[a].addEventListener("click", function(a) {
                    a.preventDefault();
                    setDisaster(this.name)
                }, !1)
            } else this.disasterWindow.style.display = "block";
            this.disasterWindow.className = "open"
        }
    },
    closeDisaster: function() {
        this.disasterWindow.style.display = "none";
        this.disasterWindow.className = "close"
    },
    addSlider: function(a, b, c, e, f, h, g) {
        var l = this,
            k = document.createElement("div"),
            p = document.createElement("div"),
            q = document.createElement("div");
        k.style.cssText = "position:absolute; left:10px; top:-18px; pointer-events:none; width:180px; height:20px; font-size:12px; color:" + this.colors[0] + ";";
        p.style.cssText = this.radius + "position:absolute; left:10px; top:" + (b + 20) + "px; padding:0; cursor:w-resize; pointer-events:auto; width:180px; height:20px; background-color:" + l.colors[1] + ";";
        q.style.cssText = this.radius + "position:absolute; pointer-events:none; margin:5px; width:100px; height:10px; background-color:" + h + ";";
        a.appendChild(p);
        p.appendChild(q);
        p.appendChild(k);
        p.name = c;
        p.id = c;
        k.innerHTML = null !== f ? c + " " + e + "% of " + f + "$ = " + Math.floor(e / 100 * f) + "$" : c + " " + e + "%";
        q.style.width = e / g * 170 + "px";
        p.className = "up";
        p.addEventListener("mouseout", function(a) {
            a.preventDefault();
            this.className = "up";
            this.style.backgroundColor = l.colors[1]
        }, !1);
        p.addEventListener("mouseover", function(a) {
            a.preventDefault();
            this.style.backgroundColor = l.colors[2]
        }, !1);
        p.addEventListener("mouseup", function(a) {
            a.preventDefault();
            this.className = "up"
        }, !1);
        p.addEventListener("mousedown",
            function(a) {
                a.preventDefault();
                this.className = "down";
                l.dragSlider(this, a.clientX, g)
            }, !1);
        p.addEventListener("mousemove", function(a) {
            a.preventDefault();
            l.dragSlider(this, a.clientX, g)
        }, !1)
    },
    setSliderValue: function(a, b, c, e) {
        var f = document.getElementById(a).childNodes;
        f[0].style.width = b / c * 170 + "px";
        f[1].innerHTML = null !== e ? a + " " + b + "% of " + e + "$ = " + Math.floor(b / 100 * e) + "$" : a + " " + b + "%"
    },
    dragSlider: function(a, b, c) {
        if ("down" == a.className) {
            var e = a.childNodes,
                f = a.getBoundingClientRect();
            b = Math.round((b - f.left) /
                170 * c);
            0 > b && (b = 0);
            b > c && (b = c);
            e[0].style.width = b / c * 170 + "px";
            switch (a.name) {
                case "Tax":
                    e[1].innerHTML = a.name + " " + b + "%";
                    this.taxRate = b;
                    break;
                case "Roads":
                    e[1].innerHTML = a.name + " " + b + "% of " + this.roadFund + "$ = " + Math.floor(b / 100 * this.roadFund) + "$";
                    this.roadRate = b;
                    break;
                case "Fire":
                    e[1].innerHTML = a.name + " " + b + "% of " + this.fireFund + "$ = " + Math.floor(b / 100 * this.fireFund) + "$";
                    this.fireRate = b;
                    break;
                case "Police":
                    e[1].innerHTML = a.name + " " + b + "% of " + this.policeFund + "$ = " + Math.floor(b / 100 * this.policeFund) + "$",
                        this.policeRate = b
            }
        }
    },
    initRCI: function() {
        var a = document.createElement("div");
        a.id = "RCI";
        a.style.cssText = "font-size:10px; position:absolute; width:70px; height:70px; bottom:20px; right:20px;";
        var b = document.createElement("div");
        b.style.cssText = "font-size:10px; position:absolute; width:46px; height:14px; bottom:28px; left:10px; background:#cccccc; padding:0px 2px;  letter-spacing:12px; text-align:center; color:#000000;";
        b.innerHTML = "RCI";
        this.R = document.createElement("div");
        this.R.id = "R";
        this.R.style.cssText =
            "position:absolute; width:10px; height:20px; bottom:42px; left:10px; background:#30ff30;";
        a.appendChild(this.R);
        this.C = document.createElement("div");
        this.C.id = "C";
        this.C.style.cssText = "position:absolute; width:10px; height:20px; bottom:42px; left:30px; background:#3030ff;";
        a.appendChild(this.C);
        this.I = document.createElement("div");
        this.I.id = "I";
        this.I.style.cssText = "position:absolute; width:10px; height:20px; bottom:42px; left:50px; background:#ffff30;";
        a.appendChild(this.I);
        a.appendChild(b);
        this.hub.appendChild(a)
    },
    updateRCI: function(a, b, c) {
        this.R.style.height = a / 100 + "px";
        this.C.style.height = b / 100 + "px";
        this.I.style.height = c / 100 + "px";
        this.R.style.bottom = 0 < a ? "42px" : 28 + a / 100 + "px";
        this.C.style.bottom = 0 < b ? "42px" : 28 + b / 100 + "px";
        this.I.style.bottom = 0 < c ? "42px" : 28 + c / 100 + "px"
    },
    addSelector: function(a, b, c, e, f) {
        var h = this,
            g = document.createElement("div");
        g.style.cssText = "font-size:14px; margin-top:10px; color:" + this.colors[0] + ";";
        "Speed" == a ? g.style.cssText = "font-size:20px; position:absolute; bottom:8px; left:497px; " : g.innerHTML =
            a + "<br>";
        g.id = a;
        for (var l = [], k = 0; k !== b.length; k++) l[k] = document.createElement("div"), l[k].style.cssText = "font-size:14px; border:1px solid " + this.colors[5] + "; background:" + this.colors[1] + "; color:" + this.colors[0] + ";", l[k].style.cssText = "Speed" == a ? l[k].style.cssText + " width:70px; height:16px; margin-left:2px; padding:6px; pointer-events:auto;  cursor:pointer; display:inline-block; " : l[k].style.cssText + " width:70px; height:16px; margin:2px; padding:7px; pointer-events:auto;  cursor:pointer; display:inline-block; ",
            0 == k && (l[k].style.cssText += this.radiusL), k == b.length - 1 && (l[k].style.cssText += this.radiusR), f ? f[k] ? (l[k].style.width = f[k] + "px", l[k].style.height = f[k] + "px", l[k].style.padding = "0px") : l[k].style.width = "60px" : l[k].style.width = "60px", l[k].className = "none", "Speed" !== a && (l[k].textContent = b[k]), k == e && (l[k].style.backgroundColor = this.colors[5], l[k].style.color = this.colors[2], l[k].className = "select"), l[k].name = k, l[k].id = a + k, g.appendChild(l[k]), l[k].addEventListener("mouseover", function(a) {
                a.preventDefault();
                this.style.border = "1px solid " + h.colors[0]
            }, !1), l[k].addEventListener("mouseout", function(a) {
                a.preventDefault();
                this.style.border = "1px solid " + h.colors[5]
            }, !1), l[k].addEventListener("click", function(b) {
                b.preventDefault();
                c(this.name);
                h.setActiveSelector(this.name, a)
            }, !1);
        "DIFFICULTY" == a ? (this.full.appendChild(g), g.style.position = "absolute", g.style.top = "200px", g.style.width = "300px") : this.hub.appendChild(g)
    },
    setActiveSelector: function(a, b) {
        for (var c = 10, e; c--;) document.getElementById(b + c) && (e = document.getElementById(b +
            c), e.style.color = this.colors[0], e.style.backgroundColor = this.colors[1], e.className = "none");
        c = document.getElementById(b + a);
        c.style.backgroundColor = this.colors[5];
        c.style.color = this.colors[2];
        c.className = "select"
    },
    removeSelector: function(a) {
        for (var b = 10, c, e = document.getElementById(a); b--;) document.getElementById(a + b) && (c = document.getElementById(a + b), e.removeChild(c));
        this.full.removeChild(e)
    },
    showToolSelect: function(a) {
        if (a.name !== this.currentToolName) {
            this.currentToolName = a.name;
            var b = a.getBoundingClientRect().left -
                this.toolSet.getBoundingClientRect().left;
            a = a.getBoundingClientRect().top - this.toolSet.getBoundingClientRect().top;
            this.select.style.left = b + "px";
            this.select.style.top = a + "px";
            this.select.style.display = "block"
        } else this.select.style.display = "none", this.currentToolName = 0;
        selectTool(this.currentToolName)
    },
    showToolInfo: function(a, b) {
        var c = view3d.toolSet[a.name].tool,
            c = c.charAt(0).toUpperCase() + c.substring(1).toLowerCase();
        b.toolInfo.innerHTML = 16 === a.name ? "Drag view" : 178 === a.name ? "Get info" : 18 === a.name ?
            "Rotate view" : c + "<br>" + view3d.toolSet[a.name].price + "$"
    },
    addSVGButton: function(a) {
        var b = this,
            c = document.createElement("div");
        c.style.cssText = " margin:0px; padding:0px; width:66px; height:66px; pointer-events:auto; cursor:pointer; display:inline-block; line-height:0px; vertical-align: top;";
        c.innerHTML = HUB.round;
        c.addEventListener("mouseover", function(a) {
            a.preventDefault();
            a = this.getBoundingClientRect().left - b.toolSet.getBoundingClientRect().left;
            var c = this.getBoundingClientRect().top - b.toolSet.getBoundingClientRect().top;
            b.selector.style.left = a + "px";
            b.selector.style.top = c + "px";
            b.selector.style.display = "block";
            b.showToolInfo(this, b)
        }, !1);
        c.addEventListener("mouseout", function(a) {
            a.preventDefault();
            b.selector.style.display = "none"
        }, !1);
        c.addEventListener("click", function(a) {
            a.preventDefault();
            b.showToolSelect(this)
        }, !1);
        a.appendChild(c);
        return c
    },
    addButton: function(a, b, c, e, f) {
        var h = this;
        c || (c = [128, 30, 22]);
        var g = document.createElement("div");
        c = "font-size:" + c[2] + "px;  border:1px solid " + this.colors[5] + "; background:" +
            this.colors[1] + "; width:" + c[0] + "px; height:" + c[1] + "px; color:" + this.colors[0] + ";";
        c = f ? c + ("margin:4px; padding:7px; pointer-events:auto;  cursor:pointer; display:inline-block; " + this.radiusB) : c + ("margin:4px; padding:7px; pointer-events:auto;  cursor:pointer; display:inline-block; " + this.radius);
        g.textContent = b;
        g.style.cssText = e ? c + e : c + "margin-top:20px;";
        g.addEventListener("mouseover", function(a) {
            a.preventDefault();
            this.style.backgroundColor = h.colors[5];
            this.style.color = h.colors[2]
        }, !1);
        g.addEventListener("mouseout",
            function(a) {
                a.preventDefault();
                this.style.backgroundColor = h.colors[1];
                this.style.color = h.colors[0]
            }, !1);
        a.appendChild(g);
        return g
    },
    clearElement: function(a) {
        a = document.getElementById(a);
        for (var b = a.childNodes, c = b.length; c--;) a.removeChild(b[c]);
        this.hub.removeChild(a)
    }
};
var ARRAY8 = "undefined" !== typeof Uint8Array ? Uint8Array : Array,
    Perlin = function() {
        this.F2 = 0.5 * (Math.sqrt(3) - 1);
        this.G2 = (3 - Math.sqrt(3)) / 6;
        var a = Math.random;
        this.p = new ARRAY8(256);
        this.perm = new ARRAY8(512);
        this.permMod12 = new ARRAY8(512);
        for (var b = 0; 256 > b; b++) this.p[b] = 256 * a();
        for (b = 0; 512 > b; b++) this.perm[b] = this.p[b & 255], this.permMod12[b] = this.perm[b] % 12
    };
Perlin.prototype = {
    grad3: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]),
    noise: function(a, b) {
        var c = this.permMod12,
            e = this.perm,
            f = this.grad3,
            h = 0,
            g = 0,
            l = 0,
            k = (a + b) * this.F2,
            p = Math.floor(a + k),
            q = Math.floor(b + k),
            k = (p + q) * this.G2,
            n = a - (p - k),
            m = b - (q - k),
            v, s;
        n > m ? (v = 1, s = 0) : (v = 0, s = 1);
        var t = n - v + this.G2,
            u = m - s + this.G2,
            k = n - 1 + 2 * this.G2,
            r = m - 1 + 2 * this.G2,
            p = p & 255,
            q = q & 255,
            w = 0.5 - n * n - m * m;
        0 <= w && (h = 3 * c[p + e[q]], w *= w, h = w * w * (f[h] * n + f[h + 1] * m));
        n = 0.5 - t * t - u * u;
        0 <= n && (g = 3 * c[p + v + e[q +
            s]], n *= n, g = n * n * (f[g] * t + f[g + 1] * u));
        t = 0.5 - k * k - r * r;
        0 <= t && (c = 3 * c[p + 1 + e[q + 1]], t *= t, l = t * t * (f[c] * k + f[c + 1] * r));
        return 70 * (h + g + l)
    }
};// JavaScript Document