const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

let cachedClient = null;

module.exports.handler = async (event, context) => {
  try {
    const contactId = event.queryStringParameters.id;

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing url parameter "id"' }),
      };
    }

    const imageId = event.queryStringParameters.image_id;

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing url parameter "image_id"' }),
      };
    }

    if (!cachedClient) {
      const uri = process.env.MONGO_URI;

      if (!uri) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        };
      }

      cachedClient = new MongoClient(uri);
      await cachedClient.connect();
    }

    const client = cachedClient;
    const database = client.db('capture-link');
    const contacts = database.collection('contacts');

    const contact = await contacts.findOne(
      { "_id": new ObjectId(contactId) },
      { projection: { gallery_url: 1 } }
    );

    if (!contact) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Contact record not found' }),
      };
    }

    const redirectUrl = contact.gallery_url;

    if (!redirectUrl) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Redirect URL not found' }),
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
