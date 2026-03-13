import { useState } from 'react';
import { Tag as TagIcon, Plus, Search, Trash2 } from 'lucide-react';

interface TagsViewProps {
    tags: any[];
    onNavigateToNotes: (tagId: string) => void;
    onDeleteTag?: (id: string) => void;
    onCreateTag?: (name: string) => void;
}

export default function TagsView({ tags, onNavigateToNotes, onDeleteTag, onCreateTag }: TagsViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [newTagName, setNewTagName] = useState('');

    const filteredTags = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="tags-view">
            <header className="view-header">
                <div>
                    <h1 className="view-title">Categorias & Tags</h1>
                    <p className="view-subtitle">{tags.length} marcadores para suas notas</p>
                </div>
                <div className="view-actions">
                    <div className="search-pill">
                        <Search size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar tag..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="tags-grid">
                {/* Create Tag Card */}
                <div className="tag-card create-tag-card">
                    <div className="tag-icon-circle" style={{ background: 'var(--surface-2)' }}><Plus size={20} /></div>
                    <div className="tag-creation">
                        <input 
                            type="text" 
                            placeholder="Nova tag..." 
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onCreateTag && (onCreateTag(newTagName), setNewTagName(''))}
                        />
                        <button onClick={() => onCreateTag && (onCreateTag(newTagName), setNewTagName(''))}>Criar</button>
                    </div>
                </div>

                {filteredTags.map(tag => {
                    // Count how many notes have this tag
                    // Note: this logic depends on how noteTagMap is passed, but for now we'll assume notes might have a tag reference or we'll filter them later.
                    // If we don't have the map here, we might just show the tag.
                    return (
                        <div key={tag.id} className="tag-card" onClick={() => onNavigateToNotes(tag.id)}>
                            <div className="tag-icon-circle" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                                <TagIcon size={20} />
                            </div>
                            <div className="tag-content">
                                <h3 className="tag-name">{tag.name}</h3>
                                <div className="tag-color-indicator" style={{ backgroundColor: tag.color }} />
                            </div>
                            <button className="tag-delete-btn" onClick={(e) => { e.stopPropagation(); onDeleteTag && onDeleteTag(tag.id); }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .tags-view { padding: 2rem; animation: fadeIn 0.4s ease-out; }
                .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .view-title { font-size: 2rem; font-weight: 800; margin: 0; }
                .view-subtitle { color: var(--muted); margin: 0.25rem 0 0 0; }
                
                .tags-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
                .tag-card { 
                    background: var(--surface); border: 1px solid var(--border); padding: 1.25rem; border-radius: 20px;
                    display: flex; align-items: center; gap: 1rem; transition: all 0.2s; cursor: pointer; position: relative;
                }
                .tag-card:hover { transform: translateY(-3px); border-color: var(--pri); box-shadow: var(--shadow); }
                
                .tag-icon-circle { 
                    width: 44px; height: 44px; border-radius: 14px; 
                    display: flex; align-items: center; justify-content: center;
                }
                .tag-content { flex: 1; }
                .tag-name { font-size: 1rem; font-weight: 700; margin: 0; }
                .tag-color-indicator { width: 30px; height: 4px; border-radius: 2px; margin-top: 6px; }
                
                .tag-delete-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: 6px; border-radius: 8px; opacity: 0; transition: 0.2s; }
                .tag-card:hover .tag-delete-btn { opacity: 1; }
                .tag-delete-btn:hover { background: rgba(240, 113, 120, 0.1); color: #f07178; }
                
                .create-tag-card { cursor: default; }
                .tag-creation { flex: 1; display: flex; gap: 8px; }
                .tag-creation input { background: none; border: none; border-bottom: 1px solid var(--border); color: var(--text); outline: none; font-family: inherit; width: 100%; font-size: 0.9rem; padding: 4px 0; }
                .tag-creation input:focus { border-color: var(--pri); }
                .tag-creation button { background: var(--pri-glow); color: var(--pri); border: none; padding: 4px 10px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.75rem; }
                .tag-creation button:hover { background: var(--pri); color: white; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
