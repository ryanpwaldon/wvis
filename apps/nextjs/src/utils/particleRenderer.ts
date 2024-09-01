import type { Map } from 'mapbox-gl'
import type { ProgramInfo } from 'twgl.js'
import { MercatorCoordinate } from 'mapbox-gl'
import { createBufferInfoFromArrays, createProgramInfo, createTextures, drawBufferInfo, setBuffersAndAttributes, setUniforms } from 'twgl.js'

import type { VectorGrid } from '~/hooks/useImageData'

// Returns all pixels
export const vQuad = /* glsl */ `
  precision highp float;
  attribute vec2 a_pos;
  varying vec2 v_tex_pos;
  void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(2.0 * a_pos - 1.0, 0, 1);
  }
`

// Receives all pixels
// Draws every pixel
export const fScreenDraw = /* glsl */ `
  precision highp float;
  uniform sampler2D u_screen;
  uniform float u_opacity;
  varying vec2 v_tex_pos;
  void main() {
    vec4 color = texture2D(u_screen, v_tex_pos); // get color from screen texture pixel (previous frame)
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0); // make color slightly more transparent
  }
`

// Returns particle pixels
export const vParticlesDraw = /* glsl */ `
  precision highp float;
  attribute float a_particle_index; // index of pixel in particle state square texture
  uniform sampler2D u_particles; // particle state square texture
  uniform float u_particles_res; // a side of the particle state square texture (e.g. for 256x256, res = 256)
  void main() {
    // find color in particle state square texture using index + particle state res as inputs
    vec4 color = texture2D(u_particles, vec2(fract(a_particle_index / u_particles_res), floor(a_particle_index / u_particles_res) / u_particles_res));
    // convert color to x,y position, normalised between 0 and 1
    vec2 pos = vec2(color.r / 255.0 + color.b, color.g / 255.0 + color.a);
    // set particle size
    gl_PointSize = 3.0;
    // normalise between -1 and 1. and, flip the y axis
    gl_Position = vec4(2.0 * pos.x - 1.0, 1.0 - 2.0 * pos.y, 0, 1);
  }
`

// Receives particle pixels
// Draws all particles
export const fParticlesDraw = /* glsl */ `
  precision highp float;

  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.33);
  }
`

