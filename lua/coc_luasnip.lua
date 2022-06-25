local M = {}

function M.getSnippets(ft)
    local snippets = require("luasnip").get_snippets(ft, {type = "snippets"})
    if not snippets then
        return {}
    end

    local ret = {}
    for _, snip in ipairs(snippets) do
        if not snip.hidden then
            table.insert(ret, {
                trigger = snip.trigger,
                name = snip.name,
                id = snip.id,
                dscr = snip.dscr,
                docstring = snip:get_docstring(),
                ft = ft,
            })
        end
    end

    return ret
end

return M
