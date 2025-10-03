// src/controllers/ttsController.js
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();

exports.synthesizeSpeech = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const request = {
      input: { text: text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    res.json({ audioContent: response.audioContent.toString('base64') });

  } catch (error) {
    console.error('ERROR synthesizing speech:', error);
    res.status(500).send('Failed to synthesize speech');
  }
};