// Receives all pixels
// Draws every pixel
export const fParticlesUpdate = /* glsl */ `
  precision highp float;
  uniform sampler2D u_particles;
  uniform sampler2D u_vector_grid;
  uniform vec2 u_vector_grid_res;
  uniform vec2 u_vector_grid_min_speed;
  uniform vec2 u_vector_grid_max_speed;
  uniform vec4 u_map_mercator_bounds;
  uniform float u_speed_factor;
  uniform float u_drop_rate;
  uniform float u_drop_rate_bump;
  uniform float u_random_seed;
  varying vec2 v_tex_pos;

  float rand(const vec2 co) {
    float t = dot(vec2(12.9898, 78.233), co);
    return fract(sin(t) * (4375.85453 + t));
  }

  vec2 getVelocityBilinear(const vec2 uv) {
    vec2 px = 1.0 / u_vector_grid_res;
    vec2 vc = (floor(uv * u_vector_grid_res)) * px;
    vec2 f = fract(uv * u_vector_grid_res);
    vec2 tl = texture2D(u_vector_grid, vc).rg;
    vec2 tr = texture2D(u_vector_grid, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_vector_grid, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_vector_grid, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
  }

  vec2 catmullRom(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;    
    vec2 v0 = (p2 - p0) * 0.5;
    vec2 v1 = (p3 - p1) * 0.5;
    return (2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1;
  }

  vec2 getVelocityCatmullRom(vec2 uv) {
    vec2 px = 1.0 / u_vector_grid_res;
    vec2 vc = floor(uv * u_vector_grid_res) * px;
    vec2 f = fract(uv * u_vector_grid_res);
    vec2 p00 = texture2D(u_vector_grid, vc + vec2(-px.x, -px.y)).rg;
    vec2 p10 = texture2D(u_vector_grid, vc + vec2(0.0, -px.y)).rg;
    vec2 p20 = texture2D(u_vector_grid, vc + vec2(px.x, -px.y)).rg;
    vec2 p30 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, -px.y)).rg;
    vec2 p01 = texture2D(u_vector_grid, vc + vec2(-px.x, 0.0)).rg;
    vec2 p11 = texture2D(u_vector_grid, vc).rg;
    vec2 p21 = texture2D(u_vector_grid, vc + vec2(px.x, 0.0)).rg;
    vec2 p31 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, 0.0)).rg;
    vec2 p02 = texture2D(u_vector_grid, vc + vec2(-px.x, px.y)).rg;
    vec2 p12 = texture2D(u_vector_grid, vc + vec2(0.0, px.y)).rg;
    vec2 p22 = texture2D(u_vector_grid, vc + vec2(px.x, px.y)).rg;
    vec2 p32 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, px.y)).rg;
    vec2 p03 = texture2D(u_vector_grid, vc + vec2(-px.x, 2.0 * px.y)).rg;
    vec2 p13 = texture2D(u_vector_grid, vc + vec2(0.0, 2.0 * px.y)).rg;
    vec2 p23 = texture2D(u_vector_grid, vc + vec2(px.x, 2.0 * px.y)).rg;
    vec2 p33 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, 2.0 * px.y)).rg;
    vec2 x0 = catmullRom(p00, p10, p20, p30, f.x);
    vec2 x1 = catmullRom(p01, p11, p21, p31, f.x);
    vec2 x2 = catmullRom(p02, p12, p22, p32, f.x);
    vec2 x3 = catmullRom(p03, p13, p23, p33, f.x);
    return catmullRom(x0, x1, x2, x3, f.y);
  }

  vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);
  }

  vec2 getVelocityBicubic(vec2 uv) {
    vec2 px = 1.0 / u_vector_grid_res;
    vec2 vc = floor(uv * u_vector_grid_res) * px;
    vec2 f = fract(uv * u_vector_grid_res);
    vec4 x = cubic(f.x);
    vec4 y = cubic(f.y);
    vec2 c00 = texture2D(u_vector_grid, vc + vec2(-px.x, -px.y)).rg;
    vec2 c10 = texture2D(u_vector_grid, vc + vec2(0.0, -px.y)).rg;
    vec2 c20 = texture2D(u_vector_grid, vc + vec2(px.x, -px.y)).rg;
    vec2 c30 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, -px.y)).rg;
    vec2 c01 = texture2D(u_vector_grid, vc + vec2(-px.x, 0.0)).rg;
    vec2 c11 = texture2D(u_vector_grid, vc + vec2(0.0, 0.0)).rg;
    vec2 c21 = texture2D(u_vector_grid, vc + vec2(px.x, 0.0)).rg;
    vec2 c31 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, 0.0)).rg;
    vec2 c02 = texture2D(u_vector_grid, vc + vec2(-px.x, px.y)).rg;
    vec2 c12 = texture2D(u_vector_grid, vc + vec2(0.0, px.y)).rg;
    vec2 c22 = texture2D(u_vector_grid, vc + vec2(px.x, px.y)).rg;
    vec2 c32 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, px.y)).rg;
    vec2 c03 = texture2D(u_vector_grid, vc + vec2(-px.x, 2.0 * px.y)).rg;
    vec2 c13 = texture2D(u_vector_grid, vc + vec2(0.0, 2.0 * px.y)).rg;
    vec2 c23 = texture2D(u_vector_grid, vc + vec2(px.x, 2.0 * px.y)).rg;
    vec2 c33 = texture2D(u_vector_grid, vc + vec2(2.0 * px.x, 2.0 * px.y)).rg;
    vec2 row0 = c00 * x.x + c10 * x.y + c20 * x.z + c30 * x.w;
    vec2 row1 = c01 * x.x + c11 * x.y + c21 * x.z + c31 * x.w;
    vec2 row2 = c02 * x.x + c12 * x.y + c22 * x.z + c32 * x.w;
    vec2 row3 = c03 * x.x + c13 * x.y + c23 * x.z + c33 * x.w;
    return row0 * y.x + row1 * y.y + row2 * y.z + row3 * y.w;
  }

  vec2 getLngLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_map_mercator_bounds.x + pos.x * x_domain);
    float mercator_y = u_map_mercator_bounds.w + pos.y * y_domain;
    float lng = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat = 90.0 - (360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654/180.0)));
    return vec2(lng, lat);
  }

  void main() {
    // find color in particle state square texture
    vec4 color = texture2D(u_particles, v_tex_pos);
    // convert color to x,y position, normalised between 0 and 1
    vec2 pos = vec2(color.r / 255.0 + color.b, color.g / 255.0 + color.a);
    // get width
    float x_domain = abs(u_map_mercator_bounds.x - u_map_mercator_bounds.z);
    // get height
    float y_domain = abs(u_map_mercator_bounds.y - u_map_mercator_bounds.w);
    // get [lng, lat]
    vec2 lngLat = getLngLat(x_domain, y_domain, pos);
    float lng = lngLat.x;
    float lat = lngLat.y;
    // get flow field pos, by normalising between 0 and 1
    vec2 vector_grid_pos = vec2(lng / 360.0, (lat + 90.0) / 180.0);
    // normalise velocity between -100 and 100 (e.g. [-91, 34])
    vec2 velocity = mix(u_vector_grid_min_speed, u_vector_grid_max_speed, getVelocityBicubic(vector_grid_pos));
    // get speed by dividing vector length, by max speed length
    float speed_t = length(velocity) / length(u_vector_grid_max_speed);
    // get offset (distance to move particle). we must flip y to account for differing coordinate systems
    vec2 offset = vec2(velocity.x, -velocity.y) * 0.0001 * u_speed_factor;
    // update pos with offset
    pos = fract(1.0 + pos + offset);
    vec2 seed = (pos + v_tex_pos) * u_random_seed;
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));
    vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
    // randomly reset position
    pos = mix(pos, random_pos, drop);
    gl_FragColor = vec4(fract(pos * 255.0), floor(pos * 255.0) / 255.0);
  }
`

