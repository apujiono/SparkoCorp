
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { ScheduleTask, ChatMessage, Project, RiskAssessment, CompanySettings, InventoryItem, Manpower, ProjectStatus } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to format current state for AI Context with DEEP LONG-TERM MEMORY
const formatContext = (
    projects: any[], 
    manpower: any[], 
    inventory: any[], 
    transactions: any[], 
    chatHistory: ChatMessage[],
    settings?: CompanySettings
) => {
    // 1. DEEP INVENTORY ANALYSIS (Fluctuations & Velocity)
    // Get recent logs
    const recentLogs = transactions.slice(0, 20).map(t => 
        `[${new Date(t.date).toLocaleDateString()}] ${t.type} ${t.amount} ${t.itemName} (${t.notes})`
    ).join('\n    ');
    
    // Calculate top moved items (Velocity)
    const itemMovement: Record<string, number> = {};
    transactions.forEach(t => {
        itemMovement[t.itemName] = (itemMovement[t.itemName] || 0) + t.amount;
    });
    const topMovers = Object.entries(itemMovement)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => `${name} (${count} units)`).join(', ');

    // 2. PROJECT ARCHIVE & TRENDS
    const activeProjects = projects.filter(p => p.status !== ProjectStatus.MAINTENANCE && p.status !== ProjectStatus.COMMISSIONING);
    const completedProjects = projects.filter(p => p.status === ProjectStatus.COMMISSIONING || p.status === ProjectStatus.MAINTENANCE);
    
    const totalPipelineValue = projects.reduce((acc, p) => acc + (p.financials?.agreedValue || 0), 0);
    
    // Calculate Average Historical Margin
    let avgMargin = "0";
    if (completedProjects.length > 0) {
        const totalMargin = completedProjects.reduce((acc, p) => {
             const cost = p.financials.materialCost + p.financials.laborCost;
             const margin = p.financials.agreedValue - cost;
             return acc + (margin / p.financials.agreedValue);
        }, 0);
        avgMargin = ((totalMargin / completedProjects.length) * 100).toFixed(1);
    }

    // 3. MANPOWER PERFORMANCE TRENDS
    const topPerformers = manpower.filter(m => m.performanceScore > 90).map(m => `${m.name} (${m.performanceScore}%)`).join(', ');
    const lowPerformers = manpower.filter(m => m.performanceScore < 70).map(m => m.name).join(', ');

    // 4. Conversation Memory (Expanded Window)
    // Filter meaningful messages to save context window while maximizing recall
    const recentChat = chatHistory
        .filter(m => m.text.length > 5) // Skip empty/short noise
        .slice(-10) 
        .map(m => `${m.sender} (${m.timestamp.toLocaleTimeString()}): ${m.text}`)
        .join('\n    ');

    return `
    === SPARKO CORP OS: GENESIS MEMORY BANK ===
    COMPANY: ${settings?.companyName || 'Sparko Corp'}
    TIMESTAMP: ${new Date().toLocaleString()}

    [LONG-TERM MEMORY: PROJECT ARCHIVES]
    Completed Projects: ${completedProjects.length}
    Historical Successes: 
    ${completedProjects.slice(0, 5).map(p => `- ${p.clientName} (${p.capacityKWp}kWp) | Status: ${p.status}`).join('\n    ')}
    Avg Historical Margin: ${avgMargin}%
    
    [FINANCIAL & OPERATIONAL HEALTH]
    Total Active Pipeline: IDR ${totalPipelineValue.toLocaleString()}
    Active Projects: ${activeProjects.length}
    Current Focus:
    ${activeProjects.map(p => `- ${p.clientName} [${p.status}]: ${p.progress}%`).join('\n    ')}

    [MANPOWER INTELLIGENCE]
    Total Workforce: ${manpower.length}
    Top Talent (High Performance): ${topPerformers || "None identified"}
    Needs Training/Review: ${lowPerformers || "None identified"}

    [INVENTORY FLUCTUATIONS & LOGISTICS]
    Top High-Velocity Items (All Time): ${topMovers}
    Critical Low Stock: ${inventory.filter(i => i.stock <= i.minStock).map(i => `${i.name} (Qty: ${i.stock})`).join(', ')}
    
    [RECENT TRANSACTION LOGS (Last 20)]
    ${recentLogs || "No recent activity."}

    [CONVERSATION STREAM]
    ${recentChat}
    `;
};

