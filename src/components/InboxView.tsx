import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Send, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  User, 
  Users, 
  Mail, 
  Plus,
  ArrowLeft,
  X,
  Filter,
  MessageSquare,
  BadgeAlert,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiService } from '@/lib/apiService';
import { Message, Student, Teacher, RecipientType, MessagePriority, MessageCategory } from '../types';
import { cn } from '@/lib/utils';

interface InboxViewProps {
  currentUser: any;
  userRole: 'admin' | 'staff' | 'student';
  students: Student[];
  teachers: Teacher[];
}

export default function InboxView({ currentUser, userRole, students, teachers }: InboxViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Real-time listener for messages via API polling
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const msgs = await apiService.getMessagesForUser(currentUser.id, userRole || 'student', currentUser.batch);
        setMessages(msgs);
      } catch (err) {
        console.error("Error polling messages:", err);
      } finally {
        setLoading(false);
      }
    };
    pollMessages();
    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser, userRole]);

  const threads = useMemo(() => {
    // Group messages by "conversation"
    // For simplicity, we'll treat each broadcast as a thread, 
    // and private chats between two users as a thread.
    const threadMap = new Map<string, Message[]>();
    
    messages.forEach(msg => {
      let threadKey = '';
      if (msg.recipientType === 'Individual') {
        const otherId = msg.senderId === currentUser.id ? msg.recipientArray[0] : msg.senderId;
        threadKey = `private-${[currentUser.id, otherId].sort().join('-')}`;
      } else {
        threadKey = `broadcast-${msg.recipientType}-${msg.batchId || 'all'}`;
      }
      
      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, []);
      }
      threadMap.get(threadKey)?.push(msg);
    });

    return Array.from(threadMap.entries()).map(([id, msgs]) => ({
      id,
      messages: msgs,
      lastMessage: msgs[0],
      unreadCount: msgs.filter(m => m.senderId !== currentUser.id && !m.readBy?.includes(currentUser.id)).length
    })).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [messages, currentUser.id]);

  const activeThread = useMemo(() => 
    threads.find(t => t.id === selectedThreadId), 
    [threads, selectedThreadId]
  );

  useEffect(() => {
    if (activeThread) {
      activeThread.messages.forEach(msg => {
        if (msg.senderId !== currentUser.id && !msg.readBy?.includes(currentUser.id)) {
          apiService.markMessageAsRead(msg.id, currentUser.id);
        }
      });
    }
  }, [activeThread, currentUser.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-180px)] flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 border-b-4 border-indigo-500 pb-1 w-fit">Message Center</h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time communication & broadcasts</p>
        </div>
        <Button onClick={() => setIsComposeOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl px-6 h-12 shadow-lg shadow-indigo-100">
          <Plus className="w-5 h-5 mr-2" /> New Message
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Threads List */}
        <Card className="w-80 flex flex-col border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
          <div className="p-6 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search chats..." 
                className="pl-10 h-11 bg-slate-50 border-none rounded-2xl text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="py-2 space-y-1">
              {threads.filter(t => {
                const search = searchQuery.toLowerCase();
                const lastMsg = t.lastMessage;
                return lastMsg.senderName.toLowerCase().includes(search) || lastMsg.text.toLowerCase().includes(search);
              }).map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={cn(
                    "w-full p-4 rounded-[2rem] text-left transition-all group flex items-start gap-3",
                    selectedThreadId === thread.id 
                      ? "bg-indigo-50 shadow-inner" 
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm overflow-hidden">
                    {thread.lastMessage.recipientType === 'Individual' ? (
                      <User className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <Users className="w-6 h-6 text-indigo-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 truncate text-sm">
                        {thread.lastMessage.recipientType === 'Individual' 
                          ? (thread.lastMessage.senderId === currentUser.id 
                              ? (thread.lastMessage.recipientType === 'Individual' ? 'Private Chat' : thread.lastMessage.recipientType) 
                              : thread.lastMessage.senderName)
                          : thread.lastMessage.category === 'Broadcast' ? `Broadcast: ${thread.lastMessage.recipientType}` : thread.lastMessage.senderName
                        }
                      </span>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-indigo-600 text-[10px] px-1.5 h-4 min-w-4 flex items-center justify-center rounded-full">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs mt-1 truncate",
                      thread.unreadCount > 0 ? "font-bold text-indigo-600" : "text-slate-500"
                    )}>
                      {thread.lastMessage.text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] flex flex-col bg-slate-50/50">
          {activeThread ? (
            <>
              <div className="p-6 bg-white border-b border-slate-100 rounded-t-[2.5rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {activeThread.lastMessage.recipientType === 'Individual' 
                        ? 'Direct Message' 
                        : `${activeThread.lastMessage.recipientType} Broadcast`
                      }
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {activeThread.lastMessage.category} • {activeThread.messages.length} messages
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {activeThread.messages.slice().reverse().map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        msg.senderId === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.senderName}</span>
                        <span className="text-[9px] text-slate-300 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn(
                        "p-4 rounded-3xl text-sm shadow-sm",
                        msg.senderId === currentUser.id 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.text}
                      </div>
                      {msg.senderId === currentUser.id && (
                        <div className="mt-1 px-1 flex items-center gap-1">
                          <StatusIcon status={msg.readBy.length > 0 ? 'Read' : 'Sent'} />
                          <span className="text-[9px] text-slate-400 font-bold">
                            {msg.readBy.length > 0 ? 'Read' : 'Sent'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100 rounded-b-[2.5rem]">
                <ChatInput 
                  onSend={(content) => {
                    const lastMsg = activeThread.lastMessage;
                    handleQuickReply(lastMsg, content);
                  }} 
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-6">
                <Mail className="w-12 h-12 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Your Inbox</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">Select a conversation from the left to start messaging. Broadcasts and direct inquiries will appear here.</p>
            </div>
          )}
        </Card>
      </div>

      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        currentUser={currentUser}
        userRole={userRole}
        students={students}
        teachers={teachers}
      />
    </motion.div>
  );

  async function handleQuickReply(originalMsg: Message, content: string) {
    if (!content.trim()) return;

    const recipientArray = originalMsg.recipientType === 'Individual' 
      ? [originalMsg.senderId === currentUser.id ? originalMsg.recipientArray[0] : originalMsg.senderId]
      : originalMsg.recipientArray;

    await apiService.sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.role === 'Admin' ? 'Admin' : currentUser.name,
      text: content,
      recipientArray
    });
  }
}

