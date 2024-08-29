import type { Map } from 'mapbox-gl'
import type { ProgramInfo } from 'twgl.js'
import { MercatorCoordinate } from 'mapbox-gl'
import { createBufferInfoFromArrays, createProgramInfo, createTexture, drawBufferInfo, setBuffersAndAttributes, setUniforms } from 'twgl.js'

export const vs = /* glsl */ `
  precision highp float;
  attribute vec2 a_pos;
  varying vec2 v_tex_pos;
  void main() {
    v_tex_pos = vec2(1.0 - a_pos.x, a_pos.y);
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
  }
`

export const fs = /* glsl */ `
  precision highp float;
  uniform sampler2D u_flow_field;
  uniform vec2 u_flow_field_res;
  uniform vec2 u_flow_field_min_speed;
  uniform vec2 u_flow_field_max_speed;
  uniform vec4 u_map_mercator_bounds;
  varying vec2 v_tex_pos;

  vec2 getVelocity(const vec2 uv) {
    vec2 px = 1.0 / u_flow_field_res;
    vec2 vc = (floor(uv * u_flow_field_res)) * px;
    vec2 f = fract(uv * u_flow_field_res);
    vec2 tl = texture2D(u_flow_field, vc).rg;
    vec2 tr = texture2D(u_flow_field, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_flow_field, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_flow_field, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
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
    float x_domain = abs(u_map_mercator_bounds.x - u_map_mercator_bounds.z);
    float y_domain = abs(u_map_mercator_bounds.y - u_map_mercator_bounds.w);
    vec2 lngLat = getLngLat(x_domain, y_domain, v_tex_pos);
    float lng = lngLat.x;
    float lat = lngLat.y;
    vec2 flow_field_pos = vec2(lng / 360.0, (lat + 90.0) / 180.0);
    vec2 velocity = mix(u_flow_field_min_speed, u_flow_field_max_speed, getVelocity(flow_field_pos));
    float speed_t = length(velocity) / length(u_flow_field_max_speed);
    gl_FragColor = vec4(1.0, 1.0, 1.0, speed_t);
  }
`

export class ChoroplethRenderer {
  private readonly VECTOR_MAGNITUDE_RANGE = [-200, 200] as const

  private map: Map
  private gl: WebGL2RenderingContext
  private flowFieldData?: ImageData
  private flowFieldTexture: WebGLTexture
  private choroplethDrawProgram: ProgramInfo
  private mapMercatorBounds: [number, number, number, number] = [0, 0, 0, 0]

  constructor(map: Map, gl: WebGL2RenderingContext) {
    this.map = map
    this.gl = gl
    this.choroplethDrawProgram = createProgramInfo(this.gl, [vs, fs])
    this.flowFieldTexture = createTexture(this.gl, { mag: this.gl.LINEAR, min: this.gl.LINEAR, width: 1, height: 1 })
  }

  public setFlowField(data: ImageData) {
    this.flowFieldData = data
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.flowFieldTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.flowFieldData.width,
      this.flowFieldData.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.flowFieldData.data,
    )
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
  }

  public updateMapBounds() {
    const mapGeoBounds = this.map.getBounds()
    if (!mapGeoBounds) throw new Error('Cannot get map bounds.')
    const northWestMercator = MercatorCoordinate.fromLngLat(mapGeoBounds.getNorthWest())
    const southEastMercator = MercatorCoordinate.fromLngLat(mapGeoBounds.getSouthEast())
    this.mapMercatorBounds = [northWestMercator.x, southEastMercator.y, southEastMercator.x, northWestMercator.y]
  }

  public draw() {
    if (!this.flowFieldData) return
    this.gl.enable(this.gl.BLEND)
    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.disable(this.gl.STENCIL_TEST)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.useProgram(this.choroplethDrawProgram.program)
    const choroplethQuadBufferInfo = createBufferInfoFromArrays(this.gl, { a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) } }) // prettier-ignore
    setBuffersAndAttributes(this.gl, this.choroplethDrawProgram, choroplethQuadBufferInfo)
    setUniforms(this.choroplethDrawProgram, {
      u_flow_field: this.flowFieldTexture,
      u_flow_field_min_speed: [this.VECTOR_MAGNITUDE_RANGE[0], this.VECTOR_MAGNITUDE_RANGE[0]],
      u_flow_field_max_speed: [this.VECTOR_MAGNITUDE_RANGE[1], this.VECTOR_MAGNITUDE_RANGE[1]],
      u_flow_field_res: [this.flowFieldData.width, this.flowFieldData.height],
      u_map_mercator_bounds: this.mapMercatorBounds,
    })
    drawBufferInfo(this.gl, choroplethQuadBufferInfo)
  }
}
