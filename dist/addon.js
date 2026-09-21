"use strict";

const Sentry = require("@sentry/node");
const { addonBuilder } = require("stremio-addon-sdk");

const manifest = {
    id: "community.ppvstreams",
    version: "0.0.4",

    catalogs: [
        { id: "basketball", type: "tv", name: "Live Basketball matches" },
        { id: "football", type: "tv", name: "Live Football matches" },
        { id: "Arm Wrestling", type: "tv", name: "Live Arm Wrestling events" },
        { id: "Rugby", type: "tv", name: "Live Rugby matches" },
        { id: "NFL", type: "tv", name: "Live NFL matches" },
        { id: "Combat Sports", type: "tv", name: "Combat Sports events" },
        { id: "Wrestling", type: "tv", name: "Live Wrestling events" },
        { id: "Darts", type: "tv", name: "Live Darts events" }
    ],

    resources: [
        { name: "stream", types: ["tv"] },
        { name: "meta", types: ["tv"] }
    ],

    types: ["tv"],

    name: "ppvstreams",

    description:
        "Live sports catalog including football, NFL, basketball, wrestling, darts, rugby and more."
};

async function getNFLGames() {
    try {
        const response = await fetch(
            "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
        );

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}`);
        }

        const data = await response.json();

        return (data.events || []).map((event) => {
            const competition =
                event.competitions && event.competitions[0];

            const competitors =
                competition && competition.competitors
                    ? competition.competitors
                    : [];

            const home = competitors.find(
                (team) => team.homeAway === "home"
            );

            const away = competitors.find(
                (team) => team.homeAway === "away"
            );

            const poster =
                (home &&
                    home.team &&
                    home.team.logo) ||
                (away &&
                    away.team &&
                    away.team.logo) ||
                "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png";

            return {
                id: `espn-nfl-${event.id}`,
                name:
                    event.name ||
                    "NFL Game",
                poster: poster,
                startTime: event.date,
                gameId: event.id
            };
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error("NFL catalog error:", error);
        return [];
    }
}

async function getNFLMeta(id) {
    const gameId = id.replace("espn-nfl-", "");

    return {
        id: id,
        type: "tv",
        name: "NFL Game",
        poster:
            "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png",
        posterShape: "landscape",
        description:
            "NFL game information from ESPN.",
        links: [
            {
                name: "ESPN",
                category: "other",
                url:
                    "https://www.espn.com/nfl/game/_/gameId/" +
                    encodeURIComponent(gameId)
            }
        ]
    };
}

async function getMovieStreams(id) {
    try {
        const response = await fetch(
            `https://ppv.land/api/streams/${id}`
        );

        const data = await response.json();

        return [
            {
                name:
                    data &&
                    data.data &&
                    data.data.name
                        ? data.data.name
                        : "N/A",

                url:
                    data &&
                    data.data &&
                    data.data.source
                        ? data.data.source
                        : "N/A",

                title:
                    data &&
                    data.data &&
                    data.data.tag
                        ? data.data.tag
                        : "N/A",

                behaviorHints: {
                    notWebReady: true
                }
            }
        ];
    } catch (error) {
        Sentry.captureException(error);
        console.error("Stream error:", error);
        return [];
    }
}

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ id }) => {

    if (id === "NFL") {
        const games = await getNFLGames();

        const metas = games.map((game) => ({
            id: game.id,
            type: "tv",
            name: game.name,
            poster: game.poster,
            background: game.poster,
            posterShape: "landscape",
            description:
                `NFL game scheduled for ${new Date(
                    game.startTime
                ).toLocaleString()}`
        }));

        console.log(
            `NFL catalog returned ${metas.length} games`
        );

        return {
            metas: metas
        };
    }

    return {
        metas: []
    };
});

builder.defineMetaHandler(async ({ id }) => {

    if (id.startsWith("espn-nfl-")) {
        return {
            meta: await getNFLMeta(id)
        };
    }

    return {
        meta: {
            id: id,
            type: "tv",
            name: "N/A"
        }
    };
});

builder.defineStreamHandler(async ({ id }) => {

    /*
     * ESPN NFL catalog entries are schedule/information entries.
     * They do not create a broadcast stream here.
     */

    if (id.startsWith("espn-nfl-")) {
        return {
            streams: []
        };
    }

    const streams = await getMovieStreams(id);

    return {
        streams: streams
    };
});

module.exports = builder.getInterface();
