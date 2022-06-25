import {ExtensionContext, workspace, languages, CompletionItemProvider, CompletionItem, TextDocument, Position, CancellationToken, CompletionContext, CompletionItemKind, ProviderResult} from 'coc.nvim';

const {nvim} = workspace

let snip_cache: {[name: string]: snippet[]} = {}
let doc_cache = []

interface snippet {
    trigger: string,
    name: string,
    id: number,
    dscr: string,
    docstring: string,
    ft: string,
}
type snippets = snippet[]

class LanguageProvider implements CompletionItemProvider {
    private async getSnippets(): Promise<snippets> {
        const filetypes: string[] = await nvim.eval(`luaeval('require("luasnip.util.util").get_snippet_filetypes()')`) as string[]
        let items: snippets = []
        for (const ft of filetypes) {
            if (!(ft in snip_cache)) {
                const ft_snippets: snippet[] = await nvim.eval(`luaeval('require("coc_luasnip").getSnippets("${ft}")')`) as snippet[]
                snip_cache[ft] = ft_snippets
            }
            snip_cache[ft].forEach(snip => items.push(snip))
        }
        return items
    }

    private getDocumentation(snip: snippet): string {
        const ft = snip.ft
        if ((ft in doc_cache) && (snip.id in doc_cache[ft])) {
            return doc_cache[ft][snip.id]
        }

        const header = snip.name || '' + ` _ \`[${ft}]\``
        const docstring = ['', '```' + ft, snip.docstring, '```']
        const documentation = [header, '---', snip.dscr || ''].concat(docstring).reduce((acc, cur) => acc + cur + '\n', '')

        if (!(ft in doc_cache)) doc_cache[ft] = {}
        doc_cache[ft][snip.id] = documentation

        return documentation
    }

    public async provideCompletionItems(
        _document: TextDocument,
        _position: Position,
        _token: CancellationToken,
        _context: CompletionContext,
    ): Promise<CompletionItem[]> {
        return (await this.getSnippets()).map(snip => {
            return {
                label: snip.name,
                kind: CompletionItemKind.Snippet,
                insertText: snip.name,
                data: snip
            }
        })
    }

    public resolveCompletionItem(item: CompletionItem): ProviderResult<CompletionItem> {
        item.documentation = {
            kind: 'markdown',
            value: this.getDocumentation(item.data)
        }
        return item
    }
}

export const activate = (context: ExtensionContext) => {
    const configuration = workspace.getConfiguration('snippets')
    context.subscriptions.push(
        languages.registerCompletionItemProvider(
            'luasnip-source',
            configuration.get('shortcut', 'S'),
            ['snippets'],
            new LanguageProvider(),
            ['$'],
            configuration.get<number>('priority', 10),
        )
    );
}
