import type { APIRoute } from 'astro';
import { getUsersCollection, ObjectId } from '../../server/mongo';

// Ensure this endpoint always runs on the server
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const col = await getUsersCollection();
    const id = url.searchParams.get('id');

    if (id) {
      const user = await col.findOne({ _id: new ObjectId(id) });
      if (!user) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const list = await col.find({}, { sort: { createdAt: -1 } }).toArray();
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/users error', err);
    return new Response('Internal error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const col = await getUsersCollection();
    const body = await request.json();
    const now = new Date();

    const doc = {
      name: String(body.name),
      email: String(body.email),
      role: (body.role === 'viewer' ? 'viewer' : 'admin') as 'viewer' | 'admin',
      active: body.active !== false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    return new Response(JSON.stringify({ _id: result.insertedId, ...doc }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('POST /api/users error', err);
    return new Response('Internal error', { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    const col = await getUsersCollection();
    const body = await request.json();

    const update: any = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = String(body.name);
    if (body.email !== undefined) update.email = String(body.email);
    if (body.role !== undefined) update.role = body.role === 'viewer' ? 'viewer' : 'admin';
    if (body.active !== undefined) update.active = Boolean(body.active);

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' },
    );

    if (!result) return new Response('Not found', { status: 404 });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('PUT /api/users error', err);
    return new Response('Internal error', { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    const col = await getUsersCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return new Response('Not found', { status: 404 });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/users error', err);
    return new Response('Internal error', { status: 500 });
  }
};
