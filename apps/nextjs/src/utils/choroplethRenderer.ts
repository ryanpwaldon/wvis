import type { Map } from 'mapbox-gl'
import type { ProgramInfo } from 'twgl.js'
import { rgb } from 'd3-color'
import { interpolateTurbo } from 'd3-scale-chromatic'
import { MercatorCoordinate } from 'mapbox-gl'
import { createBufferInfoFromArrays, createProgramInfo, createTexture, drawBufferInfo, setBuffersAndAttributes, setUniforms } from 'twgl.js'

import { ChoroplethCombinationMode } from '@sctv/shared'

import type { VectorGrid } from '~/hooks/useVectorGrid'

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
  uniform sampler2D u_color_ramp;
  uniform sampler2D u_vector_grid;
  uniform float u_color_ramp_max_mag;
  uniform vec2 u_vector_grid_res;
  uniform vec2 u_vector_grid_min_mag;
  uniform vec2 u_vector_grid_max_mag;
  uniform int u_vector_grid_combination_mode;
  uniform vec4 u_map_mercator_bounds;
  varying vec2 v_tex_pos;

  vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);
  }

  float getMagnitudeBicubicCancellation(vec2 uv) {
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
    vec2 velocity = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, row0 * y.x + row1 * y.y + row2 * y.z + row3 * y.w);
    return length(velocity) / u_color_ramp_max_mag;
  }

  float getMagnitudeBicubicPreservation(vec2 uv) {
    vec2 px = 1.0 / u_vector_grid_res;
    vec2 vc = floor(uv * u_vector_grid_res) * px;
    vec2 f = fract(uv * u_vector_grid_res);
    vec4 x = cubic(f.x);
    vec4 y = cubic(f.y);
    vec2 c00 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(-px.x, -px.y)).rg);
    vec2 c10 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(0.0, -px.y)).rg);
    vec2 c20 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(px.x, -px.y)).rg);
    vec2 c30 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(2.0 * px.x, -px.y)).rg);
    vec2 c01 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(-px.x, 0.0)).rg);
    vec2 c11 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(0.0, 0.0)).rg);
    vec2 c21 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(px.x, 0.0)).rg);
    vec2 c31 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(2.0 * px.x, 0.0)).rg);
    vec2 c02 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(-px.x, px.y)).rg);
    vec2 c12 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(0.0, px.y)).rg);
    vec2 c22 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(px.x, px.y)).rg);
    vec2 c32 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(2.0 * px.x, px.y)).rg);
    vec2 c03 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(-px.x, 2.0 * px.y)).rg);
    vec2 c13 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(0.0, 2.0 * px.y)).rg);
    vec2 c23 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(px.x, 2.0 * px.y)).rg);
    vec2 c33 = mix(u_vector_grid_min_mag, u_vector_grid_max_mag, texture2D(u_vector_grid, vc + vec2(2.0 * px.x, 2.0 * px.y)).rg);
    float m00 = length(c00);
    float m10 = length(c10);
    float m20 = length(c20);
    float m30 = length(c30);
    float m01 = length(c01);
    float m11 = length(c11);
    float m21 = length(c21);
    float m31 = length(c31);
    float m02 = length(c02);
    float m12 = length(c12);
    float m22 = length(c22);
    float m32 = length(c32);
    float m03 = length(c03);
    float m13 = length(c13);
    float m23 = length(c23);
    float m33 = length(c33);
    float row0 = m00 * x.x + m10 * x.y + m20 * x.z + m30 * x.w;
    float row1 = m01 * x.x + m11 * x.y + m21 * x.z + m31 * x.w;
    float row2 = m02 * x.x + m12 * x.y + m22 * x.z + m32 * x.w;
    float row3 = m03 * x.x + m13 * x.y + m23 * x.z + m33 * x.w;
    float magnitude = row0 * y.x + row1 * y.y + row2 * y.z + row3 * y.w;
    return magnitude / u_color_ramp_max_mag;
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
    vec2 vector_grid_pos = vec2(lng / 360.0, (lat + 90.0) / 180.0);
    float magnitude;
    if (u_vector_grid_combination_mode == ${ChoroplethCombinationMode.Cancellation}) {
      magnitude = getMagnitudeBicubicCancellation(vector_grid_pos);
    } else if (u_vector_grid_combination_mode == ${ChoroplethCombinationMode.Preservation}) {
      magnitude = getMagnitudeBicubicPreservation(vector_grid_pos);
    }
    vec4 color = texture2D(u_color_ramp, vec2(magnitude, 0.5));
    gl_FragColor = vec4(color.rgb, 0.7);
  }
