import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, List, ChevronRight, BookOpen, X } from 'lucide-react';
import {
  getReadingLists, createReadingList, deleteReadingList, updateReadingList,
  removeMangaFromList,
} from '../services/storage';
import { getMangaByIds } from '../services/mangadex';
import { getCoverFileName, getCoverUrl } from '../types';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import type { ReadingList } from '../types';
export default function ReadingListPage() {
  const [lists, setLists] = useState(getReadingLists());
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editingList, setEditingList] = useState<ReadingList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const { addToast } = useToast();
  const refresh = () => setLists(getReadingLists());

  // Fetch covers for all manga in lists
  useEffect(() => {
    const allIds = [...new Set(lists.flatMap(l => l.mangaIds))];
    const idsToFetch = allIds.filter(id => !coverMap[id]);
    if (idsToFetch.length === 0) return;
    getMangaByIds(idsToFetch).then(res => {
      const newMap: Record<string, string> = { ...coverMap };
      for (const manga of res.data) {
        const fileName = getCoverFileName(manga);
        if (fileName) newMap[manga.id] = getCoverUrl(manga.id, fileName, '256');
      }
      setCoverMap(newMap);
    }).catch(() => {});
  }, [lists]);

  const handleCreate = () => {
    if (!newListName.trim()) return;
    createReadingList(newListName.trim(), newListDesc.trim());
    setNewListName('');
    setNewListDesc('');
    setShowCreate(false);
    refresh();
    addToast('Reading list created!', 'success');
  };
  const handleDelete = (id: string) => {
    deleteReadingList(id);
    refresh();
    addToast('Reading list deleted', 'info');
  };
  const handleUpdate = () => {
    if (!editingList || !newListName.trim()) return;
    updateReadingList(editingList.id, { name: newListName.trim(), description: newListDesc.trim() });
    setEditingList(null);
    setNewListName('');
    setNewListDesc('');
    refresh();
    addToast('Reading list updated', 'success');
  };
  const handleRemoveManga = (listId: string, mangaId: string) => {
    removeMangaFromList(listId, mangaId);
    refresh();
  };
  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Reading Lists</h1>
        <button
          onClick={() => { setShowCreate(true); setNewListName(''); setNewListDesc(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all hover:shadow-glow"
        >
          <Plus size={16} />
          New List
        </button>
      </div>
      {lists.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <List size={40} className="text-text-muted mb-4" />
          <p className="text-text-secondary mb-2">No reading lists yet</p>
          <p className="text-sm text-text-muted mb-4">Create custom lists to organize your manga</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list.id} className="group p-5 rounded-2xl bg-bg-secondary border border-border hover:border-border-hover transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary">{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-text-secondary mt-1">{list.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-2">
                    {list.mangaIds.length} manga · Updated {new Date(list.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingList(list);
                      setNewListName(list.name);
                      setNewListDesc(list.description);
                    }}
                    className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {/* Manga in list */}
              {list.mangaIds.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
                  {list.mangaIds.slice(0, 8).map(mangaId => (
                    <Link
                      key={mangaId}
                      to={`/manga/${mangaId}`}
                      className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-bg-tertiary hover:ring-2 hover:ring-accent/40 transition-all"
                    >
                      <img
                        src={coverMap[mangaId] || ''}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </Link>
                  ))}
                  {list.mangaIds.length > 8 && (
                    <div className="shrink-0 w-14 h-20 rounded-lg bg-bg-tertiary flex items-center justify-center">
                      <span className="text-xs text-text-muted">+{list.mangaIds.length - 8}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreate || !!editingList}
        onClose={() => { setShowCreate(false); setEditingList(null); }}
        title={editingList ? 'Edit Reading List' : 'Create Reading List'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
            <input
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="My Reading List"
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description (optional)</label>
            <textarea
              value={newListDesc}
              onChange={e => setNewListDesc(e.target.value)}
              placeholder="What's this list about?"
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all resize-none"
            />
          </div>
          <button
            onClick={editingList ? handleUpdate : handleCreate}
            disabled={!newListName.trim()}
            className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-all"
          >
            {editingList ? 'Save Changes' : 'Create List'}
          </button>
        </div>
      </Modal>
    </div>
  );
}