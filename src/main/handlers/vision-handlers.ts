/**
 * AI Vision IPC Handlers
 * Main process handlers for AI vision functionality
 */

import { ipcMain, BrowserWindow, webContents } from 'electron';
import { logger } from '../../shared/security/error-handling';
import { secureIPCHandler, IpcChannels } from '../../shared/security/ipc-validation';

// AI Service integrations
interface AIServiceConfig {
  openai?: {
    apiKey: string;
    model: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
  gemini?: {
    apiKey: string;
    model: string;
  };
}

/**
 * AI Vision Handler Class
 */
export class VisionHandlers {
  private aiConfig: AIServiceConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.aiConfig = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4-vision-preview',
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: 'claude-3-sonnet-20240229',
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-pro-vision',
      },
    };
  }

  /**
   * Initialize vision handlers
   */
  initialize(): void {
    if (this.isInitialized) return;

    logger.info('Initializing AI Vision handlers', 'VisionHandlers');

    // Register IPC handlers with security validation
    ipcMain.handle('vision-check-services', 
      secureIPCHandler('vision-check-services' as IpcChannels, this.handleCheckServices.bind(this))
    );

    ipcMain.handle('vision-capture-screenshot',
      secureIPCHandler('vision-capture-screenshot' as IpcChannels, this.handleCaptureScreenshot.bind(this))
    );

    ipcMain.handle('vision-analyze-image',
      secureIPCHandler('vision-analyze-image' as IpcChannels, this.handleAnalyzeImage.bind(this))
    );

    ipcMain.handle('vision-generate-code',
      secureIPCHandler('vision-generate-code' as IpcChannels, this.handleGenerateCode.bind(this))
    );

    ipcMain.handle('vision-analyze-accessibility',
      secureIPCHandler('vision-analyze-accessibility' as IpcChannels, this.handleAnalyzeAccessibility.bind(this))
    );

    ipcMain.handle('vision-design-suggestions',
      secureIPCHandler('vision-design-suggestions' as IpcChannels, this.handleDesignSuggestions.bind(this))
    );

    ipcMain.handle('vision-compare-images',
      secureIPCHandler('vision-compare-images' as IpcChannels, this.handleCompareImages.bind(this))
    );

    ipcMain.handle('vision-extract-text',
      secureIPCHandler('vision-extract-text' as IpcChannels, this.handleExtractText.bind(this))
    );

    this.isInitialized = true;
    logger.info('AI Vision handlers initialized successfully', 'VisionHandlers');
  }

  /**
   * Check available AI services
   */
  private async handleCheckServices(event: any): Promise<{
    openai: boolean;
    anthropic: boolean;
    gemini: boolean;
  }> {
    return {
      openai: !!this.aiConfig.openai?.apiKey,
      anthropic: !!this.aiConfig.anthropic?.apiKey,
      gemini: !!this.aiConfig.gemini?.apiKey,
    };
  }

  /**
   * Capture screenshot from webview
   */
  private async handleCaptureScreenshot(event: any, data: {
    webviewId: string;
    options: {
      quality: number;
      format: 'png' | 'jpeg';
      fullPage: boolean;
      selector?: string;
      clip?: { x: number; y: number; width: number; height: number };
    };
  }): Promise<string> {
    try {
      logger.debug('Capturing screenshot', 'VisionHandlers', data);

      // Find the webview by ID
      const allWebContents = webContents.getAllWebContents();
      const targetWebContents = allWebContents.find(wc => 
        wc.getURL().includes(data.webviewId) || wc.id.toString() === data.webviewId
      );

      if (!targetWebContents) {
        throw new Error(`Webview not found: ${data.webviewId}`);
      }

      // Capture screenshot
      const image = await targetWebContents.capturePage({
        x: data.options.clip?.x || 0,
        y: data.options.clip?.y || 0,
        width: data.options.clip?.width || 0,
        height: data.options.clip?.height || 0,
      });

      // Convert to base64 data URL
      const buffer = data.options.format === 'jpeg' 
        ? image.toJPEG(data.options.quality)
        : image.toPNG();

      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/${data.options.format};base64,${base64}`;

      logger.debug('Screenshot captured successfully', 'VisionHandlers', {
        size: buffer.length,
        format: data.options.format,
      });

      return dataUrl;
    } catch (error) {
      logger.error('Failed to capture screenshot', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Analyze image with AI vision
   */
  private async handleAnalyzeImage(event: any, data: {
    imageData: string;
    analysisType: 'full' | 'components' | 'accessibility' | 'design';
    options: {
      includeComponents: boolean;
      includeAccessibility: boolean;
      includeDesign: boolean;
      includeCodeGeneration: boolean;
    };
  }): Promise<any> {
    try {
      logger.info('Starting AI vision analysis', 'VisionHandlers', {
        analysisType: data.analysisType,
        options: data.options,
      });

      // Choose the best available AI service
      const aiService = this.selectBestAIService();
      
      const analysisPrompt = this.buildAnalysisPrompt(data.analysisType, data.options);
      const result = await this.callAIService(aiService, analysisPrompt, data.imageData);

      logger.info('AI vision analysis completed', 'VisionHandlers', {
        service: aiService,
        analysisType: data.analysisType,
      });

      return result;
    } catch (error) {
      logger.error('AI vision analysis failed', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Generate code from analysis
   */
  private async handleGenerateCode(event: any, data: {
    analysis: any;
    framework: 'react' | 'vue' | 'angular' | 'html';
    options: {
      includeStyles: boolean;
      includeAccessibility: boolean;
      includeResponsive: boolean;
      codeStyle: string;
    };
  }): Promise<any[]> {
    try {
      logger.info('Generating code from analysis', 'VisionHandlers', {
        framework: data.framework,
        options: data.options,
      });

      const aiService = this.selectBestAIService();
      const codePrompt = this.buildCodeGenerationPrompt(data.analysis, data.framework, data.options);
      
      const result = await this.callAIService(aiService, codePrompt);

      logger.info('Code generation completed', 'VisionHandlers', {
        service: aiService,
        framework: data.framework,
      });

      return result;
    } catch (error) {
      logger.error('Code generation failed', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Analyze accessibility
   */
  private async handleAnalyzeAccessibility(event: any, data: {
    imageData: string;
    options: {
      checkContrast: boolean;
      checkLabels: boolean;
      checkKeyboardNavigation: boolean;
      checkFocusOrder: boolean;
      checkSemantics: boolean;
    };
  }): Promise<any> {
    try {
      logger.info('Starting accessibility analysis', 'VisionHandlers', data.options);

      const aiService = this.selectBestAIService();
      const accessibilityPrompt = this.buildAccessibilityPrompt(data.options);
      
      const result = await this.callAIService(aiService, accessibilityPrompt, data.imageData);

      logger.info('Accessibility analysis completed', 'VisionHandlers');
      return result;
    } catch (error) {
      logger.error('Accessibility analysis failed', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Get design suggestions
   */
  private async handleDesignSuggestions(event: any, data: {
    imageData: string;
    options: {
      analyzeLayout: boolean;
      analyzeColors: boolean;
      analyzeTypography: boolean;
      analyzeSpacing: boolean;
      analyzeConsistency: boolean;
      analyzeUsability: boolean;
    };
  }): Promise<any[]> {
    try {
      logger.info('Getting design suggestions', 'VisionHandlers', data.options);

      const aiService = this.selectBestAIService();
      const designPrompt = this.buildDesignPrompt(data.options);
      
      const result = await this.callAIService(aiService, designPrompt, data.imageData);

      logger.info('Design suggestions completed', 'VisionHandlers');
      return result;
    } catch (error) {
      logger.error('Design suggestions failed', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Compare two images
   */
  private async handleCompareImages(event: any, data: {
    beforeImage: string;
    afterImage: string;
    options: {
      threshold: number;
      includePixelDiff: boolean;
      highlightDifferences: boolean;
    };
  }): Promise<any> {
    try {
      logger.info('Comparing images', 'VisionHandlers', data.options);

      const aiService = this.selectBestAIService();
      const comparePrompt = this.buildComparisonPrompt(data.options);
      
      // For comparison, we need to send both images
      const result = await this.callAIServiceWithMultipleImages(
        aiService, 
        comparePrompt, 
        [data.beforeImage, data.afterImage]
      );

      logger.info('Image comparison completed', 'VisionHandlers');
      return result;
    } catch (error) {
      logger.error('Image comparison failed', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Extract text from image (OCR)
   */
  private async handleExtractText(event: any, data: {
    imageData: string;
    options: {
      language: string;
      includeBlocks: boolean;
      includeConfidence: boolean;
    };
  }): Promise<any> {
    try {
      logger.info('Extracting text from image', 'VisionHandlers', data.options);

      const aiService = this.selectBestAIService();
      const ocrPrompt = this.buildOCRPrompt(data.options);
      
      const result = await this.callAIService(aiService, ocrPrompt, data.imageData);

      logger.info('Text extraction completed', 'VisionHandlers');
      return result;
    } catch (error) {
      logger.error('Text extraction failed', 'VisionHandlers', error, data);
      throw error;
    }
  }

  /**
   * Select the best available AI service
   */
  private selectBestAIService(): 'gemini' | 'openai' | 'anthropic' {
    // Prefer Gemini for vision tasks, then OpenAI, then Anthropic
    if (this.aiConfig.gemini?.apiKey) return 'gemini';
    if (this.aiConfig.openai?.apiKey) return 'openai';
    if (this.aiConfig.anthropic?.apiKey) return 'anthropic';
    
    throw new Error('No AI services available for vision analysis');
  }

  /**
   * Call AI service with image
   */
  private async callAIService(
    service: 'gemini' | 'openai' | 'anthropic',
    prompt: string,
    imageData?: string
  ): Promise<any> {
    switch (service) {
      case 'gemini':
        return this.callGeminiVision(prompt, imageData);
      case 'openai':
        return this.callOpenAIVision(prompt, imageData);
      case 'anthropic':
        return this.callAnthropicVision(prompt, imageData);
      default:
        throw new Error(`Unsupported AI service: ${service}`);
    }
  }

  /**
   * Call AI service with multiple images
   */
  private async callAIServiceWithMultipleImages(
    service: 'gemini' | 'openai' | 'anthropic',
    prompt: string,
    images: string[]
  ): Promise<any> {
    // Implementation would depend on the specific service capabilities
    // For now, use the first image
    return this.callAIService(service, prompt, images[0]);
  }

  /**
   * Call Gemini Vision API
   */
  private async callGeminiVision(prompt: string, imageData?: string): Promise<any> {
    // Implementation for Gemini Vision API
    // This would use the Google AI SDK
    logger.debug('Calling Gemini Vision API', 'VisionHandlers');
    
    // Mock response for now - replace with actual API call
    return {
      components: [],
      accessibility: { score: 85, issues: [], suggestions: [] },
      designSuggestions: [],
      codeGeneration: [],
      metadata: {
        apiProvider: 'gemini',
        modelVersion: this.aiConfig.gemini?.model,
      },
    };
  }

  /**
   * Call OpenAI Vision API
   */
  private async callOpenAIVision(prompt: string, imageData?: string): Promise<any> {
    // Implementation for OpenAI Vision API
    logger.debug('Calling OpenAI Vision API', 'VisionHandlers');
    
    // Mock response for now - replace with actual API call
    return {
      components: [],
      accessibility: { score: 80, issues: [], suggestions: [] },
      designSuggestions: [],
      codeGeneration: [],
      metadata: {
        apiProvider: 'openai',
        modelVersion: this.aiConfig.openai?.model,
      },
    };
  }

  /**
   * Call Anthropic Vision API
   */
  private async callAnthropicVision(prompt: string, imageData?: string): Promise<any> {
    // Implementation for Anthropic Vision API
    logger.debug('Calling Anthropic Vision API', 'VisionHandlers');
    
    // Mock response for now - replace with actual API call
    return {
      components: [],
      accessibility: { score: 90, issues: [], suggestions: [] },
      designSuggestions: [],
      codeGeneration: [],
      metadata: {
        apiProvider: 'anthropic',
        modelVersion: this.aiConfig.anthropic?.model,
      },
    };
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(
    analysisType: string,
    options: any
  ): string {
    let prompt = 'Analyze this screenshot of a web page and provide detailed insights. ';
    
    if (options.includeComponents) {
      prompt += 'Identify all UI components (buttons, inputs, text, images, containers) with their positions and properties. ';
    }
    
    if (options.includeAccessibility) {
      prompt += 'Evaluate accessibility compliance and identify issues with contrast, labels, keyboard navigation. ';
    }
    
    if (options.includeDesign) {
      prompt += 'Suggest design improvements for layout, colors, typography, spacing, and usability. ';
    }
    
    if (options.includeCodeGeneration) {
      prompt += 'Generate code suggestions for recreating the UI components. ';
    }
    
    prompt += 'Return the response as a structured JSON object.';
    
    return prompt;
  }

  /**
   * Build code generation prompt
   */
  private buildCodeGenerationPrompt(
    analysis: any,
    framework: string,
    options: any
  ): string {
    return `Generate ${framework} code based on the UI analysis. Include ${
      options.includeStyles ? 'styles, ' : ''
    }${
      options.includeAccessibility ? 'accessibility features, ' : ''
    }${
      options.includeResponsive ? 'responsive design' : ''
    }. Use ${options.codeStyle} coding style.`;
  }

  /**
   * Build accessibility prompt
   */
  private buildAccessibilityPrompt(options: any): string {
    return `Analyze this image for accessibility compliance. Check for ${
      Object.entries(options)
        .filter(([_, value]) => value)
        .map(([key, _]) => key.replace('check', '').toLowerCase())
        .join(', ')
    }. Provide a score out of 100 and detailed recommendations.`;
  }

  /**
   * Build design prompt
   */
  private buildDesignPrompt(options: any): string {
    return `Provide design improvement suggestions for this UI. Analyze ${
      Object.entries(options)
        .filter(([_, value]) => value)
        .map(([key, _]) => key.replace('analyze', '').toLowerCase())
        .join(', ')
    }. Focus on modern design principles and user experience.`;
  }

  /**
   * Build comparison prompt
   */
  private buildComparisonPrompt(options: any): string {
    return `Compare these two images and identify visual differences. Use a threshold of ${
      options.threshold
    } and ${options.highlightDifferences ? 'highlight' : 'list'} the differences.`;
  }

  /**
   * Build OCR prompt
   */
  private buildOCRPrompt(options: any): string {
    return `Extract all text from this image in ${options.language}. ${
      options.includeBlocks ? 'Include text block positions. ' : ''
    }${
      options.includeConfidence ? 'Include confidence scores.' : ''
    }`;
  }

  /**
   * Cleanup handlers
   */
  cleanup(): void {
    if (!this.isInitialized) return;

    logger.info('Cleaning up AI Vision handlers', 'VisionHandlers');
    
    // Remove IPC handlers
    ipcMain.removeHandler('vision-check-services');
    ipcMain.removeHandler('vision-capture-screenshot');
    ipcMain.removeHandler('vision-analyze-image');
    ipcMain.removeHandler('vision-generate-code');
    ipcMain.removeHandler('vision-analyze-accessibility');
    ipcMain.removeHandler('vision-design-suggestions');
    ipcMain.removeHandler('vision-compare-images');
    ipcMain.removeHandler('vision-extract-text');

    this.isInitialized = false;
  }
}

// Export singleton instance
export const visionHandlers = new VisionHandlers();