`

export class ChoroplethRenderer {
  private map: Map
  private gl: WebGL2RenderingContext
  private vectorGrid?: VectorGrid
  private colorRampTexture: WebGLTexture
  private vectorGridTexture: WebGLTexture
  private choroplethDrawProgram: ProgramInfo
  private mapMercatorBounds: [number, number, number, number] = [0, 0, 0, 0]

  constructor(map: Map, gl: WebGL2RenderingContext) {
    this.map = map
    this.gl = gl
    this.choroplethDrawProgram = createProgramInfo(this.gl, [vs, fs])
    this.vectorGridTexture = createTexture(this.gl, {
      width: 1,
      height: 1,
      mag: this.gl.NEAREST,
      min: this.gl.NEAREST,
      wrapS: this.gl.REPEAT,
      wrapT: this.gl.CLAMP_TO_EDGE,
    })
    this.colorRampTexture = this.createColorRampTexture()
  }

  private createColorRampTexture() {
    const size = 256
    const pixels = new Uint8Array(size * 4)
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1)
      const color = rgb(interpolateTurbo(t))
      pixels[i * 4] = color.r
      pixels[i * 4 + 1] = color.g
      pixels[i * 4 + 2] = color.b
      pixels[i * 4 + 3] = 255
    }
    return createTexture(this.gl, { src: pixels, width: size, height: 1, mag: this.gl.NEAREST, min: this.gl.NEAREST, wrap: this.gl.CLAMP_TO_EDGE })
  }

  public setVectorGrid(vectorGrid: VectorGrid) {
    const { width, height, data } = vectorGrid.image
    const { width: currWidth, height: currHeight } = this.vectorGrid?.image ?? { width: null, height: null }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.vectorGridTexture)
    if (currWidth === width && currHeight === height) {
      this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data)
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data)
    }
    this.vectorGrid = vectorGrid
  }

  public updateMapBounds() {
    const mapGeoBounds = this.map.getBounds()
    if (!mapGeoBounds) throw new Error('Cannot get map bounds.')
    const northWestMercator = MercatorCoordinate.fromLngLat(mapGeoBounds.getNorthWest())
    const southEastMercator = MercatorCoordinate.fromLngLat(mapGeoBounds.getSouthEast())
    this.mapMercatorBounds = [northWestMercator.x, southEastMercator.y, southEastMercator.x, northWestMercator.y]
  }

  public draw() {
    if (!this.vectorGrid) return
    this.gl.enable(this.gl.BLEND)
    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.disable(this.gl.STENCIL_TEST)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.useProgram(this.choroplethDrawProgram.program)
    const choroplethQuadBufferInfo = createBufferInfoFromArrays(this.gl, { a_pos: { numComponents: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) } }) // prettier-ignore
    setBuffersAndAttributes(this.gl, this.choroplethDrawProgram, choroplethQuadBufferInfo)
    setUniforms(this.choroplethDrawProgram, {
      u_color_ramp: this.colorRampTexture,
      u_vector_grid: this.vectorGridTexture,
      u_vector_grid_combination_mode: this.vectorGrid.config.choropleth.combinationMode,
      u_vector_grid_res: [this.vectorGrid.image.width - 1, this.vectorGrid.image.height - 1], // subtract 1 from height/width fix (why? needs investigating)
      u_vector_grid_min_mag: [this.vectorGrid.metadata.minU, this.vectorGrid.metadata.minV],
      u_vector_grid_max_mag: [this.vectorGrid.metadata.maxU, this.vectorGrid.metadata.maxV],
      u_color_ramp_max_mag: this.vectorGrid.config.magMax,
      u_map_mercator_bounds: this.mapMercatorBounds,
    })
    drawBufferInfo(this.gl, choroplethQuadBufferInfo)
  }
}
