import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, List, BookOpen, X } from 'lucide-react';
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
    addToast('List created', 'success');
  };
  const handleDelete = (id: string) => {
    deleteReadingList(id);
    refresh();
    addToast('List deleted', 'info');
  };
  const handleUpdate = () => {
    if (!editingList || !newListName.trim()) return;
    updateReadingList(editingList.id, { name: newListName.trim(), description: newListDesc.trim() });
    setEditingList(null);
    setNewListName('');
    setNewListDesc('');
    refresh();
    addToast('List updated', 'success');
  };
  const handleRemoveManga = (listId: string, mangaId: string) => {
    removeMangaFromList(listId, mangaId);
    refresh();
  };
  return (
    <div className="site-container py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary">Reading Lists</h1>
        <button
          onClick={() => { setShowCreate(true); setNewListName(''); setNewListDesc(''); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          New List
        </button>
      </div>
      {lists.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <List size={32} className="text-text-muted mb-3" />
          <p className="text-text-secondary mb-1">No reading lists yet</p>
          <p className="text-sm text-text-muted mb-3">Create lists to organize your manga</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map(list => (
            <div key={list.id} className="group p-4 rounded-lg bg-bg-secondary border border-border hover:border-border-hover transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary">{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-text-secondary mt-0.5">{list.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1.5">
                    {list.mangaIds.length} manga · Updated {new Date(list.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingList(list);
                      setNewListName(list.name);
                      setNewListDesc(list.description);
                    }}
                    className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-1.5 rounded-md text-text-muted hover:text-error hover:bg-error/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {/* Manga covers */}
              {list.mangaIds.length > 0 && (
                <div className="flex gap-1.5 mt-3 overflow-x-auto hide-scrollbar">
                  {list.mangaIds.slice(0, 8).map(mangaId => (
                    <Link
                      key={mangaId}
                      to={`/manga/${mangaId}`}
                      className="shrink-0 w-11 h-16 rounded-md overflow-hidden bg-bg-tertiary hover:ring-1 hover:ring-accent/40 transition-all"
                    >
                      <img
                        src={coverMap[mangaId] || ''}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </Link>
                  ))}
                  {list.mangaIds.length > 8 && (
                    <div className="shrink-0 w-11 h-16 rounded-md bg-bg-tertiary flex items-center justify-center">
                      <span className="text-[10px] text-text-muted">+{list.mangaIds.length - 8}</span>
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
        title={editingList ? 'Edit List' : 'New List'}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="My Reading List"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={newListDesc}
              onChange={e => setNewListDesc(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 transition-colors resize-none"
            />
          </div>
          <button
            onClick={editingList ? handleUpdate : handleCreate}
            disabled={!newListName.trim()}
            className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {editingList ? 'Save' : 'Create'}
          </button>
        </div>
      </Modal>
    </div>
  );
}