interface RenderTextures {
  vectorFieldTexture: WebGLTexture
  backgroundTexture: WebGLTexture
  screenTexture: WebGLTexture
}

interface ParticleTextures {
  particleTextureSource: WebGLTexture
  particleTextureDestination: WebGLTexture
}

class ParticleRenderer {
  private readonly VECTOR_MAGNITUDE_RANGE = [-100, 100] as const
  private readonly PARTICLE_FADE_RATE = 0.985
  private readonly PARTICLE_SPEED_FACTOR = 0.3
  private readonly PARTICLE_DROP_RATE = 0.01
  private readonly PARTICLE_DROP_RATE_INCREASE = 0.05
  private readonly PARTICLE_COUNT = 10000

  private map: Map
  private gl: WebGL2RenderingContext
  private vectorFieldData?: VectorGrid
  private screenDrawProgram?: ProgramInfo
  private particlesDrawProgram?: ProgramInfo
  private particlesUpdateProgram?: ProgramInfo
  private renderTextures?: RenderTextures
  private particleTextures?: ParticleTextures
  private offscreenFramebuffer: WebGLFramebuffer | null = null
  private particleIndexArray?: Float32Array
  private particleTextureResolution = 0
  private animationState: 'PAUSED' | 'ANIMATING' = 'PAUSED'
  private mapViewportBounds: [number, number, number, number] = [0, 0, 0, 0]
  private animationFrameId = 0

  constructor(map: Map, gl: WebGL2RenderingContext) {
    this.map = map
    this.gl = gl
  }

