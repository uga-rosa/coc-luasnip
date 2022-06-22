local M = {}

function M.getSnippets(ft)
    local snippets = require("luasnip").get_snippets(ft, {type = "snippets"})
    if not snippets then
        return {}
    end

    local ret = {}
    for _, snip in ipairs(snippets) do
        table.insert(ret, {
            trigger = snip.trigger,
            name = snip.name,
            id = snip.id,
            dscr = snip.dscr,
            hidden = snip.hidden,
            docstring = snip:get_docstring()
        })
    end

    return ret
end

return M
