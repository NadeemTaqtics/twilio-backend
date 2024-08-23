// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Twilio = require('twilio');

const app = express();
const port = process.env.PORT || 5005;

// Twilio credentials
const client = Twilio("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN");

app.use(cors());
app.use(bodyParser.json());

// Create a new conversation
app.post('/create-conversation', async (req, res) => {
    try {
        const { friendlyName } = req.body;
        const conversation = await client.conversations.v1.conversations.create({
            friendlyName
        });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a participant to a conversation
app.post('/add-participant', async (req, res) => {
    try {
        const { conversationSid, identity } = req.body;
        const participant = await client.conversations.v1.conversations(conversationSid)
            .participants
            .create({ identity });
        res.json(participant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send a message to a conversation
app.post('/send-message', async (req, res) => {
    try {
        const { conversationSid, body, author, participantSid } = req.body;
        const message = await client.conversations.v1.conversations(conversationSid)
            .messages
            .create({ body, author, participantSid });
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List all messages in a conversation
app.get('/list-messages/:conversationSid', async (req, res) => {
    try {
        const { conversationSid } = req.params;
        const messages = await client.conversations.v1.conversations(conversationSid)
            .messages
            .list();

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// List all conversations
app.get('/list-conversations', async (req, res) => {
    try {
        const conversations = await client.conversations.v1.conversations.list();
        console.log("conversations", conversations);

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Get participants from a conversation
app.get('/participants/:conversationSid', async (req, res) => {
    try {
        const { conversationSid } = req.params;
        const participants = await client.conversations.v1.conversations(conversationSid)
            .participants
            .list();

        // Log participants for debugging
        // console.log('Participants:', participants);

        res.json(participants);
    } catch (error) {
        console.error('Error fetching participants:', error.message);
        res.status(500).json({ error: error.message });
    }
});


app.post('/token', (req, res) => {
    const { identity, conversationSid } = req.body;

    if (!identity) {
        return res.status(400).json({ error: 'Identity is required' });
    }

    try {


        // Create a new Access Token
        const AccessToken = Twilio.jwt.AccessToken;
        const ChatGrant = AccessToken.ChatGrant;

        const token = new AccessToken(
            "TWILIO_ACCOUNT_SID",
            "TWILIO_API_KEY_SID",
            "TWILIO_API_KEY_SECRET",
            { identity: identity, ttl: 3600 * 5 }
        );


        const conversationsGrant = new AccessToken.ChatGrant({
            serviceSid: "TWILIO_CONVERSATION_SERVICE_ID",
        });


        // Grant access to Conversations
        token.addGrant(conversationsGrant);

        // Serialize the token to a JWT string
        const jwt = token.toJwt();

        // Send the token to the client
        res.json({ token: jwt });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});



app.post('/create-service', async () => {
    try {
        // Create a new conversation service
        const service = await client.conversations._v1.services.create({
            friendlyName: 'My Conversation Service'
        });

        console.log('Conversation Service SID:', service.sid);
        return service.sid;
    } catch (error) {
        console.error('Error creating conversation service:', error.message);
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
