(function(){
  // Scene properties
  var scene_color = 0x000000;
  var scene_color_alpha = 1;

  // Lights
  var light_am_color = 0xAAAAAA;
  var light_spot_color = 0xDDDDDD;
  var light_spot_intensity = 0.7;
  var light_spot_position = {x: 5, y: 5, z: 20,}
  var light_spot_camera_near = 0.5;


  // Plane Properties
  var plane_width = 10;
  var plane_height = 10;
  var plane_width_segs = 1;
  var plane_height_segs = 1;
  var plane_color = 0xDDDDDD;
  var plane_position = {x: 0, y: 0, z: -5};

  // Camera Properties
  var camera_angle = 0;
  var camera_range = -12;
  var camera_speed = 0.05 * Math.PI/180;
  var camera_target = new THREE.Vector3(0, 0, -5);
  var camera_focal = 70;
  var camera_near = 0.1;
  var camera_far = 50;

  // Box properties
  var box_width = 0.5;
  var box_height = 0.5;
  var box_depth = 1;
  var box_rotation_speed = 0.01;
  var box_color = 0x005500;
  var box_position = {x: -1, y: -1, z: -4};

  var scene,
    camera,
    controls,
    cube,
    central,
    selectedSide;

  init();

  var num = 3,
      size = 1,
      raycaster = new THREE.Raycaster(),
      mouse = new THREE.Vector2();

  var cube = createCube();

  function animate() {
     requestAnimationFrame( animate );
     controls.update();
     renderer.render( scene, camera );
  }

  function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    camera = new THREE.PerspectiveCamera(camera_focal, window.innerWidth/window.innerHeight, camera_near, camera_far);
    camera.position.set(100, 90, 100);
    camera.lookAt(camera_target);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene_color, scene_color_alpha);
    document.body.appendChild( renderer.domElement );

    setupLight();
    setupControls();

    document.getElementById("rotate_clockwise").addEventListener("click", function(){
      rotateSelectedSideAroundCentral(true);
    });

    document.getElementById("rotate_counterclockwise").addEventListener("click", function(){
      rotateSelectedSideAroundCentral(false);
    });

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );

  }

  function onDocumentMouseDown( event )
  {
    if(event.target.classList.contains("control")){
      return;
    }

    // find intersections

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( cube.children, false );

    // if there is one (or more) intersections
    if ( intersects.length > 0 )
    {
      console.log("Hit @ " + toString( intersects[0].point ) );
      var object = intersects[0].object;

      var south = cube.children.filter(c => c.position.y > central.position.y);
      var north = cube.children.filter(c => c.position.y < central.position.y);
      var east = cube.children.filter(c => c.position.x > central.position.x);
      var west = cube.children.filter(c => c.position.x < central.position.x);
      var front = cube.children.filter(c => c.position.z < central.position.z);
      var back = cube.children.filter(c => c.position.z > central.position.z);


      var sides = [east, south, north, west, back, front];

      for (var i = 0; i < sides.length; i++) {
          if(JSON.stringify(selectedSide) !== JSON.stringify(sides[i]) && sides[i].includes(object)){
            selectedSide = sides[i];
            selectedSide.forEach(c => c.material.opacity = 1.0);
            break;
          }
      }

      cube.children.filter(c => !selectedSide.includes(c))
        .forEach(c => c.material.opacity = 0.5);

        document.getElementById("rotate_clockwise").style.display = "block";
        document.getElementById("rotate_counterclockwise").style.display = "block";


      //intersects[0].object.parent.remove(intersects[0].object);
    } else {
      selectedSide = null;
      cube.children.forEach(c => c.material.opacity = 1.0);
      document.getElementById("rotate_clockwise").style.display = "none";
      document.getElementById("rotate_counterclockwise").style.display = "none";
    }

  }

  // clockwise - boolean indicating whether the rotation should be performed in a clockwise manner
  async function rotateSelectedSideAroundCentral(clockwise){
    //TODO: clockwise/counterclockwise
    var theta = THREE.Math.degToRad(3);
    var point = central.position;

    if(clockwise){
      theta *= -1;
    }

    var south = cube.children.filter(c => c.position.y > central.position.y);
    var north = cube.children.filter(c => c.position.y < central.position.y);
    var east = cube.children.filter(c => c.position.x > central.position.x);
    var west = cube.children.filter(c => c.position.x < central.position.x);
    var front = cube.children.filter(c => c.position.z < central.position.z);
    var back = cube.children.filter(c => c.position.z > central.position.z);


    var sides = [east, south, north, west, back, front];
    var axis;

    if(JSON.stringify(selectedSide) === JSON.stringify(south) || JSON.stringify(selectedSide) === JSON.stringify(north)){
      axis = new THREE.Vector3(0.0,1.0,0.0);
    } else if(JSON.stringify(selectedSide) === JSON.stringify(east) || JSON.stringify(selectedSide) === JSON.stringify(west)){
      axis = new THREE.Vector3(1.0,0.0,0.0);
    } else if(JSON.stringify(selectedSide) === JSON.stringify(front) || JSON.stringify(selectedSide) === JSON.stringify(back)){
      axis = new THREE.Vector3(0.0,0.0,1.0);
    }

    for(var i = 0; i < 30; i++){
      selectedSide.forEach(obj => {
        obj.position.sub(point); // remove the offset
        obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
        obj.position.add(point); // re-add the offset
        obj.rotateOnWorldAxis(axis, theta); // rotate the OBJECT
      });
      await sleep(10);
    }

    //Not sure why but the position may be slightly off after this.. TODO: debug..
    selectedSide.forEach(obj => {
      obj.position.x = Math.round(obj.position.x * 100) / 100
      obj.position.y = Math.round(obj.position.y * 100) / 100
      obj.position.z = Math.round(obj.position.z * 100) / 100
    });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function createCube(){
    var cube = new THREE.Object3D();
    for(var i = 0; i < num; i++){
        for(var j = 0; j < num; j++){
            for(var k = 0; k < num; k++){
                cube.add(createCubelet(i, j, k, size, 0x00ff00));
            }
        }
    }

    scene.add(cube);

    return cube;
  }

  function createCubelet(x, y, z, size, color){
    var posX = x * (size + size * 0.05);
    var posY = y * (size + size * 0.05);
    var posZ = z * (size + size * 0.05);

    var geometry = new THREE.BoxGeometry( size, size, size );

    // colors
    var yellow = new THREE.Color(1, 1, 0);
    var red = new THREE.Color(1, 0, 0);
    var green = new THREE.Color(0, 1, 0);
    var blue = new THREE.Color(0, 0, 1);
    var orange = new THREE.Color(1, 0.6, 0);
    var black = new THREE.Color(0.3,0.3,0.3);
    var colors = [red, green, blue, yellow, orange, black];

    if(x == 0){
      geometry.faces[2].color = colors[3];
      geometry.faces[3].color = colors[3];
    }

    if(y == 0){
      geometry.faces[6].color = colors[0];
      geometry.faces[7].color = colors[0];

    }

    if(y == 2){
      geometry.faces[4].color = colors[4];
      geometry.faces[5].color = colors[4];
    }

    if(z == 0){
      geometry.faces[10].color = colors[1];
      geometry.faces[11].color = colors[1];
    }

    if(z == 2){
      geometry.faces[8].color = colors[2];
      geometry.faces[9].color = colors[2];
    }

    var material = new THREE.MeshLambertMaterial({color: 0xffffff, vertexColors: THREE.FaceColors});
    material.transparent = true;

    cube = new THREE.Mesh( geometry, material );
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.position.set(posX, posY, posZ);

    if(x == y && x == z  && x == 1){
      console.log("Creating a central piece!");
      geometry.faces.forEach(face => face.color = colors[5]);
      central = cube;
    }

    return cube;
  }

  function setupLight(){
    // Add abbient light
    var am_light = new THREE.AmbientLight(light_am_color); // soft white light
    scene.add(am_light);

    // Add directional light
    var spot_light = new THREE.SpotLight(light_spot_color, light_spot_intensity);
    spot_light.position.set(light_spot_position.x, light_spot_position.y, light_spot_position.z);
    spot_light.target = scene;
    spot_light.castShadow = true;
    spot_light.receiveShadow = true;
    spot_light.shadow.camera.near	= light_spot_camera_near;
    scene.add(spot_light);
  }

  function setupControls(){
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    controls.enableDamping = true;
    controls.dampingFactor = 0.5;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 10;
  }

  animate();

})();
