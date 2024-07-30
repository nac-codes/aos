local bint = require('.bint')(256)
local ao = require('ao')
local json = require('json')

-- Initialize state
if not Balances then Balances = { [ao.id] = tostring(bint(10 * 1e12)) } end -- 10 tokens for the process

if Name ~= 'DAO Token' then Name = 'DAO Token' end
if Ticker ~= 'DAO' then Ticker = 'DAO' end
if Denomination ~= 12 then Denomination = 12 end

-- Helper function to check if an address is a member
function IsMember(address)
    return Balances[address] and tonumber(Balances[address]) > 0
end

-- Helper function to calculate total token supply
function GetTotalSupply()
    local total = bint(0)
    for _, balance in pairs(Balances) do
        total = bint.__add(total, bint(balance))
    end
    return total
end

-- Handler for getting DAO information
Handlers.add('info', Handlers.utils.hasMatchingTag('Action', 'Info'), function(msg)
    ao.send({
        Target = msg.From,
        Name = Name,
        Ticker = Ticker,
        Denomination = tostring(Denomination)
    })
    -- print out info
    Print_all(msg.From, Name, Ticker, tostring(Denomination))
end)

-- Handler for checking balance
Handlers.add('balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(msg)
    local balance = Balances[msg.From] or "0"
    ao.send({
        Target = msg.From,
        Action = 'BalanceResult',
        Balance = balance,
        Data = "Your balance is " .. balance .. " " .. Ticker
    })
    Print_all("Your balance is " .. balance .. " " .. Ticker)
end)

-- Handler for getting list of Balances
Handlers.add('getBalances', Handlers.utils.hasMatchingTag('Action', 'GetBalances'), function(msg)
    if not IsMember(msg.From) then
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Unauthorized: Only members can get balances'
        })
        print("Unauthorized: Only members can get balances")
        return
    end

    ao.send({
        Target = msg.From,
        Action = 'Balances',
        Data = json.encode(Balances)
    })
    Print_all(json.encode(Balances))
end)