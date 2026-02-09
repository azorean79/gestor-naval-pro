"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, X, MessageCircle } from "lucide-react";
import { JulinhoWidget } from "./dashboard/julinho-widget";
import { JulinhoChatbot } from "./julinho-chatbot";

export function AssistenteJulinho() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);

  // Simulate checking for new suggestions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would check the API for new suggestions
      // For now, we'll just randomly show the indicator sometimes
      setHasNewSuggestions(Math.random() > 0.8);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {hasNewSuggestions && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            size="icon"
          >
            <Lightbulb className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4">
          <Card className="w-full max-w-md h-[80vh] max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Assistente Julinho</h3>
                {hasNewSuggestions && (
                  <Badge variant="destructive" className="text-xs">
                    Novo
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex border-b">
              <Button
                variant={activeTab === 'suggestions' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('suggestions')}
                className="flex-1 rounded-none border-r"
                size="sm"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Sugestões
              </Button>
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className="flex-1 rounded-none"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>

            <CardContent className="flex-1 overflow-hidden p-0">
              {activeTab === 'suggestions' ? (
                <div className="h-full overflow-y-auto p-4">
                  <JulinhoWidget />
                </div>
              ) : (
                <div className="h-full">
                  <JulinhoChatbot isOpen={true} onToggle={() => {}} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}