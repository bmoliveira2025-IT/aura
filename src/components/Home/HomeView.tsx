import { FileText, Calendar, Book, Tag, ChevronRight, Clock, Trash2, Edit } from 'lucide-react';

interface HomeViewProps {
    session: any;
    notes: any[];
    events: any[];
    notebooks: string[];
    tags: any[];
    onNavigate: (view: any) => void;
    onSelectNote: (id: string) => void;
    onDeleteEvent: (id: string) => void;
    onEditEvent: (id: string) => void;
}

export default function HomeView({ session, notes, events, notebooks, tags, onNavigate, onSelectNote, onDeleteEvent, onEditEvent }: HomeViewProps) {
    const userName = session?.user?.email?.split('@')[0] || 'Aura';
    
    // Recent notes (last 3)
    const recentNotes = [...notes].slice(0, 3);
    
    // Upcoming events (today and future)
    const upcomingEvents = [...events]
        .filter(e => new Date(e.start_at) >= new Date(new Date().setHours(0,0,0,0)))
        .sort((a,b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 3);

    return (
        <div className="home-view">
            <header className="home-hero">
                <div>
                    <h1 className="home-greeting">Olá, {userName}! ✨</h1>
                    <p className="home-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </header>

            <div className="home-grid">
                {/* Stats Summary */}
                <div className="home-stats">
                    <div className="stat-card" onClick={() => onNavigate('notes')}>
                        <div className="stat-icon" style={{ background: 'var(--pri-glow)' }}><FileText size={20} color="var(--pri)" /></div>
                        <div className="stat-info">
                            <span className="stat-value">{notes.length}</span>
                            <span className="stat-label">Notas</span>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => onNavigate('calendar')}>
                        <div className="stat-icon" style={{ background: 'rgba(199, 146, 234, 0.15)' }}><Calendar size={20} color="#c792ea" /></div>
                        <div className="stat-info">
                            <span className="stat-value">{events.length}</span>
                            <span className="stat-label">Eventos</span>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => onNavigate('notebooks')}>
                        <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.15)' }}><Book size={20} color="#34d399" /></div>
                        <div className="stat-info">
                            <span className="stat-value">{notebooks.length}</span>
                            <span className="stat-label">Cadernos</span>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => onNavigate('tags')}>
                        <div className="stat-icon" style={{ background: 'rgba(240, 113, 120, 0.15)' }}><Tag size={20} color="#f07178" /></div>
                        <div className="stat-info">
                            <span className="stat-value">{tags.length}</span>
                            <span className="stat-label">Tags</span>
                        </div>
                    </div>
                </div>

                <div className="home-main-cols">
                    {/* Recent Notes Section */}
                    <div className="home-section">
                        <div className="section-header">
                            <h2 className="section-title"><FileText size={18} /> Notas Recentes</h2>
                            <button className="section-link" onClick={() => onNavigate('notes')}>Ver todas <ChevronRight size={14} /></button>
                        </div>
                        <div className="recent-list">
                            {recentNotes.length === 0 ? (
                                <p className="empty-text">Nenhuma nota ainda.</p>
                            ) : (
                                recentNotes.map(note => (
                                    <div key={note.id} className="quick-note-card" onClick={() => onSelectNote(note.id)}>
                                        <div className="note-icon"><FileText size={14} /></div>
                                        <div className="note-info">
                                            <span className="note-title">{note.title || 'Sem título'}</span>
                                            <span className="note-subtitle">{note.notebook || 'Geral'}</span>
                                        </div>
                                        <Clock size={12} className="note-clock" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upcoming Events Section */}
                    <div className="home-section">
                        <div className="section-header">
                            <h2 className="section-title"><Calendar size={18} /> Próximos Eventos</h2>
                            <button className="section-link" onClick={() => onNavigate('calendar')}>Agenda completa <ChevronRight size={14} /></button>
                        </div>
                        <div className="event-list">
                            {upcomingEvents.length === 0 ? (
                                <p className="empty-text">Sem eventos próximos.</p>
                            ) : (
                                upcomingEvents.map(event => (
                                    <div key={event.id} className="quick-event-card">
                                        <div className="event-date">
                                            <span className="ev-day">{new Date(event.start_at).getDate()}</span>
                                            <span className="ev-month">{new Date(event.start_at).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                        </div>
                                        <div className="event-info">
                                            <span className="event-title">{event.title}</span>
                                            <span className="event-time">
                                                {new Date(event.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="event-card-actions">
                                            <button className="ev-action-btn edit" onClick={(e) => { e.stopPropagation(); onEditEvent(event.id); }} title="Editar"><Edit size={14} /></button>
                                            <button className="ev-action-btn delete" onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }} title="Excluir"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .home-view {
                    padding: 2.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    animation: fadeIn 0.4s ease-out;
                }
                .home-greeting { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
                .home-date { color: var(--muted); font-size: 1rem; text-transform: capitalize; }
                .home-grid { margin-top: 3rem; display: flex; flex-direction: column; gap: 2.5rem; }
                .home-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                .stat-card { 
                    background: var(--surface); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px;
                    display: flex; align-items: center; gap: 1.25rem; transition: all 0.2s; cursor: pointer;
                }
                .stat-card:hover { transform: translateY(-3px); border-color: var(--pri); box-shadow: var(--shadow); }
                .stat-icon { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-value { font-size: 1.5rem; font-weight: 800; display: block; line-height: 1; }
                .stat-label { color: var(--muted); font-size: 0.85rem; font-weight: 600; }
                
                .home-main-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
                @media (max-width: 900px) { .home-main-cols { grid-template-columns: 1fr; } }
                
                .home-section { display: flex; flex-direction: column; gap: 1.25rem; }
                .section-header { display: flex; justify-content: space-between; align-items: center; }
                .section-title { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0; }
                .section-link { background: none; border: none; color: var(--pri); font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px; transition: 0.2s; }
                .section-link:hover { background: var(--pri-glow); }
                
                .recent-list, .event-list { display: flex; flex-direction: column; gap: 10px; }
                .quick-note-card, .quick-event-card {
                    background: var(--surface); border: 1px solid var(--border); padding: 12px 16px; border-radius: 14px;
                    display: flex; align-items: center; gap: 12px; transition: 0.2s; cursor: pointer;
                }
                .quick-note-card:hover { border-color: var(--pri); background: var(--surface-2); }
                .note-icon { color: var(--pri); opacity: 0.7; }
                .note-info { flex: 1; display: flex; flex-direction: column; }
                .note-title { font-size: 0.9rem; font-weight: 700; }
                .note-subtitle { font-size: 0.75rem; color: var(--muted); }
                .note-clock { color: var(--muted); opacity: 0.5; }
                
                .event-date { width: 40px; height: 40px; background: var(--surface-2); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid var(--border); }
                .ev-day { font-size: 1rem; font-weight: 800; line-height: 1; color: var(--text); }
                .ev-month { font-size: 0.6rem; text-transform: uppercase; font-weight: 700; color: #c792ea; }
                .event-info { flex: 1; display: flex; flex-direction: column; }
                .event-time { font-size: 0.75rem; color: var(--muted); }
                .empty-text { color: var(--muted); font-size: 0.9rem; font-style: italic; margin: 0; }
                
                .event-card-actions { display: flex; gap: 4px; opacity: 0; transition: 0.2s; }
                .quick-event-card:hover .event-card-actions { opacity: 1; }
                .ev-action-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: 6px; border-radius: 8px; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
                .ev-action-btn:hover { background: var(--surface-2); color: var(--text); }
                .ev-action-btn.delete:hover { color: #f07178; background: rgba(240, 113, 120, 0.1); }
                .ev-action-btn.edit:hover { color: var(--pri); background: var(--pri-glow); }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
