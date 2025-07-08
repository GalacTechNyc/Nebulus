/**
 * AI Vision Service
 * Provides screenshot capture, image analysis, and AI-powered visual insights
 */

import { logger } from '../../shared/security/error-handling';

export interface ScreenshotOptions {
  quality?: number;
  format?: 'png' | 'jpeg';
  fullPage?: boolean;
  selector?: string;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisionAnalysisResult {
  components: UIComponent[];
  accessibility: AccessibilityInsights;
  designSuggestions: DesignSuggestion[];
  codeGeneration: CodeSuggestion[];
  metadata: AnalysisMetadata;
}

export interface UIComponent {
  id: string;
  type: 'button' | 'input' | 'text' | 'image' | 'container' | 'navigation' | 'form' | 'unknown';
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text?: string;
  attributes?: { [key: string]: string };
  children?: UIComponent[];
  confidence: number;
}

export interface AccessibilityInsights {
  score: number;
  issues: AccessibilityIssue[];
  suggestions: AccessibilitySuggestion[];
}

export interface AccessibilityIssue {
  type: 'missing_alt' | 'low_contrast' | 'missing_label' | 'keyboard_navigation' | 'focus_order';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element?: UIComponent;
  recommendation: string;
}

export interface AccessibilitySuggestion {
  type: string;
  description: string;
  implementation: string;
  impact: 'low' | 'medium' | 'high';
}

export interface DesignSuggestion {
  category: 'layout' | 'color' | 'typography' | 'spacing' | 'consistency' | 'usability';
  title: string;
  description: string;
  before?: string;
  after?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CodeSuggestion {
  framework: 'react' | 'vue' | 'angular' | 'html' | 'css';
  component: string;
  code: string;
  description: string;
  confidence: number;
}

export interface AnalysisMetadata {
  timestamp: Date;
  processingTime: number;
  imageSize: { width: number; height: number };
  apiProvider: string;
  modelVersion: string;
}

/**
 * AI Vision Service Class
 */
export class VisionService {
  private static instance: VisionService;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): VisionService {
    if (!VisionService.instance) {
      VisionService.instance = new VisionService();
    }
    return VisionService.instance;
  }

  /**
   * Initialize the vision service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Vision Service', 'VisionService');
      
      // Check if required APIs are available
      await this.checkAPIAvailability();
      
      this.isInitialized = true;
      logger.info('AI Vision Service initialized successfully', 'VisionService');
    } catch (error) {
      logger.error('Failed to initialize AI Vision Service', 'VisionService', error);
      throw error;
    }
  }

  /**
   * Check if vision APIs are available
   */
  private async checkAPIAvailability(): Promise<void> {
    // Check if we can access the required AI services
    const availableServices = await window.electronAPI.invoke('vision-check-services');
    
    if (!availableServices.gemini && !availableServices.openai && !availableServices.claude) {
      throw new Error('No AI vision services available');
    }
    
    logger.info('Available vision services', 'VisionService', availableServices);
  }

  /**
   * Capture screenshot of webview or specific element
   */
  async captureScreenshot(
    webviewId: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Vision service not initialized');
    }

    try {
      logger.debug('Capturing screenshot', 'VisionService', { webviewId, options });
      
      const screenshot = await window.electronAPI.invoke('vision-capture-screenshot', {
        webviewId,
        options: {
          quality: options.quality || 90,
          format: options.format || 'png',
          fullPage: options.fullPage || false,
          selector: options.selector,
          clip: options.clip,
        },
      });

      logger.debug('Screenshot captured successfully', 'VisionService', {
        size: screenshot.length,
        format: options.format,
      });

      return screenshot;
    } catch (error) {
      logger.error('Failed to capture screenshot', 'VisionService', error, { webviewId, options });
      throw error;
    }
  }

