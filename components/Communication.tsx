
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Project, Manpower, InventoryItem, InventoryTransaction } from '../types';
import { processAiCommand, analyzeMultimodal, generateOperationalReport, LiveSession, playAudioChunk, generateSpeech, transcribeAudio } from '../services/geminiService';
import { Send, Terminal, Paperclip, Download, Cpu, Activity, User, Bot, Check, RefreshCw, Hexagon, Zap, ThumbsUp, ThumbsDown, BookOpen, FileText, Copy, Video, Mic, MicOff, PhoneOff, Camera, CameraOff, Globe, Map, Brain, Speaker, PlayCircle, Loader2 } from 'lucide-react';

/* Props Interface Omitted for Brevity */

const SwarmVisualizer = () => (
    <div className="flex items-center gap-4 py-4 px-6 bg-purple-900/10 border border-purple-500/20 rounded-xl animate-fade-in mx-12">
        <div className="flex gap-2">
            {[1,2,3,4].map(i => (
                <div key={i} className="flex flex-col items-center gap-1">
                    <Hexagon size={24} className={`text-orange-500 animate-pulse`} style={{animationDelay: `${i * 150}ms`}} fill={i % 2 === 0 ? "rgba(249, 115, 22, 0.2)" : "none"} />
                    <div className="w-1 h-8 bg-orange-500/30 rounded-full"></div>
                </div>
            ))}
        </div>
        <div className="flex-1 font-mono text-xs text-purple-300 space-y-1">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div> NODE_1: CONTEXT_INGESTION...</div>
            <div className="flex items-center gap-2 opacity-70"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> NODE_2: STRATEGIC_ANALYSIS...</div>
            <div className="flex items-center gap-2 opacity-50"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> NODE_3: RISK_ASSESSMENT...</div>
            <div className="flex items-center gap-2 opacity-30"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> NODE_4: EXECUTIVE_SYNTHESIS...</div>
        </div>
    </div>
);

// Live Video Interface Component
const LiveInterface = ({ onClose }: { onClose: () => void }) => {
    const [status, setStatus] = useState('Initializing...');
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const initSession = async () => {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const apiKey = process.env.API_KEY || ''; 
                sessionRef.current = new LiveSession(
                    { apiKey, voiceName: 'Zephyr', videoEnabled: true },
                    async (audioBase64) => {
                        if (!audioContextRef.current) return;
                        setAiSpeaking(true);
                        const duration = await playAudioChunk(audioBase64, audioContextRef.current);
                        setTimeout(() => setAiSpeaking(false), duration * 1000);
                    }
                );
                await sessionRef.current.connect();
                setStatus('GENESIS LIVE: CONNECTED');
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error(e);
                setStatus('CONNECTION FAILED');
            }
        };
        initSession();
        return () => {
            sessionRef.current?.disconnect();
            audioContextRef.current?.close();
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-0 right-0 text-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400 tracking-widest flex items-center justify-center gap-3">
                    <Activity className="text-orange-500 animate-pulse"/> GENESIS LIVE
                </h2>
                <p className="text-xs text-purple-400 font-mono mt-2">{status}</p>
            </div>
            <div className="relative w-full max-w-4xl aspect-video bg-[#0a0210] rounded-2xl border border-purple-500/30 overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.2)]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`relative transition-all duration-300 ${aiSpeaking ? 'scale-110' : 'scale-100'}`}>
                         <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-orange-600 blur-xl opacity-50 animate-pulse"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                              <Hexagon size={64} className="text-white fill-white/10" strokeWidth={1} />
                         </div>
                         {aiSpeaking && (
                             <div className="absolute -inset-8 border border-orange-500/50 rounded-full animate-[spin_4s_linear_infinite]"></div>
                         )}
                    </div>
                </div>
                {camOn && (
                    <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-xl border border-white/20 overflow-hidden shadow-2xl">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    </div>
                )}
            </div>
            <div className="mt-8 flex gap-6">
                 <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full border ${micOn ? 'bg-slate-800 border-slate-600 text-white' : 'bg-red-900/50 border-red-500 text-red-400'}`}>
                     {micOn ? <Mic size={24}/> : <MicOff size={24}/>}
                 </button>
                 <button onClick={onClose} className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                     <PhoneOff size={24} />
                 </button>
                 <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full border ${camOn ? 'bg-slate-800 border-slate-600 text-white' : 'bg-red-900/50 border-red-500 text-red-400'}`}>
                     {camOn ? <Camera size={24}/> : <CameraOff size={24}/>}
                 </button>
            </div>
        </div>
    );
};

