import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAppState, useAIMessages } from '../../hooks/useAppState';
import ipcService from '../../services/ipc';

const AIContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Message = styled.div<{ role: 'user' | 'assistant' | 'system' }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.medium};
  background-color: ${props => {
    switch (props.role) {
      case 'user':
        return props.theme.colors.ai.user + '20';
      case 'assistant':
        return props.theme.colors.ai.assistant + '20';
      case 'system':
        return props.theme.colors.ai.system + '20';
      default:
        return props.theme.colors.surface;
    }
  }};
  border: 1px solid ${props => {
    switch (props.role) {
      case 'user':
        return props.theme.colors.ai.user + '40';
      case 'assistant':
        return props.theme.colors.ai.assistant + '40';
      case 'system':
        return props.theme.colors.ai.system + '40';
      default:
        return props.theme.colors.border;
    }
  }};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
`;

const MessageContent = styled.div`
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  line-height: 1.4;
  white-space: pre-wrap;
`;

const CodeBlock = styled.pre`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.sm};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: ${props => props.theme.fontSizes.small};
  overflow-x: auto;
  margin: ${props => props.theme.spacing.xs} 0;
`;

const CodeActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.xs};
  flex-wrap: wrap;
`;

const InsertButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.small};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary + '20'};
  }
`;

const ReplaceButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.warning};
  color: ${props => props.theme.colors.warning};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.small};
  
  &:hover {
    background-color: ${props => props.theme.colors.warning + '20'};
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.border};
  gap: ${props => props.theme.spacing.xs};
`;

const InputTextArea = styled.textarea`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  resize: vertical;
  min-height: 60px;
  max-height: 120px;
  font-family: inherit;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

const InputActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SendButton = styled.button<{ disabled: boolean }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  background-color: ${props => props.disabled ? props.theme.colors.surface : props.theme.colors.primary};
  color: ${props => props.disabled ? props.theme.colors.textMuted : 'white'};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: ${props => props.theme.fontSizes.small};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background-color: ${props => props.disabled ? props.theme.colors.surface : props.theme.colors.primaryHover};
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  flex-wrap: wrap;
`;

const QuickAction = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.small};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    border-color: ${props => props.theme.colors.borderHover};
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.small};
  padding: ${props => props.theme.spacing.sm};
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 2px;
  
  span {
    width: 4px;
    height: 4px;
    background-color: ${props => props.theme.colors.primary};
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
    
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
  }
  
  @keyframes pulse {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }
