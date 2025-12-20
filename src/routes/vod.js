const express = require('express');
const router = express.Router();
const vodController = require('../controllers/vodController');
const { authenticateAdmin } = require('../middleware/auth.middleware');
const { checkModuleAccess } = require('../middleware/rbac');

// VOD Categories
router.get('/categories', authenticateAdmin, vodController.getVODCategories);

// Movies
router.get('/movies', authenticateAdmin, vodController.getAllMovies);
router.get('/movies/:id', authenticateAdmin, vodController.getMovieById);

// Series
router.get('/series', authenticateAdmin, vodController.getAllSeries);
router.get('/series/:id', authenticateAdmin, vodController.getSeriesById);
router.get('/series/:series_id/seasons/:season_id/episodes', authenticateAdmin, vodController.getSeasonEpisodes);

// M3U Import
router.post('/import-m3u', authenticateAdmin, checkModuleAccess('channels'), vodController.validateVODImport(), vodController.importVODM3U);

module.exports = router;
