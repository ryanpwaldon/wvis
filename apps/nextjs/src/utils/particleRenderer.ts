import type { Map } from 'mapbox-gl'
import type { ProgramInfo } from 'twgl.js'
import { MercatorCoordinate } from 'mapbox-gl'
import { createBufferInfoFromArrays, createProgramInfo, createTextures, drawBufferInfo, setBuffersAndAttributes, setUniforms } from 'twgl.js'

// Returns all pixels
export const vQuad = /* glsl */ `
  precision highp float;
  attribute vec2 a_pos;
  varying vec2 v_tex_pos;
  void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
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
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);
    // a hack to guarantee opacity fade out even with a value close to 1.0
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
  }
`

// Returns particle pixels
export const vParticlesDraw = /* glsl */ `
  precision highp float;
  attribute float a_index;
  uniform sampler2D u_particles;
  uniform float u_particles_res;
  varying vec2 v_particle_pos;

  void main() {
    vec4 color = texture2D(u_particles, vec2(fract(a_index / u_particles_res), floor(a_index / u_particles_res) / u_particles_res));
    v_particle_pos = vec2(color.r / 255.0 + color.b, color.g / 255.0 + color.a);
    gl_PointSize = 2.0;
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
  }
`

// Receives particle pixels
// Draws all particles
export const fParticlesDraw = /* glsl */ `
  precision highp float;
  uniform sampler2D u_vector;
  uniform vec2 u_vector_min;
  uniform vec2 u_vector_max;
  uniform vec4 u_bounds;
  uniform vec4 u_data_bounds;
  varying vec2 v_particle_pos;

  vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;
    float lon = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat = 90.0 - (360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654/180.0)));
    return vec2(lon, lat);
  }

  void main() {
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 coordinate = returnLonLat(x_domain, y_domain, v_particle_pos);
    float lon = coordinate.x;
    float lat = coordinate.y;
    if (lat > u_data_bounds.w || lat < u_data_bounds.y || lon > u_data_bounds.z || lon < u_data_bounds.x) {
      discard;
    }
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.33);
  }
`

