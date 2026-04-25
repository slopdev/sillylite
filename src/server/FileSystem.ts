import fs from "fs/promises";
import { createReadStream, ReadStream } from "fs";

export interface IFileSystem {
  mkdir(path: string, options?: { recursive?: boolean }): Promise<string | undefined>;
  readFile(path: string, options: { encoding: "utf-8" } | "utf-8"): Promise<string>;
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: string | Buffer): Promise<void>;
  readdir(path: string): Promise<string[]>;
  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  unlink(path: string): Promise<void>;
  access(path: string): Promise<void>;
  createReadStream(path: string): ReadStream;
}

/**
 * Standard Node.js implementation of the FileSystem interface.
 */
export class NodeFileSystem implements IFileSystem {
  async mkdir(path: string, options?: { recursive?: boolean }) {
    return await fs.mkdir(path, options);
  }
  async readFile(path: string, options?: any): Promise<any> {
    return await fs.readFile(path, options);
  }
  async writeFile(path: string, data: string | Buffer) {
    await fs.writeFile(path, data);
  }
  async readdir(path: string) {
    return await fs.readdir(path);
  }
  async rm(path: string, options?: { recursive?: boolean; force?: boolean }) {
    await fs.rm(path, options);
  }
  async unlink(path: string) { await fs.unlink(path); }
  async access(path: string) { await fs.access(path); }
  createReadStream(path: string) { return createReadStream(path); }
}