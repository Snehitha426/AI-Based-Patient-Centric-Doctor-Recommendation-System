// ===== LangChain Doctor Recommendation Server =====
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');

const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname)));

// Initialize Groq LLM via LangChain
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
});

const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are a medical AI assistant that recommends doctors. 
Given patient preferences, return ONLY a valid JSON array of 5-6 doctor objects.
Each doctor object must have these exact fields:
- name (string): Doctor's full name with "Dr." prefix
- hospital (string): Hospital or clinic name
- specialization (string): Medical specialization
- experience (string): e.g., "12 years"
- rating (number): Between 4.0 and 5.0
- education (string): e.g., "MD, AIIMS Delhi"
- fee (string): Consultation fee in Indian Rupees like "₹600"
- reason (string): 1-2 sentence personalized reason for recommending this doctor
- emoji (string): either "👨‍⚕️" or "👩‍⚕️"

Return ONLY the JSON array, no markdown, no explanation, no code blocks.`,
    ],
    [
        'human',
        `Find doctors matching these patient preferences:
- Location: {location}
- Specialization needed: {specialization}
- Appointment type: {appointmentType}
- Minimum experience: {experience}
- Minimum rating: {rating}
- Education preference: {education}
- Budget range: {budget}
- Patient name: {name}

Return 5-6 highly relevant doctors as a JSON array.`,
    ],
]);

const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

app.post('/api/recommend', async (req, res) => {
    const {
        name = 'Patient',
        email = '',
        location = 'India',
        specialization = 'General Physician',
        appointmentType = 'Both',
        experience = '0',
        rating = '4',
        education = 'Any',
        budget = 'Any',
    } = req.body;

    console.log('[LangChain] Received request for:', { name, location, specialization });

    try {
        const rawOutput = await chain.invoke({
            name,
            location,
            specialization,
            appointmentType,
            experience,
            rating,
            education,
            budget,
        });

        console.log('[LangChain] Raw LLM output:', rawOutput);

        // Strip any accidental markdown code fences
        const cleaned = rawOutput
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        let doctors;
        try {
            doctors = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[LangChain] JSON parse failed:', parseErr.message);
            return res.status(500).json({ error: 'LLM returned invalid JSON', raw: cleaned });
        }

        if (!Array.isArray(doctors)) {
            // Wrap single object
            doctors = [doctors];
        }

        console.log(`[LangChain] Returning ${doctors.length} doctors.`);
        return res.json({ doctors, success: true });
    } catch (err) {
        console.error('[LangChain] Error:', err.message);
        return res.status(500).json({ error: err.message, success: false });
    }
});

app.get('/health', (_, res) => res.json({ status: 'ok', powered_by: 'LangChain + Groq' }));

app.listen(PORT, () => {
    console.log(`✅ SmartDoc LangChain server running on http://localhost:${PORT}`);
    console.log(`   POST http://localhost:${PORT}/api/recommend`);
});
