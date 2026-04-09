import type { APIRoute } from 'astro';
import { getCategoriesCollection, ObjectId } from '../../server/mongo';

// Ensure this endpoint always runs on the server (needed for POST/PUT/DELETE)
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const col = await getCategoriesCollection();
    const id = url.searchParams.get('id');

    if (id) {
      const cat = await col.findOne({ _id: new ObjectId(id) });
      if (!cat) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(cat), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const list = await col.find({}, { sort: { name: 1 } }).toArray();
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/categories error', err);
    return new Response('Internal error', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const col = await getCategoriesCollection();
    const body = await request.json();
    const now = new Date();

    const name = String(body.name).trim();
    if (!name) return new Response('Name required', { status: 400 });

    const slug = (body.slug || name)
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const doc = {
      name,
      color: body.color ? String(body.color) : undefined,
      slug,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    return new Response(JSON.stringify({ _id: result.insertedId, ...doc }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('POST /api/categories error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    const col = await getCategoriesCollection();
    const body = await request.json();

    const update: any = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = String(body.name);
    if (body.color !== undefined) update.color = body.color ? String(body.color) : undefined;
    if (body.slug !== undefined) update.slug = String(body.slug);

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
    console.error('PUT /api/categories error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    const col = await getCategoriesCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return new Response('Not found', { status: 404 });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/categories error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
