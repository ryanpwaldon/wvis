import type { Map } from 'mapbox-gl'
import type { ProgramInfo } from 'twgl.js'
import { MercatorCoordinate } from 'mapbox-gl'
import { createBufferInfoFromArrays, createProgramInfo, createTexture, drawBufferInfo, setBuffersAndAttributes, setUniforms } from 'twgl.js'

// Returns all pixels
export const vs = /* glsl */ `
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
export const fs = /* glsl */ `
  precision highp float;
  uniform sampler2D u_vector;
  uniform vec2 u_vector_res;
  uniform vec2 u_vector_min;
  uniform vec2 u_vector_max;
  uniform vec4 u_bounds;
  uniform vec4 u_data_bounds;
  varying vec2 v_tex_pos;

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
    float x_domain = abs(u_bounds.x - u_bounds.z);
    float y_domain = abs(u_bounds.y - u_bounds.w);
    vec2 coordinate = returnLonLat(x_domain, y_domain, v_tex_pos);
    float lon = coordinate.x;
    float lat = coordinate.y;
    float lon_domain = u_data_bounds.z - u_data_bounds.x;
    float lat_domain = u_data_bounds.w - u_data_bounds.y;
    vec2 pos_lookup = vec2((lon - u_data_bounds.x) / lon_domain, (lat - u_data_bounds.y) / lat_domain);
    vec2 velocity = mix(u_vector_min, u_vector_max, lookup_vector(pos_lookup));
    float speed_t = length(velocity) / length(u_vector_max);
    gl_FragColor = vec4(1.0, 1.0, 1.0, speed_t);
  }
`

export class ChoroplethRenderer {
  private readonly VECTOR_MAGNITUDE_RANGE = [-100, 100] as const
  private readonly LONGITUDE_LATITUDE_BOUNDS = [-180, -90, 180, 90] as const

  private map: Map
  private gl: WebGL2RenderingContext
  private vectorFieldData?: ImageData
  private vectorFieldTexture?: WebGLTexture
  private choroplethDrawProgram?: ProgramInfo
  private mapViewportBounds: [number, number, number, number] = [0, 0, 0, 0]
  private animationState: 'ANIMATING' | 'PAUSED' = 'PAUSED'

  constructor(map: Map, gl: WebGL2RenderingContext) {
    this.map = map
    this.gl = gl
  }

  public initialize(vectorFieldImage: ImageData): void {
    this.vectorFieldData = vectorFieldImage
    this.choroplethDrawProgram = createProgramInfo(this.gl, [vs, fs])
    this.vectorFieldTexture = createTexture(this.gl, {
      mag: this.gl.LINEAR,
      min: this.gl.LINEAR,
      width: this.vectorFieldData.width,
      height: this.vectorFieldData.height,
      format: this.gl.RGBA,
      src: this.vectorFieldData.data,
    })
  }

  public updateVectorField(data: ImageData): void {
    if (!this.vectorFieldTexture) return console.error('Vector field texture not initialized.')
    this.vectorFieldData = data
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.vectorFieldTexture)
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
    this.startAnimation()
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

  public startAnimation(): void {
    this.updateMapBounds()
    this.animationState = 'ANIMATING'
  }

  public stopAnimation(): void {
    this.animationState = 'PAUSED'
  }

  public draw(): void {
    if (this.animationState !== 'ANIMATING' || !this.choroplethDrawProgram || !this.vectorFieldData) return
    this.gl.enable(this.gl.BLEND)
    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.disable(this.gl.STENCIL_TEST)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.useProgram(this.choroplethDrawProgram.program)
    const choroplethQuadBufferInfo = createBufferInfoFromArrays(this.gl, {
      a_pos: {
        numComponents: 2,
        data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      },
    })
    setBuffersAndAttributes(this.gl, this.choroplethDrawProgram, choroplethQuadBufferInfo)
    setUniforms(this.choroplethDrawProgram, {
      u_vector: this.vectorFieldTexture,
      u_vector_min: [this.VECTOR_MAGNITUDE_RANGE[0], this.VECTOR_MAGNITUDE_RANGE[0]],
      u_vector_max: [this.VECTOR_MAGNITUDE_RANGE[1], this.VECTOR_MAGNITUDE_RANGE[1]],
      u_vector_res: [this.vectorFieldData.width, this.vectorFieldData.height],
      u_bounds: this.mapViewportBounds,
      u_data_bounds: this.LONGITUDE_LATITUDE_BOUNDS,
    })
    drawBufferInfo(this.gl, choroplethQuadBufferInfo)
  }
}
