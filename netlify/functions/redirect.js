const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

let cachedClient = null;

module.exports.handler = async (event, context) => {
  try {
    const contactId = event.queryStringParameters.id;

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing id parameter' }),
      };
    }

    if (!cachedClient) {
      const uri = process.env.MONGO_URI;

      if (!uri) {
        console.error('MONGO_URI is not defined');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Internal server error: MongoDB URI not set' }),
        };
      }

      cachedClient = new MongoClient(uri);
      await cachedClient.connect();
    }

    const client = cachedClient;
    const database = client.db('capture-link');
    const contacts = database.collection('contacts');

    // Only fetch the gallery_url field
    const contact = await contacts.findOne(
      { "_id": new ObjectId(contactId) },
      { projection: { gallery_url: 1 } }
    );

    if (!contact) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Contact not found' }),
      };
    }

    const redirectUrl = contact.gallery_url;

    if (!redirectUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No redirect URL found for this contact' }),
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
      },
      body: '',
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