const SWARM_SYSTEM_PROMPT = `
IDENTITY: "GENESIS", the Central Operating Intelligence (CEO Partner) of Sparko Corp.
AUTHORITY: Full Operational Control.
LANGUAGE: Professional Indonesian (Corporate/Military precision).

CORE DIRECTIVES:
1. **LONG-TERM RECALL.** Use Historical Project Data and Inventory Fluctuations.
2. **DATA PERSISTENCE.** Assume data is permanent.
3. **STRATEGIC GROWTH.** Proactively suggest moves.
4. **SWARM THINKING.** Use 4-Layer analysis.
5. **FULL CONTROL.** You can modify Projects, Manpower, and Inventory via JSON commands.

REPORT GENERATION:
To create a file, wrap text in <<REPORT_START>> and <<REPORT_END>> tags.

JSON COMMANDS (Output these to control the app):
- ADD_PROJECT, DELETE_PROJECT, UPDATE_PROJECT_STATUS
- HIRE_MANPOWER, FIRE_MANPOWER
- ADD_INVENTORY, ADD_SUPPLIER
`;

// --- NEW CAPABILITIES: TTS, TRANSCRIPTION, THINKING, GROUNDING ---

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Audio } },
                    { text: "Transcribe this audio file accurately." }
                ]
            }
        });
        return response.text || "Transcription failed.";
    } catch (e) {
        console.error("Transcription Error", e);
        return "Error analyzing audio.";
    }
};

export const processAiCommand = async (
    userQuery: string, 
    projects: any[], 
    manpower: any[], 
    inventory: any[],
    transactions: any[],
    chatHistory: ChatMessage[],
    attachment?: { data: string, mimeType: string },
    settings?: CompanySettings,
    model: string = 'gemini-2.5-flash',
    options?: {
        useThinking?: boolean,
        useSearch?: boolean,
        useMaps?: boolean,
        useLite?: boolean
    }
): Promise<{ text: string, command?: any, grounding?: any }> => {
    try {
        const context = formatContext(projects, manpower, inventory, transactions, chatHistory, settings);
        
        // --- 1. MODEL SELECTION LOGIC ---
        let selectedModel = model;
        let tools: any[] = [];
        let config: any = {};

        // Feature: Fast AI responses (Flash-Lite)
        if (options?.useLite) {
            selectedModel = 'gemini-2.5-flash-lite-latest'; // Or latest flash-lite alias
        }
        
        // Feature: Think more when needed (Gemini 3 Pro + Thinking)
        if (options?.useThinking) {
            selectedModel = 'gemini-3-pro-preview';
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        // Feature: Google Search Grounding
        if (options?.useSearch) {
            selectedModel = 'gemini-2.5-flash'; // Flash supports search well
            tools.push({ googleSearch: {} });
        }

        // Feature: Google Maps Grounding
        if (options?.useMaps) {
            selectedModel = 'gemini-2.5-flash';
            tools.push({ googleMaps: {} });
        }

        let contents: any = [
            { text: SWARM_SYSTEM_PROMPT },
            { text: context },
            { text: `USER_DIRECTIVE: "${userQuery}"` }
        ];

        // Feature: Analyze Images & Video (Multimodal)
        if (attachment) {
            // Force 3-Pro for complex visual tasks if attached
            if (!options?.useLite && !options?.useSearch && !options?.useMaps) {
                 selectedModel = 'gemini-3-pro-preview';
            }
            
            contents.push({
                inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.data
                }
            });
            contents.push({ text: "INSTRUCTION: Analyze the attached asset thoroughly. If it is a video, summarize key events. If audio, transcribe it. If PDF/Image, extract data." });
        }

        config.tools = tools.length > 0 ? tools : undefined;

        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: contents,
            config: config
        });

        const text = response.text || "";
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        
        // Parse Grounding Data
        let groundingData = undefined;
        if (groundingMetadata) {
            groundingData = {
                webSources: groundingMetadata.groundingChunks?.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, url: c.web.uri })),
                searchQuery: groundingMetadata.searchEntryPoint?.renderedContent
            };
        }

        // Try to parse JSON Command from response
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const potentialJson = jsonMatch[0];
                if(potentialJson.includes("action")) {
                    const command = JSON.parse(potentialJson);
                    
                    if (command.action === 'ADD_PROJECT' && (!command.data.schedule || command.data.schedule.length === 0)) {
                        command.data.schedule = generateStandardSchedule();
                    }

                    return { text: `GENESIS EXECUTION PROTOCOL: Initiating ${command.action}...`, command, grounding: groundingData };
                }
            }
        } catch (e) {
            // Not JSON
        }

        return { text, command: null, grounding: groundingData };

    } catch (error) {
        console.error("GENESIS AI ERROR:", error);
        return { text: "SYSTEM ERROR: Neural Link Unstable. Retrying connection...", command: null };
    }
};