  public initialize(vectorGrid: VectorGrid): void {
    this.vectorFieldData = vectorGrid
    this.screenDrawProgram = createProgramInfo(this.gl, [vQuad, fScreenDraw])
    this.particlesDrawProgram = createProgramInfo(this.gl, [vParticlesDraw, fParticlesDraw])
    this.particlesUpdateProgram = createProgramInfo(this.gl, [vQuad, fParticlesUpdate])
    this.initializeParticles()
    const emptyTextureData = new Uint8Array(this.gl.canvas.width * this.gl.canvas.height * 4)
    this.renderTextures = createTextures(this.gl, {
      vectorFieldTexture: {
        mag: this.gl.NEAREST,
        min: this.gl.NEAREST,
        width: this.vectorFieldData.image.width,
        height: this.vectorFieldData.image.height,
        format: this.gl.RGBA,
        src: this.vectorFieldData.image.data,
      },
      backgroundTexture: {
        mag: this.gl.NEAREST,
        min: this.gl.NEAREST,
        width: this.gl.canvas.width,
        height: this.gl.canvas.height,
        format: this.gl.RGBA,
        src: emptyTextureData,
        wrap: this.gl.CLAMP_TO_EDGE,
      },
      screenTexture: {
        mag: this.gl.NEAREST,
        min: this.gl.NEAREST,
        width: this.gl.canvas.width,
        height: this.gl.canvas.height,
        format: this.gl.RGBA,
        src: emptyTextureData,
        wrap: this.gl.CLAMP_TO_EDGE,
      },
    }) as unknown as RenderTextures
    this.offscreenFramebuffer = this.gl.createFramebuffer()
    this.startAnimation()
  }

