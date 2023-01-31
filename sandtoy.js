var Nano = require( 'nanogl' );

// Function called by onload handler
function start2()
{
  // Gets canvas from the HTML page
  var canvas = document.getElementById('glcanvas');

  // Creates GL context
  gl = null;
  try {gl = canvas.getContext('experimental-webgl');}
  catch(e) {error = "Sorry your browser does not support WebGL.";return;}
  
  // If no exception but context creation failed, alerts user
  if(!gl) {error = "Sorry your browser does not support WebGL.";return;}
  
  if (gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0){
  	error = "Sorry your browser does not support texture lookups within a vertex shader."; 
  	return;
  }
  
  gl.clearColor(0.3, 0.3, 0.3, 1.0);
  gl.clearDepth(1.0);
	
	function gxFrameBuffer() {
    var rttFramebuffer;
    var rttTexture;

    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = 512;
    rttFramebuffer.height = 512;

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
		
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)


    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    this.frameBuffer = rttFramebuffer;
    this.texture = rttTexture;
}

function gxFloatFrameBuffer() {
  var rttFramebuffer;
  var rttTexture;

  rttFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
  rttFramebuffer.width = 512;
  rttFramebuffer.height = 512;

  rttTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, rttTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.FLOAT, null);

  var renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	gl.clearColor(0,0,0,0)
	gl.clear(gl.COLOR_BUFFER_BIT)

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  this.frameBuffer = rttFramebuffer;
  this.texture = rttTexture;
}

