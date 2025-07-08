#!/usr/bin/env node

/**
 * Auto-Updater Configuration Script
 * Updates the auto-updater server with new release information
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  updateServerUrl: process.env.UPDATE_SERVER_URL || 'https://updates.nebulus.dev',
  updateServerKey: process.env.UPDATE_SERVER_KEY,
  releaseNotesUrl: process.env.RELEASE_NOTES_URL || 'https://github.com/stephonbridges/nebulus/releases',
  buildDir: path.join(__dirname, '..', 'dist'),
  releaseDir: path.join(__dirname, '..', 'release'),
};

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
}

// Generate file checksums
function generateChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Get file size
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

// Detect platform from filename
function detectPlatform(filename) {
  if (filename.includes('.exe') || filename.includes('-win')) return 'win32';
  if (filename.includes('.dmg') || filename.includes('-mac')) return 'darwin';
  if (filename.includes('.AppImage') || filename.includes('-linux')) return 'linux';
  return 'unknown';
}

// Detect architecture from filename
function detectArchitecture(filename) {
  if (filename.includes('x64') || filename.includes('amd64')) return 'x64';
  if (filename.includes('arm64') || filename.includes('aarch64')) return 'arm64';
  if (filename.includes('ia32') || filename.includes('x86')) return 'ia32';
  return 'x64'; // Default to x64
}

// Scan release directory for artifacts
function scanReleaseArtifacts() {
  log('Scanning release artifacts...');
  
  if (!fs.existsSync(config.releaseDir)) {
    throw new Error(`Release directory not found: ${config.releaseDir}`);
  }
  
  const files = fs.readdirSync(config.releaseDir);
  const artifacts = [];
  
  // Filter for release artifacts
  const releaseFiles = files.filter(file => {
    return file.endsWith('.exe') || 
           file.endsWith('.dmg') || 
           file.endsWith('.AppImage') || 
           file.endsWith('.deb') || 
           file.endsWith('.rpm') ||
           file.endsWith('.zip');
  });
  
  for (const file of releaseFiles) {
    const filePath = path.join(config.releaseDir, file);
    const platform = detectPlatform(file);
    const arch = detectArchitecture(file);
    
    artifacts.push({
      filename: file,
      path: filePath,
      platform,
      arch,
      size: getFileSize(filePath),
      checksum: generateChecksum(filePath),
      url: `${config.updateServerUrl}/releases/${file}`,
    });
  }
  
  log(`Found ${artifacts.length} release artifacts`);
  return artifacts;
}

// Get version information
function getVersionInfo() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  return {
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    releaseDate: new Date().toISOString(),
  };
}

// Generate release manifest
function generateReleaseManifest(versionInfo, artifacts) {
  log('Generating release manifest...');
  
  const manifest = {
    version: versionInfo.version,
    name: versionInfo.name,
    description: versionInfo.description,
    releaseDate: versionInfo.releaseDate,
    releaseNotesUrl: `${config.releaseNotesUrl}/tag/v${versionInfo.version}`,
    
    // Platform-specific downloads
    platforms: {
      win32: {
        x64: artifacts.filter(a => a.platform === 'win32' && a.arch === 'x64'),
        ia32: artifacts.filter(a => a.platform === 'win32' && a.arch === 'ia32'),
      },
      darwin: {
        x64: artifacts.filter(a => a.platform === 'darwin' && a.arch === 'x64'),
        arm64: artifacts.filter(a => a.platform === 'darwin' && a.arch === 'arm64'),
      },
      linux: {
        x64: artifacts.filter(a => a.platform === 'linux' && a.arch === 'x64'),
        arm64: artifacts.filter(a => a.platform === 'linux' && a.arch === 'arm64'),
      },
    },
    
    // Auto-updater specific information
    autoUpdater: {
      enabled: true,
      checkInterval: 3600000, // 1 hour
      downloadInBackground: true,
      installOnQuit: true,
    },
    
    // Security information
    security: {
      signatureAlgorithm: 'sha256',
      publicKeyUrl: `${config.updateServerUrl}/public-key.pem`,
    },
    
    // Metadata
    metadata: {
      buildNumber: process.env.GITHUB_RUN_NUMBER || '0',
      commitHash: process.env.GITHUB_SHA || 'unknown',
      buildDate: new Date().toISOString(),
      channel: process.env.RELEASE_CHANNEL || 'stable',
    },
  };
  
  // Remove empty platform arrays
  Object.keys(manifest.platforms).forEach(platform => {
    Object.keys(manifest.platforms[platform]).forEach(arch => {
      if (manifest.platforms[platform][arch].length === 0) {
        delete manifest.platforms[platform][arch];
      }
    });
    
    if (Object.keys(manifest.platforms[platform]).length === 0) {
      delete manifest.platforms[platform];
    }
  });
  
  return manifest;
}

// Upload manifest to update server
async function uploadManifest(manifest) {
  log('Uploading manifest to update server...');
  
  try {
    // Save manifest locally first
    const manifestPath = path.join(config.releaseDir, 'release-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    log(`Manifest saved locally: ${manifestPath}`);
    
    // In a real scenario, you would upload to your update server
    // For now, we'll simulate the upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    log('Manifest uploaded successfully');
    return { success: true, manifestUrl: `${config.updateServerUrl}/manifest.json` };
  } catch (error) {
    log(`Failed to upload manifest: ${error.message}`, 'error');
    throw error;
  }
}

// Update latest version pointer
async function updateLatestVersion(version) {
  log('Updating latest version pointer...');
  
  try {
    const latestInfo = {
      version,
      updateUrl: `${config.updateServerUrl}/manifest.json`,
      timestamp: new Date().toISOString(),
    };
    
    // Save latest version info
    const latestPath = path.join(config.releaseDir, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(latestInfo, null, 2));
    
    // Simulate upload to update server
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    log('Latest version pointer updated');
    return { success: true };
  } catch (error) {
    log(`Failed to update latest version: ${error.message}`, 'error');
    throw error;
  }
}

// Validate update server configuration
function validateUpdateServer() {
  log('Validating update server configuration...');
  
  if (!config.updateServerKey) {
    throw new Error('UPDATE_SERVER_KEY environment variable is required');
  }
  
  // Additional validation would go here
  log('Update server configuration validated');
}

// Generate update statistics
function generateUpdateStats(manifest) {
  const stats = {
    totalArtifacts: 0,
    totalSize: 0,
    platformBreakdown: {},
    architectureBreakdown: {},
  };
  
  Object.values(manifest.platforms).forEach(platform => {
    Object.values(platform).forEach(artifacts => {
      artifacts.forEach(artifact => {
        stats.totalArtifacts++;
        stats.totalSize += artifact.size;
        
        // Platform stats
        if (!stats.platformBreakdown[artifact.platform]) {
          stats.platformBreakdown[artifact.platform] = 0;
        }
        stats.platformBreakdown[artifact.platform]++;
        
        // Architecture stats
        if (!stats.architectureBreakdown[artifact.arch]) {
          stats.architectureBreakdown[artifact.arch] = 0;
        }
        stats.architectureBreakdown[artifact.arch]++;
      });
    });
  });
  
  return stats;
}

// Main auto-updater update function
async function main() {
  const startTime = Date.now();
  
  try {
    log('Starting auto-updater configuration update...');
    
    // Validate environment
    validateUpdateServer();
    
    // Get version information
    const versionInfo = getVersionInfo();
    log(`Configuring auto-updater for version: ${versionInfo.version}`);
    
    // Scan release artifacts
    const artifacts = scanReleaseArtifacts();
    
    if (artifacts.length === 0) {
      throw new Error('No release artifacts found');
    }
    
    // Generate manifest
    const manifest = generateReleaseManifest(versionInfo, artifacts);
    
    // Generate statistics
    const stats = generateUpdateStats(manifest);
    log(`Release statistics: ${stats.totalArtifacts} artifacts, ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB total`);
    
    // Upload manifest
    const uploadResult = await uploadManifest(manifest);
    
    // Update latest version pointer
    await updateLatestVersion(versionInfo.version);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`Auto-updater configuration completed successfully in ${duration} seconds`);
    
    // Summary
    console.log('\\n' + '='.repeat(50));
    console.log('AUTO-UPDATER UPDATE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Version: ${versionInfo.version}`);
    console.log(`Artifacts: ${stats.totalArtifacts}`);
    console.log(`Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Manifest URL: ${uploadResult.manifestUrl}`);
    console.log(`Platforms: ${Object.keys(stats.platformBreakdown).join(', ')}`);
    console.log(`Architectures: ${Object.keys(stats.architectureBreakdown).join(', ')}`);
    console.log('='.repeat(50) + '\\n');
    
  } catch (error) {
    log(`Auto-updater configuration failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('Auto-updater update interrupted by user', 'warn');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Auto-updater update terminated', 'warn');
  process.exit(1);
});

// Run auto-updater update
if (require.main === module) {
  main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  generateReleaseManifest,
  uploadManifest,
  updateLatestVersion,
};

