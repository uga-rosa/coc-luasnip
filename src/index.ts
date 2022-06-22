import {VimCompleteItem, ExtensionContext, sources, workspace} from 'coc.nvim';

const {nvim} = workspace

let snip_cache = []
let doc_cache = []

interface snippets {
    trigger: string,
    name: string,
    id: number,
    dscr: string,
    hidden: boolean,
    docstring: string,
}

const getCompletionItems = async (): Promise<VimCompleteItem[]> => {
    const filetypes: string[] = await nvim.eval(`luaeval('require("luasnip.util.util").get_snippet_filetypes()')`) as string[]
    const items = (await Promise.all(filetypes.map(async (ft: string): Promise<VimCompleteItem[]> => {
        if (!(ft in snip_cache)) {
            const ft_snippets: snippets[] = await nvim.eval(`luaeval('require("coc_luasnip").getSnippets("${ft}")')`) as snippets[]
            const ft_items = await Promise.all(ft_snippets.filter((snip: snippets): boolean => {
                return !snip.hidden
            }).map(async (snip: snippets): Promise<VimCompleteItem> => {
                return {
                    word: snip.trigger,
                    menu: '[LuaSnip]',
                    info: await getDocumentation(snip, ft)
                }
            }))
            snip_cache[ft] = ft_items
        }
        return snip_cache[ft]
    }))).reduce((acc, cur) => acc.concat(cur), [])

    return items
}

const getDocumentation = async (snip: snippets, ft: string): Promise<string> => {
    if ((ft in doc_cache) && (snip.id in doc_cache[ft])) {
        return doc_cache[ft][snip.id]
    }

    const header = snip.name || '' + ` _ \`[${ft}]\``
    const docstring = ['', '```' + await nvim.eval('&ft'), snip.docstring, '```']
    const documentation = [header, '---', snip.dscr || ''].concat(docstring).reduce((acc, cur) => acc + cur + '\n', '')

    if (!(ft in doc_cache)) doc_cache[ft] = {}
    doc_cache[ft][snip.id] = documentation

    return documentation
}

export const activate = (context: ExtensionContext) => {
    context.subscriptions.push(
        sources.createSource({
            name: 'coc-luasnip',
            doComplete: async () => {
                const items = await getCompletionItems()
                return {items};
            },
            onCompleteDone: async () => {
                await nvim.eval(`luaeval('require("luasnip").expand()')`)
            }
        }),
    );
}
