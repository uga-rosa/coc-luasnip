import {VimCompleteItem, ExtensionContext, sources, workspace} from 'coc.nvim';

const {nvim} = workspace

export const activate = (context: ExtensionContext) => {
    context.subscriptions.push(
        sources.createSource({
            name: 'coc-luasnip',
            doComplete: async () => {
                const items = await nvim.eval(`luaeval('require("coc_luasnip").getCompletionItems()')`) as VimCompleteItem[]
                return {items};
            },
            onCompleteDone: async () => {
                await nvim.eval(`luaeval('require("luasnip").expand()')`)
            }
        }),
    );
}
