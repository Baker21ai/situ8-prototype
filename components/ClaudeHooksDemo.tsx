import React, { useState } from 'react';
// Testing Claude Hooks - this comment should trigger notifications!
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useClaude } from '../contexts/ClaudeContext';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Download, 
  Upload, 
  Settings,
  Bot,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bell,
  Volume2,
  VolumeX,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export function ClaudeHooksDemo() {
  const {
    chats,
    activeChat,
    createChat,
    selectChat,
    deleteChat,
    sendMessage,
    isProcessing,
    lastCompletedChat,
    config,
    updateConfig,
    clearHistory,
    exportChats,
    importChats,
  } = useClaude();

  const [messageInput, setMessageInput] = useState('');
  const [newChatTitle, setNewChatTitle] = useState('');

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      if (!activeChat) {
        createChat(newChatTitle || 'New Chat');
      }
      
      await sendMessage(messageInput);
      setMessageInput('');
      setNewChatTitle('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleImportChats = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importChats(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportChats = () => {
    const data = exportChats();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-chats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'streaming':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-500" />
            Claude Hooks Demo
            <Badge variant="outline" className="ml-auto">
              {chats.length} chats
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat Interface</TabsTrigger>
              <TabsTrigger value="history">Chat History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Chat List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Chats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                              activeChat?.id === chat.id
                                ? 'bg-blue-50 border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => selectChat(chat.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                {chat.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {chat.messages.length}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={chat.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {chat.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {chat.updatedAt.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <Input
                        placeholder="New chat title (optional)"
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                      />
                      <Button 
                        onClick={() => createChat(newChatTitle || undefined)}
                        className="w-full"
                        size="sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        New Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Messages */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>
                        {activeChat ? activeChat.title : 'No active chat'}
                      </span>
                      {activeChat && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteChat(activeChat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 mb-4">
                      <div className="space-y-4">
                        {activeChat?.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs opacity-75">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                                {getStatusIcon(message.status)}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">
                                {message.content || (message.status === 'pending' ? 'Thinking...' : '')}
                              </p>
                              {message.metadata && (
                                <div className="text-xs opacity-75 mt-2">
                                  {message.metadata.model} • {message.metadata.tokens} tokens • {message.metadata.duration}ms
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        disabled={isProcessing}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={isProcessing || !messageInput.trim()}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Bar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span>Status: {isProcessing ? 'Processing...' : 'Ready'}</span>
                      {lastCompletedChat && (
                        <span className="text-green-600">
                          Last completed: {lastCompletedChat.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {config.enableNotifications && <Bell className="h-4 w-4 text-blue-500" />}
                      {config.enableSounds ? (
                        <Volume2 className="h-4 w-4 text-blue-500" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-400" />
                      )}
                      {config.autoSaveChats && <Save className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Chat History
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleImportChats}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportChats}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="destructive" size="sm" onClick={clearHistory}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {chats.map((chat) => (
                        <Card key={chat.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{chat.title}</h4>
                            <Badge variant="outline">{chat.status}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {chat.messages.length} messages • Created {chat.createdAt.toLocaleString()}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => selectChat(chat.id)}
                            >
                              Open
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteChat(chat.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Claude Hooks Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Enable Notifications</Label>
                      <p className="text-sm text-gray-600">Show toast notifications when chats complete</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={config.enableNotifications}
                      onCheckedChange={(checked) => updateConfig({ enableNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sounds">Enable Sounds</Label>
                      <p className="text-sm text-gray-600">Play notification sounds</p>
                    </div>
                    <Switch
                      id="sounds"
                      checked={config.enableSounds}
                      onCheckedChange={(checked) => updateConfig({ enableSounds: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autosave">Auto-save Chats</Label>
                      <p className="text-sm text-gray-600">Automatically save chats to localStorage</p>
                    </div>
                    <Switch
                      id="autosave"
                      checked={config.autoSaveChats}
                      onCheckedChange={(checked) => updateConfig({ autoSaveChats: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxHistory">Max Chat History</Label>
                    <Input
                      id="maxHistory"
                      type="number"
                      value={config.maxChatHistory}
                      onChange={(e) => updateConfig({ maxChatHistory: parseInt(e.target.value) || 50 })}
                      min="1"
                      max="1000"
                    />
                    <p className="text-sm text-gray-600">Maximum number of chats to keep in history</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationDuration">Notification Duration (ms)</Label>
                    <Input
                      id="notificationDuration"
                      type="number"
                      value={config.notificationDuration}
                      onChange={(e) => updateConfig({ notificationDuration: parseInt(e.target.value) || 4000 })}
                      min="1000"
                      max="10000"
                      step="500"
                    />
                    <p className="text-sm text-gray-600">How long notifications stay visible</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}