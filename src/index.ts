import {VimCompleteItem, ExtensionContext, sources, workspace} from 'coc.nvim';

const {nvim} = workspace

export async function activate(context: ExtensionContext): Promise<void> {
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
