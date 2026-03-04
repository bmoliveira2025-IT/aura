import { useState, useRef } from 'react';
import { Book, ChevronLeft, ChevronRight, Plus, FileText, Clock, Terminal } from 'lucide-react';

interface DashboardProps {
    notes: any[];
    tags: any[];
    notebooks: string[];
    noteTagMap: Record<string, string[]>;
    onSelectNote: (id: string) => void;
    onNewNote: () => void;
}

export default function Dashboard({ notes, tags, notebooks, noteTagMap, onSelectNote, onNewNote }: DashboardProps) {
    const [activeNotebook, setActiveNotebook] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Filter notes
    let filtered = notes;
    if (activeNotebook) filtered = filtered.filter(n => n.notebook === activeNotebook);
    if (activeTag) filtered = filtered.filter(n => noteTagMap[n.id]?.includes(activeTag));

    const scroll = (dir: 'left' | 'right') => {
        if (!carouselRef.current) return;
        const amount = 320;
        carouselRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return tmp.textContent?.slice(0, 120) || '';
    };

    const clearFilters = () => {
        setActiveNotebook(null);
        setActiveTag(null);
    };

    const renderPreview = (text: string) => {
        if (!text) return 'Nota vazia...';

        // Escapar HTML básico
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 1. Comentários e Strings (primeiro)
        escaped = escaped.replace(/(\/\/.*$)/gm, '<span class="hp-c">$1</span>');
        escaped = escaped.replace(/(".*?"|'.*?')/g, '<span class="hp-s">$1</span>');

        // 2. Keywords e Numeros (apenas onde NÃO há um <span aberto)
        const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'class', 'default', 'type', 'interface', 'any', 'string', 'number', 'boolean', 'null', 'undefined'];
        const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
        const numRegex = /\b(\d+)\b/g;

        const safeReplace = (regex: RegExp, className: string) => {
            escaped = escaped.replace(regex, (match, ...args) => {
                // Em regex com um grupo de captura, os argumentos são:
                // (match, p1, offset, string)
                // Usamos os dois últimos
                const string = args[args.length - 1] as string;
                const offset = args[args.length - 2] as number;

                const before = string.substring(0, offset);
                const openSpan = (before.match(/<span/g) || []).length;
                const closeSpan = (before.match(/<\/span/g) || []).length;
                if (openSpan > closeSpan) return match;
                return `<span class="${className}">${match}</span>`;
            });
        };

        safeReplace(kwRegex, 'hp-k');
        safeReplace(numRegex, 'hp-n');

        return escaped;
    };

    return (
        <div className="dash">
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Sua coleção de notas</h1>
                    <p className="dash-subtitle">
                        {notes.length} registro{notes.length !== 1 ? 's' : ''} • {notebooks.length} caderno{notebooks.length !== 1 ? 's' : ''} • {tags.length} tag{tags.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="dash-new-btn" onClick={onNewNote}>
                    <Plus size={18} /> Nova nota
                </button>
            </div>

            {/* Notebooks */}
            <section className="dash-section">
                <h2 className="dash-section-title"><Book size={16} /> Cadernos</h2>
                <div className="dash-chips">
                    <button
                        className={`dash-chip ${activeNotebook === null ? 'active' : ''}`}
                        onClick={() => setActiveNotebook(null)}
                    >
                        Todos
                        <span className="dash-chip-count">{notes.length}</span>
                    </button>
                    {notebooks.map(nb => (
                        <button
                            key={nb}
                            className={`dash-chip notebook-chip-dash ${activeNotebook === nb ? 'active' : ''}`}
                            onClick={() => setActiveNotebook(activeNotebook === nb ? null : nb)}
                        >
                            <Book size={12} />
                            {nb}
                            <span className="dash-chip-count">{notes.filter(n => n.notebook === nb).length}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Tags */}
            {tags.length > 0 && (
                <section className="dash-section">
                    <h2 className="dash-section-title">Tags</h2>
                    <div className="dash-chips">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                className={`dash-chip ${activeTag === tag.id ? 'active' : ''}`}
                                onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
                                style={activeTag === tag.id ? { borderColor: tag.color, color: tag.color } : {}}
                            >
                                <span className="dash-chip-dot" style={{ background: tag.color }} />
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Active filters */}
            {(activeNotebook || activeTag) && (
                <div className="dash-active-filter">
                    <span>
                        Filtrando por: {activeNotebook && <strong>{activeNotebook}</strong>}
                        {activeNotebook && activeTag && ' + '}
                        {activeTag && <strong>{tags.find(t => t.id === activeTag)?.name}</strong>}
                    </span>
                    <button onClick={clearFilters}>Limpar filtros</button>
                </div>
            )}

            {/* Notes Carousel */}
            <section className="dash-section">
                <div className="dash-carousel-header">
                    <h2 className="dash-section-title">
                        <FileText size={16} />
                        {activeNotebook ? `Notas em "${activeNotebook}"` : 'Notas Recentes'}
                        <span className="dash-count-badge">{filtered.length}</span>
                    </h2>
                    {filtered.length > 3 && (
                        <div className="dash-carousel-nav">
                            <button className="dash-nav-btn" onClick={() => scroll('left')}><ChevronLeft size={18} /></button>
                            <button className="dash-nav-btn" onClick={() => scroll('right')}><ChevronRight size={18} /></button>
                        </div>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="dash-empty">
                        <FileText size={40} />
                        <p>Nenhuma nota encontrada</p>
                        <button className="dash-new-btn small" onClick={onNewNote}>
                            <Plus size={16} /> Criar Nota
                        </button>
                    </div>
                ) : (
                    <div className="dash-carousel" ref={carouselRef}>
                        {filtered.map(note => {
                            const noteTags = noteTagMap[note.id] || [];
                            const preview = stripHtml(note.content?.html || '');
                            return (
                                <button key={note.id} className="dash-card" onClick={() => onSelectNote(note.id)}>
                                    <div className="dash-card-top">
                                        {note.notebook && (
                                            <span className="dash-card-notebook">
                                                <Book size={10} /> {note.notebook}
                                            </span>
                                        )}
                                        {noteTags.length > 0 && (
                                            <div className="dash-card-tags">
                                                {noteTags.slice(0, 3).map(tid => {
                                                    const tag = tags.find(t => t.id === tid);
                                                    return tag ? (
                                                        <span key={tid} className="dash-card-tag-badge" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                                                            {tag.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="dash-card-title">{note.title || 'Sem título'}</h3>
                                    <div
                                        className="dash-card-preview-rich"
                                        dangerouslySetInnerHTML={{ __html: renderPreview(preview) }}
                                    />
                                    <div className="dash-card-footer">
                                        <span className="dash-card-date">
                                            <Clock size={10} />
                                            {new Date(note.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Zabbix Shortcuts */}
            <section className="dash-section zabbix-shortcuts">
                <h2 className="dash-section-title"><Terminal size={16} /> Atalhos zabbix</h2>
                <div className="dash-chips">
                    <a href="https://www.zabbix.com/documentation/current/en" target="_blank" rel="noreferrer" className="dash-chip link-chip">
                        <Book size={12} /> Documentação oficial
                    </a>
                    <a href="https://www.zabbix.com/forum/" target="_blank" rel="noreferrer" className="dash-chip link-chip">
                        <Terminal size={12} /> Fórum comunidade
                    </a>
                    <a href="https://github.com/zabbix/zabbix" target="_blank" rel="noreferrer" className="dash-chip link-chip">
                        <Plus size={12} /> Github zabbix
                    </a>
                </div>
            </section>
        </div>
    );
}
