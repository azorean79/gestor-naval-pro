'use client';

import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: AssistenteAction;
}

export interface AssistenteAction {
  type: string;
  params: Record<string, any>;
  executed?: boolean;
  result?: any;
}

export function useAssistente() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Olá! Sou o Julinho, o seu assistente inteligente para gestão naval. Posso ajudá-lo com:\n\n• Criar e gerir jangadas salva-vidas\n• Agendar inspeções SOLAS/IMO\n• Consultar stock e componentes\n• Gerar relatórios e certificados\n• Gerir clientes e navios\n• Criar obras e faturas\n\nComo posso ajudar hoje?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao comunicar com o assistente');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Execute action if present
      if (data.action) {
        await executeAction(data.action);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const executeAction = useCallback(async (action: AssistenteAction) => {
    try {
      const response = await fetch('/api/assistente/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        throw new Error('Erro ao executar ação');
      }

      const result = await response.json();
      
      // Update message with action result
      setMessages((prev) =>
        prev.map((msg) =>
          msg.action?.type === action.type
            ? { ...msg, action: { ...msg.action, executed: true, result } }
            : msg
        )
      );

      return result;
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      throw error;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '👋 Olá! Sou o Julinho. Como posso ajudar?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    clearMessages,
    toggleOpen,
    setIsOpen,
  };
}
