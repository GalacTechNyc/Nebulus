/**
 * AI Vision Panel Component
 * Provides interface for AI-powered visual analysis of web pages
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { visionService, VisionAnalysisResult, ScreenshotOptions } from '../../services/vision-service';
import { logger } from '../../../shared/security/error-handling';

export interface AIVisionPanelProps {
  webviewId?: string;
  onCodeGenerated?: (code: string, framework: string) => void;
  onAnalysisComplete?: (analysis: VisionAnalysisResult) => void;
  className?: string;
}

type AnalysisTab = 'overview' | 'components' | 'accessibility' | 'design' | 'code';

export const AIVisionPanel: React.FC<AIVisionPanelProps> = ({
  webviewId,
  onCodeGenerated,
  onAnalysisComplete,
  className,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<'react' | 'vue' | 'angular' | 'html'>('react');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize vision service
    visionService.initialize().catch(error => {
      logger.error('Failed to initialize vision service', 'AIVisionPanel', error);
      setError('Failed to initialize AI Vision service');
    });
  }, []);

  /**
   * Capture screenshot from webview
   */
  const captureScreenshot = useCallback(async (options: ScreenshotOptions = {}) => {
    if (!webviewId) {
      setError('No webview available for screenshot');
      return;
    }

    try {
      setError(null);
      setIsAnalyzing(true);
      
      logger.info('Capturing screenshot for analysis', 'AIVisionPanel', { webviewId });
      
      const screenshotData = await visionService.captureScreenshot(webviewId, options);
      setScreenshot(screenshotData);
      
      // Automatically start analysis
      await analyzeImage(screenshotData);
    } catch (error) {
      logger.error('Failed to capture screenshot', 'AIVisionPanel', error);
      setError(`Failed to capture screenshot: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [webviewId]);

  /**
   * Analyze uploaded or captured image
   */
  const analyzeImage = useCallback(async (imageData: string) => {
    try {
      setError(null);
      setIsAnalyzing(true);
      
      logger.info('Starting AI vision analysis', 'AIVisionPanel');
      
      const analysis = await visionService.analyzeScreenshot(imageData, 'full');
      setCurrentAnalysis(analysis);
      onAnalysisComplete?.(analysis);
      
      logger.info('AI vision analysis completed', 'AIVisionPanel', {
        componentsFound: analysis.components.length,
        accessibilityScore: analysis.accessibility.score,
        designSuggestions: analysis.designSuggestions.length,
      });
    } catch (error) {
      logger.error('Failed to analyze image', 'AIVisionPanel', error);
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete]);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setScreenshot(imageData);
        await analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('Failed to process uploaded file', 'AIVisionPanel', error);
      setError(`Failed to process file: ${error.message}`);
    }
  }, [analyzeImage]);

  /**
   * Generate code from analysis
   */
  const generateCode = useCallback(async () => {
    if (!currentAnalysis) return;

    try {
      setError(null);
      
      const codeGeneration = await visionService.generateCodeFromAnalysis(
        currentAnalysis,
        selectedFramework
      );
      
      if (codeGeneration.length > 0) {
        onCodeGenerated?.(codeGeneration[0].code, selectedFramework);
      }
    } catch (error) {
      logger.error('Failed to generate code', 'AIVisionPanel', error);
      setError(`Code generation failed: ${error.message}`);
    }
  }, [currentAnalysis, selectedFramework, onCodeGenerated]);

  /**
   * Render analysis overview
   */
  const renderOverview = () => {
    if (!currentAnalysis) return null;

    return (
      <div className="analysis-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Components Found</h4>
            <span className="stat-value">{currentAnalysis.components.length}</span>
          </div>
          <div className="stat-card">
            <h4>Accessibility Score</h4>
            <span className={`stat-value ${getAccessibilityScoreClass(currentAnalysis.accessibility.score)}`}>
              {currentAnalysis.accessibility.score}/100
            </span>
          </div>
          <div className="stat-card">
            <h4>Design Issues</h4>
            <span className="stat-value">{currentAnalysis.designSuggestions.length}</span>
          </div>
          <div className="stat-card">
            <h4>Processing Time</h4>
            <span className="stat-value">{currentAnalysis.metadata.processingTime.toFixed(0)}ms</span>
          </div>
        </div>
        
        {screenshot && (
          <div className="screenshot-preview">
            <h4>Analyzed Screenshot</h4>
            <img src={screenshot} alt="Analyzed screenshot" className="screenshot-image" />
          </div>
        )}
      </div>
    );
  };

  /**
   * Render components analysis
   */
  const renderComponents = () => {
    if (!currentAnalysis?.components) return null;

    return (
      <div className="components-analysis">
        <h4>Detected UI Components ({currentAnalysis.components.length})</h4>
        <div className="components-list">
          {currentAnalysis.components.map((component, index) => (
            <div key={component.id || index} className="component-item">
              <div className="component-header">
                <span className="component-type">{component.type}</span>
                <span className="component-confidence">{(component.confidence * 100).toFixed(0)}%</span>
              </div>
              {component.text && (
                <div className="component-text">"{component.text}"</div>
              )}
              <div className="component-bounds">
                {component.bounds.width}×{component.bounds.height} at ({component.bounds.x}, {component.bounds.y})
              </div>
              {component.attributes && Object.keys(component.attributes).length > 0 && (
                <div className="component-attributes">
                  {Object.entries(component.attributes).map(([key, value]) => (
                    <span key={key} className="attribute">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render accessibility analysis
   */
  const renderAccessibility = () => {
    if (!currentAnalysis?.accessibility) return null;

    const { accessibility } = currentAnalysis;

    return (
      <div className="accessibility-analysis">
        <div className="accessibility-score">
          <h4>Accessibility Score</h4>
          <div className={`score-circle ${getAccessibilityScoreClass(accessibility.score)}`}>
            {accessibility.score}/100
          </div>
        </div>
        
        {accessibility.issues.length > 0 && (
          <div className="accessibility-issues">
            <h4>Issues Found ({accessibility.issues.length})</h4>
            {accessibility.issues.map((issue, index) => (
              <div key={index} className={`issue-item severity-${issue.severity}`}>
                <div className="issue-header">
                  <span className="issue-type">{issue.type.replace('_', ' ')}</span>
                  <span className="issue-severity">{issue.severity}</span>
                </div>
                <div className="issue-description">{issue.description}</div>
                <div className="issue-recommendation">{issue.recommendation}</div>
              </div>
            ))}
          </div>
        )}
        
        {accessibility.suggestions.length > 0 && (
          <div className="accessibility-suggestions">
            <h4>Improvement Suggestions</h4>
            {accessibility.suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <span className="suggestion-type">{suggestion.type}</span>
                  <span className={`suggestion-impact impact-${suggestion.impact}`}>
                    {suggestion.impact} impact
                  </span>
                </div>
                <div className="suggestion-description">{suggestion.description}</div>
                <div className="suggestion-implementation">{suggestion.implementation}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render design suggestions
   */
  const renderDesign = () => {
    if (!currentAnalysis?.designSuggestions) return null;

    const groupedSuggestions = currentAnalysis.designSuggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = [];
      }
      acc[suggestion.category].push(suggestion);
      return acc;
    }, {} as Record<string, typeof currentAnalysis.designSuggestions>);

    return (
      <div className="design-analysis">
        <h4>Design Suggestions</h4>
        {Object.entries(groupedSuggestions).map(([category, suggestions]) => (
          <div key={category} className="design-category">
            <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
            {suggestions.map((suggestion, index) => (
              <div key={index} className={`design-suggestion priority-${suggestion.priority}`}>
                <div className="suggestion-header">
                  <span className="suggestion-title">{suggestion.title}</span>
                  <span className="suggestion-priority">{suggestion.priority}</span>
                </div>
                <div className="suggestion-description">{suggestion.description}</div>
                {suggestion.before && suggestion.after && (
                  <div className="suggestion-comparison">
                    <div className="before">Before: {suggestion.before}</div>
                    <div className="after">After: {suggestion.after}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render code generation
   */
  const renderCode = () => {
    if (!currentAnalysis?.codeGeneration) return null;

    return (
      <div className="code-generation">
        <div className="code-controls">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value as any)}
            className="framework-select"
          >
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="angular">Angular</option>
            <option value="html">HTML/CSS</option>
          </select>
          <button onClick={generateCode} className="generate-button">
            Generate Code
          </button>
        </div>
        
        {currentAnalysis.codeGeneration.length > 0 && (
          <div className="code-suggestions">
            {currentAnalysis.codeGeneration.map((suggestion, index) => (
              <div key={index} className="code-suggestion">
                <div className="code-header">
                  <span className="code-component">{suggestion.component}</span>
                  <span className="code-framework">{suggestion.framework}</span>
                  <span className="code-confidence">{(suggestion.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="code-description">{suggestion.description}</div>
                <pre className="code-block">
                  <code>{suggestion.code}</code>
                </pre>
                <button
                  onClick={() => onCodeGenerated?.(suggestion.code, suggestion.framework)}
                  className="use-code-button"
                >
                  Use This Code
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /**
   * Get accessibility score CSS class
   */
  const getAccessibilityScoreClass = (score: number): string => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  return (
    <div className={`ai-vision-panel ${className || ''}`}>
      <div className="vision-header">
        <h3>AI Vision Analysis</h3>
        <div className="vision-controls">
          <button
            onClick={() => captureScreenshot()}
            disabled={!webviewId || isAnalyzing}
            className="capture-button"
          >
            {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="upload-button"
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="analyzing-indicator">
          <div className="spinner"></div>
          <span>Analyzing with AI Vision...</span>
        </div>
      )}

      {currentAnalysis && (
        <div className="analysis-results">
          <div className="analysis-tabs">
            {(['overview', 'components', 'accessibility', 'design', 'code'] as AnalysisTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="analysis-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'components' && renderComponents()}
            {activeTab === 'accessibility' && renderAccessibility()}
            {activeTab === 'design' && renderDesign()}
            {activeTab === 'code' && renderCode()}
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-vision-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
        }

        .vision-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #dee2e6;
          background: white;
          border-radius: 8px 8px 0 0;
        }

        .vision-header h3 {
          margin: 0;
          color: #495057;
        }

        .vision-controls {
          display: flex;
          gap: 8px;
        }

        .capture-button, .upload-button {
          padding: 8px 16px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .capture-button:disabled, .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-button {
          background: #6c757d;
          border-color: #6c757d;
        }

        .error-message {
          padding: 12px;
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin: 16px;
        }

        .analyzing-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          gap: 12px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .analysis-results {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .analysis-tabs {
          display: flex;
          border-bottom: 1px solid #dee2e6;
          background: white;
        }

        .tab-button {
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-size: 14px;
        }

        .tab-button.active {
          border-bottom-color: #007bff;
          color: #007bff;
          font-weight: 500;
        }

        .analysis-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          text-align: center;
        }

        .stat-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6c757d;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #495057;
        }

        .stat-value.excellent { color: #28a745; }
        .stat-value.good { color: #17a2b8; }
        .stat-value.fair { color: #ffc107; }
        .stat-value.poor { color: #dc3545; }

        .screenshot-preview {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .screenshot-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }

        .components-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .component-item {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .component-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .component-type {
          background: #e9ecef;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .component-confidence {
          font-size: 12px;
          color: #6c757d;
        }

        .component-text {
          font-style: italic;
          color: #495057;
          margin-bottom: 4px;
        }

        .component-bounds {
          font-size: 12px;
          color: #6c757d;
        }

        .component-attributes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .attribute {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
        }

        .accessibility-score {
          text-align: center;
          margin-bottom: 24px;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          font-size: 18px;
          font-weight: bold;
          color: white;
        }

        .score-circle.excellent { background: #28a745; }
        .score-circle.good { background: #17a2b8; }
        .score-circle.fair { background: #ffc107; }
        .score-circle.poor { background: #dc3545; }

        .issue-item, .suggestion-item {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          margin-bottom: 12px;
        }

        .issue-item.severity-critical { border-left: 4px solid #dc3545; }
        .issue-item.severity-high { border-left: 4px solid #fd7e14; }
        .issue-item.severity-medium { border-left: 4px solid #ffc107; }
        .issue-item.severity-low { border-left: 4px solid #17a2b8; }

        .issue-header, .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .issue-type, .suggestion-type {
          font-weight: 500;
          text-transform: capitalize;
        }

        .issue-severity, .suggestion-impact {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .issue-severity { background: #f8d7da; color: #721c24; }
        .suggestion-impact.high { background: #d4edda; color: #155724; }
        .suggestion-impact.medium { background: #fff3cd; color: #856404; }
        .suggestion-impact.low { background: #cce5ff; color: #004085; }

        .code-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }

        .framework-select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: white;
        }

        .generate-button, .use-code-button {
          padding: 8px 16px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .code-suggestion {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          margin-bottom: 16px;
        }

        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .code-block {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e9ecef;
          overflow-x: auto;
          margin: 12px 0;
        }

        .code-block code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default AIVisionPanel;

