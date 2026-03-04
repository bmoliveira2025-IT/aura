import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import Editor from './components/Editor/Editor';
import Dashboard from './components/Dashboard/Dashboard';
import { Plus, ChevronRight, ChevronLeft, Shield, Zap, Laptop, MoreVertical, Trash2, X, FolderOpen, Book, Home, Settings, Terminal, Search, List } from 'lucide-react';
import JsonFormatter from './components/Tools/JsonFormatter';
import JsonViewer from './components/Tools/JsonViewer';

interface Note {
  id: string;
  title: string;
  content: { html: string };
  notebook: string | null;
  updated_at: string;
  user_id: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

const TAG_COLORS = ['#4fc1ff', '#34d399', '#c792ea', '#f07178', '#ffcb6b', '#82aaff', '#89ddff'];
const DEFAULT_NOTEBOOK = 'Pessoal';

function App() {
  const { session, isLoading, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [appReady, setAppReady] = useState(false);

  const lastSavedTitleRef = useRef('');
  const lastSavedContentRef = useRef('');

  const [noteId, setNoteId] = useState<string | null>(() => localStorage.getItem('aura_last_note_id'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'dashboard' | 'editor' | 'json-formatter' | 'json-viewer'>(() => {
    return (localStorage.getItem('aura_last_view') as any) || 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Settings & Theme
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'solar' | 'florest' | 'nordic'>(() => {
    return (localStorage.getItem('aura_theme') as any) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura_theme', theme);
  }, [theme]);

  // Persist Navigation
  useEffect(() => {
    if (!appReady) return;
    if (noteId) localStorage.setItem('aura_last_note_id', noteId);
    else localStorage.removeItem('aura_last_note_id');
    localStorage.setItem('aura_last_view', view);
  }, [view, noteId, appReady]);

  // Tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Notebooks (cadernos)
  const [notebooks, setNotebooks] = useState<string[]>([]);
  const [currentNotebook, setCurrentNotebook] = useState<string | null>(null);
  const [filterNotebook, setFilterNotebook] = useState<string | null>(null);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  // ─── Data Loading ─────────────────────────────────────────

  const loadAllNotes = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('notes')
      .select('id, title, updated_at, notebook, content, user_id')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    if (data) {
      setNotes(data as Note[]);
      const nbs = [...new Set([DEFAULT_NOTEBOOK, ...data.map((n: any) => n.notebook).filter(Boolean)])] as string[];
      setNotebooks(nbs);
    }
  };

  const loadTags = async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('tags').select('*').eq('user_id', session.user.id).order('name');
    if (data) setTags(data as Tag[]);
  };

  const loadNoteTags = async (nId: string) => {
    const { data } = await supabase.from('note_tags').select('tag_id').eq('note_id', nId);
    if (data) setNoteTags(data.map((d: any) => d.tag_id));
    else setNoteTags([]);
  };

  useEffect(() => {
    if (!session?.user) return;

    const initialize = async () => {
      await loadAllNotes();
      await loadTags();

      // Recovery Logic
      const lastView = localStorage.getItem('aura_last_view');
      const lastNoteId = localStorage.getItem('aura_last_note_id');

      if (lastView === 'editor' && lastNoteId) {
        await pickNote(lastNoteId);
      } else if (lastView === 'json-tool' || lastView === 'json-formatter') {
        setView('json-formatter');
      } else if (lastView === 'json-viewer') {
        setView('json-viewer');
      } else {
        setView('dashboard');
      }
      setAppReady(true);
    };

    initialize();
  }, [session]);

  // ─── Note Operations ──────────────────────────────────────

  const newNote = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('notes')
      .insert({ user_id: session.user.id, title: 'Título', content: { html: '<p></p>' }, notebook: filterNotebook || DEFAULT_NOTEBOOK })
      .select().single();
    if (data) {
      const n = data as Note;
      setNoteId(n.id);
      setTitle(n.title);
      setContent(n.content.html);
      lastSavedTitleRef.current = n.title;
      lastSavedContentRef.current = n.content.html;
      setCurrentNotebook(n.notebook || null);
      setNoteTags([]);
      setView('editor');
      loadAllNotes();
    }
  };

  const pickNote = async (id: string) => {
    const { data } = await supabase.from('notes').select('*').eq('id', id).single();
    if (data) {
      const n = data as Note;
      setNoteId(n.id);
      setTitle(n.title || '');
      setContent(n.content?.html || '<p></p>');
      lastSavedTitleRef.current = n.title || '';
      lastSavedContentRef.current = n.content?.html || '<p></p>';
      setCurrentNotebook(n.notebook || null);
      loadNoteTags(n.id);
      setView('editor');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const fn = isSignUp ? signUpWithEmail : signInWithEmail;
    const result = await fn(email, password);
    if (result.error) {
      setAuthError(result.error.message);
    } else if (isSignUp) {
      alert('Conta criada! Faça login para continuar.');
      setIsSignUp(false);
      setPassword('');
    }
  };

  const deleteNote = async () => {
    const idToDelete = noteId;
    const userId = session?.user?.id;
    if (!idToDelete || !userId) return;
    setShowMenu(false);
    const { error } = await supabase.from('notes').delete().eq('id', idToDelete).eq('user_id', userId);
    if (error) {
      console.error('Erro ao excluir nota:', error);
      return;
    }
    const remaining = notes.filter(n => n.id !== idToDelete);
    setNotes(remaining);
    if (remaining.length > 0) {
      pickNote(remaining[0].id);
    } else {
      setNoteId(null); setTitle(''); setContent('<p></p>'); setNoteTags([]); setCurrentNotebook(null);
      newNote();
    }
  };

  // ─── Tag Operations ───────────────────────────────────────

  const createTag = async () => {
    if (!session?.user || !newTagName.trim()) return;
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    const { data } = await supabase.from('tags').insert({ user_id: session.user.id, name: newTagName.trim(), color }).select().single();
    if (data) { setTags(prev => [...prev, data as Tag]); setNewTagName(''); }
  };

  const toggleTagOnNote = async (tagId: string) => {
    if (!noteId) return;
    if (noteTags.includes(tagId)) {
      await supabase.from('note_tags').delete().eq('note_id', noteId).eq('tag_id', tagId);
      setNoteTags(prev => prev.filter(id => id !== tagId));
    } else {
      await supabase.from('note_tags').insert({ note_id: noteId, tag_id: tagId });
      setNoteTags(prev => [...prev, tagId]);
    }
  };

  const deleteTag = async (tagId: string) => {
    await supabase.from('tags').delete().eq('id', tagId);
    setTags(prev => prev.filter(t => t.id !== tagId));
    setNoteTags(prev => prev.filter(id => id !== tagId));
    if (filterTag === tagId) setFilterTag(null);
  };

  // ─── Notebook Operations ──────────────────────────────────

  const setNoteNotebook = async (nb: string | null) => {
    if (!noteId || !session?.user) return;
    await supabase.from('notes').update({ notebook: nb }).eq('id', noteId).eq('user_id', session.user.id);
    setCurrentNotebook(nb);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, notebook: nb } : n));
    if (nb && !notebooks.includes(nb)) setNotebooks(prev => [...prev, nb]);
    setShowMenu(false);
  };

  const createNotebook = () => {
    if (!newNotebookName.trim()) return;
    setNoteNotebook(newNotebookName.trim());
    setNewNotebookName('');
    setShowNewNotebook(false);
  };

  // ─── Auto-save ────────────────────────────────────────────

  useEffect(() => {
    if (!noteId || !session?.user || view !== 'editor' || !appReady) return;

    // Dirty check: only save if content/title changed from what's on server
    if (title === lastSavedTitleRef.current && content === lastSavedContentRef.current) return;

    const t = setTimeout(async () => {
      await supabase
        .from('notes')
        .update({ title, content: { html: content }, updated_at: new Date().toISOString() })
        .eq('id', noteId).eq('user_id', session.user.id);

      lastSavedTitleRef.current = title;
      lastSavedContentRef.current = content;

      setNotes(p => p.map(n => n.id === noteId ? { ...n, title, updated_at: new Date().toISOString() } : n));
    }, 1000);
    return () => clearTimeout(t);
  }, [content, title, noteId, session, view, appReady]);

  // ─── Filtering ────────────────────────────────────────────

  const [noteTagMap, setNoteTagMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!session?.user || notes.length === 0) return;
    const loadMap = async () => {
      const { data } = await supabase.from('note_tags').select('note_id, tag_id').in('note_id', notes.map(n => n.id));
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach((d: any) => { if (!map[d.note_id]) map[d.note_id] = []; map[d.note_id].push(d.tag_id); });
        setNoteTagMap(map);
      }
    };
    loadMap();
  }, [notes, session]);

  let filteredNotes = notes;
  if (filterNotebook) filteredNotes = filteredNotes.filter(n => n.notebook === filterNotebook);
  if (filterTag) filteredNotes = filteredNotes.filter(n => noteTagMap[n.id]?.includes(filterTag));

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredNotes = filteredNotes.filter(n => {
      const matchesTitle = n.title?.toLowerCase().includes(q);
      const matchesTags = noteTagMap[n.id]?.some(tid => {
        const tag = tags.find(t => t.id === tid);
        return tag?.name.toLowerCase().includes(q);
      });
      return matchesTitle || matchesTags;
    });
  }

  // ─── Render ───────────────────────────────────────────────

  if (isLoading) return <div className="loading-screen">Carregando Aura...</div>;

  if (!session) {
    return (
      <div className="auth-fullscreen">
        <div className="auth-hero">
          <div className="hero-content">
            <div className="auth-hero-logo">
              <div className="auth-gem large" />
              <h1>Aura</h1>
            </div>
            <p className="hero-tagline">A base de conhecimento essencial para especialistas Zabbix.</p>

            <div className="feature-grid">
              <div className="feature-item">
                <div className="feat-icon"><Terminal size={20} /></div>
                <div>
                  <h3>Scripts & Templates</h3>
                  <p>Guarde seus scripts Python, Bash e templates de monitoramento com sintaxe highlight.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feat-icon"><Zap size={20} /></div>
                <div>
                  <h3>Debug de LLD & Regex</h3>
                  <p>Ferramentas integradas para testar JSONPath e expressões regulares do Zabbix.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feat-icon"><Laptop size={20} /></div>
                <div>
                  <h3>Inventário Estruturado</h3>
                  <p>Documente topologias, itens e triggers de forma organizada e segura.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feat-icon"><Shield size={20} /></div>
                <div>
                  <h3>Pronto para o NOC</h3>
                  <p>Interface Dark otimizada para ambientes de operação e alta performance.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-footer">
            <span>Powered by Supabase & Aura Team</span>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-box glass">
            <div className="auth-logo-mobile">
              <div className="auth-gem" />
              <h1>Aura</h1>
            </div>
            <h2>{isSignUp ? 'Criar sua conta' : 'Boas-vindas de volta'}</h2>
            <p className="auth-subtitle">{isSignUp ? 'Comece sua jornada hoje mesmo.' : 'Entre para continuar de onde parou.'}</p>

            <form className="auth-form" onSubmit={handleAuth}>
              {authError && <div className="auth-error">{authError}</div>}
              <div className="field">
                <label>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="dev@aura.com" required />
              </div>
              <div className="field">
                <label>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-primary main-auth-btn">
                {isSignUp ? 'Criar conta grátis' : 'Entrar na plataforma'}
              </button>
            </form>

            <p className="auth-switch">
              {isSignUp ? 'Já tem uma conta?' : 'Novo por aqui?'}
              <button onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? ' Fazer login' : ' Criar conta grátis'}
              </button>
            </p>

            <div className="auth-badges">
              <span className="badge"><Shield size={12} /> SSL Seguro</span>
              <span className="badge"><Zap size={12} /> Build Fast</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-top">
          <div className="logo">
            <div className="logo-gem" />
            <span className="logo-name">Aura</span>
          </div>
          <button className="icon-btn" onClick={newNote} title="Nova nota"><Plus size={16} /></button>
        </div>

        <div className="sidebar-body">
          {/* ── Busca ── */}
          <div className="sidebar-section">
            <div className="search-wrapper">
              <Search className="search-icon" size={14} />
              <input
                type="text"
                placeholder="Buscar nota ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ── Home ── */}
          <div className="sidebar-section">
            <button
              className={`home-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              <Home size={14} /> Página inicial
            </button>
          </div>


          {/* ── Ferramentas ── */}
          <div className="sidebar-section">
            <span className="section-label">Ferramentas</span>
            <div className="notebooks-list">
              <button
                className={`notebook-btn ${view === 'json-formatter' ? 'active' : ''}`}
                onClick={() => setView('json-formatter')}
              >
                <Terminal size={14} />
                <span>Formatador json</span>
              </button>
              <button
                className={`notebook-btn ${view === 'json-viewer' ? 'active' : ''}`}
                onClick={() => setView('json-viewer')}
              >
                <List size={14} />
                <span>Visualizador json</span>
              </button>
            </div>
          </div>

          {/* ── Cadernos ── */}
          <div className="sidebar-section">
            <span className="section-label">Cadernos</span>
            <div className="notebooks-list">
              <button
                className={`notebook-btn ${filterNotebook === null ? 'active' : ''}`}
                onClick={() => setFilterNotebook(null)}
              >
                <FolderOpen size={14} />
                <span>Todas as notas</span>
                <span className="nb-count">{notes.length}</span>
              </button>
              {notebooks.map((nb: string) => (
                <button
                  key={nb}
                  className={`notebook-btn ${filterNotebook === nb ? 'active' : ''}`}
                  onClick={() => setFilterNotebook(filterNotebook === nb ? null : nb)}
                >
                  <Book size={14} />
                  <span>{nb}</span>
                  <span className="nb-count">{notes.filter((n: Note) => n.notebook === nb).length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Notas ── */}
          <div className="sidebar-section">
            <span className="section-label">
              {filterNotebook ? `Notas em "${filterNotebook}"` : 'Notas recentes'}
              {(filterNotebook || filterTag) && (
                <button className="clear-filter-btn" onClick={() => { setFilterNotebook(null); setFilterTag(null); }} title="Limpar filtros">
                  <X size={10} />
                </button>
              )}
            </span>
            <div className="notes-list">
              {filteredNotes.length === 0
                ? <span className="empty-note">Nenhuma nota encontrada.</span>
                : filteredNotes.map((n: Note) => (
                  <button key={n.id} className={`note-btn ${noteId === n.id ? 'active' : ''}`} onClick={() => pickNote(n.id)}>
                    <span className="n-title">{n.title || 'Sem título'}</span>
                    <div className="n-meta">
                      <span className="n-date">{new Date(n.updated_at).toLocaleDateString('pt-BR')}</span>
                      {n.notebook && <span className="n-notebook">{n.notebook}</span>}
                      {noteTagMap[n.id] && (
                        <div className="n-tags">
                          {noteTagMap[n.id].map((tid: string) => {
                            const tag = tags.find((t: Tag) => t.id === tid);
                            return tag ? <span key={tid} className="n-tag-dot" style={{ background: tag.color }} title={tag.name} /> : null;
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              }
            </div>
          </div>

          {/* ── Tags ── */}
          <div className="sidebar-section">
            <span className="section-label">Tags</span>
            <div className="tags-section">
              {tags.map((tag: Tag) => (
                <div key={tag.id} className={`tag-row ${filterTag === tag.id ? 'active' : ''}`}>
                  <button className="tag-btn" onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}>
                    <span className="tag-color" style={{ background: tag.color }} />
                    <span>{tag.name}</span>
                  </button>
                  <button className="tag-delete" onClick={() => deleteTag(tag.id)} title="Remover tag"><X size={12} /></button>
                </div>
              ))}
              <div className="new-tag-row">
                <input
                  type="text" className="new-tag-input" value={newTagName}
                  onChange={e => setNewTagName(e.target.value)} placeholder="Nova tag..."
                  onKeyDown={e => e.key === 'Enter' && createTag()}
                />
                <button className="icon-btn small" onClick={createTag} title="Criar tag"><Plus size={14} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar">
              {session?.user?.email?.[0].toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{session?.user?.email?.split('@')[0]}</span>
              <button className="profile-action" onClick={signOut}>Sair da conta</button>
            </div>
            <button className="profile-settings-btn" onClick={() => setShowSettings(true)} title="Configurações">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>

      <button
        className={`sidebar-toggle-btn ${isSidebarOpen ? 'open' : 'closed'}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <main className="main">
        {view === 'dashboard' ? (
          <Dashboard
            notes={notes}
            tags={tags}
            notebooks={notebooks}
            noteTagMap={noteTagMap}
            onSelectNote={pickNote}
            onNewNote={newNote}
          />
        ) : view === 'json-formatter' ? (
          <JsonFormatter />
        ) : view === 'json-viewer' ? (
          <JsonViewer />
        ) : (
          <div className="main-inner">
            <div className="title-bar">
              <input type="text" className="title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da nota..." />

              {/* Modern metadata inline */}
              {noteId && (currentNotebook || noteTags.length > 0) && (
                <div className="current-note-meta-inline">
                  {currentNotebook && (
                    <span className="meta-pill notebook-pill" title={`Caderno: ${currentNotebook}`}>
                      <Book size={12} />
                      <span className="pill-text">{currentNotebook}</span>
                    </span>
                  )}
                  {noteTags.map((tid: string) => {
                    const tag = tags.find((t: Tag) => t.id === tid);
                    return tag ? (
                      <span key={tid} className="meta-pill tag-pill" style={{ '--tag-color': tag.color } as any}>
                        <span className="pill-dot" style={{ background: tag.color }} />
                        <span className="pill-text">{tag.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); toggleTagOnNote(tid); }} className="pill-remove">
                          <X size={10} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {noteId && (
                <div className="note-menu-container">
                  <button className="icon-btn note-menu-trigger" onClick={() => setShowMenu(!showMenu)} title="Opções da nota">
                    <MoreVertical size={18} />
                  </button>
                  {showMenu && (
                    <>
                      <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
                      <div className="note-dropdown">
                        {/* Caderno */}
                        <div className="dropdown-section-label">Mover para Caderno</div>
                        <div className="dropdown-tags-list">
                          {notebooks.map((nb: string) => (
                            <button
                              key={nb}
                              className={`dropdown-tag-item ${currentNotebook === nb ? 'selected' : ''}`}
                              onClick={() => setNoteNotebook(nb)}
                            >
                              <Book size={13} /> {nb}
                              {currentNotebook === nb && <span className="tag-check">✓</span>}
                            </button>
                          ))}
                          {!showNewNotebook ? (
                            <button className="dropdown-tag-item create-new" onClick={() => setShowNewNotebook(true)}>
                              <Plus size={13} /> Criar novo caderno
                            </button>
                          ) : (
                            <div className="new-nb-inline">
                              <input
                                type="text" className="new-tag-input" value={newNotebookName}
                                onChange={e => setNewNotebookName(e.target.value)} placeholder="Nome do caderno..."
                                onKeyDown={e => e.key === 'Enter' && createNotebook()}
                                autoFocus
                              />
                              <button className="icon-btn small" onClick={createNotebook}><Plus size={14} /></button>
                            </div>
                          )}
                        </div>

                        <div className="dropdown-divider" />

                        {/* Tags */}
                        <div className="dropdown-section-label">Tags</div>
                        <div className="dropdown-tags-list">
                          {tags.map((tag: Tag) => (
                            <button
                              key={tag.id}
                              className={`dropdown-tag-item ${noteTags.includes(tag.id) ? 'selected' : ''}`}
                              onClick={() => toggleTagOnNote(tag.id)}
                            >
                              <span className="tag-color" style={{ background: tag.color }} />
                              <span>{tag.name}</span>
                              {noteTags.includes(tag.id) && <span className="tag-check">✓</span>}
                            </button>
                          ))}
                          {tags.length === 0 && <div className="dropdown-hint">Crie tags na barra lateral</div>}
                        </div>

                        <div className="dropdown-divider" />

                        <button className="dropdown-item danger" onClick={deleteNote}>
                          <Trash2 size={15} /> Enviar para lixeira
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="editor-box">
              {noteId
                ? <Editor key={noteId} content={content} onChange={setContent} />
                : <div className="empty-editor">Selecione ou crie uma nota</div>
              }
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <>
          <div className="modal-backdrop" onClick={() => setShowSettings(false)} />
          <div className="settings-modal auth-box">
            <div className="settings-header">
              <h2>Configurações</h2>
              <button className="icon-btn" onClick={() => setShowSettings(false)}><X size={18} /></button>
            </div>

            <div className="settings-section">
              <h3>Aparência</h3>
              <p className="settings-desc">Escolha o tema visual da aplicação</p>

              <div className="theme-grid">
                <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  <div className="theme-preview" style={{ background: '#0f1115', borderColor: '#4fc1ff' }}></div>
                  <span>Aura escuro</span>
                </button>
                <button className={`theme-btn ${theme === 'solar' ? 'active' : ''}`} onClick={() => setTheme('solar')}>
                  <div className="theme-preview" style={{ background: '#fcfaf7', borderColor: '#f59e0b' }}></div>
                  <span>Solar</span>
                </button>
                <button className={`theme-btn ${theme === 'florest' ? 'active' : ''}`} onClick={() => setTheme('florest')}>
                  <div className="theme-preview" style={{ background: '#0d1312', borderColor: '#4ade80' }}></div>
                  <span>Florest</span>
                </button>
                <button className={`theme-btn ${theme === 'nordic' ? 'active' : ''}`} onClick={() => setTheme('nordic')}>
                  <div className="theme-preview" style={{ background: '#f1f5f9', borderColor: '#2563eb' }}></div>
                  <span>Nordic</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
