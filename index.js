const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('/etc/secrets/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
app.use(express.json());

app.post('/sendPush', async (req, res) => {
  const {recipientId, senderName, text, chatId} = req.body;
  if (!recipientId) return res.status(400).send({error: 'recipientId required'});
  
  // Busca token no Firestore
  const userSnap = await db.collection('users').doc(recipientId).get();
  const token = userSnap.data()?.fcmToken;
  if (!token) return res.status(404).send({error: 'fcmToken not found for user'});

  const payload = {
    notification: {
      title: `${senderName} te enviou uma mensagem`,
      body: text,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    data: {chatId}
  };

  try {
    await admin.messaging().sendToDevice(token, payload);
    res.send({success: true});
  } catch (e) {
    res.status(500).send({error: e.message});
  }
});

app.get('/', (req, res) => res.send('API Push Railway está online!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Rodando na porta', PORT));
