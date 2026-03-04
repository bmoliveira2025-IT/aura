import { useState, useEffect } from 'react';
import { Trash2, List } from 'lucide-react';
import JsonTreeView from './JsonTreeView';

export default function JsonViewer() {
    const [input, setInput] = useState(() => localStorage.getItem('aura-json-viewer-input') || '');
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('aura-json-viewer-input', input);

        if (!input.trim()) {
            setParsedData(null);
            setError(null);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            setParsedData(parsed);
            setError(null);
        } catch (e: any) {
            setError(`JSON inválido: ${e.message}`);
            setParsedData(null);
        }
    }, [input]);

    const clearAll = () => {
        setInput('');
        setParsedData(null);
        setError(null);
        localStorage.removeItem('aura-json-viewer-input');
    };

    return (
        <div className="json-tool-container">
            <div className="json-tool-header">
                <div className="tool-title">
                    <div className="tool-icon-wrapper">
                        <List size={22} className="tool-icon" />
                    </div>
                    <div>
                        <h2>Visualizador json</h2>
                        <p className="tool-subtitle">Explore a estrutura de seus dados JSON em uma árvore interativa.</p>
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
                    <textarea
                        className="json-textarea modern-scroll"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='Cole seu JSON para visualizar a árvore...'
                        spellCheck="false"
                    />
                </div>

                <div className="json-output-section">
                    <div className="section-label">Estrutura em árvore</div>
                    <div className="output-wrapper">
                        {error && <div className="json-error">{error}</div>}
                        <div className="json-tree-wrapper modern-scroll">
                            {parsedData ? (
                                <JsonTreeView data={parsedData} />
                            ) : (
                                <div className="tree-empty">// Cole um JSON válido para explorar</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
