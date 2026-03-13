import { useState } from 'react';
import { Book, Plus, MoreVertical, Search } from 'lucide-react';

interface NotebooksViewProps {
    notebooks: string[];
    notes: any[];
    onNavigateToNotes: (notebook: string) => void;
}

export default function NotebooksView({ notebooks, notes, onNavigateToNotes }: NotebooksViewProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNotebooks = notebooks.filter(nb => 
        nb.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="notebooks-view">
            <header className="view-header">
                <div>
                    <h1 className="view-title">Seus Cadernos</h1>
                    <p className="view-subtitle">{notebooks.length} cadernos organizados</p>
                </div>
                <div className="view-actions">
                    <div className="search-pill">
                        <Search size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar caderno..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary-view"><Plus size={18} /> Novo Caderno</button>
                </div>
            </header>

            <div className="notebooks-grid">
                {filteredNotebooks.map(nb => {
                    const count = notes.filter(n => n.notebook === nb).length;
                    return (
                        <div key={nb} className="notebook-card" onClick={() => onNavigateToNotes(nb)}>
                            <div className="nb-card-icon"><Book size={24} /></div>
                            <div className="nb-card-content">
                                <h3 className="nb-card-name">{nb}</h3>
                                <p className="nb-card-count">{count} {count === 1 ? 'nota' : 'notas'}</p>
                            </div>
                            <button className="nb-card-options" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .notebooks-view { padding: 2rem; animation: fadeIn 0.4s ease-out; }
                .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .view-title { font-size: 2rem; font-weight: 800; margin: 0; }
                .view-subtitle { color: var(--muted); margin: 0.25rem 0 0 0; }
                .view-actions { display: flex; gap: 1rem; align-items: center; }
                
                .search-pill { 
                    display: flex; align-items: center; gap: 10px; background: var(--surface);
                    border: 1px solid var(--border); padding: 8px 16px; border-radius: 12px; transition: 0.2s;
                }
                .search-pill:focus-within { border-color: var(--pri); box-shadow: 0 0 0 3px var(--pri-glow); }
                .search-pill input { background: none; border: none; outline: none; color: var(--text); font-family: inherit; width: 200px; }
                
                .btn-primary-view { 
                    background: linear-gradient(135deg, var(--pri), var(--acc)); color: white; border: none;
                    padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px var(--pri-glow); transition: 0.2s;
                }
                .btn-primary-view:hover { transform: translateY(-2px); filter: brightness(1.1); }
                
                .notebooks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .notebook-card { 
                    background: var(--surface); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px;
                    display: flex; align-items: center; gap: 1.25rem; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer; position: relative; overflow: hidden;
                }
                .notebook-card::after { 
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 0; 
                    background: var(--pri); transition: 0.3s; 
                }
                .notebook-card:hover { transform: translateY(-5px); border-color: var(--pri); box-shadow: var(--shadow-lg); }
                .notebook-card:hover::after { width: 4px; }
                
                .nb-card-icon { 
                    width: 50px; height: 50px; background: var(--surface-2); border-radius: 14px;
                    display: flex; align-items: center; justify-content: center; color: var(--pri); border: 1px solid var(--border);
                }
                .nb-card-content { flex: 1; }
                .nb-card-name { font-size: 1.1rem; font-weight: 700; margin: 0; }
                .nb-card-count { font-size: 0.85rem; color: var(--muted); margin: 2px 0 0 0; }
                .nb-card-options { background: none; border: none; color: var(--muted); cursor: pointer; padding: 6px; border-radius: 8px; opacity: 0; transition: 0.2s; }
                .notebook-card:hover .nb-card-options { opacity: 1; }
                .nb-card-options:hover { background: var(--surface-2); color: var(--text); }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
