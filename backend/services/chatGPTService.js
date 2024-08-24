const OpenAI = require("openai");
const NodeCache = require('node-cache');
const Sentiment = require('sentiment');

const openai = new OpenAI({
  apiKey: procestis.env.OPENAI_API_KEY,
});

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const sentiment = new Sentiment();

let apiCallCount = 0;
const API_CALL_LIMIT = 1000;

const userProfiles = new Map();

function getUserProfile(userId) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      interactionCount: 0,
      moodHistory: [],
      lastInteractionTime: Date.now(),
      preferences: {},
      voiceEnabled: false,
    });
  }
  return userProfiles.get(userId);
}

function updateUserProfile(userId, update) {
  const profile = getUserProfile(userId);
  Object.assign(profile, update);
  userProfiles.set(userId, profile);
}

function analyzeSentiment(message) {
  const result = sentiment.analyze(message);
  return result.score < 0 ? 'negative' : result.score > 0 ? 'positive' : 'neutral';
}

function detectCrisis(message) {
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'no reason to live', 'want to die', 'better off dead'];
  return crisisKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

async function getChatGPTReply(message, userId, isVoiceInput = false) {
  const profile = getUserProfile(userId);
  const mood = analyzeSentiment(message);

  if (detectCrisis(message)) {
    const crisisResponse = "I'm very concerned about what you've shared. Please reach out to a crisis helpline immediately. You can call 1-800-273-8255 for the National Suicide Prevention Lifeline, or text HOME to 741741 to reach a crisis counselor. Your life matters, and help is available.";
    if (isVoiceInput) {
      speakResponse(crisisResponse);
    }
    return crisisResponse;
  }

  const cacheKey = `${userId}:${message}`;
  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    if (isVoiceInput) {
      speakResponse(cachedResponse);
    }
    return cachedResponse;
  }

  if (apiCallCount >= API_CALL_LIMIT) {
    console.warn('API call limit reached');
    const limitResponse = "I'm at my limit for today. Let's continue our chat tomorrow.";
    if (isVoiceInput) {
      speakResponse(limitResponse);
    }
    return limitResponse;
  }
  apiCallCount++;

  try {
    const systemMessage = `You are an empathetic and supportive AI assistant specializing in mental health support, particularly for depression. Provide concise, helpful responses. The user's current mood seems ${mood}. Their recent mood history: ${profile.moodHistory.join(', ')}. Interaction count: ${profile.interactionCount}. Tailor your response accordingly, and suggest an appropriate follow-up question or interactive activity.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: systemMessage},
        {role: "user", content: message}
      ],
    });

    let response = completion.choices[0].message.content;

    updateUserProfile(userId, {
      interactionCount: profile.interactionCount + 1,
      moodHistory: [...profile.moodHistory, mood].slice(-5),
      lastInteractionTime: Date.now(),
    });

    cache.set(cacheKey, response);

    if (isVoiceInput) {
      speakResponse(response);
    }

    return response;

  } catch (error) {
    console.error('Error interacting with ChatGPT:', error);
    const errorResponse = "I'm having trouble processing your request right now. Can you please rephrase or try again later?";
    if (isVoiceInput) {
      speakResponse(errorResponse);
    }
    return errorResponse;
  }
}

function startVoiceRecognition(callback) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.onresult = (event) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    callback(transcript);
  };

  recognition.start();
}

function speakResponse(text) {
  const speech = new SpeechSynthesisUtterance(text);
  let voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          setFemaleVoice();
      };
  } else {
      setFemaleVoice();
  }

  function setFemaleVoice() {
      const femaleVoice = voices.find(voice => 
          voice.name.includes('female') || 
          voice.name.includes('Female') || 
          voice.name.includes('woman') ||
          voice.name.includes('Woman')
      );
      if (femaleVoice) {
          speech.voice = femaleVoice;
      }
  }

  speech.pitch = 1.2;
  speech.rate = 1.0;
  window.speechSynthesis.speak(speech);
}


module.exports = {
  getChatGPTReply,
  startVoiceRecognition,
  speakResponse,
};
