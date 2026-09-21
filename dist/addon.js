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

    if (mod != null) {
        for (var k in mod) {
            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) {
                __createBinding(result, mod, k);
            }
        }
    }

    __setModuleDefault(result, mod);
    return result;
};

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P
            ? value
            : new P(function (resolve) {
                resolve(value);
            });
    }

    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
        }

        function step(result) {
            try {
                step(generator.next(result));
            }
            catch (e) {
                reject(e);
            }
        }

        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

Object.defineProperty(exports, "__esModule", { value: true });

const Sentry = __importStar(require("@sentry/node"));
const stremio_addon_sdk_1 = require("stremio-addon-sdk");

const manifest = {
    id: 'community.ppvstreams',
    version: '0.0.4',

    catalogs: [
        { id: 'basketball', type: 'tv', name: 'Live Basketball matches' },
        { id: 'football', name: 'Live Football matches', type: 'tv' },
        { id: 'Arm Wrestling', name: 'Live Arm Wrestling evens', type: 'tv' },
        { id: 'Rugby', name: 'Live rugby matches', type: 'tv' },
        { id: 'NFL', name: 'Live NFL matches', type: 'tv' },
        { id: 'Combat Sports', name: 'Combat sports events', type: 'tv' },
        { id: 'Wrestling', name: 'Live wrestling events', type: 'tv' },
        { id: 'Darts', name: 'Live darts events around the world', type: 'tv' }
    ],

    resources: [
        { name: 'stream', types: ['tv'] },
        { name: 'meta', types: ['tv'] }
    ],

    types: ['tv'],

    name: 'ppvstreams',

    description:
        'Stream your favorite live sports, featuring football (soccer), NFL, basketball, wrestling, darts, and more.'
};

function getNFLGames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(
                'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
            );

            if (!response.ok) {
                throw new Error(`ESPN API returned ${response.status}`);
            }

            const data = yield response.json();

            return (data.events || []).map(event => {
                const competition =
                    event.competitions && event.competitions[0];

                const home =
                    competition &&
                    competition.competitors &&
                    competition.competitors.find(
                        team => team.homeAway === 'home'
                    );

                const away =
                    competition &&
                    competition.competitors &&
                    competition.competitors.find(
                        team => team.homeAway === 'away'
                    );

                const homeName =
                    home && home.team
                        ? home.team.displayName
                        : 'Home Team';

                const awayName =
                    away && away.team
                        ? away.team.displayName
                        : 'Away Team';

                const poster =
                    (home &&
                        home.team &&
                        home.team.logo) ||
                    'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png';

                return {
                    id: `espn-nfl-${event.id}`,
                    name: event.name || `${awayName} at ${homeName}`,
                    poster: poster,
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

function getNFLMeta(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameId = id.replace('espn-nfl-', '');

        try {
            const response = yield fetch(
                'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' +
                encodeURIComponent(gameId)
            );

            if (!response.ok) {
                throw new Error(`ESPN API returned ${response.status}`);
            }

            const data = yield response.json();

            const event = data.header && data.header.competitions
                ? {
                    name:
                        data.header.competitions[0] &&
                        data.header.competitions[0].competitors
                        ? data.header.competitions[0].competitors
                            .map(team =>
                                team.team
                                    ? team.team.displayName
                                    : ''
                            )
                            .filter(Boolean)
                            .join(' vs ')
                        : 'NFL Game'
                }
                : null;

            return {
                id: id,
                type: 'tv',
                name: event && event.name
                    ? event.name
                    : 'NFL Game',
                poster:
                    'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
                posterShape: 'landscape',
                description: 'NFL game information from ESPN.',
                links: [
                    {
                        name: 'ESPN',
                        category: 'other',
                        url:
                            'https://www.espn.com/nfl/game/_/gameId/' +
                            encodeURIComponent(gameId)
                    }
                ]
            };

        } catch (error) {
            Sentry.captureException(error);

            return {
                id: id,
                type: 'tv',
                name: 'NFL Game',
                poster:
                    'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
                posterShape: 'landscape'
            };
        }
    });
}

function getMovieStreams(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const streams = yield fetch(
                `https://ppv.land/api/streams/${id}`
            );

            const response = yield streams.json();

            return [
                {
                    name:
                        response &&
                        response.data &&
                        response.data.name
                            ? response.data.name
                            : 'N/A',

                    url:
                        response &&
                        response.data &&
                        response.data.source
                            ? response.data.source
                            : 'N/A',

                    title:
                        response &&
                        response.data &&
                        response.data.tag
                            ? response.data.tag
                            : 'N/A',

                    behaviorHints: {
                        notWebReady: true
                    }
                }
            ];

        } catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}

const builder = new stremio_addon_sdk_1.addonBuilder(manifest);

builder.defineCatalogHandler(
    ({ id }) =>
        __awaiter(void 0, void 0, void 0, function* () {

            if (id === 'NFL') {

                const games = yield getNFLGames();

                const metas = games.map(game => ({
                    id: game.id,
                    type: 'tv',
                    name: game.name,
                    poster: game.poster,
                    background: game.poster,
                    posterShape: 'landscape',
                    description:
                        `NFL game scheduled for ${new Date(
                            game.startTime
                        ).toLocaleString()}`
                }));

                return {
                    metas: metas
                };
            }

            return {
                metas: []
            };
        })
);

builder.defineMetaHandler(
    ({ id }) =>
        __awaiter(void 0, void 0, void 0, function* () {

            if (id.startsWith('espn-nfl-')) {
                return {
                    meta: yield getNFLMeta(id)
                };
            }

            return {
                meta: {
                    id: id,
                    type: 'tv',
                    name: 'N/A'
                }
            };
        })
);

builder.defineStreamHandler(
    ({ id }) =>
        __awaiter(void 0, void 0, void 0, function* () {

            /*
             * NFL entries created above are schedule/information entries.
             * They do not generate a broadcast stream here.
             */

            if (id.startsWith('espn-nfl-')) {
                return {
                    streams: []
                };
            }

            const streams = yield getMovieStreams(id);

            return {
                streams: streams
            };
        })
);

exports.default = builder.getInterface();