// Receives all pixels
// Draws every pixel
export const fParticlesUpdate = /* glsl */ `
  precision highp float;
  uniform sampler2D u_particles;
  uniform sampler2D u_vector;
  uniform vec2 u_vector_res;
  uniform vec2 u_vector_min;
  uniform vec2 u_vector_max;
  uniform float u_rand_seed;
  uniform float u_speed_factor;
  uniform float u_drop_rate;
  uniform float u_drop_rate_bump;
  uniform vec4 u_bounds;
  uniform vec4 u_data_bounds;
  varying vec2 v_tex_pos;

  const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
  float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
  }

  vec2 lookup_vector(const vec2 uv) {
    vec2 px = 1.0 / u_vector_res;
    vec2 vc = (floor(uv * u_vector_res)) * px;
    vec2 f = fract(uv * u_vector_res);
    vec2 tl = texture2D(u_vector, vc).rg;
    vec2 tr = texture2D(u_vector, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_vector, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_vector, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
  }

  vec2 returnLonLat(float x_domain, float y_domain, vec2 pos) {
    float mercator_x = fract(u_bounds.x + pos.x * x_domain);
    float mercator_y = u_bounds.w + pos.y * y_domain;
    float lon = mercator_x * 360.0 - 180.0;
    float lat2 = 180.0 - mercator_y * 360.0;
    float lat = 90.0 - (360.0 / 3.141592654 * atan(exp(lat2 * 3.141592654/180.0)));
    return vec2(lon, lat);
  }

  void main() {
    vec4 color = texture2D(u_particles, v_tex_pos);
    vec2 pos = vec2(color.r / 255.0 + color.b, color.g / 255.0 + color.a);
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 coordinate = returnLonLat(x_domain, y_domain, pos);
    float lon = coordinate.x;
    float lat = coordinate.y;
    float lon_domain = u_data_bounds.z - u_data_bounds.x;
    float lat_domain = u_data_bounds.w - u_data_bounds.y;
    vec2 pos_lookup = vec2((lon - u_data_bounds.x) / lon_domain, (lat - u_data_bounds.y) / lat_domain);
    vec2 velocity = mix(u_vector_min, u_vector_max, lookup_vector(pos_lookup));
    float speed_t = length(velocity) / length(u_vector_max);
    vec2 offset = vec2(velocity.x, -velocity.y) * 0.0001 * u_speed_factor;
    pos = fract(1.0 + pos + offset);
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));
    vec2 random_pos = vec2(rand(seed + 1.3), rand(seed + 2.1));
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
  private readonly LONGITUDE_LATITUDE_BOUNDS = [-180, -90, 180, 90] as const
  private readonly VECTOR_MAGNITUDE_RANGE = [-100, 100] as const
  private readonly PARTICLE_FADE_RATE = 0.985
  private readonly PARTICLE_SPEED_FACTOR = 0.3
  private readonly PARTICLE_DROP_RATE = 0.01
  private readonly PARTICLE_DROP_RATE_INCREASE = 0.05
  private readonly PARTICLE_COUNT = 10000

  private map: Map
  private gl: WebGL2RenderingContext
  private vectorFieldData?: ImageData
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

  public initialize(vectorFieldImage: ImageData): void {
    this.vectorFieldData = vectorFieldImage
    this.screenDrawProgram = createProgramInfo(this.gl, [vQuad, fScreenDraw])
    this.particlesDrawProgram = createProgramInfo(this.gl, [vParticlesDraw, fParticlesDraw])
    this.particlesUpdateProgram = createProgramInfo(this.gl, [vQuad, fParticlesUpdate])
    this.initializeParticles()
    const emptyTextureData = new Uint8Array(this.gl.canvas.width * this.gl.canvas.height * 4)
    this.renderTextures = createTextures(this.gl, {
      vectorFieldTexture: {
        mag: this.gl.LINEAR,
        min: this.gl.LINEAR,
        width: this.vectorFieldData.width,
        height: this.vectorFieldData.height,
        format: this.gl.RGBA,
        src: this.vectorFieldData.data,
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

  public updateVectorField(newVectorFieldImage: ImageData): void {
    if (!this.renderTextures) return console.error('Render textures not initialized')
    this.vectorFieldData = newVectorFieldImage
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures.vectorFieldTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.vectorFieldData.width,
      this.vectorFieldData.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.vectorFieldData.data,
    )
    this.clearParticles()
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
    const particleAttributes = { a_index: { numComponents: 1, data: this.particleIndexArray } }
    const particleBufferInfo = createBufferInfoFromArrays(this.gl, particleAttributes)
    const particleUniforms = {
      u_vector: this.renderTextures.vectorFieldTexture,
      u_particles: this.particleTextures.particleTextureSource,
      u_particles_res: this.particleTextureResolution,
      u_vector_min: [this.VECTOR_MAGNITUDE_RANGE[0], this.VECTOR_MAGNITUDE_RANGE[0]],
      u_vector_max: [this.VECTOR_MAGNITUDE_RANGE[1], this.VECTOR_MAGNITUDE_RANGE[1]],
      u_bounds: this.mapViewportBounds,
      u_data_bounds: this.LONGITUDE_LATITUDE_BOUNDS,
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
      u_vector: this.renderTextures.vectorFieldTexture,
      u_particles: this.particleTextures.particleTextureSource,
      u_vector_min: [this.VECTOR_MAGNITUDE_RANGE[0], this.VECTOR_MAGNITUDE_RANGE[0]],
      u_vector_max: [this.VECTOR_MAGNITUDE_RANGE[1], this.VECTOR_MAGNITUDE_RANGE[1]],
      u_rand_seed: Math.random(),
      u_vector_res: [this.vectorFieldData.width, this.vectorFieldData.height],
      u_speed_factor: this.PARTICLE_SPEED_FACTOR,
      u_drop_rate: this.PARTICLE_DROP_RATE,
      u_drop_rate_bump: this.PARTICLE_DROP_RATE_INCREASE,
      u_bounds: this.mapViewportBounds,
      u_data_bounds: this.LONGITUDE_LATITUDE_BOUNDS,
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
}

export { ParticleRenderer }
