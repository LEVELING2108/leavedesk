// Runs a paginated find and returns items plus the metadata the client needs to render pagers
export async function paginate(Model, filter, { page, limit, sort = { createdAt: -1 }, populate } = {}) {
  let query = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
