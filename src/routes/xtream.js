const express = require('express');
const router = express.Router();
const xtreamController = require('../controllers/xtreamController');
const { streamLimiter } = require('../middleware/rateLimiter');

router.get('/player_api.php', streamLimiter, xtreamController.authenticate, (req, res) => {
    const { action } = req.query;

    switch (action) {
        case 'get_live_categories':
            return xtreamController.getLiveCategories(req, res);
        case 'get_live_streams':
            return xtreamController.getLiveStreams(req, res);
        case 'get_vod_categories':
            return xtreamController.getVodCategories(req, res);
        case 'get_vod_streams':
            return xtreamController.getVodStreams(req, res);
        case 'get_series_categories':
            return xtreamController.getSeriesCategories(req, res);
        case 'get_series':
            return xtreamController.getSeries(req, res);
        case 'get_series_info':
            return xtreamController.getSeriesInfo(req, res);
        case 'get_short_epg':
        case 'get_simple_data_table':
            return xtreamController.getEpg(req, res);
        default:
            return xtreamController.getUserInfo(req, res);
    }
});

router.get('/live/:username/:password/:stream_id.:extension', streamLimiter, xtreamController.getStreamUrl);
router.get('/movie/:username/:password/:stream_id.:extension', streamLimiter, xtreamController.getStreamUrl);
router.get('/series/:username/:password/:stream_id.:extension', streamLimiter, xtreamController.getStreamUrl);

router.get('/get.php', streamLimiter, xtreamController.getM3uPlaylist);

module.exports = router;
