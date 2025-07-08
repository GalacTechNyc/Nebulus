/**
 * File System Security Controls
 * Provides secure file access validation and sandboxing
 */

import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface FileSystemConfig {
  allowedDirectories: string[];
  blockedDirectories: string[];
  allowedExtensions: string[];
  blockedExtensions: string[];
  maxFileSize: number;
  maxFilesPerOperation: number;
}

/**
 * Default secure file system configuration
 */
export const DEFAULT_FILESYSTEM_CONFIG: FileSystemConfig = {
  allowedDirectories: [
    app.getPath('documents'),
    app.getPath('desktop'),
    app.getPath('downloads'),
    path.join(app.getPath('home'), 'Projects'),
    path.join(app.getPath('home'), 'Development'),
  ],
  blockedDirectories: [
    app.getPath('appData'),
    '/System',
    '/Windows',
    '/etc',
    '/usr/bin',
    '/bin',
    path.join(app.getPath('home'), '.ssh'),
    path.join(app.getPath('home'), '.aws'),
  ],
  allowedExtensions: [
    // Code files
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
    '.css', '.scss', '.sass', '.less', '.html', '.xml', '.json', '.yaml', '.yml',
    '.md', '.txt', '.csv', '.sql', '.sh', '.bat', '.ps1',
    // Config files
    '.config', '.conf', '.ini', '.env', '.gitignore', '.dockerignore',
    // Documentation
    '.pdf', '.doc', '.docx', '.rtf',
    // Images (for web development)
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  ],
  blockedExtensions: [
    // Executables
    '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm',
    '.app', '.scr', '.com', '.pif', '.cmd',
    // Scripts that could be dangerous
    '.vbs', '.js', '.jse', '.wsf', '.wsh',
    // System files
    '.sys', '.dll', '.so', '.dylib',
    // Archives (could contain malicious files)
    '.zip', '.rar', '.7z', '.tar', '.gz',
  ],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFilesPerOperation: 100,
};

/**
 * Normalize and resolve file path
 */
export const normalizePath = (filePath: string): string => {
  return path.resolve(path.normalize(filePath));
};

/**
 * Check if path is within allowed directories
 */