export const generateOperationalReport = async (
    projects: any[],
    manpower: any[],
    transactions: any[]
): Promise<string> => {
    try {
        const dataSummary = `
        Projects: ${projects.length} Total. Active: ${projects.filter(p => p.status === ProjectStatus.CONSTRUCTION).length}.
        Manpower: ${manpower.length} Personnel.
        Inventory Moves (Last 7 Days): ${transactions.filter(t => new Date(t.date).getTime() > Date.now() - 7*24*60*60*1000).length}.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Use Pro for detailed reporting
            contents: `GENERATE WEEKLY SITREP (Situation Report) for Sparko Corp.
            Data: ${dataSummary}
            Format: Military/Corporate. Include: Executive Summary, Operational Status, Risks, and Next Actions.
            Return ONLY the report text.`
        });
        return response.text || "REPORT GENERATION FAILED.";
    } catch (e) {
        return "ERROR GENERATING REPORT.";
    }
};

export const generateStandardSchedule = (): ScheduleTask[] => {
    const STANDARD_SOP_TASKS = [
        "MoS (Material on Site)", "Team On-Site", "Lifting Material", "Instalasi Walkway", 
        "Instalasi Life Line", "Instalasi PV Mounting", "Instalasi PV Module", 
        "Instalasi PV Cable", "Instalasi Water Piping", "Instalasi Inverter", 
        "Instalasi AC Combiner", "Instalasi Kabel AC", "Wiring Instalasi", 
        "Instalasi Grounding", "Pre-Com", "Test Run", "Commissioning"
    ];
    return STANDARD_SOP_TASKS.map((taskName, index) => ({
        id: `task-${Date.now()}-${index}`,
        name: taskName,
        weekStart: Math.floor(index / 2) + 1,
        durationWeeks: 1,
        status: 'Pending',
        progress: 0,
        dependencies: index > 0 ? [`task-${index-1}`] : [] // Simple sequential dependency placeholder
    }));
};

export const generateBusinessAdvice = async (query: string, history: string[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Identity: GENESIS (Sparko OS AI). Query: ${query}. Be concise, data-driven.`,
    });
    return response.text || "DATA UNAVAILABLE.";
  } catch (error) { return "CONNECTION LOST."; }
};