  public updateVectorField(newVectorFieldImage: VectorGrid): void {
    if (!this.renderTextures) return console.error('Render textures not initialized')
    this.vectorFieldData = newVectorFieldImage
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures.vectorFieldTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.vectorFieldData.image.width,
      this.vectorFieldData.image.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.vectorFieldData.image.data,
    )
  }

  private initializeParticles(): void {
    this.particleTextureResolution = Math.ceil(Math.sqrt(this.PARTICLE_COUNT))
    const totalParticles = this.particleTextureResolution * this.particleTextureResolution
    const particleStateData = new Uint8Array(totalParticles * 4)
    for (let i = 0; i < particleStateData.length; i++) particleStateData[i] = Math.floor(Math.random() * 256)
    this.particleTextures = createTextures(this.gl, {
      particleTextureSource: {
        mag: this.gl.NEAREST,
        min: this.gl.NEAREST,
        width: this.particleTextureResolution,
        height: this.particleTextureResolution,
        format: this.gl.RGBA,
        src: particleStateData,
        wrap: this.gl.CLAMP_TO_EDGE,
      },
      particleTextureDestination: {
        mag: this.gl.NEAREST,
        min: this.gl.NEAREST,
        width: this.particleTextureResolution,
        height: this.particleTextureResolution,
        format: this.gl.RGBA,
        src: particleStateData,
        wrap: this.gl.CLAMP_TO_EDGE,
      },
    }) as unknown as ParticleTextures
    this.particleIndexArray = new Float32Array(totalParticles)
    for (let i = 0; i < totalParticles; i++) this.particleIndexArray[i] = i
  }

  private renderTextureToScreen(texture: WebGLTexture, opacity: number): void {
    if (!this.screenDrawProgram) return
    this.gl.useProgram(this.screenDrawProgram.program)
    const quadVertices = { a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) } }
    const renderUniforms = { u_screen: texture, u_opacity: opacity }
    const quadBufferInfo = createBufferInfoFromArrays(this.gl, quadVertices)
    setBuffersAndAttributes(this.gl, this.screenDrawProgram, quadBufferInfo)
    setUniforms(this.screenDrawProgram, renderUniforms)
    drawBufferInfo(this.gl, quadBufferInfo)
  }

  public draw(): void {
    if (
      this.animationState !== 'ANIMATING' ||
      !this.offscreenFramebuffer ||
      !this.renderTextures ||
      !this.particlesDrawProgram ||
      !this.particlesUpdateProgram ||
      !this.particleTextures ||
      !this.vectorFieldData
    )
      return

    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.disable(this.gl.STENCIL_TEST)

    // Render backgroundTexture to the screenTexture
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.offscreenFramebuffer)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.renderTextures.screenTexture, 0)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.disable(this.gl.BLEND)
    this.renderTextureToScreen(this.renderTextures.backgroundTexture, this.PARTICLE_FADE_RATE)

    // Render particles to screenTexture
    this.gl.useProgram(this.particlesDrawProgram.program)
    const particleAttributes = { a_particle_index: { numComponents: 1, data: this.particleIndexArray } }
    const particleBufferInfo = createBufferInfoFromArrays(this.gl, particleAttributes)
    const particleUniforms = {
      u_particles: this.particleTextures.particleTextureSource,
      u_particles_res: this.particleTextureResolution,
    }
    setBuffersAndAttributes(this.gl, this.particlesDrawProgram, particleBufferInfo)
    setUniforms(this.particlesDrawProgram, particleUniforms)
    drawBufferInfo(this.gl, particleBufferInfo, this.gl.POINTS)

    // Render screenTexture to screen
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    this.renderTextureToScreen(this.renderTextures.screenTexture, 1.0)
    this.gl.disable(this.gl.BLEND)
    ;[this.renderTextures.backgroundTexture, this.renderTextures.screenTexture] = [this.renderTextures.screenTexture, this.renderTextures.backgroundTexture]

    // Update particles
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.offscreenFramebuffer)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.particleTextures.particleTextureDestination, 0)
    this.gl.viewport(0, 0, this.particleTextureResolution, this.particleTextureResolution)
    this.gl.useProgram(this.particlesUpdateProgram.program)
    const quadVertices = { a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) } }
    const updateUniforms = {
      u_vector_grid: this.renderTextures.vectorFieldTexture,
      u_particles: this.particleTextures.particleTextureSource,
      u_vector_grid_min_speed: [this.vectorFieldData.metadata.minU, this.vectorFieldData.metadata.minV],
      u_vector_grid_max_speed: [this.vectorFieldData.metadata.maxU, this.vectorFieldData.metadata.maxV],
      u_random_seed: Math.random(),
      u_vector_grid_res: [this.vectorFieldData.image.width - 1, this.vectorFieldData.image.height - 1], // subtract 1 from height/width fix (why? needs investigating)
      u_speed_factor: this.PARTICLE_SPEED_FACTOR,
      u_drop_rate: this.PARTICLE_DROP_RATE,
      u_drop_rate_bump: this.PARTICLE_DROP_RATE_INCREASE,
      u_map_mercator_bounds: this.mapViewportBounds,
    }
    const quadBufferInfo = createBufferInfoFromArrays(this.gl, quadVertices)
    setBuffersAndAttributes(this.gl, this.particlesUpdateProgram, quadBufferInfo)
    setUniforms(this.particlesUpdateProgram, updateUniforms)
    drawBufferInfo(this.gl, quadBufferInfo)
    ;[this.particleTextures.particleTextureSource, this.particleTextures.particleTextureDestination] = [this.particleTextures.particleTextureDestination, this.particleTextures.particleTextureSource] // prettier-ignore
  }

  private animationFrame(): void {
    this.map.triggerRepaint()
    this.animationFrameId = requestAnimationFrame(() => this.animationFrame())
  }

  public startAnimation(): void {
    this.animationState = 'ANIMATING'
    this.updateMapBounds()
    this.animationFrame()
  }

  public stopAnimation(): void {
    this.animationState = 'PAUSED'
    this.clearParticles()
    cancelAnimationFrame(this.animationFrameId)
  }

  private updateMapBounds(): void {
    const mapBounds = this.map.getBounds()
    if (!mapBounds) throw new Error('Cannot get map bounds.')
    const northWest = mapBounds.getNorthWest()
    const southEast = mapBounds.getSouthEast()
    const northWestMercator = MercatorCoordinate.fromLngLat(northWest)
    const southEastMercator = MercatorCoordinate.fromLngLat(southEast)
    this.mapViewportBounds = [northWestMercator.x, southEastMercator.y, southEastMercator.x, northWestMercator.y]
  }

  private clearParticles(): void {
    if (!this.offscreenFramebuffer || !this.renderTextures) return
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.offscreenFramebuffer)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.renderTextures.screenTexture, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.renderTextures.backgroundTexture, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.initializeParticles()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public resizeTextures(): void {
    if (!this.renderTextures) return console.error('Render textures not initialized.')
    const emptyTextureData = new Uint8Array(this.gl.canvas.width * this.gl.canvas.height * 4)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures.backgroundTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.canvas.width,
      this.gl.canvas.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      emptyTextureData,
    )
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures.screenTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.canvas.width,
      this.gl.canvas.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      emptyTextureData,
    )
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
  }
}

export { ParticleRenderer }