function timeRenderer() {

	let fShaderSrc = `
	uniform sampler2D srcTimeSampler;
	uniform sampler2D srcMotionSampler;
	varying highp vec2 vTextureCoord;
	uniform highp int uMouseDown;
  uniform highp vec2 uMousePos;
  void main(void) {
		highp vec4 time = texture2D(srcTimeSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		
		highp vec4 motion = texture2D(srcMotionSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		highp vec2 displacement = vec2(motion.r, motion.g);
		highp vec2 velocity = vec2(motion.b, motion.a);
		
		highp vec2 fragmentCoord = (vTextureCoord * 512.0) + vec2(displacement.x,512.0-displacement.y);

		highp vec2 mouse2 = vec2(uMousePos.x,uMousePos.y+512.0);
		highp float d = distance(mouse2, fragmentCoord);

		if (uMouseDown == 1 && d <= 50.0)  {
			time.r = 300.0;
		}
		else {
			time.r = time.r - 1.0;
			if (time.r < 0.0) 
				time.r = 0.0;	
		}

		gl_FragColor = vec4(time.r,0.0,0.0,0.0);
  }
	`

  let vShaderSrc = `
  attribute vec2 ppos;
  attribute vec2 aTextureCoord;
  varying highp vec2 vTextureCoord;
  void main(void) {
  	vTextureCoord = aTextureCoord;
  	gl_Position = vec4(ppos.x, ppos.y, 0.0, 1.0);
  }
  `

  let mProgram = new Nano.Program(gl,vShaderSrc,fShaderSrc);
  mProgram.use();

	var textureCoordAttribute = gl.getAttribLocation(mProgram.program, "aTextureCoord");  

  var v = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
  var vertices = new Float32Array(v);
	
  var u = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  var texcoords = new Float32Array(u);
  
  var vbuffer = gl.createBuffer();
  var ubuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
	

	this.drawScene = function(srcT, srcMotion, dstT) {

    mProgram.use()

    gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, srcT.texture)
		mProgram.srcTimeSampler(1)
	
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, srcMotion.texture);
		mProgram.srcMotionSampler(2)
	
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	
    gl.vertexAttribPointer(mProgram.ppos(), 2, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
	
		gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
		gl.enableVertexAttribArray(mProgram.ppos());
		gl.enableVertexAttribArray(textureCoordAttribute);
		
		mProgram.uMouseDown(mouseDown)
		mProgram.uMousePos(mousePos[0], mousePos[1])

		gl.bindFramebuffer(gl.FRAMEBUFFER, dstT.frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, null)
		gl.activeTexture(gl.TEXTURE2)
		gl.bindTexture(gl.TEXTURE_2D, null)

		gl.flush()
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				
	}
      
	var parentFunction = this;
	this.program = mProgram.program;
}

	//---------------- end of time stage -----------------
	
  function motionRenderer() {

	let fShaderSrc = `
  uniform sampler2D noiseSampler;
	uniform sampler2D timeSampler;
	uniform sampler2D srcMotionSampler;
	varying highp vec2 vTextureCoord;
	uniform int uMouseDown;
  uniform highp vec2 uMousePos;
	uniform highp vec2 uMouseDelta;
	uniform int uAutoReassemble;
  void main(void) {
		highp vec4 time = texture2D(timeSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		
		highp vec4 motion = texture2D(srcMotionSampler, vec2(vTextureCoord.s, vTextureCoord.t));
		highp vec2 displacement = vec2(motion.r, motion.g);
		highp vec2 velocity = vec2(motion.b, motion.a);
		
		highp vec2 fragmentCoord = (vTextureCoord * 512.0) + vec2(displacement.x,512.0-displacement.y);

		highp vec2 mouse2 = vec2(uMousePos.x,uMousePos.y+512.0);
		highp vec2 prevMouse2 = vec2(uMouseDelta.x, -uMouseDelta.y);
		highp float d = distance(mouse2, fragmentCoord);

		if (uMouseDown == 1 && d <= 50.0)  { 
			if (prevMouse2.x != 0.0 || prevMouse2.y != 0.0) {
				highp vec4 noise2 = texture2D(noiseSampler, vec2(vTextureCoord.s, vTextureCoord.t));

				highp vec2 noise = vec2(noise2.r, noise2.g);
				noise = noise * 2.0 - 1.0;

				highp float r = d/50.0;
				if (r > 1.0)
					r = 1.0;
				highp float force = 1.0 - (r*r*r);
				velocity.x = prevMouse2.x * force + noise.x*2.0;
				velocity.y = prevMouse2.y * force + noise.y*2.0;
				
				/*
				if (velocity.x > 10.0)
					velocity.x = 10.0;
				else if (velocity.x < -10.0)
					velocity.x = -10.0;
				if (velocity.y > 10.0)
					velocity.y = 10.0;
				else if (velocity.y < -10.0)
					velocity.y = -10.0;
				*/
			}
		}
		else if (uAutoReassemble == 1 && time.r == 0.0) {
			displacement = displacement * vec2(0.8);
		}
			 
		displacement += velocity;
		velocity -= velocity*vec2(0.13);
		if (distance(velocity,vec2(0.0)) < 1.0)
			velocity = vec2(0.0);
		gl_FragColor = vec4(displacement.x, displacement.y, velocity.x, velocity.y);
  }
	`

  let vShaderSrc = `
  attribute vec2 ppos;
  attribute vec2 aTextureCoord;
  varying highp vec2 vTextureCoord;
  void main(void) {
  	vTextureCoord = aTextureCoord;
  	gl_Position = vec4(ppos.x, ppos.y, 0.0, 1.0);
  }
  `

  let mProgram = new Nano.Program(gl,vShaderSrc,fShaderSrc);
  mProgram.use();

	var textureCoordAttribute = gl.getAttribLocation(mProgram.program, "aTextureCoord");  

  var v = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
  var vertices = new Float32Array(v);
	
  var u = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  var texcoords = new Float32Array(u);
  
  var vbuffer = gl.createBuffer();
  var ubuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
	
	var noiseTexture;
	var noiseImage;

	this.drawScene = function(srcT, srcMotion, dstMotion) {

    mProgram.use()

    gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, srcMotion.texture)
		mProgram.srcMotionSampler(1)
	
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, srcT.texture);
		mProgram.timeSampler(2)
	
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
		mProgram.noiseSampler(3)
	
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	
    gl.vertexAttribPointer(mProgram.ppos(), 2, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
	
		gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
		gl.enableVertexAttribArray(mProgram.ppos());
		gl.enableVertexAttribArray(textureCoordAttribute);
		
		mProgram.uMouseDown(mouseDown)
		mProgram.uAutoReassemble(autoReassemble)
    mProgram.uMouseDelta(mouseDelta[0], mouseDelta[1])
		mProgram.uMousePos(mousePos[0], mousePos[1])

		gl.bindFramebuffer(gl.FRAMEBUFFER, dstMotion.frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.activeTexture(gl.TEXTURE1)
		gl.bindTexture(gl.TEXTURE_2D, null)
		gl.activeTexture(gl.TEXTURE2)
		gl.bindTexture(gl.TEXTURE_2D, null)
		gl.activeTexture(gl.TEXTURE3)
		gl.bindTexture(gl.TEXTURE_2D, null)
		
		gl.flush()
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				
	}
		
	function initTextures2() {  
		noiseTexture = gl.createTexture();  
		noiseImage = new Image();  
		noiseImage.onload = function() { handleTextureLoaded2(noiseImage, noiseTexture); }  
		noiseImage.src = "./noise.png";  
	}  
      
	var parentFunction = this;
	this.ready = false;
	this.program = mProgram.program;

  function handleTextureLoaded2(image, texture) {  
		gl.activeTexture(gl.TEXTURE5);  
		gl.bindTexture(gl.TEXTURE_2D, texture);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);         
		
		parentFunction.ready = true;
  }  
  
	initTextures2();
}
    
    
  //---------------- end of motion stage -----------------  
  
  function particleRenderer() {
  
		// Creates fragment shader (returns white color for any position)
		var fshader = gl.createShader(gl.FRAGMENT_SHADER);

		var fShaderSrc = `
			uniform sampler2D photoSampler;
			varying highp vec2 vTextureCoord;
			void main(void) {
				gl_FragColor = texture2D(photoSampler, vec2(vTextureCoord.s, vTextureCoord.t));
			}
    `

    var vShaderSrc = `
		uniform sampler2D uSamplerMotion;
		attribute vec2 ppos;
		attribute vec2 aTextureCoord;
		varying highp vec2 vTextureCoord;
		void main(void) {
			vec4 offsets = texture2D(uSamplerMotion, vec2(aTextureCoord.x, aTextureCoord.y));
			vTextureCoord = aTextureCoord;
			highp float deltaX = offsets.r/256.0;
			highp float deltaY = offsets.g/256.0;
			highp float newX = ppos.x + deltaX;
			highp float newY = ppos.y + deltaY;
			highp float newZ = 0.0;
			if (deltaX != 0.0 || deltaY != 0.0)
				newZ = -1.0;
			gl_Position = vec4(newX, newY, newZ, 1.0);
			gl_PointSize = 1.2;
		}
    `

    pProgram = new Nano.Program(gl, vShaderSrc, fShaderSrc)
		pProgram.use()
		
		gl.clearColor(0.3, 0.3, 0.3, 1.0);
		gl.clearDepth(1.0);
    
		var textureCoordAttribute = gl.getAttribLocation(pProgram.program, "aTextureCoord");  
		
		var v = [];
		
		for (var i = 0; i < 512; i++) {
			for (var j = 0; j < 512; j++) {
				v.push((j/511.0)*2-1.0); v.push((i/511.0)*2-1.0);
			}
		}
		
		var u = [];
		for (var i = 0; i < 512; i++) {
			for (var j = 0; j < 512; j++) {
				u.push(-1.0+(j/511.0)); u.push(1.0-(i/511.0));
			}
		}
				
		var vertices = new Float32Array(v);
		var texcoords = new Float32Array(u);
		
		var vbuffer = gl.createBuffer();
		var ubuffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
		
		var numberFrame = 0;
		var startTime = (new Date).getTime();
		
		this.drawScene = function(dstMotion) {
		
      pProgram.use()
			
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, dstMotion.texture);
			pProgram.uSamplerMotion(1)
			
			gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
			gl.vertexAttribPointer(pProgram.ppos(), 2, gl.FLOAT, false, 0, 0)
			
			gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
			gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
			
			gl.enableVertexAttribArray(pProgram.ppos())
			gl.enableVertexAttribArray(textureCoordAttribute)  
		
			// Draws the photo as a bunch of points
			gl.drawArrays(gl.POINTS, 0, 512*512);
			gl.flush()
			
			numberFrame++;
	
			if (numberFrame % 60 === 0.0) {
					var nd = (new Date).getTime();
					var diff = nd - startTime;
	
					jQuery("#fps").text(Math.floor(numberFrame/(diff/1000)) + " fps");
					startTime = nd;
					numberFrame = 0;
			}		
			
		}

		var photoTexture;
		var photoImage;

    function initTextures() {  
      photoTexture = gl.createTexture();  
      photoImage = new Image();  
      photoImage.onload = function() { handleTextureLoaded3(photoImage, photoTexture); }  
      photoImage.src = "./sandbox.jpg";  
    }  
      
		var parentFunction = this;
		this.ready = false;
		this.program = pProgram.program;

    function handleTextureLoaded3(image, texture) {  
			gl.activeTexture(gl.TEXTURE0);  
      gl.bindTexture(gl.TEXTURE_2D, texture);  
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);       
      pProgram.photoSampler(0)
			parentFunction.ready = true;
    }  
    
    initTextures();
    
  }
		
	// Enable extention before creating floating point textures
	var floatTextureExt = gl.getExtension('OES_texture_float')
  console.log("Supports Floating Point Textures: ", floatTextureExt?'YES':'NO')
  
	var fbT1 = new gxFloatFrameBuffer()
	var fbT2 = new gxFloatFrameBuffer();
  var fbf1 = new gxFloatFrameBuffer()
	var fbf2 = new gxFloatFrameBuffer()
	

	reassemble = function() {
		console.log("reassembling")
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbT1.frameBuffer)
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbT2.frameBuffer)
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.clearColor(0.3,0.3,0.3,1)
		gl.clearDepth(1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.flush()
	}

	reset = function() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbT1.frameBuffer)
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbT2.frameBuffer)
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbf1.frameBuffer)
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbf2.frameBuffer)
		gl.clearColor(0,0,0,0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.clearColor(0.3,0.3,0.3,1.0)
		gl.clearDepth(1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.flush()
	}

	var time = new timeRenderer()
	var motion = new motionRenderer()
  var particles = new particleRenderer()
      
  var fbi = true;
    
	function tick() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)		
		
		if (motion.ready) 
		{
			var srcT;
			var dstT;
			var srcMotion;
			var dstMotion;
			
			if (fbi) { 
				srcT = fbT1
				dstT = fbT2
				srcMotion = fbf1
				dstMotion = fbf2
			}
			else {
				srcT = fbT2
				dstT = fbT1
				srcMotion = fbf2
				dstMotion = fbf1
			}
			fbi = !fbi
			
			gl.disable(gl.DEPTH_TEST)

			time.drawScene(srcT, srcMotion, dstT)

			motion.drawScene(dstT, srcMotion, dstMotion)

			if (particles.ready) {
				gl.enable(gl.DEPTH_TEST)
				gl.depthFunc(gl.LEQUAL)
				particles.drawScene(dstMotion)
			}
		}
	}
	
	
	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame       || 
						window.webkitRequestAnimationFrame || 
						window.mozRequestAnimationFrame    || 
						window.oRequestAnimationFrame      || 
						window.msRequestAnimationFrame     || 
						function( callback ){
							window.setTimeout(callback, 1000 / 60)
						}
	})();

	(function animloop(){
		requestAnimFrame(animloop)
		tick()
	})()

}