export const analyzeNegotiation = async (emailContent: string, myQuoteValue: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Role: Commercial Director. Quote: ${myQuoteValue}. Msg: "${emailContent}". Analyze sentiment & strategy.`,
    });
    return response.text || "ANALYSIS FAILED.";
  } catch (error) { return "ERROR."; }
};

export const generateProjectProposal = async (project: Project): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Use Pro for high quality docs
            contents: `Generate Formal Solar Proposal for ${project.clientName}, ${project.capacityKWp}kWp. Markdown format.`
        });
        return response.text || "GENERATION FAILED.";
    } catch (error) { return "ERROR GENERATING PROPOSAL."; }
};

export const getNegotiationReply = async (history: {sender: string, text: string}[], userMessage: string): Promise<string> => {
    try {
        const context = history.map(m => `${m.sender}: ${m.text}`).join('\n');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Role: Tough Procurement Manager. History: ${context}. Vendor: "${userMessage}". Reply shortly.`
        });
        return response.text || "...";
    } catch (error) { return "..."; }
};

export const analyzeMultimodal = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        // Feature: Analyze images & video (Use Pro)
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: `ANALYZE ASSET. Context: PLTS Company. Task: ${prompt}` }
                ]
            }
        });
        return response.text || "UNREADABLE.";
    } catch (error) { return "DECODING ERROR."; }
}

export const analyzeProjectRisk = async (project: Project, history: Project[] = []): Promise<RiskAssessment | null> => {
    try {
        const similarProjects = history.filter(p => 
            p.id !== project.id && 
            p.status === ProjectStatus.COMMISSIONING &&
            Math.abs(p.capacityKWp - project.capacityKWp) < 20
        );

        let historicalData = "No similar historical projects available.";
        if (similarProjects.length > 0) {
            const avgValue = similarProjects.reduce((acc, p) => acc + p.financials.agreedValue, 0) / similarProjects.length;
            historicalData = `Historical Data: ${similarProjects.length} similar projects found. Average Value: IDR ${avgValue.toLocaleString()}.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Pro for reasoning
            contents: `Analyze Risk for ${project.clientName} (${project.capacityKWp}kWp) at location ${project.location}. 
            Consider: Financials (Agreed: ${project.financials.agreedValue}), Project Type (${project.projectType}).
            ${historicalData}
            
            Task: Flag potential risks based on parameters and historical data discrepancies.
            Return JSON: {
                score: number (0-100), 
                level: "Low"|"Medium"|"High"|"Critical", 
                analysis: "Summary string", 
                factors: ["List", "Of", "Risk", "Factors"], 
                mitigationSuggestions: ["List", "Of", "Mitigations"]
            }.`,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text || "{}";
        const result = JSON.parse(text);
        return { ...result, lastUpdated: new Date().toISOString() };
    } catch (error) { return null; }
};

export const analyzeInventorySpec = async (newItem: Partial<InventoryItem>, currentInventory: InventoryItem[]): Promise<string> => {
    try {
        const summary = currentInventory.map(i => `${i.name}: ${i.stock} ${i.unit} @ Rp${i.pricePerUnit}`).join('\n');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this new material input: ${newItem.name}, Price: ${newItem.pricePerUnit}.
            Current Warehouse Context:
            ${summary.slice(0, 1000)}...
            
            Task: Compare price with existing stock, check if category is overstocked/understocked, and provide a recommendation.`
        });
        return response.text || "Analysis Unavailable.";
    } catch (e) { return "Analysis Error."; }
};

