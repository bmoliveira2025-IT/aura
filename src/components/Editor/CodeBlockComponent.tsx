import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';

export default function CodeBlockComponent({ node, updateAttributes }: any) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(node.textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <NodeViewWrapper className="code-block-wrapper">
            <div className="code-block-header">
                <select
                    className="code-block-lang-select"
                    contentEditable={false}
                    value={node.attrs.language || 'plaintext'}
                    onChange={e => updateAttributes({ language: e.target.value })}
                >
                    <option value="plaintext">Texto</option>
                    <option value="bash">Bash</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="css">CSS</option>
                    <option value="dart">Dart</option>
                    <option value="dockerfile">Dockerfile</option>
                    <option value="elixir">Elixir</option>
                    <option value="go">Go</option>
                    <option value="graphql">GraphQL</option>
                    <option value="haskell">Haskell</option>
                    <option value="html">HTML</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="json">JSON</option>
                    <option value="kotlin">Kotlin</option>
                    <option value="lua">Lua</option>
                    <option value="markdown">Markdown</option>
                    <option value="php">PHP</option>
                    <option value="python">Python</option>
                    <option value="r">R</option>
                    <option value="ruby">Ruby</option>
                    <option value="rust">Rust</option>
                    <option value="scala">Scala</option>
                    <option value="scss">SCSS</option>
                    <option value="shell">Shell</option>
                    <option value="sql">SQL</option>
                    <option value="swift">Swift</option>
                    <option value="tsx">TSX / React</option>
                    <option value="typescript">TypeScript</option>
                    <option value="xml">XML / SVG</option>
                    <option value="yaml">YAML</option>
                </select>
                <button className="code-block-copy-btn" onClick={handleCopy} contentEditable={false}>
                    {isCopied ? '✓ Copiado' : 'Copiar'}
                </button>
            </div>
            <pre>
                <NodeViewContent as={'code' as any} />
            </pre>
        </NodeViewWrapper>
    );
}
