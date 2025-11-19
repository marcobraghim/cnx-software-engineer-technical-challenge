import { Storage } from "@google-cloud/storage";
import { join } from "path";

export class GcpStorageService {

  private storage: Storage;
  private bucket: string;

  constructor(projectId: string, bucketName: string) {
    this.bucket = bucketName;

    this.storage = new Storage({
      projectId: projectId.toString(),
      keyFilename: join(__dirname, '../../credentials/gcp-credentials.json'),
    });
  }

  async uploadFile(fileName: string, fileContent: Buffer | string, contentType: string = 'application/octet-stream') {
    const bucketInstance = this.storage.bucket(this.bucket.toString());
    const bucketFile = bucketInstance.file(fileName);
    const contentBuffer = typeof fileContent === 'string' ? Buffer.from(fileContent) : fileContent;
    await bucketFile.save(contentBuffer, { contentType });
  }

  async uploadJsonFile(fileName: string, fileContent: Buffer | string) {
    return await this.uploadFile(fileName, fileContent, 'application/json');
  }
}