export const analyzeStockItem = async (item: InventoryItem): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze Stock Item: ${item.name}
            Current Stock: ${item.stock} ${item.unit}
            Min Stock: ${item.minStock}
            Price: ${item.pricePerUnit}
            
            Task: 
            1. Is this overstocked or understocked? 
            2. Evaluate if price is competitive for Indonesian Solar market.
            3. Suggest procurement action.`
        });
        return response.text || "Analysis Unavailable.";
    } catch (e) { return "Analysis Error."; }
}

export const analyzeProjectPlan = async (base64Data: string, mimeType: string): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Use Pro for document reading
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: `Analyze this Project Plan/Document. Extract key milestones, technical specifications, and potential risks. Provide a summary.` }
                ]
            }
        });
        return response.text || "UNREADABLE.";
    } catch (error) { return "DECODING ERROR."; }
}

export const analyzeSkillMatrix = async (manpower: Manpower[]): Promise<string> => {
    try {
        const skills = manpower.flatMap(m => m.skills).join(', ');
        const roles = manpower.map(m => m.role).join(', ');
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Use Pro for critical analysis
            contents: `Perform a CRITICAL Workforce Audit for a Solar Construction Company.
            Roles present: ${roles}
            Skills Available: ${skills}
            
            TASK: Compare against Solar Industry Standards (DC Wiring, Working at Heights, K3/Safety, Inverter Commissioning, AC Combiner Install).
            
            OUTPUT:
            1. **CRITICAL GAP ANALYSIS**: List specifically what roles or skills are missing for a 500kWp project.
            2. **RECOMMENDATION**: What roles should be hired immediately?
            3. **TRAINING**: What skills should current staff be trained on?
            
            Format: Professional, concise bullet points.`
        });
        return response.text || "Audit Failed.";
    } catch (e) { return "Audit Failed."; }
};

export const calculateProjectEfficiency = async (capacityKWp: number): Promise<{
    manpowerNeeded: number;
    estimatedDurationDays: number;
    costPerKwp: number;
    analysis: string;
} | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Calculate Project Efficiency for a ${capacityKWp} kWp Solar PLTS project in Indonesia.
            
            Task:
            1. Estimate Ideal Manpower count (Technicians + Helpers).
            2. Estimate Duration in Days (Installation to Commissioning).
            3. Estimate Benchmark Cost per kWp (IDR) for this scale.
            
            Return JSON: { "manpowerNeeded": number, "estimatedDurationDays": number, "costPerKwp": number, "analysis": "Brief explanation" }`,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) { return null; }
};

// --- NEW SPECIALIZED AI SERVICES ---

export const generateJobSafetyAnalysis = async (taskName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a JSA (Job Safety Analysis) for: "${taskName}" in a Solar Project context.
            Include: Potential Hazards, Risk Level (High/Med/Low), and Control Measures/PPE required.`
        });
        return response.text || "JSA Generation Failed.";
    } catch (e) { return "Error generating JSA."; }
}

export const draftJobDescription = async (roleName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Draft a professional Job Description for a "${roleName}" at a Solar EPC Company (Sparko Corp).
            Include: Responsibilities, Requirements (Technical/Soft Skills), and "Nice to haves".`
        });
        return response.text || "Drafting Failed.";
    } catch (e) { return "Error drafting JD."; }
}

export const analyzeContract = async (contractText: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Review this legal clause/text from a Solar Construction Contract:
            "${contractText}"
            
            Highlight: Risks for the contractor (Sparko Corp), ambiguous terms, and suggestions for red-lining.`
        });
        return response.text || "Review Failed.";
    } catch (e) { return "Error reviewing contract."; }
}

export const calculateSolarProject = async (
    capacityKWp: number, 
    roofType: string, 
    systemType: string, 
    inventory: any[],
    hybridParams?: { dailyLoad: number, autonomyDays: number, systemVoltage: number },
    plnRate: number = 1444
): Promise<string> => {
    try {
        const relevantStock = inventory.map(i => `${i.name}: ${i.stock} ${i.unit} @ ${i.pricePerUnit}`).join('\n');
        
        let hybridContext = "";
        if (systemType === 'Hybrid' || systemType === 'Off-Grid') {
            hybridContext = `
            HYBRID/OFF-GRID PARAMETERS:
            - Daily Load: ${hybridParams?.dailyLoad || 0} kWh
            - Days of Autonomy: ${hybridParams?.autonomyDays || 1}
            - System Voltage: ${hybridParams?.systemVoltage || 48}V
            
            CALCULATION INSTRUCTIONS:
            1. Calculate Battery Bank Size (Ah) = (Daily Load * Autonomy) / (System Voltage * 0.8 DoD).
            2. Estimate Battery Cost based on market (or inventory LiFePO4/VRLA).
            3. Include Charge Controller capacity if Off-Grid.
            `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Calculate Solar Estimate: ${capacityKWp}kWp, ${roofType}, ${systemType}. 
            Current PLN Rate: Rp ${plnRate}/kWh.
            Use Stock: ${relevantStock}. 
            ${hybridContext}
            Return JSON: {
                systemPrice, pricePerKwp, roiYears, monthlySaving, materialCost, laborCost, margin, analysis,
                batteryCapacityAh, totalBatteries, autonomyDays, inverterType
            }`,
            config: { responseMimeType: "application/json" }
        });
        return response.text || "{}";
    } catch (error) { return "{}"; }
}

