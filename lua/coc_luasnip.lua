local util = require("vim.lsp.util")

local M = {}

local snip_cache = {}
local doc_cache = {}

function M.getCompletionItems()
    local filetypes = require("luasnip.util.util").get_snippet_filetypes()
    local items = {}

    for i = 1, #filetypes do
        local ft = filetypes[i]
        if not snip_cache[ft] then
            -- ft not yet in cache.
            local ft_items = {}
            local ft_table = require("luasnip").get_snippets(ft, { type = "snippets" })
            if ft_table then
                for _, snip in pairs(ft_table) do
                    if not snip.hidden then
                        table.insert(ft_items, {
                            word = snip.trigger,
                            menu = "[LuaSnip]",
                            info = M.getDocument(snip, ft),
                            isSnippet = true,
                        })
                    end
                end
            end
            snip_cache[ft] = ft_items
        end
        vim.list_extend(items, snip_cache[ft])
    end

    return items
end

function M.getDocument(snip, ft)
    if doc_cache[ft] and doc_cache[ft][snip.id] then
        return doc_cache[ft][snip.id]
    end

    local header = (snip.name or "") .. " _ `[" .. ft .. "]`\n"
    local docstring = { "", "```" .. vim.bo.filetype, snip:get_docstring(), "```" }
    local documentation = { header .. "---", (snip.dscr or ""), docstring }
    documentation = util.convert_input_to_markdown_lines(documentation)
    documentation = table.concat(documentation, "\n")

    doc_cache[ft] = doc_cache[ft] or {}
    doc_cache[ft][snip.id] = documentation

    return documentation
end

return M
