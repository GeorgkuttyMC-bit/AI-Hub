import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { SAMPLE_JOBS } from "./src/data";
import { Job } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry and fallback checking
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini SDK successfully initialized on server.");
  } catch (err) {
    console.error("Failed to initialize Gemini SDK:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found, running in database-only mode.");
}

// Memory cache for AI-searched results to save API quota and load extremely fast
const aiSearchCache: Map<string, Job[]> = new Map();

// REST API endpoint: Get jobs with local filters
app.get("/api/jobs", (req, res) => {
  try {
    const { query, location, workType, experienceLevel } = req.query;

    let filtered = [...SAMPLE_JOBS];

    if (query) {
      const q = String(query).toLowerCase();
      filtered = filtered.filter(
        j => j.title.toLowerCase().includes(q) ||
             j.company.toLowerCase().includes(q) ||
             j.description.toLowerCase().includes(q) ||
             j.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (location && location !== "All") {
      const loc = String(location).toLowerCase();
      filtered = filtered.filter(j => j.location.toLowerCase() === loc);
    }

    if (workType && workType !== "All") {
      filtered = filtered.filter(j => j.workType.toLowerCase() === String(workType).toLowerCase());
    }

    if (experienceLevel && experienceLevel !== "All") {
      filtered = filtered.filter(j => j.experienceLevel === String(experienceLevel));
    }

    res.json({
      success: true,
      jobs: filtered,
      source: "database"
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// REST API endpoint: Trigger a dynamic live search using Gemini Search Grounding
app.post("/api/jobs/ai-search", async (req, res) => {
  try {
    const { query = "", location = "All", workType = "All" } = req.body;

    // Check cache first to respond instantly for repeated keys
    const cacheKey = `${query}_${location}_${workType}`.toLowerCase().trim();
    if (aiSearchCache.has(cacheKey)) {
      return res.json({
        success: true,
        jobs: aiSearchCache.get(cacheKey),
        source: "ai_live",
        cached: true
      });
    }

    if (!ai) {
      return res.status(200).json({
        success: false,
        source: "database",
        error: "Gemini AI Search is currently unavailable (missing API key on Server). Showing offline curated jobs instead.",
        jobs: []
      });
    }

    const locPrompt = location === "All" ? "anywhere in India, focused on main metro cities, Bangalore, and Kochi" : `${location}, India`;
    const typePrompt = workType === "All" ? "Remote, Work from Office (WFO), or Hybrid" : `${workType} (Work From Office/Home)`;
    const searchQuery = query ? query : "Artificial Intelligence, Machine Learning, Deep Learning, NLP, Computer Vision, Generative AI";

    const systemInstruction = 
      "You are a stellar assistant specializing in aggregating and structuring real, active job postings. " +
      "You MUST use the googleSearch tool to perform queries on Google/job portals to gather 4-6 real, active, " +
      "currently listed Artificial Intelligence, Machine Learning, Data Science, or Generative AI job openings in India for 2026. " +
      "Classify each job description, set workType correctly to either 'Remote', 'WFO', or 'Hybrid', " +
      "match experienceLevel precisely ('Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager'), " +
      "list actual required skills, estimate a realistic salary in Indian Rupees (INR) matching the role, " +
      "cite real portal sources (e.g. 'LinkedIn', 'Naukri', 'Indeed', or specific company career page), and supply a valid fallback/original job application URL.";

    const prompt = `Perform a live web search for active job listings in India that match the following criteria:
    - Base Job Role: ${searchQuery}
    - Location: ${locPrompt}
    - Work Type: ${typePrompt}

    Identify 4-6 real-world, verified AI/ML related jobs. Provide clean, parsed details for each job in a neat list matching the schema provided.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobs: {
              type: Type.ARRAY,
              description: "List of real, active job postings found via live web search",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Official job title, e.g., Junior machine learning engineer" },
                  company: { type: Type.STRING, description: "Name of hiring employer" },
                  location: { type: Type.STRING, description: "Hub name e.g., Bangalore, Kochi, Mumbai, Delhi NCR, Chennai, Hyderabad, Pune, Kolkata" },
                  workType: { type: Type.STRING, description: "Must be 'WFO' or 'Remote' or 'Hybrid'" },
                  description: { type: Type.STRING, description: "Short description of the job duties and goals" },
                  skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core technologies, libraries or competencies (e.g., PyTorch, Python)" },
                  salaryRange: { type: Type.STRING, description: "Estimated/stated salary range in Indian Rupees (INR), e.g. ₹15,00,000 - ₹22,00,000" },
                  experienceLevel: { type: Type.STRING, description: "Must be 'Entry Level' or 'Mid Level' or 'Senior Level' or 'Lead / Manager'" },
                  postedDate: { type: Type.STRING, description: "Formatted as YYYY-MM-DD" },
                  portalSource: { type: Type.STRING, description: "Source board e.g., LinkedIn, Naukri, Glassdoor, Company Careers" },
                  applyUrl: { type: Type.STRING, description: "Actual application link, do not make up fake links, use a real carrier/source job portral page or direct career portal link" }
                },
                required: ["title", "company", "location", "workType", "description", "skills", "experienceLevel", "postedDate", "portalSource", "applyUrl"]
              }
            }
          },
          required: ["jobs"]
        }
      }
    });

    const textToParse = response.text || "{}";
    const data = JSON.parse(textToParse);

    if (data && Array.isArray(data.jobs)) {
      // Clean up dynamic IDs
      const mappedJobs: Job[] = data.jobs.map((job: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        title: job.title || "AI Developer",
        company: job.company || "Enterprise Solutions",
        location: job.location || "Bangalore",
        workType: (job.workType === "WFO" || job.workType === "Remote" || job.workType === "Hybrid") ? job.workType : "WFO",
        description: job.description || "Exciting role core AI team.",
        skills: Array.isArray(job.skills) ? job.skills : ["Python", "Machine Learning"],
        salaryRange: job.salaryRange || "Competitive INR",
        experienceLevel: job.experienceLevel || "Mid Level",
        postedDate: job.postedDate || new Date().toISOString().split('T')[0],
        portalSource: job.portalSource || "LinkedIn",
        applyUrl: job.applyUrl || "https://www.linkedin.com"
      }));

      // Cache successful response
      aiSearchCache.set(cacheKey, mappedJobs);

      return res.json({
        success: true,
        jobs: mappedJobs,
        source: "ai_live"
      });
    }

    throw new Error("Invalid structure returned from AI Search");

  } catch (error: any) {
    console.error("Live AI Search Error:", error);
    res.status(200).json({
      success: false,
      source: "database",
      error: `Live AI search encountered an issue: ${error.message || error}. Falling back to curated matching jobs!`,
      jobs: []
    });
  }
});

// REST API endpoint: AI Career Advisory Coach for India AI/ML ecosystem
app.post("/api/career-coach", async (req, res) => {
  try {
    const { question = "" } = req.body;
    if (!ai) {
      return res.json({
        success: false,
        answer: "Gemini server-side API key is not configured in the Secrets panel in AI Studio. Please add your GEMINI_API_KEY to retrieve dynamic Indian market intelligence."
      });
    }

    const systemInstruction = 
      "You are a stellar Indian tech recruiter and career coach specializing in AI, Machine Learning, and Data Science. " +
      "Provide professional, highly accurate, concrete, and actionable replies detailing salary patterns, interview prep, " +
      "hot startups, MNC tech parks, training paths, and job strategy for Indian cities (especially Bangalore and Kochi, plus Chennai, Mumbai, Hyd, Pune, Delhi NCR). " +
      "Be encouraging yet realistic, format your response in professional bullet points and paragraphs using Markdown. Avoid overly generic lists; give actual local tech park names (e.g. Infopark Kochi, Manyata Tech Park Bangalore, Cyber City Hyderabad, etc.).";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({
      success: true,
      answer: response.text || "No response received from the guide model."
    });
  } catch (error: any) {
    console.error("AI Coach Error:", error);
    res.json({
      success: false,
      answer: `AI Advisory module encountered an issue: ${error.message || error}. Please try asking again shortly.`
    });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application active on port ${PORT}`);
  });
}

startServer();