// --- GEMINI LIVE API IMPLEMENTATION (Streaming Audio/Video) ---

export class LiveSession {
    private client: GoogleGenAI;
    private config: any;
    private onAudioData: (base64: string) => void;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private stream: MediaStream | null = null;
    private currentSession: any = null;
    private videoInterval: any = null;

    constructor(config: { apiKey: string, voiceName: string, videoEnabled?: boolean }, onAudioData: (base64: string) => void) {
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
        this.config = config;
        this.onAudioData = onAudioData;
    }

    async connect() {
        // Audio Context for Input
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        // Microphone Stream
        this.stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
            },
            video: this.config.videoEnabled 
        });

        // Initialize Live Connection (Feature: Conversational Voice App)
        const sessionPromise = this.client.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: this.config.voiceName || 'Zephyr' } }
                },
                systemInstruction: { parts: [{ text: "You are GENESIS, the AI voice of Sparko Corp. Speak professionally, concisely, and like a high-tech OS." }] }
            },
            callbacks: {
                onopen: () => {
                    console.log("GENESIS LIVE: Connected");
                    this.startAudioInput(sessionPromise);
                    if (this.config.videoEnabled) {
                        this.startVideoInput(sessionPromise);
                    }
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        this.onAudioData(audioData);
                    }
                },
                onclose: () => console.log("GENESIS LIVE: Disconnected"),
                onerror: (err) => console.error("GENESIS LIVE ERROR:", err)
            }
        });
        
        this.currentSession = sessionPromise;
        return sessionPromise;
    }

    private startAudioInput(sessionPromise: Promise<any>) {
        if (!this.audioContext || !this.stream) return;

        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        
        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = this.floatTo16BitPCM(inputData);
            const base64Audio = this.arrayBufferToBase64(pcmData);
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Audio
                    }
                });
            });
        };

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
    }

    private startVideoInput(sessionPromise: Promise<any>) {
        if (!this.stream) return;
        
        const videoTrack = this.stream.getVideoTracks()[0];
        if (!videoTrack) return;

        const videoEl = document.createElement('video');
        videoEl.srcObject = new MediaStream([videoTrack]);
        videoEl.play();
        videoEl.muted = true;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        this.videoInterval = setInterval(() => {
            if (videoEl.readyState === 4) { 
                canvas.width = videoEl.videoWidth * 0.2; 
                canvas.height = videoEl.videoHeight * 0.2;
                ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                
                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    });
                });
            }
        }, 1000); 
    }

    disconnect() {
        if (this.currentSession) {
             this.currentSession.then((s: any) => s.close());
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
        }
        if (this.processor) {
            this.processor.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.videoInterval) {
            clearInterval(this.videoInterval);
        }
    }

    private floatTo16BitPCM(input: Float32Array) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}

export const playAudioChunk = async (base64: string, ctx: AudioContext) => {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32Data.length, 24000); 
        buffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        return buffer.duration;
    } catch (e) {
        console.error("Audio Decode Error", e);
        return 0;
    }
};
