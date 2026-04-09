import type { APIRoute } from 'astro';
import { getProductsCollection, ObjectId } from '../../server/mongo';

// Ensure this endpoint always runs on the server (needed for POST/PUT/DELETE)
export const prerender = false;

// GET /api/products  -> lista todos los productos
export const GET: APIRoute = async ({ url }) => {
  try {
    const col = await getProductsCollection();
    const id = url.searchParams.get('id');

    if (id) {
      const product = await col.findOne({ _id: new ObjectId(id) });
      if (!product) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(product), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const products = await col
      .find({}, { sort: { createdAt: -1 } })
      .toArray();

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/products error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/products -> crea un producto
export const POST: APIRoute = async ({ request }) => {
  try {
    const col = await getProductsCollection();
    const body = await request.json();

    const now = new Date();

    const doc = {
      name: String(body.name),
      categoryId: new ObjectId(body.categoryId),
      categoryName: String(body.categoryName),
      price: Number(body.price),
      description: String(body.description ?? ''),
      available: Boolean(body.available),
      image: body.image ? String(body.image) : undefined,
      badge: body.badge ? String(body.badge) : null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    return new Response(JSON.stringify({ _id: result.insertedId, ...doc }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('POST /api/products error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/products?id=... -> actualiza un producto
export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    const col = await getProductsCollection();
    const body = await request.json();

    const update: any = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = String(body.name);
    if (body.categoryId) update.categoryId = new ObjectId(body.categoryId);
    if (body.categoryName) update.categoryName = String(body.categoryName);
    if (body.price !== undefined) update.price = Number(body.price);
    if (body.description !== undefined) update.description = String(body.description);
    if (body.available !== undefined) update.available = Boolean(body.available);
    if (body.image !== undefined) update.image = body.image ? String(body.image) : undefined;
    if (body.badge !== undefined) update.badge = body.badge ? String(body.badge) : null;

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
    console.error('PUT /api/products error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/products?id=...
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });
    const col = await getProductsCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return new Response('Not found', { status: 404 });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/products error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
