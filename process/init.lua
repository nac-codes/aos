-- init.lua

-- ------------ Loading Modules ----------------
Org = require('.org')
print("Org loaded")

Voting = require('.voting')
print("Voting loaded")

-- ------------ Initialization ----------------
function Init(msg)
    Org = require('.org')
    print("Org loaded")

    Voting = require('.voting')
    print("Voting loaded")

    -- Extract organization details from msg.Tags
    local orgName = msg.Tags["Name"]
    local orgTicker = msg.Tags["Ticker"]
    local orgUniqueID = msg.Tags["UniqueID"]

    -- Initialize the organization
    Org.initialize(orgName, orgTicker, orgUniqueID)

    print("Organization initialized with Name:" .. orgName .. "Ticker:" .. orgTicker .. "UniqueID:" .. orgUniqueID)
end

return Init