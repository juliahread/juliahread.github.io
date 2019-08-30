// GLOBAL VARIABLES
var gl;
// Recursion depth
var depth = 3;
// Initial vertices
var vert0 = vec3(-1,  0, -1 / Math.sqrt(2));
var vert1 = vec3( 1,  0, -1 / Math.sqrt(2));
var vert2 = vec3( 0,  1,  1 / Math.sqrt(2));
var vert3 = vec3( 0, -1,  1 / Math.sqrt(2));
// Vertices array
var vertices;
// Colors used
var pink1 = vec3(255 / 255, 209 / 255, 220 / 255);
var pink2 = vec3(252 / 255, 142 / 255, 172 / 255);
var blue1 = vec3(115 / 255, 194 / 255, 230 / 255);
var blue2 = vec3(179 / 255, 205 / 255, 224 / 255);
// Colors array
var colors = [];
// Vector with point halfway
var half = [vec3(0, 0, 0), vec3(2, 2, 2), vec3(1, 1, 1)];
// Rotation variables
var theta = [0.0, 0.0, 0.0];
var x_axis = 0;
var y_axis = 1;
var z_axis = 2;
var axis = x_axis;
var theta_loc;

window.onload = function init() {
  var canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // Configures WebGL
  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
  gl.enable(gl.DEPTH_TEST);

  // Loads shaders and initializes attribute buffers
  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  // Generates vertices through recursive call
  vertices = tetCoords(depth, fillVerts(vert0, vert1, vert2, vert3));
  // Loops through vertices to add correct colors
  for (var i = 0; i < vertices.length; i += 12) {
    colors = colors.concat(
      [ pink1, pink1, pink1,
        pink2, pink2, pink2,
        blue1, blue1, blue1,
        blue2, blue2, blue2 ]
    );
  }

  // Loads the data into the GPU
  gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
  // Associates shader variables with data buffer
  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  // Loads the data into the GPU
  gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
  // Associates shader variables with data buffer
  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  theta_loc = gl.getUniformLocation(program, "theta");

  // Rotation listeners
  document.getElementById("xButton").onclick = function() {
    axis = x_axis;
  }
  document.getElementById("yButton").onclick = function() {
    axis = y_axis;
  }
  document.getElementById("zButton").onclick = function() {
    axis = z_axis;
  }

  render();
};

// Updates rotation and draws triangles
function render() {
  theta[axis] += 1;
  gl.uniform3fv(theta_loc, flatten(theta));
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays( gl.TRIANGLES, 0, vertices.length );
  requestAnimFrame(render);
}

// Maps point on one line to point on another line
function map_point(params) {
  // Distinguishes parameters
  var P = params[0];
  var Q = params[1];
  var A = params[2];
  var B = params[3];
  var X = params[4];
  // Calculates difference of end point to point on line
  var xDiffPart = Math.abs(P[0] - X[0]);
  var yDiffPart = Math.abs(P[1] - X[1]);
  var zDiffPart = Math.abs(P[2] - X[2]);
  // Calculates difference between end points
  var xDiffWhole = Math.abs(P[0] - Q[0]);
  var yDiffWhole = Math.abs(P[1] - Q[1]);
  var zDiffWhole = Math.abs(P[2] - Q[2]);
  // Maps point given fraction between end points
  var x = mix([A[0]], [B[0]], xDiffPart / xDiffWhole);
  var y = mix([A[1]], [B[1]], yDiffPart / yDiffWhole);
  var z = mix([A[2]], [B[2]], zDiffPart / zDiffWhole);
  // Returns result
  return vec3(x, y, z);
}

// Recursive function to generate tetrahedron coordinates
function tetCoords(level, bigTet) {
  // Base case: returns given coordinates
  if (level == 0) {
    return bigTet;
  }
  // Distinguishes 4 vertices of given tetrahedron
  var v0 = bigTet[1];
  var v1 = bigTet[0];
  var v2 = bigTet[2];
  var v3 = bigTet[3];
  // Calculates all the midpoints of the edges
  var a = map_point([half[0], half[1], v1, v0, half[2]]);
  var b = map_point([half[0], half[1], v0, v2, half[2]]);
  var c = map_point([half[0], half[1], v1, v2, half[2]]);
  var d = map_point([half[0], half[1], v3, v1, half[2]]);
  var e = map_point([half[0], half[1], v3, v2, half[2]]);
  var f = map_point([half[0], half[1], v3, v0, half[2]]);
  // Creates the 4 smaller tetrahedrons given all the points
  var tet1 = fillVerts(a, v1, c, d);
  var tet2 = fillVerts(f, d, e, v3);
  var tet3 = fillVerts(v0, a, b, f);
  var tet4 = fillVerts(b, c, v2, e);
  // Creates an array of all the recursively generated ordered coordinates
  var v = [];
  v = v.concat(tetCoords(level - 1, tet1));
  v = v.concat(tetCoords(level - 1, tet2));
  v = v.concat(tetCoords(level - 1, tet3));
  v = v.concat(tetCoords(level - 1, tet4));
  // Returns coordinates
  return v;
}

// Orders given vertices to make edges of tetrahedron
function fillVerts(vt0, vt1, vt2, vt3) {
  return [ vt1, vt0, vt2,
           vt3, vt1, vt2,
           vt0, vt3, vt2,
           vt1, vt3, vt0 ];
}
