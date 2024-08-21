import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import type { JobInfo } from '../validators'
import { CLOUDFLARE_R2_BUCKET_NAME } from '../constants'
import { env } from '../env'
import { jobInfoSchema } from '../validators'

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
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
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

  async getLatestJobInfo(dir: string) {
    try {
      const command = new GetObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET_NAME, Key: `${dir}/jobInfo.json` })
      const response = await this.S3.send(command)
      if (!response.Body) throw new Error('No body in the response.')
      const responseText = await response.Body.transformToString()
      return jobInfoSchema.parse(responseText)
    } catch (error) {
      if (error instanceof NoSuchKey) return null
      console.error('Error fetching latest job info:', error)
      throw error
    }
  }

  async updateJobInfo(dir: string, jobInfo: JobInfo) {
    try {
      const validJobInfo = jobInfoSchema.parse(jobInfo)
      const jobInfoString = JSON.stringify(validJobInfo)

      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: `${dir}/jobInfo.json`,
        Body: jobInfoString,
        ContentType: 'application/json',
      })

      await this.S3.send(command)
      console.log('Job info updated successfully:', `${dir}/jobInfo.json`)
    } catch (error) {
      console.error('Error updating job info:', error)
      throw error
    }
  }
}

export const storageService = new StorageService()
