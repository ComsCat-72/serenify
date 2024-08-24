// chatController.js
const chatGPTService = require('../services/chatGPTService');



exports.handleChat = async (req, res) => {
  const { message, userId } = req.body;
  try {
    const botReply = await chatGPTService.getChatGPTReply(message, userId);
    res.json({ reply: botReply });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
};