function StatusIcon({ status }: { status: 'Sent' | 'Delivered' | 'Read' }) {
  if (status === 'Read') return <CheckCheck className="w-3 h-3 text-indigo-500" />;
  if (status === 'Delivered') return <CheckCheck className="w-3 h-3 text-slate-300" />;
  return <Check className="w-3 h-3 text-slate-300" />;
}

function ChatInput({ onSend }: { onSend: (content: string) => void }) {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (content.trim()) {
      onSend(content);
      setContent('');
    }
  };

  return (
    <div className="flex gap-3">
      <Input 
        placeholder="Type your message..." 
        className="flex-1 h-12 bg-slate-50 border-none rounded-2xl px-6"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
      />
      <Button 
        onClick={handleSend}
        className="w-12 h-12 p-0 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}

function ComposeModal({ isOpen, onClose, currentUser, userRole, students, teachers }: any) {
  const [recipientType, setRecipientType] = useState<RecipientType>('Individual');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<MessagePriority>('Normal');
  const [category, setCategory] = useState<MessageCategory>('General');
  const [sending, setSending] = useState(false);

  const batches = useMemo(() => Array.from(new Set(students.map((s: Student) => s.batch))), [students]);

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error('Please enter message content');
      return;
    }

    if (recipientType === 'Individual' && !selectedRecipientId) {
      toast.error('Please select a recipient');
      return;
    }

    if (recipientType === 'Batch' && !selectedBatch) {
      toast.error('Please select a batch');
      return;
    }

    setSending(true);
    try {
      let recipientArray: string[] = [];
      if (recipientType === 'Individual') {
        recipientArray = [selectedRecipientId];
      } else if (recipientType === 'All Teachers') {
        recipientArray = teachers.map((t: Teacher) => t.id);
      } else if (recipientType === 'All Students') {
        recipientArray = students.map((s: Student) => s.id);
      } else if (recipientType === 'Batch') {
        recipientArray = students.filter((s: Student) => s.batch === selectedBatch).map((s: Student) => s.id);
      }

      await apiService.sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.role === 'Admin' ? 'Admin' : currentUser.name,
        text: content,
        recipientArray
      });

      toast.success('Message sent successfully');
      onClose();
      setContent('');
      setSelectedRecipientId('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none p-8 gap-6">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">New Message</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Recipient Type</label>
              <Select value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual User</SelectItem>
                  {userRole !== 'student' && (
                    <>
                      <SelectItem value="All Teachers">All Faculty</SelectItem>
                      <SelectItem value="All Students">All Students</SelectItem>
                      <SelectItem value="Batch">Specific Batch</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Priority</label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Inquiry">Support Inquiry</SelectItem>
                  <SelectItem value="Feedback">Feedback</SelectItem>
                  <SelectItem value="Alert">Important Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {recipientType === 'Individual' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select User</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId}>
                  <SelectTrigger className="pl-11 h-12 bg-slate-50 border-none rounded-2xl">
                    <SelectValue placeholder="Search by name or SKIT ID" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 border-b mb-1">Faculty & Admin</div>
                    {[...teachers].sort((a, b) => (a.role === 'Admin' ? -1 : 1)).map((t: Teacher) => (
                      <SelectItem key={t.id} value={t.id}>{t.role === 'Admin' ? '✨ System Administrator' : t.name} ({t.employeeId})</SelectItem>
                    ))}
                    <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 border-b my-1">Students</div>
                    {students.map((s: Student) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.collegeId || s.rollNo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {recipientType === 'Batch' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select Batch</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl">
                  <SelectValue placeholder="Select batch name" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b: string) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Message Content</label>
            <textarea 
              className="w-full min-h-[120px] p-4 bg-slate-50 border-none rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
              placeholder="Type your message here..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-2xl h-12 px-6">Cancel</Button>
          <Button 
            onClick={handleSend} 
            disabled={sending}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-8 shadow-lg shadow-indigo-100"
          >
            {sending ? 'Sending...' : 'Send Message'} <Send className="ml-2 w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
