"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
    id: 'community.ppvstreams',
    version: '0.0.4',
    catalogs: [
        { id: 'basketball', type: 'tv', name: 'Live Basketball matches' },
        { id: 'football', name: 'Live Football matches', type: 'tv' },
        { id: 'Arm Wrestling', name: 'Live Arm Wrestling evens', type: 'tv' },
        { id: 'Rugby', name: 'Live rugby matches', type: 'tv' },
        { id: 'NFL', name: 'Live nfl matches', type: 'tv' },
        { id: "Combat Sports", name: "Combat sports events", type: "tv" },
        { id: "Wrestling", name: "Live wrestling events", type: "tv" },
        {
            id: 'Darts',
            name: 'Live darts events around the world',
            type: 'tv',
        },
    ],
    resources: [
        { name: 'stream', types: ['tv'] },
        { name: 'meta', types: ['tv'] },
    ],
    types: ['tv'],
    name: 'ppvstreams',
    description: 'Stream your favorite live sports, featuring football (soccer), NFL, basketball, wrestling, darts, and more. Enjoy real-time access to popular games and exclusive events, all conveniently available in one place. This add-on is based on PPV Land.',
};
function getNFLGames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');

            if (!response.ok) {
                throw new Error(`ESPN API returned ${response.status}`);
            }

            const data = yield response.json();
            const now = Date.now();
            const next24Hours = now + (24 * 60 * 60 * 1000);

            return (data.events || [])
                .filter(event => {
                    const gameTime = new Date(event.date).getTime();
                    return gameTime >= now && gameTime <= next24Hours;
                })
                .map(event => {
                    const competition = event.competitions?.[0];
                    const home = competition?.competitors?.find(
                        team => team.homeAway === 'home'
                    );
                    const away = competition?.competitors?.find(
                        team => team.homeAway === 'away'
                    );

                    return {
                        id: `espn-nfl-${event.id}`,
                        name: event.name,
                        poster: home?.team?.logo ||
                            'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
                        gameId: event.id,
                        startTime: event.date
                    };
                });
        } catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}
function getMovieStreams(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const streams = yield fetch(`https://ppv.land/api/streams/${id}`);
            const response = yield streams.json();
            return [
                {
                    name: (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "N/A",
                    url: (_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.source) !== null && _d !== void 0 ? _d : "N/A",
                    title: (_f = (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.tag) !== null && _f !== void 0 ? _f : "N/A",
                    behaviorHints: { notWebReady: true, },
                },
            ];
        }
        catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}
function getMovieMetaDetals(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const streams = yield fetch(`https://ppv.land/api/streams/${id}`);
            const response = yield streams.json();
            return {
                name: (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "N/A",
                id: id,
                type: 'tv',
                poster: (_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.poster) !== null && _d !== void 0 ? _d : "https://placehold.co/600x400",
                posterShape: 'landscape',
                background: (_f = (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.poster) !== null && _f !== void 0 ? _f : "https://placehold.co/600x400",
                language: 'english',
                website: response.data.source,
            };
        }
        catch (error) {
            Sentry.captureException(error);
            return { id: id, name: 'N/A', type: 'channel' };
        }
    });
}
const builder = new stremio_addon_sdk_1.addonBuilder(manifest);
builder.defineCatalogHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    if (id === 'NFL') {
        const results = (yield getNFLGames()).map(game => ({
            id: game.id,
            name: game.name,
            type: 'tv',
            background: game.poster,
            description: `NFL game starting ${new Date(game.startTime).toLocaleString()}`,
            poster: game.poster,
            posterShape: 'landscape',
            logo: game.poster,
        }));

        return {
            metas: results,
        };
    }

    const results = [];
    return {
        metas: results,
    };
}));
builder.defineStreamHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    const streams = yield getMovieStreams(id);
    return {
        streams,
    };
}));
exports.default = builder.getInterface();
