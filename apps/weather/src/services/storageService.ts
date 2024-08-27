import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { CLOUDFLARE_BUCKET_NAME } from '@sctv/constants'

import { env } from '../env'

class StorageService {
  private S3: S3Client

  constructor() {
    this.S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    })
  }

  async uploadImage(buffer: Buffer, dir: string, name: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_BUCKET_NAME,
        Key: `${dir}/${name}`,
        Body: buffer,
        ContentType: 'image/png',
      })
      await this.S3.send(command)
      console.log('Image uploaded successfully:', name)
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  async getJson(key: string) {
    try {
      const command = new GetObjectCommand({ Bucket: CLOUDFLARE_BUCKET_NAME, Key: key })
      const response = await this.S3.send(command)
      if (!response.Body) throw new Error('No body in the response.')
      const text = await response.Body.transformToString()
      return JSON.parse(text) as unknown
    } catch (error) {
      if (error instanceof NoSuchKey) return null
      console.error(`Error fetching file ${key}:`, error)
      throw error
    }
  }

  async putJson(key: string, json: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_BUCKET_NAME,
        Key: key,
        Body: json,
        ContentType: 'application/json',
      })
      await this.S3.send(command)
    } catch (error) {
      console.error('Error updating json:', error)
      throw error
    }
  }
}

export const storageService = new StorageService()