export const isPathAllowed = (
  filePath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): boolean => {
  const normalizedPath = normalizePath(filePath);
  
  // Check against blocked directories first
  for (const blockedDir of config.blockedDirectories) {
    const normalizedBlockedDir = normalizePath(blockedDir);
    if (normalizedPath.startsWith(normalizedBlockedDir)) {
      return false;
    }
  }
  
  // Check against allowed directories
  for (const allowedDir of config.allowedDirectories) {
    const normalizedAllowedDir = normalizePath(allowedDir);
    if (normalizedPath.startsWith(normalizedAllowedDir)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if file extension is allowed
 */
export const isExtensionAllowed = (
  filePath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): boolean => {
  const ext = path.extname(filePath).toLowerCase();
  
  // Check blocked extensions first
  if (config.blockedExtensions.includes(ext)) {
    return false;
  }
  
  // If no extension, allow (for directories and files without extensions)
  if (!ext) {
    return true;
  }
  
  // Check allowed extensions
  return config.allowedExtensions.includes(ext);
};

/**
 * Validate file size
 */
export const isFileSizeAllowed = async (
  filePath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): Promise<boolean> => {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size <= config.maxFileSize;
  } catch (error) {
    // If file doesn't exist or can't be accessed, consider it valid for creation
    return true;
  }
};

/**
 * Sanitize file name to prevent directory traversal and invalid characters
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
};

/**
 * Comprehensive file path validation
 */
export const validateFilePath = async (
  filePath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // Basic path validation
  if (!filePath || typeof filePath !== 'string') {
    errors.push('Invalid file path provided');
    return { valid: false, errors };
  }
  
  // Check for path traversal attempts
  if (filePath.includes('..')) {
    errors.push('Path traversal detected');
  }
  
  // Check if path is allowed
  if (!isPathAllowed(filePath, config)) {
    errors.push('File path is not in allowed directory');
  }
  
  // Check file extension
  if (!isExtensionAllowed(filePath, config)) {
    errors.push('File extension is not allowed');
  }
  
  // Check file size (if file exists)
  if (await fs.promises.access(filePath, fs.constants.F_OK).then(() => true).catch(() => false)) {
    if (!(await isFileSizeAllowed(filePath, config))) {
      errors.push('File size exceeds maximum allowed size');
    }
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Secure file read operation
 */
export const secureFileRead = async (
  filePath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): Promise<string> => {
  const validation = await validateFilePath(filePath, config);
  
  if (!validation.valid) {
    throw new Error(`File access denied: ${validation.errors.join(', ')}`);
  }
  
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // Log successful file access
    console.log(`Secure file read: ${filePath}`);
    
    return content;
  } catch (error) {
    console.error(`Failed to read file: ${filePath}`, error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

/**
 * Secure file write operation
 */
export const secureFileWrite = async (
  filePath: string,
  content: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): Promise<void> => {
  const validation = await validateFilePath(filePath, config);
  
  if (!validation.valid) {
    throw new Error(`File access denied: ${validation.errors.join(', ')}`);
  }
  
  // Validate content size
  if (Buffer.byteLength(content, 'utf-8') > config.maxFileSize) {
    throw new Error('Content size exceeds maximum allowed size');
  }
  
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.promises.writeFile(filePath, content, 'utf-8');
    
    // Log successful file write
    console.log(`Secure file write: ${filePath}`);
  } catch (error) {
    console.error(`Failed to write file: ${filePath}`, error);
    throw new Error(`Failed to write file: ${error.message}`);
  }
};

/**
 * Secure file delete operation
 */
export const secureFileDelete = async (
  filePath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG
): Promise<void> => {
  const validation = await validateFilePath(filePath, config);
  
  if (!validation.valid) {
    throw new Error(`File access denied: ${validation.errors.join(', ')}`);
  }
  
  try {
    await fs.promises.unlink(filePath);
    
    // Log successful file deletion
    console.log(`Secure file delete: ${filePath}`);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get secure project structure (filtered for allowed files)
 */
export const getSecureProjectStructure = async (
  projectPath: string,
  config: FileSystemConfig = DEFAULT_FILESYSTEM_CONFIG,
  maxDepth: number = 5
): Promise<any> => {
  const validation = await validateFilePath(projectPath, config);
  
  if (!validation.valid) {
    throw new Error(`Directory access denied: ${validation.errors.join(', ')}`);
  }
  
  const buildStructure = async (dirPath: string, depth: number): Promise<any> => {
    if (depth > maxDepth) {
      return null;
    }
    
    try {
      const stats = await fs.promises.stat(dirPath);
      
      if (stats.isFile()) {
        if (!isExtensionAllowed(dirPath, config)) {
          return null; // Filter out disallowed files
        }
        
        return {
          name: path.basename(dirPath),
          type: 'file',
          path: dirPath,
          size: stats.size,
          modified: stats.mtime,
        };
      }
      
      if (stats.isDirectory()) {
        const entries = await fs.promises.readdir(dirPath);
        const children = [];
        
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry);
          
          // Skip hidden files and directories
          if (entry.startsWith('.')) {
            continue;
          }
          
          const child = await buildStructure(entryPath, depth + 1);
          if (child) {
            children.push(child);
          }
        }
        
        return {
          name: path.basename(dirPath),
          type: 'directory',
          path: dirPath,
          children: children.sort((a, b) => {
            // Directories first, then files
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          }),
        };
      }
    } catch (error) {
      console.warn(`Failed to access: ${dirPath}`, error);
      return null;
    }
  };
  
  return buildStructure(projectPath, 0);
};

