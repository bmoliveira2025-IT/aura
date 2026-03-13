import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import './CalendarView.css';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    start_at: string;
    end_at: string;
    location: string;
    platform: string;
}

export default function CalendarView() {
    const { session } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        location: ''
    });

    const loadEvents = async () => {
        if (!session?.user) return;
        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', session.user.id)
            .order('start_at', { ascending: true });
        
        if (data) setEvents(data);
    };

    useEffect(() => {
        loadEvents();
    }, [session]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) return;

        const { error } = await supabase.from('events').insert({
            user_id: session.user.id,
            ...newEvent,
            start_at: new Date(newEvent.start_at).toISOString(),
            end_at: new Date(newEvent.end_at).toISOString(),
        });

        if (!error) {
            setShowModal(false);
            setNewEvent({ title: '', description: '', start_at: '', end_at: '', location: '' });
            loadEvents();
        }
    };

    const handleConnectGoogle = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            alert('Erro: VITE_GOOGLE_CLIENT_ID não configurado no arquivo .env');
            return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const redirectUri = `${supabaseUrl}/functions/v1/auth-callback`;
        const state = btoa(JSON.stringify({ userId: session?.user.id, platform: 'google' }));
        const scope = 'https://www.googleapis.com/auth/calendar.readonly';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}&` +
            `access_type=offline&` +
            `prompt=consent`;

        window.location.href = authUrl;
    };

    const handleSyncNow = async () => {
        alert('Sincronizando com calendários externos...');
        // No futuro: await supabase.functions.invoke('sync-calendars');
        await loadEvents();
    };

    // Calendar logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const prevMonthDays = daysInMonth(year, month - 1);
    const calendarCells = [];

    // Fill previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        calendarCells.push({ day: prevMonthDays - i, current: false });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
        calendarCells.push({ day: i, current: true, date: new Date(year, month, i) });
    }

    // Fill next month days
    const nextDays = 42 - calendarCells.length;
    for (let i = 1; i <= nextDays; i++) {
        calendarCells.push({ day: i, current: false });
    }

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className="calendar-container">
            <header className="calendar-header">
                <div className="calendar-header-left">
                    <h1>Aura Agenda</h1>
                    <p>Gerencie seus eventos e integrações</p>
                </div>
                <div className="calendar-controls">
                    <div className="calendar-nav">
                        <button className="calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
                        <div className="current-month-display">{monthNames[month]} {year}</div>
                        <button className="calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={18} /></button>
                    </div>
                    <button className="btn-add-event" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Novo Evento
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                <div className="calendar-grid-wrapper">
                    <div className="calendar-days-header">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <div key={d} className="day-name">{d}</div>)}
                    </div>
                    <div className="calendar-grid">
                        {calendarCells.map((cell, idx) => {
                            const cellDate = cell.date;
                            const isToday = cellDate && cellDate.toDateString() === new Date().toDateString();
                            const cellEvents = cellDate ? events.filter(e => new Date(e.start_at).toDateString() === cellDate.toDateString()) : [];

                            return (
                                <div key={idx} className={`calendar-cell ${!cell.current ? 'inactive' : ''} ${isToday ? 'today' : ''}`}>
                                    <span className="cell-number">{cell.day}</span>
                                    <div className="cell-events">
                                        {cellEvents.map(e => (
                                            <div key={e.id} className="event-pill" title={e.title}>{e.title}</div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="calendar-sidebar">
                    <div className="upcoming-widget">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 className="widget-title" style={{ marginBottom: 0 }}><Clock size={18} color="#4fc1ff" /> Próximos Eventos</h3>
                            <button className="icon-btn small" onClick={handleSyncNow} title="Sincronizar agora">
                                <Plus size={14} style={{ transform: 'rotate(45deg)' }} /> {/* Using Plus rotated for Refresh look */}
                            </button>
                        </div>
                        <div className="upcoming-list">
                            {events.slice(0, 5).map(e => {
                                const d = new Date(e.start_at);
                                return (
                                    <div key={e.id} className="upcoming-item">
                                        <div className="upcoming-date-box">
                                            <span className="up-month">{monthNames[d.getMonth()].slice(0, 3)}</span>
                                            <span className="up-day">{d.getDate()}</span>
                                        </div>
                                        <div className="upcoming-info">
                                            <h4>{e.title}</h4>
                                            <p>{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {e.location || 'Sem local'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {events.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Nenhum evento agendado.</p>}
                        </div>
                    </div>

                    <div className="upcoming-widget">
                        <h3 className="widget-title"><CalendarIcon size={18} color="#c792ea" /> Integrações</h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Sincronize sua agenda com outras plataformas.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn-secondary small" style={{ width: '100%', textAlign: 'left' }} onClick={handleConnectGoogle}>Conectar Google Calendar</button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="event-modal">
                        <div className="dash-header" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
                            <h2>Novo Evento</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form className="event-form" onSubmit={handleAddEvent}>
                            <div className="form-group">
                                <label>Título</label>
                                <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Reunião Zabbix..." required />
                            </div>
                            <div className="form-group">
                                <label>Início</label>
                                <input type="datetime-local" value={newEvent.start_at} onChange={e => setNewEvent({...newEvent, start_at: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Término</label>
                                <input type="datetime-local" value={newEvent.end_at} onChange={e => setNewEvent({...newEvent, end_at: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Local</label>
                                <input type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} placeholder="Escritório ou Link..." />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Detalhes do evento..."></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Criar Evento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
