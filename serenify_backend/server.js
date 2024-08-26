
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const axios = require('axios');
const emailRouter = require('./routes/emailRouter');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :response-time ms - :body'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
            messages: [{ role: "system", content: "You are a supportive chatbot specializing in depression. Provide empathetic responses and accurate information about depression." },
                       { role: "user", content: prompt }],
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

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    const language = await detectLanguage(message);
    console.log(`Detected language: ${language}`);

    try {
        const response = await getChatGPTResponse(message, language);
        res.json({ reply: response, detectedLanguage: language });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'An error occurred while processing your message.' });
    }
});

app.use('/api', emailRouter);

app.listen(port, () => {
    console.log(`The server is running on ${port}`);
});

module.exports = app;
