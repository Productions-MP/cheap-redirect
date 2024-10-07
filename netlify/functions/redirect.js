import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

export async function handler(event, context) {
  try {
    const contactId = event.queryStringParameters.id;

    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing id parameter' }),
      };
    }

    await client.connect();
    const database = client.db('capture-link');
    const contacts = database.collection('contacts');

    const contact = await contacts.findOne({ "_id": {"$oid": contactId} });

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
  } finally {
    await client.close();
  }
}
