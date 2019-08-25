var gl;
var numPoints;

window.onload = function init() {
    var canvas = document.getElementById( "gl-canvas" );
    var width = canvas.width;

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Define vertex and color arrays
    var vertices = [];
    var colors = [];
    // Define vectors for 
    var origin = vec3(0, 0, 0);
    var maxColors = vec3(1, 1, 1);
    var maxCoord = vec3(width - 1, width - 1, width - 1);
    var halfCoord = vec3(width / 2 - 1, width / 2 - 1, width / 2 - 1);
    // Looping
    for (var i = 0; i < width; i++) {
      var mappedCoord = (i / width) * 2 - 1;
      vertices.push(vec2(mappedCoord, 1));
      vertices.push(vec2(mappedCoord, 0));
      vertices.push(vec2(mappedCoord, 0));
      vertices.push(vec2(mappedCoord, -1));
      var grayCoord = vec3(i, i, i);
      var grayValue = map_point([origin, maxCoord, origin, maxColors, grayCoord]);
      colors.push(grayValue);
      colors.push(grayValue);
      if (i < width / 2) {
        var red = (width / 2) - i;
        var green = i;
        var blue = 0;
      }
      else {
        var red = 0;
        var green = width - i;
        var blue = i - (width / 2);
      }
      var colorCoord = vec3(red, green, blue);
      var colorValue = map_point([origin, halfCoord, origin, maxColors, colorCoord]);
      colors.push(colorValue);
      colors.push(colorValue);
    }
    numPoints = vertices.length;


    // Load coordinates into the GPU
    gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    // Associate shader variables with data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Load colors into the GPU
    gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    // Associate shader variables with data buffer
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    render();
};

function map_point(params) {
  var P = params[0];
  var Q = params[1];
  var A = params[2];
  var B = params[3];
  var X = params[4];

  var xDiffPart = Math.abs(P[0] - X[0]);
  var yDiffPart = Math.abs(P[1] - X[1]);
  var zDiffPart = Math.abs(P[2] - X[2]);

  var xDiffWhole = Math.abs(P[0] - Q[0]);
  var yDiffWhole = Math.abs(P[1] - Q[1]);
  var zDiffWhole = Math.abs(P[2] - Q[2]);

  var r = mix([A[0]], [B[0]], xDiffPart / xDiffWhole);
  var g = mix([A[1]], [B[1]], yDiffPart / yDiffWhole);
  var b = mix([A[2]], [B[2]], zDiffPart / zDiffWhole);

  return vec3(r,g,b);
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, numPoints );
}
