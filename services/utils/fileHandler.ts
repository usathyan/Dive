import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import logger from "./logger.js";

const PROJECT_ROOT = process.cwd();

export const SUPPORTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
];
export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".rtf",
  ".odt",
  ".html",
  ".csv",
  ".epub",
];

export function multerDestination(
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, destination: string) => void
) {
  const uploadDir = path.join(PROJECT_ROOT, "uploads");
  fs.mkdir(uploadDir, { recursive: true })
    .then(() => cb(null, uploadDir))
    .catch((err) => cb(err, uploadDir));
}

export function multerFilename(
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void
) {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  cb(null, uniqueSuffix + path.extname(file.originalname));
}

export async function handleUploadFiles({
  files,
  filepaths,
}: {
  files: Express.Multer.File[];
  filepaths: string[];
}) {
  const documents: string[] = [];
  const images: string[] = [];

  for (const file of files) {
    const hash = await calculateFileHash(file.path);

    // 檢查是否已存在相同hash前綴的檔案
    const uploadDir = path.join(PROJECT_ROOT, "uploads");
    const files = await fs.readdir(uploadDir);
    const existingFile = files.find((f) => f.startsWith(hash));
    if (existingFile) {
      // 如果找到相同hash的檔案,使用該檔案
      file.filename = existingFile;
      await fs.unlink(file.path); // 刪除新上傳的檔案
      file.path = path.join(uploadDir, existingFile);
    } else {
      const newFileName = `${hash}-${file.originalname}`;
      const newPath = path.join(PROJECT_ROOT, "uploads", newFileName);
      // 重命名檔案
      await fs.rename(file.path, newPath);
      file.filename = newFileName; // 更新檔案名稱
    }

    const ext = path.extname(file.filename).toLowerCase();
    if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
      images.push(`uploads/${file.filename}`);
    } else if (SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext)) {
      documents.push(`uploads/${file.filename}`);
    } else {
      logger.error(`Unsupported file type: ${file.filename}`);
    }
  }

  for (const filepath of filepaths) {
    const ext = path.extname(filepath).toLowerCase();
    if(SUPPORTED_IMAGE_EXTENSIONS.includes(ext)){
      images.push(filepath);
    } else if (SUPPORTED_DOCUMENT_EXTENSIONS.includes(ext)) {
      documents.push(filepath);
    } else {
      logger.error(`Unsupported file type: ${filepath}`);
    }
  }

  return { images, documents };
}

async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("md5").update(fileBuffer).digest("hex").slice(0, 12);
}