  /**
   * Analyze screenshot with AI vision
   */
  async analyzeScreenshot(
    imageData: string,
    analysisType: 'full' | 'components' | 'accessibility' | 'design' = 'full'
  ): Promise<VisionAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Vision service not initialized');
    }

    const startTime = performance.now();

    try {
      logger.info('Starting vision analysis', 'VisionService', { analysisType });

      // Send to AI service for analysis
      const result = await window.electronAPI.invoke('vision-analyze-image', {
        imageData,
        analysisType,
        options: {
          includeComponents: analysisType === 'full' || analysisType === 'components',
          includeAccessibility: analysisType === 'full' || analysisType === 'accessibility',
          includeDesign: analysisType === 'full' || analysisType === 'design',
          includeCodeGeneration: analysisType === 'full',
        },
      });

      const processingTime = performance.now() - startTime;

      logger.info('Vision analysis completed', 'VisionService', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        componentsFound: result.components?.length || 0,
        accessibilityIssues: result.accessibility?.issues?.length || 0,
        designSuggestions: result.designSuggestions?.length || 0,
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTime,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      logger.error('Vision analysis failed', 'VisionService', error, {
        analysisType,
        processingTime: `${processingTime.toFixed(2)}ms`,
      });
      throw error;
    }
  }

  /**
   * Generate code from visual analysis
   */
  async generateCodeFromAnalysis(
    analysis: VisionAnalysisResult,
    framework: 'react' | 'vue' | 'angular' | 'html' = 'react'
  ): Promise<CodeSuggestion[]> {
    try {
      logger.info('Generating code from analysis', 'VisionService', { framework });

      const codeGeneration = await window.electronAPI.invoke('vision-generate-code', {
        analysis,
        framework,
        options: {
          includeStyles: true,
          includeAccessibility: true,
          includeResponsive: true,
          codeStyle: 'modern',
        },
      });

      logger.info('Code generation completed', 'VisionService', {
        suggestionsCount: codeGeneration.length,
        framework,
      });

      return codeGeneration;
    } catch (error) {
      logger.error('Code generation failed', 'VisionService', error, { framework });
      throw error;
    }
  }

  /**
   * Analyze accessibility of the captured image
   */
  async analyzeAccessibility(imageData: string): Promise<AccessibilityInsights> {
    try {
      logger.info('Starting accessibility analysis', 'VisionService');

      const accessibility = await window.electronAPI.invoke('vision-analyze-accessibility', {
        imageData,
        options: {
          checkContrast: true,
          checkLabels: true,
          checkKeyboardNavigation: true,
          checkFocusOrder: true,
          checkSemantics: true,
        },
      });

      logger.info('Accessibility analysis completed', 'VisionService', {
        score: accessibility.score,
        issuesCount: accessibility.issues.length,
        suggestionsCount: accessibility.suggestions.length,
      });

      return accessibility;
    } catch (error) {
      logger.error('Accessibility analysis failed', 'VisionService', error);
      throw error;
    }
  }

  /**
   * Get design improvement suggestions
   */
  async getDesignSuggestions(imageData: string): Promise<DesignSuggestion[]> {
    try {
      logger.info('Getting design suggestions', 'VisionService');

      const suggestions = await window.electronAPI.invoke('vision-design-suggestions', {
        imageData,
        options: {
          analyzeLayout: true,
          analyzeColors: true,
          analyzeTypography: true,
          analyzeSpacing: true,
          analyzeConsistency: true,
          analyzeUsability: true,
        },
      });

      logger.info('Design suggestions completed', 'VisionService', {
        suggestionsCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.error('Design suggestions failed', 'VisionService', error);
      throw error;
    }
  }

  /**
   * Compare two screenshots for visual differences
   */
  async compareScreenshots(
    beforeImage: string,
    afterImage: string
  ): Promise<{
    differences: Array<{
      type: 'added' | 'removed' | 'modified';
      bounds: { x: number; y: number; width: number; height: number };
      description: string;
    }>;
    similarity: number;
  }> {
    try {
      logger.info('Comparing screenshots', 'VisionService');

      const comparison = await window.electronAPI.invoke('vision-compare-images', {
        beforeImage,
        afterImage,
        options: {
          threshold: 0.1,
          includePixelDiff: false,
          highlightDifferences: true,
        },
      });

      logger.info('Screenshot comparison completed', 'VisionService', {
        similarity: comparison.similarity,
        differencesCount: comparison.differences.length,
      });

      return comparison;
    } catch (error) {
      logger.error('Screenshot comparison failed', 'VisionService', error);
      throw error;
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(imageData: string): Promise<{
    text: string;
    confidence: number;
    blocks: Array<{
      text: string;
      bounds: { x: number; y: number; width: number; height: number };
      confidence: number;
    }>;
  }> {
    try {
      logger.info('Extracting text from image', 'VisionService');

      const textExtraction = await window.electronAPI.invoke('vision-extract-text', {
        imageData,
        options: {
          language: 'en',
          includeBlocks: true,
          includeConfidence: true,
        },
      });

      logger.info('Text extraction completed', 'VisionService', {
        textLength: textExtraction.text.length,
        blocksCount: textExtraction.blocks.length,
        confidence: textExtraction.confidence,
      });

      return textExtraction;
    } catch (error) {
      logger.error('Text extraction failed', 'VisionService', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up Vision Service', 'VisionService');
      this.isInitialized = false;
    } catch (error) {
      logger.error('Failed to cleanup Vision Service', 'VisionService', error);
    }
  }
}

// Export singleton instance
export const visionService = VisionService.getInstance();

