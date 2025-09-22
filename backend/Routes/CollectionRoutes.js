const express = require('express');
const router = express.Router();
const { createCollection, listCollections, updateCollection, deleteCollection } = require('../Controllers/CollectionController');

router.post('/', createCollection);
router.get('/', listCollections);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

module.exports = router;
