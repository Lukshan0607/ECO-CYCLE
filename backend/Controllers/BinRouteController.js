const BinRoute = require('../Model/BinRouteModel');

function deriveCity(location = '') {
  const s = String(location).trim();
  if (!s) return '';
  const parts = s.split(/\s+/);
  // Patterns like "Keells Kandy City Center" -> Kandy
  const idxCity = parts.findIndex(p => ['City','Complex','Center','Junction','Road','Fort','Town','Place'].includes(p));
  if (idxCity > 0) {
    // If before a marker word, take the previous token as city
    return parts[idxCity - 1];
  }
  // Brand prefixes -> next token is typically the city (Keells X, Glomark Y, Cargills Z)
  if (['Keells','Glomark','Cargills'].includes(parts[0]) && parts[1]) {
    // include number token if follows (e.g., Colombo 07)
    if (parts[2] && /^\d+/.test(parts[2])) return parts[1] + ' ' + parts[2];
    return parts[1];
  }
  // If ends with a number (e.g., Colombo 07), take last two
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && parts.length >= 2) return parts.slice(-2).join(' ');
  // Fallbacks: if contains a known long location, take first token
  if (parts.length >= 1) return parts[0];
  return '';
}

// Build query filter from request
function buildFilter(query) {
  const filter = {};
  const { search, status, city, manager } = query;
  if (status && ['Active', 'Inactive', 'Maintenance'].includes(status)) {
    filter.status = status;
  }
  if (city) {
    filter.city = { $regex: new RegExp(city, 'i') };
  }
  if (manager) {
    filter.managerName = { $regex: new RegExp(manager, 'i') };
  }
  if (search) {
    const rx = new RegExp(search, 'i');
    filter.$or = [
      { location: { $regex: rx } },
      { city: { $regex: rx } },
      { managerName: { $regex: rx } },
      { routeId: { $regex: rx } },
    ];
  }
  return filter;
}

exports.list = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const routes = await BinRoute.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: routes });
  } catch (err) {
    console.error('BinRoute list error', err);
    res.status(500).json({ success: false, message: 'Failed to load bin routes' });
  }
};

exports.create = async (req, res) => {
  try {
    const { location, managerName, status = 'Active', distanceKm } = req.body || {};
    let { city } = req.body || {};
    if (!location || !managerName || typeof distanceKm !== 'number') {
      return res.status(400).json({ success: false, message: 'location, managerName and numeric distanceKm are required' });
    }
    if (!city) city = deriveCity(location);
    const doc = await BinRoute.create({ location, managerName, status, distanceKm, city });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('BinRoute create error', err);
    res.status(500).json({ success: false, message: 'Failed to create bin route' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    ['location', 'managerName', 'status', 'distanceKm', 'city'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const doc = await BinRoute.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('BinRoute update error', err);
    res.status(500).json({ success: false, message: 'Failed to update bin route' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await BinRoute.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { _id: id } });
  } catch (err) {
    console.error('BinRoute remove error', err);
    res.status(500).json({ success: false, message: 'Failed to remove bin route' });
  }
};
