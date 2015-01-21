(function ($) {

  Drupal.behaviors.drupalthree = {
    attach: function (context, settings) {
      var camera, scene, renderer;
      var mouseX = 0, mouseY = 0;
      var container;
      var dae;
      
      var clock = new THREE.Clock();
      var morphs = [];
      
      var windowHalfX = window.innerWidth / 2;
      var windowHalfY = window.innerHeight / 2;
      var config = Drupal.settings.drupalthree.config;
      if (config.loaders.loader.name == 'ColladaLoader') {
        realise_collada(config);
      }
      else {
        drupalthree_init(config);
      }

      function drupalthree_init(config) {
        //configuration
        container = $('#' + config.container_id)[0];
        container_obj = $('#' + config.container_id);
        container_obj.width(config.width);
        container_obj.height(config.height);
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.035);

        camera = new THREE.PerspectiveCamera(45, container_obj.width() / container_obj.height(), 1, 2000);
        camera.position.set(2, 4, 5);

        //camera.position.x = 0;
        renderer = new THREE.WebGLRenderer({alpha: true});
        renderer.setClearColor(0x000000, 0); // the default
        renderer.setSize(container_obj.width(), container_obj.width());

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        container.appendChild(renderer.domElement);



        scene.add(new THREE.AmbientLight(0xcccccc));

        var directionalLight = new THREE.DirectionalLight(0xeeeeee);
        directionalLight.position.x = Math.random() - 0.5;
        directionalLight.position.y = Math.random();
        directionalLight.position.z = Math.random() - 0.5;
        directionalLight.position.normalize();
        scene.add(directionalLight);

        var manager = new THREE.LoadingManager();
        manager.onProgress = function (item, loaded, total) {
          //console.log(item, loaded, total);
        };

        loader_name = config.loaders.loader.name;

        if (loader_name == 'OBJMTLLoader') {
          realise_obj_mtl(config, manager, scene);
        }

        if (loader_name == 'ColladaLoader') {
          realise_json(config, manager, scene);
        }
      }

      function realise_obj_mtl(config, manager, scene) {
        var onProgress = function (xhr) {
          if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
          }
        };

        var onError = function (xhr) {
        };


        THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());
        var loader = new THREE.OBJMTLLoader(manager);
        obj_loader = config.loaders.loader.items['obj'];
        mtl_loader = config.loaders.loader.items['mtl'];
        loader.load(obj_loader, mtl_loader, function (object) {
          object.traverse(function (child) {
          });
          obj = object;
          scene.add(obj);

          render();
        });
      }

      function realise_collada(config) {
        var loader = new THREE.ColladaLoader();
        loader.options.convertUpAxis = true;
        loader.load(config.loaders.loader.items['Collada'], function (collada) {

          dae = collada.scene;

          dae.traverse(function (child) {

            if (child instanceof THREE.SkinnedMesh) {

              var animation = new THREE.Animation(child, child.geometry.animation);
              animation.play();

            }

          });

          dae.scale.x = dae.scale.y = dae.scale.z = 0.002;
          dae.position.x = -1;
          dae.updateMatrix();

          drupalthree_init(config);
          animate();

        });
      }

      function realise_json(config, manager, scene) {
        // Add Blender exported Collada model
        var loader = new THREE.JSONLoader();
        loader.load(config.loaders.loader.items['json'], function (geometry, materials) {

          // adjust color a bit

          var material = materials[ 0 ];
          material.morphTargets = true;
          material.color.setHex(0xffaaaa);
          material.ambient.setHex(0x222222);

          var faceMaterial = new THREE.MeshFaceMaterial(materials);

          for (var i = 0; i < 729; i++) {

            // random placement in a grid

            var x = ((i % 27) - 13.5) * 2 + THREE.Math.randFloatSpread(1);
            var z = (Math.floor(i / 27) - 13.5) * 2 + THREE.Math.randFloatSpread(1);

            // leave space for big monster

            if (Math.abs(x) < 2 && Math.abs(z) < 2)
              continue;

            morph = new THREE.MorphAnimMesh(geometry, faceMaterial);

            // one second duration

            morph.duration = 1000;

            // random animation offset

            morph.time = 1000 * Math.random();

            var s = THREE.Math.randFloat(0.00075, 0.001);
            morph.scale.set(s, s, s);

            morph.position.set(x, 0, z);
            morph.rotation.y = THREE.Math.randFloat(-0.25, 0.25);

            morph.matrixAutoUpdate = false;
            morph.updateMatrix();

            scene.add(morph);

            morphs.push(morph);

          }

        });
        // Add the COLLADA
        scene.add(dae);
      }


      function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
      }
      function animate() {

        requestAnimationFrame(animate);

        var delta = clock.getDelta();

        // animate Collada model

        THREE.AnimationHandler.update(delta);

        if (morphs.length) {

          for (var i = 0; i < morphs.length; i ++)
            morphs[ i ].updateAnimation(1000 * delta);

        }

        render();

      }

    }

  };


})(jQuery);  