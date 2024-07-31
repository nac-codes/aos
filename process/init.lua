
-- function that takes in an arbitrary number of arguments and returns a string representation of them
function Print_all(...)
    local args = {...}
    local str = ""
    for i, v in ipairs(args) do
        str = str .. tostring(v)
        if i < #args then
            str = str .. " "
        end
    end
    print(str)
end

-- loading modules
Org = require('.org')
print("Org loaded")

Voting = require('.voting')
print("Voting loaded")