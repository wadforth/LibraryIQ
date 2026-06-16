local logger = require("logger")
local millennium = require("millennium")
local http = require("http")
local json = require("json")

local cache = {}

local function encode_response(payload)
    local ok, encoded = pcall(json.encode, payload)

    if ok then
        return encoded
    end

    return '{"ok":false,"error":"failed_to_encode_response"}'
end

local function build_error(error_code, detail)
    return encode_response({
        ok = false,
        error = error_code,
        detail = detail or ""
    })
end

local function normalise_rating(appid, data)
    local summary = data.query_summary or {}

    local total_positive = tonumber(summary.total_positive) or 0
    local total_negative = tonumber(summary.total_negative) or 0
    local total_reviews = tonumber(summary.total_reviews) or 0

    local positive_percent = nil

    if total_reviews > 0 then
        positive_percent = math.floor((total_positive / total_reviews) * 100 + 0.5)
    end

    return {
        ok = true,
        appid = tostring(appid),
        review_score = summary.review_score,
        review_score_desc = summary.review_score_desc or "No rating",
        total_positive = total_positive,
        total_negative = total_negative,
        total_reviews = total_reviews,
        positive_percent = positive_percent,
        updated_at = os.time()
    }
end

function get_steam_rating(params)
    local appid = params and params.appid

    if appid == nil or tostring(appid):match("^%d+$") == nil then
        return build_error("invalid_appid", "AppID must be numeric")
    end

    appid = tostring(appid)

    local cached = cache[appid]
    local now = os.time()

    if cached ~= nil and cached.expires_at > now then
        return cached.body
    end

    local url = "https://store.steampowered.com/appreviews/" ..
        appid ..
        "?json=1&language=all&purchase_type=all&num_per_page=0"

    logger:info("Fetching Steam rating for AppID " .. appid)

    local res, err = http.get(url, {
        headers = {
            ["Accept"] = "application/json"
        },
        timeout = 10,
        user_agent = "SteamRatings-Millennium/0.1.0"
    })

    if not res then
        logger:error("Steam Ratings request failed: " .. tostring(err))
        return build_error("request_failed", tostring(err))
    end

    logger:info("Steam Ratings HTTP status for " .. appid .. ": " .. tostring(res.status))

    if res.status < 200 or res.status >= 300 then
        logger:error("Steam Ratings request returned HTTP " .. tostring(res.status))
        return build_error("bad_http_status", tostring(res.status))
    end

    local ok, data = pcall(json.decode, res.body)

    if not ok or data == nil then
        logger:error("Steam Ratings invalid JSON for " .. appid)
        return build_error("invalid_json", "Could not parse Steam response")
    end

    local payload = normalise_rating(appid, data)
    local body = encode_response(payload)

    cache[appid] = {
        expires_at = now + 86400,
        body = body
    }

    return body
end

function test_rating()
    return get_steam_rating({
        appid = "730"
    })
end

local function on_load()
    logger:info("Steam Ratings backend loaded")
    millennium.ready()
end

local function on_unload()
    logger:info("Steam Ratings backend unloaded")
end

local function on_frontend_loaded()
    logger:info("Steam Ratings frontend loaded")
end

return {
    on_load = on_load,
    on_unload = on_unload,
    on_frontend_loaded = on_frontend_loaded,

    get_steam_rating = get_steam_rating,
    test_rating = test_rating,

    patches = {
        {
            find = [["#Menu_Account"\):\(0,\w+\.jsxs\)\("div",\{className:\w+\(\)\.SteamButton,children:\[\(0,\w+\.jsx\)\(\w+\.SteamLogo]],
            file = [[chunk~[0-9a-f]+\.js]],
            transforms = {
                {
                    match = [[\(0,(\w+\.jsx)\)\(\w+\.SteamLogo]],
                    replace = [[(0,\1)(#{{self}}?.steamRatingsLibrary?.().SteamRatingsLibraryInjector||(()=>null)]]
                }
            }
        }
    }
}