
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Category, AllData, MatchData } from './types';
import { calculateStandings, getMatchKey } from './utils/leagueEngine';
import LeagueTable from './components/LeagueTable';
import MatchMatrix from './components/MatchMatrix';
import ActionButtons from './components/ActionButtons';
import TeamManager from './components/TeamManager';

/**
 * 【重要】GAS_URL の設定
 * デプロイ後に発行された https://script.google.com/macros/s/.../exec を設定してください。
 */
const GAS_URL: string = "https://script.google.com/macros/s/AKfycbzjGILngqdBRXaTHh4opJYBy-FwYaa0MtG5traytMz1dAKvywWBDWlrjJSTUOtvWCiZwg/exec"; 

const CATEGORIES: Category[] = ['O-40', 'O-50', 'O-60'];
const INITIAL_TEAMS = ["チームA", "チームB", "チームC", "チームD", "チームE", "チームF"];

const INITIAL_DATA: AllData = {
  'O-40': { teams: [...INITIAL_TEAMS], matches: {} },
  'O-50': { teams: [...INITIAL_TEAMS], matches: {} },
  'O-60': { teams: [...INITIAL_TEAMS], matches: {} }
};

const App: React.FC = () => {
  const [data, setData] = useState<AllData>(INITIAL_DATA);
  const [activeCategory, setActiveCategory] = useState<Category>('O-60');
  const [view, setView] = useState<'matrix' | 'table' | 'settings'>('matrix');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem('league_manager_all_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // カテゴリが欠けている場合の補完
        const merged = { ...INITIAL_DATA, ...parsed };
        setData(merged);
      } catch (e) {
        console.error("Failed to parse local data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('league_manager_all_data', JSON.stringify(data));
  }, [data]);

  const currentCategoryData = data[activeCategory] || INITIAL_DATA[activeCategory];
  const standings = useMemo(() => 
    calculateStandings(currentCategoryData.teams, currentCategoryData.matches), 
    [currentCategoryData]
  );

  const syncWithCloud = async (action: 'load' | 'save') => {
    if (!GAS_URL || !GAS_URL.startsWith('https://script.google.com')) {
      alert("エラー: GASのURLが正しくありません。\nデプロイメニューから発行された「ウェブアプリURL」を設定してください。");
      return;
    }
    
    setSyncStatus('syncing');
    try {
      if (action === 'save') {
        const response = await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify(data),
          mode: 'no-cors' // GAS特有のCORS制限を回避
        });
        
        // mode: 'no-cors' の場合 response.ok は常に false ですが、リクエストは届きます
        setSyncStatus('success');
      } else {
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error("データの取得に失敗しました。");
        const cloudData = await response.json();
        
        if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
          // 受信データと初期データをマージして整合性を確保
          setData(prev => ({ ...prev, ...cloudData }));
          setSyncStatus('success');
        } else {
          alert("クラウドに有効なデータがありません。");
          setSyncStatus('error');
        }
      }
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      console.error("Sync Error:", e);
      setSyncStatus('error');
      alert(`同期エラー: ${e instanceof Error ? e.message : '通信に失敗しました'}`);
    }
  };

  const updateScore = useCallback((home: string, away: string, hVal: number | null, aVal: number | null) => {
    setData(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        matches: {
          ...prev[activeCategory].matches,
          [getMatchKey(home, away)]: { home: hVal, away: aVal }
        }
      }
    }));
  }, [activeCategory]);

  const handleClearScores = useCallback(() => {
    setData(prev => ({
      ...prev,
      [activeCategory]: { ...prev[activeCategory], matches: {} }
    }));
  }, [activeCategory]);

  const handleAddTeam = (name: string) => {
    setData(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        teams: [...prev[activeCategory].teams, name]
      }
    }));
  };

  const handleRemoveTeam = (name: string) => {
    setData(prev => {
      const filteredTeams = prev[activeCategory].teams.filter(t => t !== name);
      const filteredMatches = { ...prev[activeCategory].matches };
      Object.keys(filteredMatches).forEach(key => {
        if (key.includes(name)) delete filteredMatches[key];
      });
      return {
        ...prev,
        [activeCategory]: { teams: filteredTeams, matches: filteredMatches }
      };
    });
  };

  const handleUpdateTeamName = (oldName: string, newName: string) => {
    setData(prev => {
      const categoryData = prev[activeCategory];
      const newTeams = categoryData.teams.map(t => t === oldName ? newName : t);
      const newMatches: MatchData = {} as MatchData;
      Object.entries(categoryData.matches).forEach(([key, score]) => {
        const [h, a] = key.split('||');
        const newKey = getMatchKey(h === oldName ? newName : h, a === oldName ? newName : a);
        newMatches[newKey] = score;
      });
      return {
        ...prev,
        [activeCategory]: { teams: newTeams, matches: newMatches }
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <i className="fa-solid fa-futbol text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Soccer League Pro</h1>
              <p className="text-xs text-slate-400 font-medium uppercase">２０２６青森マスターズフットサルフェスタ</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-md text-sm font-black transition-all ${activeCategory === cat ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => syncWithCloud('save')}
                disabled={syncStatus === 'syncing'}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                title="クラウドへ保存"
              >
                <i className={`fa-solid ${syncStatus === 'syncing' ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                <span className="hidden sm:inline">保存</span>
              </button>
              <button 
                onClick={() => syncWithCloud('load')}
                disabled={syncStatus === 'syncing'}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                title="クラウドから読込"
              >
                <i className="fa-solid fa-cloud-arrow-down"></i>
                <span className="hidden sm:inline">読込</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* View Selector */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => setView('matrix')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'matrix' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
            <i className="fa-solid fa-table-cells mr-2"></i>対戦表
          </button>
          <button onClick={() => setView('table')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
            <i className="fa-solid fa-ranking-star mr-2"></i>順位表
          </button>
          <button onClick={() => setView('settings')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${view === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
            <i className="fa-solid fa-gear mr-2"></i>設定
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-white px-4 py-1.5 bg-indigo-600 rounded-full shadow-sm flex items-center">
                  {activeCategory} リーグ
                </span>
                <div className="flex items-center gap-3">
                  {syncStatus === 'success' && <span className="text-xs text-emerald-600 font-bold"><i className="fa-solid fa-check"></i> 同期完了</span>}
                  {syncStatus === 'error' && <span className="text-xs text-rose-600 font-bold"><i className="fa-solid fa-circle-exclamation"></i> 同期エラー</span>}
                </div>
              </div>
              
              {view === 'matrix' && <MatchMatrix teams={currentCategoryData.teams} matches={currentCategoryData.matches} onUpdateScore={updateScore} />}
              {view === 'table' && <LeagueTable standings={standings} />}
              {view === 'settings' && <TeamManager teams={currentCategoryData.teams} onAddTeam={handleAddTeam} onRemoveTeam={handleRemoveTeam} onUpdateTeamName={handleUpdateTeamName} />}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <ActionButtons onClearScores={handleClearScores} />
            <div className="p-6 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-amber-500"></i> 勝ち点と順位の決定
              </h4>
              <div className="text-xs leading-relaxed space-y-3">
                <p>
                  <span className="font-bold text-slate-900">【勝ち点】</span><br/>
                  勝ち: 3点 / 引き分け: 1点 / 負け: 0点
                </p>
                <div className="border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-900">【順位決定の優先順位】</span>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-500">
                    <li>勝ち点</li>
                    <li>得失点差</li>
                    <li>総得点</li>
                    <li>当該チーム間の対戦成績</li>
                  </ol>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1">
                  ※ スコア入力に合わせて順位表はリアルタイムで再計算されます。
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default App;