`;

const AIAssistant: React.FC = () => {
  const { state, dispatch } = useAppState();
  const messages = useAIMessages();
  const [input, setInput] = useState('');
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Set up streaming listener
    ipcService.onAIStream(({ content, isComplete, error }) => {
      if (error) {
        const errorMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: `Error: ${error}`,
          timestamp: new Date(),
          type: 'chat' as const
        };
        dispatch({ type: 'ADD_AI_MESSAGE', payload: errorMessage });
        dispatch({ type: 'SET_AI_PROCESSING', payload: false });
        setStreamingMessage('');
        return;
      }

      if (isComplete) {
        // Finalize the streaming message
        if (streamingMessage) {
          const aiResponse = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: streamingMessage,
            timestamp: new Date(),
            type: 'chat' as const
          };
          dispatch({ type: 'ADD_AI_MESSAGE', payload: aiResponse });
        }
        dispatch({ type: 'SET_AI_PROCESSING', payload: false });
        setStreamingMessage('');
      } else {
        // Append streaming content
        setStreamingMessage(prev => prev + content);
      }
    });

    return () => {
      ipcService.removeAllListeners('ai:stream');
    };
  }, [streamingMessage, dispatch]);

  const handleSend = async () => {
    if (!input.trim() || state.ai.isProcessing) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
      type: 'chat' as const
    };

    dispatch({ type: 'ADD_AI_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_AI_PROCESSING', payload: true });
    setInput('');

    try {
      const chatHistory = state.ai.messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }));
      setStreamingMessage(''); // Clear any previous streaming message
      
      // Start streaming - the response will be handled by the useEffect listener
      await ipcService.chatWithAI(chatHistory);
    } catch (err: any) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Error: ${err.message}`,
        timestamp: new Date(),
        type: 'chat' as const
      };
      dispatch({ type: 'ADD_AI_MESSAGE', payload: errorMessage });
      dispatch({ type: 'SET_AI_PROCESSING', payload: false });
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('component') || lowerInput.includes('react')) {
      return `I can help you create a React component! Here's a basic structure:

\`\`\`tsx
import React from 'react';
import styled from 'styled-components';

const Container = styled.div\`
  // Your styles here
\`;

interface Props {
  // Define your props
}

const YourComponent: React.FC<Props> = ({ }) => {
  return (
    <Container>
      {/* Your content */}
    </Container>
  );
};

export default YourComponent;
\`\`\`

Would you like me to customize this for your specific needs?`;
    }
    
    if (lowerInput.includes('error') || lowerInput.includes('fix')) {
      return `I'd be happy to help debug that error! Can you share:

1. The specific error message
2. The code that's causing the issue
3. What you were trying to accomplish

Common fixes I can help with:
- TypeScript errors
- React rendering issues
- Import/export problems
- Syntax errors`;
    }
    
    if (lowerInput.includes('deploy') || lowerInput.includes('vercel')) {
      return `For deployment, I can help you set up:

**Vercel Deployment:**
1. \`npm install -g vercel\`
2. \`vercel login\`
3. \`vercel\` in your project directory

**Or through our integrated deploy panel:**
- Click the Deploy button in the sidebar
- Choose your platform (Vercel, Netlify, etc.)
- Configure environment variables
- One-click deployment!

Need help with any specific deployment step?`;
    }
    
    return `I understand you're asking about: "${userInput}"

As your AI development assistant, I can help with:
🔧 Writing and debugging code
🎨 Creating React components
🚀 Deployment guidance
📝 Code explanations and optimizations
🐛 Error troubleshooting

What specific task would you like help with?`;
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  // Enhanced code insertion with context awareness
  const handleInsertCode = async (code: string) => {
    try {
      const context = await ipcService.getEditorContext();
      if (context.selectedText) {
        // If text is selected, ask user whether to replace or insert after
        if (window.confirm('Replace selected text with generated code?')) {
          await ipcService.replaceSelectedText(code);
        } else {
          ipcService.sendEditorInsertCode(code);
        }
      } else {
        ipcService.sendEditorInsertCode(code);
      }
    } catch (error) {
      // Fallback to simple insertion
      ipcService.sendEditorInsertCode(code);
    }
  };

  const handleReplaceCode = async (code: string) => {
    try {
      const context = await ipcService.getEditorContext();
      if (context.selectedText) {
        await ipcService.replaceSelectedText(code);
      } else {
        // If no selection, just insert
        ipcService.sendEditorInsertCode(code);
      }
    } catch (error) {
      ipcService.sendEditorInsertCode(code);
    }
  };

  const handleFormatAndInsert = async (code: string) => {
    try {
      // Insert code and then format the document
      ipcService.sendEditorInsertCode(code);
      setTimeout(() => {
        ipcService.formatEditorCode();
      }, 100); // Small delay to ensure code is inserted first
    } catch (error) {
      ipcService.sendEditorInsertCode(code);
    }
  };

  // Context-aware prompt generation
  const handleContextualPrompt = async (actionType: string) => {
    try {
      const context = await ipcService.getEditorContext();
      let prompt = "";
      
      switch (actionType) {
        case "component":
          prompt = context.fileName 
            ? `Create a React component for ${context.fileName}. Follow the existing code style and patterns.`
            : "Create a React component with TypeScript and styled-components";
          break;
        case "debug":
          if (context.selectedText) {
            prompt = `Debug this code and explain any issues:\n\n${context.selectedText}`;
          } else {
            prompt = context.fileName 
              ? `Help debug issues in ${context.fileName}`
              : "Help me debug my code";
          }
          break;
        case "optimize":
          if (context.selectedText) {
            prompt = `Optimize this code for better performance:\n\n${context.selectedText}`;
          } else {
            prompt = "Optimize my code for better performance and readability";
          }
          break;
        case "explain":
          if (context.selectedText) {
            prompt = `Explain how this code works:\n\n${context.selectedText}`;
          } else {
            prompt = context.fileName 
              ? `Explain the code structure in ${context.fileName}`
              : "Explain this code";
          }
          break;
        case "test":
          if (context.selectedText) {
            prompt = `Write unit tests for this code:\n\n${context.selectedText}`;
          } else {
            prompt = context.fileName 
              ? `Write unit tests for ${context.fileName}`
              : "Write unit tests for my code";
          }
          break;
        case "refactor":
          if (context.selectedText) {
            prompt = `Refactor this code to be cleaner and more maintainable:\n\n${context.selectedText}`;
          } else {
            prompt = context.fileName 
              ? `Suggest refactoring improvements for ${context.fileName}`
              : "Help me refactor my code";
          }
          break;
        default:
          prompt = "How can I help you with your code?";
      }
      
      setInput(prompt);
    } catch (error) {
      // Fallback to generic prompts
      const fallbackPrompts = {
        component: "Create a React component",
        debug: "Fix this error",
        optimize: "Optimize this code",
        explain: "Explain this code",
        test: "Write unit tests",
        refactor: "Refactor this code"
      };
      setInput(fallbackPrompts[actionType as keyof typeof fallbackPrompts] || "Help me code");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple code block detection
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/);
    
    return parts.map((part, index) => {
      if (index % 3 === 2) {
        // This is code content
        const language = parts[index - 1] || 'text';
        return (
          <div key={index}>
            <CodeBlock>{part}</CodeBlock>
            <CodeActions>
              <InsertButton onClick={() => handleInsertCode(part)}>
                📝 Insert
              </InsertButton>
              <ReplaceButton onClick={() => handleReplaceCode(part)}>
                🔄 Replace
              </ReplaceButton>
              <InsertButton onClick={() => handleFormatAndInsert(part)}>
                ✨ Format & Insert
              </InsertButton>
            </CodeActions>
          </div>
        );
      } else if (index % 3 === 1) {
        // This is language identifier, skip it
        return null;
      } else {
        // This is regular text
        return part ? <span key={index}>{part}</span> : null;
      }
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      default:
        return '💬';
    }
  };

  return (
    <AIContainer>
      <MessagesContainer>
        {messages.map(message => (
          <Message key={message.id} role={message.role}>
            <MessageHeader>
              <span>{getRoleIcon(message.role)}</span>
              <span>{message.role === 'user' ? 'You' : 'GalactusAI'}</span>
              <span>•</span>
              <span>{message.timestamp.toLocaleTimeString()}</span>
            </MessageHeader>
            <MessageContent>
              {formatMessageContent(message.content)}
            </MessageContent>
          </Message>
        ))}
        
        {streamingMessage && (
          <Message role="assistant">
            <MessageHeader>
              <span>🤖</span>
              <span>GalactusAI</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </MessageHeader>
            <MessageContent>
              {formatMessageContent(streamingMessage)}
              <span style={{ opacity: 0.7, animation: 'pulse 1s infinite' }}>▋</span>
            </MessageContent>
          </Message>
        )}

        {state.ai.isProcessing && !streamingMessage && (
          <LoadingIndicator>
            <span>🤖</span>
            <span>GalactusAI is thinking</span>
            <LoadingDots>
              <span />
              <span />
              <span />
            </LoadingDots>
          </LoadingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <QuickActions>
          <QuickAction onClick={() => handleContextualPrompt("component")}>
            📱 Component
          </QuickAction>
          <QuickAction onClick={() => handleContextualPrompt("debug")}>
            🐛 Debug
          </QuickAction>
          <QuickAction onClick={() => handleContextualPrompt("optimize")}>
            ⚡ Optimize
          </QuickAction>
          <QuickAction onClick={() => handleContextualPrompt("explain")}>
            📖 Explain
          </QuickAction>
          <QuickAction onClick={() => handleContextualPrompt("test")}>
            🧪 Test
          </QuickAction>
          <QuickAction onClick={() => handleContextualPrompt("refactor")}>
            🔄 Refactor
          </QuickAction>
        </QuickActions>
        
        <InputTextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask GalactusAI anything... (Ctrl/Cmd + Enter to send)"
          disabled={state.ai.isProcessing}
        />
        
        <InputActions>
          <div style={{ fontSize: '12px', color: '#6E7681' }}>
            Ctrl/Cmd + Enter to send
          </div>
          <SendButton
            disabled={!input.trim() || state.ai.isProcessing}
            onClick={handleSend}
          >
            Send
          </SendButton>
        </InputActions>
      </InputContainer>
    </AIContainer>
  );
};

export default AIAssistant;