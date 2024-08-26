require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const axios = require('axios');
const emailRouter = require('./routes/emailRouter');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure morgan for logging
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :response-time ms - :body'));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../serenify_frontend')));

// Route to serve the main index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/index.html'));
});

// Serve specific HTML files for each route
app.get('/assessment', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/assessment.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/chatbot.html'));
});

app.get('/coming', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/comming.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/contact.html'));
});

app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/info.html'));
});

app.get('/involved', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/involved.html'));
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/support.html'));
});

// Catch-all route to handle unknown paths
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../serenify_frontend/index.html'));
});

// Function to get response from ChatGPT
async function getChatGPTResponse(message, language) {
    const languageMap = {
        'en': 'English',
        'rw': 'Kinyarwanda',
        'sw': 'Kiswahili'
    };

    const prompt = `You are a supportive chatbot specializing in depression. Respond to the following message in ${languageMap[language]}, focusing on providing support, information, or resources related to depression: "${message}"`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a supportive chatbot specializing in depression. Provide empathetic responses and accurate information about depression." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const generatedResponse = response.data.choices[0].message.content.trim();
        return generatedResponse.length > 1 ? generatedResponse : "I'm here to support you. Could you please share more about how you're feeling?";
    } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        return 'I encountered an error while processing your request. Please try again.';
    }
}

// Function to detect language of the message
async function detectLanguage(message) {
    const franc = await import('franc-min');
    const detectedLang = franc.franc(message, { minLength: 3, only: ['eng', 'kin', 'swh'] });

    const langMap = {
        'eng': 'en',
        'kin': 'rw',
        'swh': 'sw'
    };

    return langMap[detectedLang] || 'en';
}

// API route to handle chat requests
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        const language = await detectLanguage(message);
        console.log(`Detected language: ${language}`);

        const response = await getChatGPTResponse(message, language);
        res.json({ reply: response, detectedLanguage: language });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'An error occurred while processing your message.' });
    }
});

// Use emailRouter for email-related API routes
app.use('/api', emailRouter);

// Start the server
app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});

module.exports = app;
