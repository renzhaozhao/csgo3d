import * as THREE from 'three';
// import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'


const generate3D = function (options, successCalllback) {
	const defaults = {
		weapon_type: '',
		type: '',   // 0为普通，1为双枪或双刀，2为手套，3为组合模型
		loadMethod: '', // 加载方式：0为TextureLoader，1为MTLLoader
		zoom: '',   // 缩放比列：1为手枪，2为冲锋枪，3为步枪去除组合枪
		device: '', // 设备
		el: '',     // 加载的节点
		asTexture: [],     // 贴图
		asObj: [],   // 模型
		asMtl: [], // 材质文件
		bIsReset: false // 是否需要重置模型
	}
	const opts = $.extend({}, defaults, options)

	// 生成3D
	var container;

	var camera, scene, renderer, controls;

	var axeHelper, box;

	var object = [],
		texture = [],
		material = []
		;

	init()
	animate()


	// 重置模型位置
	if (opts.bIsReset) {
		$(document).on('click', '#J_ResetObj', function () {
			resetObj()
		})
	}

	function init() {
		container = document.createElement('div');
		// document.body.appendChild( container );

		$(opts.el).html(container)

		// camera
		camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
		camera.position.z = 400;

		// world

		scene = new THREE.Scene();
		//scene.background = new THREE.Color(0xeeeeee);

		var onProgress = function (xhr) {
			if (xhr.lengthComputable) {
				var percentComplete = xhr.loaded / xhr.total * 100;
				console.log(Math.round(percentComplete, 2) + '% downloaded');
			}
		};

		var onError = function () { };

		if (opts.loadMethod == 0) {
			// manager
			var manager = new THREE.LoadingManager(loadModel);
			// manager.addHandler( /\.dds$/i, new DDSLoader() );

			// comment in the following line and import TGALoader if your asset uses TGA textures
			// manager.addHandler( /\.tga$/i, new TGALoader() );

			// texture
			// var textureLoader = new THREE.TextureLoader( manager );
			for (var i = 0; i < opts.asTexture.length; i++) {
				texture.push(new THREE.TextureLoader(manager).load(opts.asTexture[i]));
				material.push(new THREE.MeshPhongMaterial({
					map: opts.asTexture[i]
					// side: THREE.DoubleSide
				}));
			}

			for (var i = 0; i < opts.asObj.length; i++) {
				loadObj(i);
			}
			function loadObj(index) {
				new OBJLoader(manager)
					.load(opts.asObj[index], function (obj) {
						var geometry = obj.children[0].geometry;

						// 匕首（除双刀）
						if (opts.device == 'mobile' && opts.type != 1 && opts.weapon_type == '匕首') {
							obj.rotateZ(Math.PI / 2);
						}

						if (opts.type == 3) {

						} else {
							geometry.center();

							obj.scale.set(computeScale(geometry), computeScale(geometry), computeScale(geometry));

							// obj.scale.set(10, 10, 10);
						}

						// var box = new THREE.BoxHelper(obj, 0x0000ff);
						// scene.add(box);

						object[index] = obj;

						// 加载中
						successCalllback && successCalllback()

					}, onProgress, onError)
					;
			}

			function loadModel() {
				var box = new THREE.Box3(),
					group = new THREE.Group()
					;

				for (var i = 0; i < opts.asObj.length; i++) {
					object[i].traverse(function (child) {
						// if ( child.isMesh )
						if (child instanceof THREE.Mesh) {
							child.material.map = texture[i];
							// child.material.pecularMap = texture[i];
							// child.material.needsUpdate = true;
							// child.material.transparent = true;
							child.material.specular = new THREE.Color(0xffffff);
							child.material.shininess = 30;
						}
					});

					if (opts.type == 3) {
						group.add(object[i]);
					} else {
						scene.add(object[i]);
					}
				}

				if (opts.type == 3) {
					// 组合
					box.expandByObject(group);

					var maxX = box.max.x;
					var minX = box.min.x;
					var maxY = box.max.y;
					var minY = box.min.y;
					var maxZ = box.max.z;
					var minZ = box.min.z;
					var windowWidth = readWidth() / 2;
					var windowHeight = readHeight() / 2;
					var width = (maxX - minX) / 2;
					var height = (maxY - minY) / 2;
					var ratio = width / height;
					var scale = 1;

					if (opts.device == 'pc') {
						var scale = windowHeight / height / ratio / 1.8;

						group.scale.x = scale;
						group.scale.y = scale;
						group.scale.z = scale;
					} else {
						var scale = (windowWidth - 50) / width / 1.5;

						group.scale.x = scale;
						group.scale.y = scale;
						group.scale.z = scale;
					}

					box.expandByObject(group);
					group.position.x = -(box.getCenter().x);
					group.position.y = -(box.getCenter().y);
					group.position.z = -(box.getCenter().z);

					scene.add(group);
				} else {
					if (opts.type == 1) {
						box.expandByObject(object[0]);

						var x = (box.max.x - box.min.x) / 1.6;

						// 双枪和双刀
						if (opts.device == 'pc') {
							object[0].position.x = -x;
							object[1].position.x = x;
						} else {
							object[0].position.x = -x;
							object[1].position.x = x;
						}

						object[1].rotateY(Math.PI);
					}
				}
			}
		} else {
			var manager = new THREE.LoadingManager();

			for (var i = 0; i < opts.asMtl.length; i++) {
				if (i == 0) {
					new MTLLoader(manager)
						.load(opts.asMtl[0], function (materials) {
							materials.preload();

							new OBJLoader(manager)
								.setMaterials(materials)
								.load(opts.asObj[0], function (obj) {
									var geometry = obj.children[0].geometry;

									geometry.center();

									obj.scale.set(computeScale(geometry), computeScale(geometry), computeScale(geometry));

									if (opts.type == 1 || opts.type == 2) {
										var box = new THREE.Box3().expandByObject(obj);
										var x = (box.max.x - box.min.x) / 1.6;

										obj.position.x = -x;
									}

									if (opts.type == 2) {
										obj.rotateX(Math.PI / 4);
									}

									scene.add(obj);

									// 加载中
									successCalllback && successCalllback()
								}, onProgress, onError);
						});
				} else if (i == 1) {
					new MTLLoader(manager)
						.load(opts.asMtl[1], function (materials) {
							materials.preload();

							new OBJLoader(manager)
								.setMaterials(materials)
								.load(opts.asObj[1], function (obj) {
									var geometry = obj.children[0].geometry;

									geometry.center();

									obj.scale.set(computeScale(geometry), computeScale(geometry), computeScale(geometry));

									if (opts.type == 1 || opts.type == 2) {
										var box = new THREE.Box3().expandByObject(obj);
										var x = (box.max.x - box.min.x) / 1.6;

										obj.position.x = x;
									}

									if (opts.type == 1) {
										obj.rotateY(Math.PI);
									}

									if (opts.type == 2) {
										obj.rotateX(Math.PI / 4);
									}

									scene.add(obj);

									// 加载中
									successCalllback && successCalllback()
								}, onProgress, onError);
						});
				}
			}
		}

		// light

		// 环境光
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		// 半球光从上往下模拟户外光照
		var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
		scene.add(hemisphereLight);

		// 锥光1
		var spotLight1 = new THREE.SpotLight(0xffffff);
		spotLight1.position.set(0, 0, -400);
		spotLight1.angle = 3.14 / 180 * 40;
		spotLight1.intensity = 1.5;
		spotLight1.distance = 800;
		spotLight1.penumbra = 0.3;

		scene.add(spotLight1);

		// 锥光2
		var spotLight2 = new THREE.SpotLight(0xffffff);
		spotLight2.position.set(0, 0, 400);
		spotLight2.angle = 3.14 / 180 * 40;
		spotLight2.intensity = 1.5;
		spotLight2.distance = 800;
		spotLight2.penumbra = 0.2;

		scene.add(spotLight2);

		// render
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setClearAlpha(0);

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(readWidth(), readHeight());
		container.appendChild(renderer.domElement);

		// helper
		//axeHelper = new THREE.AxesHelper( 100 );
		//scene.add(axeHelper);

		// OrbitControls
		//controls = new OrbitControls( camera, renderer.domElement );
		controls = new TrackballControls(camera, renderer.domElement);

		controls.noPan = true;

		controls.staticMoving = true;
		//controls.dynamicDampingFactor = 0.1;

		controls.minDistance = 100;
		controls.maxDistance = 1000;
		controls.zoomSpeed = 2.5;
		controls.rotateSpeed = 3;

		//controls.addEventListener( 'change', render );

		window.addEventListener('resize', onWindowResize, false);
	}

	function computeScale(geometry) {
		geometry.computeBoundingBox();

		var maxX = geometry.boundingBox.max.x;
		var minX = geometry.boundingBox.min.x;
		var maxY = geometry.boundingBox.max.y;
		var minY = geometry.boundingBox.min.y;
		var maxZ = geometry.boundingBox.max.z;
		var minZ = geometry.boundingBox.min.z;
		var maxDis = Math.sqrt((maxX - minX) * (maxX - minX) + (maxY - minY) * (maxY - minY) + (maxZ - minZ) * (maxZ - minZ)) / 2;
		var windowWidth = readWidth() / 2;
		var windowHeight = readHeight() / 2;
		var width = (maxX - minX) / 2;
		var height = (maxY - minY) / 2;

		var ratio = width / height;
		var scale = 1;

		if (opts.device == 'pc') {
			windowHeight = windowHeight - ($('.index-top').outerHeight() + $('.index-bottom').outerHeight()) / 2

			if (opts.type == 1 || opts.type == 2) {
				// 双模型
				scale = windowHeight / height / 4;
			} else if (opts.zoom == 1 || opts.zoom == 2 || opts.zoom == 3) {
				// 手枪和微型冲锋枪，步枪去除组合枪
				scale = windowHeight / height / 4;
			} else {
				scale = windowHeight / height / ratio / 1.5;
				// scale = scale * 1.5
			}
		} else {
			// 匕首（除双刀）
			if (opts.type != 1 && opts.weapon_type == '匕首') {
				scale = windowWidth / width / 1.6;
			} else if (opts.type == 1 || opts.type == 2) {
				// 双模型
				scale = (windowWidth - 10) / width / 4;
			} else if (opts.zoom == 1 || opts.zoom == 2) {
				// 手枪和微型冲锋枪
				scale = windowWidth / width / 2.5;
			} else {
				scale = windowWidth / width / 2;
			}
		}

		return scale;
	}

	function readWidth() {
		var showWidth = window.innerWidth;

		return showWidth
	}

	function readHeight() {
		var showHeight = window.innerHeight;

		return showHeight
	}

	function onWindowResize() {
		camera.aspect = readWidth() / readHeight();
		camera.updateProjectionMatrix();

		controls.handleResize();
		render();

		renderer.setSize(readWidth(), readHeight());
		renderer.setPixelRatio(window.devicePixelRatio);
	}

	function animate() {
		controls.update();
		render();
		requestAnimationFrame(animate);
	}

	function render() {
		//camera.lookAt( scene.position );
		renderer.render(scene, camera);
	}

	function resetObj() {
		// camera
		camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
		camera.position.z = 400;

		// controls
		controls = new TrackballControls(camera, renderer.domElement);
		controls.staticMoving = true;
	}
}

export default generate3D