export const CommunicationHub: React.FC<any> = ({ 
  projects, setProjects, manpower, setManpower, inventory, setInventory, transactions 
}) => {
  const savedMessages = localStorage.getItem('sparko_chat_history_v3');
  const [messages, setMessages] = useState<ChatMessage[]>(savedMessages ? JSON.parse(savedMessages).map((m:any) => ({...m, timestamp: new Date(m.timestamp)})) : []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, type: string, name: string} | null>(null);
  const [isLive, setIsLive] = useState(false);
  
  // NEW STATES FOR FEATURES
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useLite, setUseLite] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('sparko_chat_history_v3', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
      if(!input.trim() && !attachment) return;
      const newMsg: ChatMessage = { 
          id: Date.now().toString(), sender: 'CEO', text: input, timestamp: new Date(), channel: 'Management',
          attachment: attachment?.data, attachmentName: attachment?.name, attachmentType: attachment?.type as any
      };
      setMessages(prev => [...prev, newMsg]);
      setInput('');
      const currAttachment = attachment;
      setAttachment(null);
      setIsTyping(true);

      let result;
      // Feature: Audio Transcription
      if (currAttachment && currAttachment.type.startsWith('audio/')) {
          const base64 = currAttachment.data.split(',')[1];
          const transcription = await transcribeAudio(base64, currAttachment.type);
          result = { text: `[AUDIO TRANSCRIPTION]:\n${transcription}`, command: null };
      } 
      // Feature: File Analysis (Images/Video/PDF)
      else if (currAttachment) {
          const base64 = currAttachment.data.split(',')[1];
          // Use Flash Lite for quick images if Thinking is OFF, else use Pro
          const text = await analyzeMultimodal(base64, currAttachment.type, input || "Analyze this asset.");
          result = { text, command: null };
      } 
      // Standard/Thinking/Grounded Request
      else {
          result = await processAiCommand(
              input, projects, manpower, inventory, transactions, messages, undefined, undefined, 'gemini-2.5-flash',
              { useThinking, useSearch, useMaps, useLite }
          );
      }
      
      setIsTyping(false);
      setMessages(prev => [...prev, {
          id: Date.now().toString(), sender: 'GENESIS', isAi: true, 
          text: result.text, timestamp: new Date(), channel: 'Management',
          groundingMetadata: result.grounding
      }]);
  };

  const handleTTS = async (text: string) => {
      // Feature: Generate Speech (TTS)
      const audioData = await generateSpeech(text);
      if (audioData) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          playAudioChunk(audioData, ctx);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => {
              setAttachment({
                  data: reader.result as string,
                  type: file.type,
                  name: file.name
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="flex h-full bg-[#05010a] font-sans overflow-hidden">
      {isLive && <LiveInterface onClose={() => setIsLive(false)} />}

      {/* Sidebar */}
      <div className="w-72 bg-[#090214] border-r border-purple-900/20 hidden md:flex flex-col">
          <div className="p-6 border-b border-purple-900/20">
              <h3 className="text-white font-bold flex items-center gap-2 tracking-wide text-sm"><Terminal className="text-orange-500" size={16}/> GENESIS UPLINK</h3>
          </div>
          <div className="p-4 space-y-3">
              <button onClick={() => setIsLive(true)} className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition animate-pulse">
                  <Video size={14}/> GENESIS LIVE
              </button>
              <button onClick={() => {}} className="w-full bg-slate-800 text-slate-300 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition">
                   <Mic size={14}/> Voice Memo (Transcribe)
              </button>
          </div>
          <div className="p-4 mt-auto border-t border-purple-900/20">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Active Protocols</h4>
              <div className="space-y-2 text-xs text-slate-400">
                  <div className={`flex justify-between ${useThinking ? 'text-green-400' : ''}`}><span>Deep Thinking</span> <span>{useThinking ? 'ON' : 'OFF'}</span></div>
                  <div className={`flex justify-between ${useSearch ? 'text-blue-400' : ''}`}><span>Web Grounding</span> <span>{useSearch ? 'ON' : 'OFF'}</span></div>
                  <div className={`flex justify-between ${useMaps ? 'text-orange-400' : ''}`}><span>Map Grounding</span> <span>{useMaps ? 'ON' : 'OFF'}</span></div>
                  <div className={`flex justify-between ${useLite ? 'text-yellow-400' : ''}`}><span>Lite Mode</span> <span>{useLite ? 'ON' : 'OFF'}</span></div>
              </div>
          </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-[#05010a] relative">
          <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-[#05010a] to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-28 custom-scrollbar">
              {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-4 ${msg.sender === 'CEO' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${msg.isAi ? 'bg-[#130722] border-orange-500 text-orange-500' : 'bg-purple-900/50 border-purple-500 text-purple-200'}`}>
                          {msg.isAi ? <Bot size={20} /> : <User size={20} />}
                      </div>
                      <div className={`max-w-[70%] space-y-1 ${msg.sender === 'CEO' ? 'items-end flex flex-col' : ''}`}>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                              {msg.sender} <span className="font-normal opacity-50">{msg.timestamp.toLocaleTimeString()}</span>
                          </div>
                          
                          <div className={`relative group p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'CEO' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-[#0f0518] text-slate-200 rounded-tl-none border border-purple-900/50 shadow-lg'}`}>
                              {/* Action Buttons */}
                              {msg.isAi && (
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleTTS(msg.text)} className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-slate-400 hover:text-white" title="Speak"><Speaker size={12}/></button>
                                      <button onClick={() => copyToClipboard(msg.text)} className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-slate-400 hover:text-white" title="Copy"><Copy size={12}/></button>
                                  </div>
                              )}

                              {msg.attachmentName && (
                                  <div className="mb-2 p-2 bg-black/20 rounded border border-white/10 flex items-center gap-2 text-xs">
                                      <Paperclip size={12}/> {msg.attachmentName}
                                  </div>
                              )}
                              
                              <div>{msg.text}</div>

                              {/* Grounding Sources */}
                              {msg.groundingMetadata?.webSources && (
                                  <div className="mt-4 pt-3 border-t border-white/10">
                                      <p className="text-[10px] text-slate-500 uppercase mb-1">Sources Cited:</p>
                                      <div className="flex flex-wrap gap-2">
                                          {msg.groundingMetadata.webSources.map((s, idx) => (
                                              <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[10px] text-blue-400 border border-white/10">
                                                  <Globe size={10} /> {s.title}
                                              </a>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ))}
              
              {isTyping && <SwarmVisualizer />}
              <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="absolute bottom-6 left-6 right-6 glass-panel rounded-2xl p-2 flex items-center gap-2 border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.1)]">
              {/* Feature Toggles */}
              <div className="absolute -top-10 left-0 flex gap-2">
                   <button onClick={() => { setUseThinking(!useThinking); setUseLite(false); }} className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${useThinking ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-black/80 border-slate-700 text-slate-500'}`}>
                       <Brain size={14}/> Think
                   </button>
                   <button onClick={() => { setUseSearch(!useSearch); setUseLite(false); }} className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${useSearch ? 'bg-blue-900/50 border-blue-500 text-blue-400' : 'bg-black/80 border-slate-700 text-slate-500'}`}>
                       <Globe size={14}/> Web
                   </button>
                   <button onClick={() => { setUseMaps(!useMaps); setUseLite(false); }} className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${useMaps ? 'bg-orange-900/50 border-orange-500 text-orange-400' : 'bg-black/80 border-slate-700 text-slate-500'}`}>
                       <Map size={14}/> Map
                   </button>
                   <button onClick={() => { setUseLite(!useLite); setUseThinking(false); }} className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${useLite ? 'bg-yellow-900/50 border-yellow-500 text-yellow-400' : 'bg-black/80 border-slate-700 text-slate-500'}`}>
                       <Zap size={14}/> Lite
                   </button>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf,video/*,audio/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-purple-400 hover:text-white transition relative hover:bg-white/5 rounded-xl">
                  <Paperclip size={20}/>
                  {attachment && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>}
              </button>
              
              <input 
                value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent text-white outline-none placeholder-purple-300/30 text-sm font-medium px-2"
                placeholder={attachment ? `Analyzing ${attachment.name}...` : useThinking ? "Ask a complex question..." : "Message Genesis AI..."}
              />
              <button onClick={handleSend} className="p-3 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white rounded-xl transition shadow-lg shadow-purple-900/30">
                  <Send size={18} />
              </button>
          </div>
      </div>
    </div>
  );
};
