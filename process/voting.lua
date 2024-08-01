local bint = require('.bint')(256)
local ao = require('ao')
local json = require('json')

-- Initialize state
if not AddRequests then AddRequests = {} end -- Ledger for add requests

-- Helper function to calculate voting threshold
local function getVotingThreshold()
    local totalSupply = GetTotalSupply()
    return bint.__mul(totalSupply, bint(51)) / bint(100) -- 51% of total supply
end

-- Helper function to print information in JSON format
local function printJson(action, data)
    print(json.encode({action = action, data = data}))
end

-- Handler for requesting to add a new member
Handlers.add('requestAddMember', Handlers.utils.hasMatchingTag('Action', 'RequestAddMember'), function(msg)
    if not IsMember(msg.From) then
        printJson('Error', 'Unauthorized: Only members can request to add new members')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Unauthorized: Only members can request to add new members'
        })
        return
    end

    local newMember = msg.Tags.Member_To_Add
    if not newMember then
        printJson('Error', 'Member_To_Add tag is required')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Member_To_Add tag is required'
        })
        return
    end

    if IsMember(newMember) then
        printJson('Error', 'Address is already a member')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Address is already a member'
        })
        return
    end

    local requesterBalance = bint(Balances[msg.From] or "0")
    if bint.__lt(requesterBalance, bint(1 * 1e12)) then
        printJson('Error', 'Insufficient balance to request adding a new member')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Insufficient balance to request adding a new member'
        })
        return
    end

    -- Check if the requester has already made a request and, if so, remove that request
    for id, request in pairs(AddRequests) do
        if request.requester == msg.From then
            AddRequests[id] = nil
            printJson('Notification', {message = 'Previous request removed', requestId = id})
            ao.send({
                Target = msg.From,
                Action = 'Notification',
                RequestId = id,
                Data = "Your previous request to add a new member has been removed."
            })
            break
        end
    end

    -- Use the message id as identifier
    AddRequests[msg.Id] = {
        newMember = newMember,
        requester = msg.From,
        votes = bint(0),
        voters = {},
        threshold = getVotingThreshold()
    }

    -- Notify all members about the new request
    for member, _ in pairs(Balances) do
        if tonumber(Balances[member]) > 0 then
            ao.send({
                Target = member,
                Action = 'NewMemberRequest',
                RequestId = msg.Id,
                NewMember = newMember,
                Requester = msg.From
            })
        end
    end

    printJson('RequestSubmitted', {
        message = "Request to add new member submitted successfully",
        requestId = msg.Id,
        request = AddRequests[msg.Id]
    })
    ao.send({
        Target = msg.From,
        Action = 'RequestSubmitted',
        RequestId = msg.Id,
        NewMember = newMember,
        Data = "Request to add new member submitted successfully"
    })
end)

-- Handler for voting on a new member request
Handlers.add('voteOnRequest', Handlers.utils.hasMatchingTag('Action', 'VoteOnRequest'), function(msg)
    local requestId = msg.Tags.RequestId
    local vote = msg.Tags.Vote

    if not requestId or not vote then
        printJson('Error', 'RequestId and Vote tags are required')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'RequestId and Vote tags are required'
        })
        return
    end

    local request = AddRequests[requestId]
    if not request then
        printJson('Error', 'Invalid request ID')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Invalid request ID'
        })
        return
    end

    if request.voters[msg.From] then
        printJson('Error', 'You have already voted on this request')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'You have already voted on this request'
        })
        return
    end

    local voterBalance = bint(Balances[msg.From] or "0")
    if bint.__eq(voterBalance, bint(0)) then
        printJson('Error', 'You must have a positive balance to vote')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'You must have a positive balance to vote'
        })
        return
    end

    if vote == "yes" then
        request.votes = bint.__add(request.votes, voterBalance)
    end
    request.voters[msg.From] = true

    if bint.__lt(request.threshold, request.votes) then
        -- Request approved, add new member
        Balances[request.newMember] = tostring(bint(2 * 1e12)) -- Equivalent to minting 1 token for the new member
        -- check if balance of requester is greater than 1
        local requesterBalance = bint(Balances[request.requester] or "0")
        if bint.__lt(requesterBalance, bint(1 * 1e12)) then
            printJson('Error', 'Votes threshold passed, but the requester no longer has a satisfactory balance')
            ao.send({
                Target = msg.From,
                Action = 'Error',
                Error = 'Votes threshold passed, but the requester no longer has a satisfactory balance'
            })
            AddRequests[requestId] = nil
            return
        end

        Balances[request.requester] = tostring(bint.__sub(bint(Balances[request.requester]), bint(1 * 1e12))) -- Deduct 1 token from requester

        printJson('MemberAdded', {
            message = 'New member added successfully',
            newMember = request.newMember,
            requester = request.requester
        })
        ao.send({
            Target = request.requester,
            Action = 'MemberAdded',
            NewMember = request.newMember,
            Data = "New member added successfully"
        })

        -- Remove the request
        AddRequests[requestId] = nil
    else
        printJson('VoteRecorded', {
            message = 'Your vote has been recorded',
            requestId = requestId,
            currentVotes = tostring(request.votes),
            threshold = tostring(request.threshold)
        })
        ao.send({
            Target = msg.From,
            Action = 'VoteRecorded',
            RequestId = requestId,
            Data = "Your vote has been recorded"
        })
    end
end)

-- Handler for getting current add requests
Handlers.add('getAddRequests', Handlers.utils.hasMatchingTag('Action', 'GetAddRequests'), function(msg)
    if not IsMember(msg.From) then
        printJson('Error', 'Unauthorized: Only members can view add requests')
        ao.send({
            Target = msg.From,
            Action = 'Error',
            Error = 'Unauthorized: Only members can view add requests'
        })
        return
    end

    printJson('AddRequestsList', AddRequests)
    ao.send({
        Target = msg.From,
        Action = 'AddRequestsList',
        Data = json.encode(AddRequests)
    })
end)