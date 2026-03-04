import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, FileJson, Search, WrapText, Minimize2 } from 'lucide-react';

export default function JsonFormatter() {
    const [input, setInput] = useState(() => localStorage.getItem('aura-json-formatter-input') || '');
    const [output, setOutput] = useState('');
    const [jsonPath, setJsonPath] = useState(() => localStorage.getItem('aura-json-formatter-path') || '');
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isInputCopied, setIsInputCopied] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Persist changes
    useEffect(() => {
        localStorage.setItem('aura-json-formatter-input', input);
        localStorage.setItem('aura-json-formatter-path', jsonPath);
    }, [input, jsonPath]);

    // Live filtering effect
    useEffect(() => {
        const timer = setTimeout(() => {
            applyJsonPath();
            if (input) {
                try {
                    const parsed = JSON.parse(input);
                    setSuggestions(generateSuggestions(parsed));
                } catch {
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        }, 150); // Small debounce to avoid flickering
        return () => clearTimeout(timer);
    }, [input, jsonPath]);

    const generateSuggestions = (obj: any): string[] => {
        const paths: string[] = ['$'];
        if (!obj || typeof obj !== 'object') return paths;

        const traverse = (current: any, path: string, depth: number) => {
            if (depth > 2) return;
            if (Array.isArray(current)) {
                if (current.length > 0) {
                    const newPath = `${path}[0]`;
                    paths.push(newPath);
                    traverse(current[0], newPath, depth + 1);
                }
            } else if (typeof current === 'object' && current !== null) {
                Object.keys(current).slice(0, 5).forEach(key => {
                    const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
                    paths.push(newPath);
                    traverse(current[key], newPath, depth + 1);
                });
            }
        };

        traverse(obj, '$', 0);
        return Array.from(new Set(paths)).slice(0, 8); // Max 8 unique suggestions
    };

    const formatJson = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            setInput(JSON.stringify(parsed, null, 2));
            setError(null);
        } catch (e: any) {
            setError(`Erro no JSON: ${e.message}`);
        }
    };

    const minifyJson = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            setInput(JSON.stringify(parsed));
            setError(null);
        } catch (e: any) {
            setError(`Erro no JSON: ${e.message}`);
        }
    };

    const applyJsonPath = () => {
        try {
            if (!input.trim()) {
                setOutput('');
                setError(null);
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(input);
            } catch (e) {
                return;
            }

            setError(null);

            if (!jsonPath.trim() || jsonPath === '$') {
                setOutput(JSON.stringify(parsed, null, 2));
                return;
            }

            const result = resolvePath(parsed, jsonPath);
            if (result === undefined) {
                setOutput('');
                if (jsonPath.length > 2) {
                    setError("Nenhum resultado encontrado para este caminho.");
                }
            } else {
                setOutput(JSON.stringify(result, null, 2));
                setError(null);
            }
        } catch (e: any) {
            console.log("JSONPath error:", e.message);
        }
    };

    const resolvePath = (obj: any, path: string) => {
        try {
            let cleanPath = path.startsWith('$') ? path.substring(1) : path;
            if (cleanPath.startsWith('.')) cleanPath = cleanPath.substring(1);

            if (!cleanPath) return obj;

            const parts = cleanPath.split(/[.\[\]]+/).filter(Boolean);
            return parts.reduce((acc, part) => {
                if (acc === null || acc === undefined) return undefined;

                const index = parseInt(part, 10);
                if (!isNaN(index) && Array.isArray(acc)) {
                    return acc[index];
                }

                return acc[part];
            }, obj);
        } catch {
            return undefined;
        }
    };

    const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setJsonPath('');
        setError(null);
        localStorage.removeItem('aura-json-formatter-input');
        localStorage.removeItem('aura-json-formatter-path');
    };

    const highlightJson = (json: string) => {
        if (!json) return '';
        // Escape HTML
        const htmlEscaped = json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return htmlEscaped.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    };

    return (
        <div className="json-tool-container">
            <div className="json-tool-header">
                <div className="tool-title">
                    <div className="tool-icon-wrapper">
                        <FileJson size={22} className="tool-icon" />
                    </div>
                    <div>
                        <h2>Formatador json & jsonpath</h2>
                        <p className="tool-subtitle">Formate, minifique e filtre seus dados JSON instantaneamente.</p>
                    </div>
                </div>
                <div className="tool-actions">
                    <button className="modern-tool-btn danger" onClick={clearAll} title="Limpar tudo">
                        <Trash2 size={18} />
                        <span>Limpar</span>
                    </button>
                </div>
            </div>

            <div className="json-tool-grid">
                <div className="json-input-section">
                    <div className="section-label">Entrada json</div>
                    <div className="input-textarea-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <textarea
                            className="json-textarea modern-scroll"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Cole seu JSON aqui... {"id": 1, "name": "Aura"}'
                            style={{ width: '100%', height: '100%' }}
                            spellCheck="false"
                        />
                        {input && (
                            <button
                                className="copy-floating-btn"
                                onClick={() => copyToClipboard(input, setIsInputCopied)}
                                title="Copiar entrada"
                            >
                                {isInputCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        )}
                    </div>
                    <div className="input-controls">
                        <button className="modern-tool-btn primary" onClick={formatJson}>
                            <WrapText size={16} />
                            <span>Prettify</span>
                        </button>
                        <button className="modern-tool-btn secondary" onClick={minifyJson}>
                            <Minimize2 size={16} />
                            <span>Minify</span>
                        </button>
                    </div>
                </div>

                <div className="json-output-section">
                    <div className="section-label">Jsonpath & resultado</div>
                    <div className="path-input-wrapper modern-focus">
                        <Search size={16} className="path-icon" />
                        <input
                            type="text"
                            className="path-input"
                            value={jsonPath}
                            onChange={(e) => setJsonPath(e.target.value)}
                            placeholder="Filtro automático: $.data.items[0]"
                        />
                    </div>

                    {suggestions.length > 0 && (
                        <div className="path-suggestions modern-scroll">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    className={`suggestion-chip ${jsonPath === s ? 'active' : ''}`}
                                    onClick={() => setJsonPath(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="output-wrapper">
                        {error && <div className="json-error">{error}</div>}
                        <pre
                            className="json-output modern-scroll"
                            dangerouslySetInnerHTML={{ __html: output ? highlightJson(output) : (!error ? '// O resultado aparecerá aqui' : '') }}
                        />
                        {output && (
                            <button className="copy-output-btn modern" onClick={() => copyToClipboard(output, setIsCopied)}>
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{isCopied ? 'Copiado' : 'Copiar resultado'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
