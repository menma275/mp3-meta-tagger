// Global Application State
const state = {
  // Album-wide metadata
  albumTitle: '',
  albumArtist: '',
  albumCoverBuffer: null,
  albumCoverMime: '',
  
  // Track array
  tracks: [],
  activeTrackId: null,
  
  // Sync tracker
  currentSyncIndex: 0,
  isSyncModeActive: false
};

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileStatus = document.getElementById('fileStatus');
const loadedSummaryText = document.getElementById('loadedSummaryText');
const resetBtn = document.getElementById('resetBtn');

// Album Settings Inputs
const albumSettingsCard = document.getElementById('albumSettingsCard');
const albumTitleInput = document.getElementById('albumTitleInput');
const albumArtistInput = document.getElementById('albumArtistInput');
const artworkContainer = document.getElementById('artworkContainer');
const coverPreview = document.getElementById('coverPreview');
const changeArtworkOverlay = document.getElementById('changeArtworkOverlay');
const artworkInput = document.getElementById('artworkInput');
const dynamicBg = document.getElementById('dynamicBg');

// Tracklist Sidebar
const tracklistContainer = document.getElementById('tracklistContainer');
const trackCountBadge = document.getElementById('trackCountBadge');
const trackList = document.getElementById('trackList');

// Export Controls
const batchExportContainer = document.getElementById('batchExportContainer');
const saveZipBtn = document.getElementById('saveZipBtn');
const saveIndividualBtn = document.getElementById('saveIndividualBtn');

// Right Panel Track Info Header
const trackDetailHeader = document.getElementById('trackDetailHeader');
const trackDetailNo = document.getElementById('trackDetailNo');
const trackDetailTitle = document.getElementById('trackDetailTitle');
const trackDetailArtist = document.getElementById('trackDetailArtist');

// Track-specific Fields
const trackPlayerCard = document.getElementById('trackPlayerCard');
const inputTitle = document.getElementById('inputTitle');
const inputArtist = document.getElementById('inputArtist');
const inputTrackNumber = document.getElementById('inputTrackNumber');

// Audio Player controls
const audioElement = document.getElementById('audioElement');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const currentTimeDisplay = document.getElementById('currentTime');
const durationTimeDisplay = document.getElementById('durationTime');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const volumeSlider = document.getElementById('volumeSlider');
const volumeIcon = document.getElementById('volumeIcon');

// Tabs & Content
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Lyrics Hub Panels
const lyricsViewer = document.getElementById('lyricsViewer');
const viewerEmptyState = document.getElementById('viewerEmptyState');
const lyricsScroller = document.getElementById('lyricsScroller');

const syncInstructions = document.getElementById('syncInstructions');
const startSyncSetupBtn = document.getElementById('startSyncSetupBtn');
const syncGridContainer = document.getElementById('syncGridContainer');
const syncProgressText = document.getElementById('syncProgressText');
const clearAllTimestampsBtn = document.getElementById('clearAllTimestampsBtn');
const syncLinesList = document.getElementById('syncLinesList');
const syncTriggerBtn = document.getElementById('syncTriggerBtn');

const rawLyricsTextarea = document.getElementById('rawLyricsTextarea');
const applyRawLyricsBtn = document.getElementById('applyRawLyricsBtn');
const clearRawLyricsBtn = document.getElementById('clearRawLyricsBtn');
const importLrcBtn = document.getElementById('importLrcBtn');
const lrcFileInput = document.getElementById('lrcFileInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    lucide.createIcons();
  } catch (err) {
    console.warn("Lucide icons load error:", err);
  }
  setupEventListeners();
});

// Setup Events
function setupEventListeners() {
  // Drag & Drop / File Upload
  dropzone.addEventListener('click', () => fileInput.click());
  selectFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'audio/mp3' || f.type === 'audio/mpeg' || f.name.endsWith('.mp3'));
    if (files.length > 0) {
      handleFilesSelected(files);
    } else {
      alert('MP3ファイルを選択してください。');
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handleFilesSelected(files);
  });

  resetBtn.addEventListener('click', resetApplication);

  // Album metadata inputs
  albumTitleInput.addEventListener('input', (e) => {
    state.albumTitle = e.target.value;
    updateExportButtonsState();
  });
  
  albumArtistInput.addEventListener('input', (e) => {
    state.albumArtist = e.target.value;
    // Update track artist defaults if empty
    state.tracks.forEach(track => {
      const row = document.getElementById(`track-item-${track.id}`);
      if (row && !track.artist) {
        row.querySelector('.track-item-artist').textContent = e.target.value || '不明なアーティスト';
      }
    });
    // Update right panel header if active track uses default artist
    const activeTrack = getActiveTrack();
    if (activeTrack && !activeTrack.artist) {
      trackDetailArtist.textContent = e.target.value || '不明なアーティスト';
    }
    updateExportButtonsState();
  });

  // Album Artwork
  changeArtworkOverlay.addEventListener('click', () => artworkInput.click());
  artworkInput.addEventListener('change', handleAlbumArtworkSelected);

  // Track specific inputs
  inputTitle.addEventListener('input', (e) => {
    const active = getActiveTrack();
    if (active) {
      active.title = e.target.value;
      trackDetailTitle.textContent = e.target.value || active.fileName;
      // update sidebar row
      const row = document.getElementById(`track-item-${active.id}`);
      if (row) row.querySelector('.track-item-title').textContent = e.target.value || active.fileName;
    }
    updateExportButtonsState();
  });

  inputArtist.addEventListener('input', (e) => {
    const active = getActiveTrack();
    if (active) {
      active.artist = e.target.value;
      trackDetailArtist.textContent = e.target.value || state.albumArtist || '不明なアーティスト';
      // update sidebar row
      const row = document.getElementById(`track-item-${active.id}`);
      if (row) row.querySelector('.track-item-artist').textContent = e.target.value || state.albumArtist || '不明なアーティスト';
    }
    updateExportButtonsState();
  });

  inputTrackNumber.addEventListener('input', (e) => {
    const active = getActiveTrack();
    if (active) {
      active.trackNumber = e.target.value;
      trackDetailNo.textContent = e.target.value || '#';
      // update sidebar row
      const row = document.getElementById(`track-item-${active.id}`);
      if (row) row.querySelector('.track-item-no').textContent = e.target.value || '#';
    }
    updateExportButtonsState();
  });

  // Audio Playback Controls
  playBtn.addEventListener('click', togglePlay);
  rewindBtn.addEventListener('click', () => skipAudio(-5));
  forwardBtn.addEventListener('click', () => skipAudio(5));
  
  audioElement.addEventListener('timeupdate', handleTimeUpdate);
  audioElement.addEventListener('loadedmetadata', handleMetadataLoaded);
  audioElement.addEventListener('play', () => {
    playIcon.setAttribute('data-lucide', 'pause');
    try { lucide.createIcons(); } catch(e){}
  });
  audioElement.addEventListener('pause', () => {
    playIcon.setAttribute('data-lucide', 'play');
    try { lucide.createIcons(); } catch(e){}
  });
  audioElement.addEventListener('ended', () => {
    playIcon.setAttribute('data-lucide', 'play');
    try { lucide.createIcons(); } catch(e){}
    lyricsScroller.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Progress Bar Seek
  progressContainer.addEventListener('mousedown', startProgressBarSeek);
  
  // Volume Slider
  volumeSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    audioElement.volume = volume;
    updateVolumeIcon(volume);
  });
  volumeIcon.addEventListener('click', toggleMute);

  // Tabs Toggle
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      tab.classList.add('active');
      const targetContent = document.getElementById('tabContent' + capitalizeFirstLetter(tab.dataset.tab));
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Raw lyrics tab actions
  rawLyricsTextarea.addEventListener('input', () => {
    applyRawLyricsBtn.disabled = rawLyricsTextarea.value.trim() === '';
  });
  
  applyRawLyricsBtn.addEventListener('click', () => {
    const active = getActiveTrack();
    if (!active) return;
    
    const text = rawLyricsTextarea.value;
    active.lyricsLines = parseLyricsText(text);
    renderSyncGrid();
    renderLiveLyrics();
    updateTrackLyricsBadge(active);
    
    document.getElementById('tabLyricsView').click();
  });

  clearRawLyricsBtn.addEventListener('click', () => {
    const active = getActiveTrack();
    if (!active) return;
    
    rawLyricsTextarea.value = '';
    applyRawLyricsBtn.disabled = true;
    active.lyricsLines = [];
    renderSyncGrid();
    renderLiveLyrics();
    updateTrackLyricsBadge(active);
  });

  // LRC file loading
  importLrcBtn.addEventListener('click', () => lrcFileInput.click());
  lrcFileInput.addEventListener('change', handleLrcFileImport);

  // Syncing tab actions
  startSyncSetupBtn.addEventListener('click', () => {
    const active = getActiveTrack();
    if (!active || active.lyricsLines.length === 0) {
      alert('先に「テキスト編集」タブで歌詞を入力してください。');
      document.getElementById('tabLyricsRaw').click();
      return;
    }
    setupSyncMode();
  });

  clearAllTimestampsBtn.addEventListener('click', () => {
    const active = getActiveTrack();
    if (!active) return;
    
    if (confirm('この曲のすべてのタイムスタンプをクリアしますか？')) {
      active.lyricsLines.forEach(line => line.time = null);
      state.currentSyncIndex = 0;
      state.isSyncModeActive = false;
      
      syncGridContainer.classList.add('hidden');
      syncInstructions.classList.remove('hidden');
      
      renderSyncGrid();
      renderLiveLyrics();
      updateRawLyricsTextarea();
      updateTrackLyricsBadge(active);
    }
  });

  // Sync Button Trigger (Space or Click)
  syncTriggerBtn.addEventListener('click', recordTimestamp);

  // Export Buttons
  saveZipBtn.addEventListener('click', handleSaveZip);
  saveIndividualBtn.addEventListener('click', handleSaveIndividual);

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleGlobalKeydown);
}

// Helpers
function getActiveTrack() {
  return state.tracks.find(t => t.id === state.activeTrackId);
}

function capitalizeFirstLetter(string) {
  return string.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

// Safe Async Tag Reading
function readTagsAsync(file) {
  return new Promise((resolve) => {
    if (typeof jsmediatags === 'undefined') {
      console.warn("jsmediatags library not loaded on window.");
      resolve(null);
      return;
    }
    try {
      jsmediatags.read(file, {
        onSuccess: (tagObj) => {
          resolve(tagObj ? tagObj.tags : null);
        },
        onError: (err) => {
          console.warn('jsmediatags error reading file:', file.name, err);
          resolve(null);
        }
      });
    } catch (e) {
      console.error("jsmediatags critical read failure:", e);
      resolve(null);
    }
  });
}

// Safe Async File Buffer Loading
function readFileAsBufferAsync(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => {
        console.error("FileReader onload error:", e);
        resolve(null);
      };
      reader.readAsArrayBuffer(file);
    } catch (e) {
      console.error("FileReader exception:", e);
      resolve(null);
    }
  });
}

// Multi-File selection processing
async function handleFilesSelected(files) {
  try {
    // Show spinner / loading UI state
    loadedSummaryText.textContent = "ファイルを読み込み中...";
    dropzone.classList.add('hidden');
    fileStatus.classList.remove('hidden');
    
    const loadingTracks = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const trackId = 'track_' + Date.now() + '_' + i;
      
      // Create new track entry with defaults
      const newTrack = {
        id: trackId,
        fileName: file.name,
        originalBuffer: null,
        title: '',
        artist: '',
        trackNumber: String(state.tracks.length + i + 1),
        lyricsLines: [],
        audioUrl: URL.createObjectURL(file),
        originalTags: {
          title: '',
          artist: '',
          album: '',
          track: '',
          hasCover: false,
          hasLyrics: false
        }
      };
      
      // Read buffer async
      newTrack.originalBuffer = await readFileAsBufferAsync(file);
      if (!newTrack.originalBuffer) {
        throw new Error(`ファイル "${file.name}" の読み込みに失敗しました。`);
      }
      
      // Read existing tags async safely
      try {
        const tags = await readTagsAsync(file);
        if (tags) {
          if (tags.title) {
            newTrack.title = String(tags.title).trim();
            newTrack.originalTags.title = String(tags.title).trim();
          }
          if (tags.artist) {
            newTrack.artist = String(tags.artist).trim();
            newTrack.originalTags.artist = String(tags.artist).trim();
          }
          
          // Parse track number
          if (tags.track) {
            const trackStr = String(tags.track);
            const num = trackStr.split('/')[0].trim();
            newTrack.trackNumber = num;
            newTrack.originalTags.track = num;
          }
          
          // Extract album title
          if (tags.album) {
            newTrack.originalTags.album = String(tags.album).trim();
            if (!state.albumTitle) {
              state.albumTitle = String(tags.album).trim();
            }
          }
          
          // Extract album artist
          if (!state.albumArtist) {
            if (tags.albumartist) {
              state.albumArtist = String(tags.albumartist).trim();
            } else if (tags.artist) {
              state.albumArtist = String(tags.artist).trim();
            }
          }
          
          // Cover Art extract: extract if not set yet
          if (tags.picture && tags.picture.data) {
            newTrack.originalTags.hasCover = true;
            if (!state.albumCoverBuffer) {
              try {
                const { data, format } = tags.picture;
                const uint8 = new Uint8Array(data);
                state.albumCoverBuffer = uint8.buffer;
                state.albumCoverMime = format || 'image/jpeg';
              } catch (picErr) {
                console.warn("Failed to extract cover art data:", picErr);
              }
            }
          }
          
          // Parse Lyrics USLT
          let lyricsText = '';
          if (tags.lyrics) {
            lyricsText = typeof tags.lyrics === 'object' ? (tags.lyrics.data || '') : tags.lyrics;
          } else if (tags.USLT) {
            lyricsText = typeof tags.USLT === 'object' ? (tags.USLT.data ? (tags.USLT.data.lyrics || '') : '') : tags.USLT;
          }
          
          if (lyricsText) {
            newTrack.lyricsLines = parseLyricsText(String(lyricsText));
            newTrack.originalTags.hasLyrics = true;
          }
        }
      } catch (tagErr) {
        console.warn(`Tag extraction error for ${file.name}:`, tagErr);
      }
      
      loadingTracks.push(newTrack);
    }
    
    // Merge loaded tracks into state
    state.tracks = [...state.tracks, ...loadingTracks];
    
    // Sort tracks by trackNumber (numerical order)
    sortTracks();
    
    // Show UI Cards
    albumSettingsCard.classList.remove('hidden');
    tracklistContainer.classList.remove('hidden');
    batchExportContainer.classList.remove('hidden');
    
    // Load Album inputs values
    albumTitleInput.value = state.albumTitle || '';
    albumArtistInput.value = state.albumArtist || '';
    
    // Set Album Cover preview
    updateAlbumCoverUI();
    
    // Select first loaded track as active
    if (loadingTracks.length > 0) {
      selectTrack(loadingTracks[0].id);
    }
    
    updateLoadedSummaryText();
    updateExportButtonsState();
    
  } catch (error) {
    console.error("Critical error in handleFilesSelected:", error);
    alert("ファイルの読み込み中にエラーが発生しました:\n" + error.message);
    resetApplication();
  }
}

function sortTracks() {
  state.tracks.sort((a, b) => {
    const numA = parseInt(a.trackNumber, 10);
    const numB = parseInt(b.trackNumber, 10);
    if (isNaN(numA) && isNaN(numB)) return a.fileName.localeCompare(b.fileName);
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numA - numB;
  });
}

function updateLoadedSummaryText() {
  loadedSummaryText.textContent = `${state.tracks.length} ファイル読み込み完了`;
  trackCountBadge.textContent = `${state.tracks.length} 曲`;
}

function updateAlbumCoverUI() {
  if (state.albumCoverBuffer) {
    const blob = new Blob([state.albumCoverBuffer], { type: state.albumCoverMime });
    const imgUrl = URL.createObjectURL(blob);
    coverPreview.src = imgUrl;
    coverPreview.classList.remove('placeholder-art');
    artworkContainer.classList.add('active');
    dynamicBg.style.backgroundImage = `url(${imgUrl})`;
  } else {
    resetArtworkToPlaceholder();
  }
}

// Tracklist Sidebar Render
function renderTrackList() {
  trackList.innerHTML = '';
  
  state.tracks.forEach(track => {
    const item = document.createElement('div');
    item.className = `track-item ${track.id === state.activeTrackId ? 'active' : ''}`;
    item.id = `track-item-${track.id}`;
    
    const trackNo = document.createElement('div');
    trackNo.className = 'track-item-no';
    trackNo.textContent = track.trackNumber || '-';
    
    const info = document.createElement('div');
    info.className = 'track-item-info';
    
    const title = document.createElement('span');
    title.className = 'track-item-title';
    title.textContent = track.title || track.fileName;
    
    const artist = document.createElement('span');
    artist.className = 'track-item-artist';
    artist.textContent = track.artist || state.albumArtist || '不明なアーティスト';
    
    info.appendChild(title);
    info.appendChild(artist);
    
    // Lyrics Synced indicator badge
    const hasSync = (track.lyricsLines || []).some(l => l.time !== null);
    const badge = document.createElement('div');
    badge.className = `track-item-badge ${hasSync ? '' : 'hidden'}`;
    badge.innerHTML = '<i data-lucide="sparkles"></i>';
    item.appendChild(badge);
    
    // Remove track button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-icon track-item-remove-btn';
    removeBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    removeBtn.title = "アルバムから削除";
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTrack(track.id);
    });
    item.appendChild(removeBtn);
    
    // Click item to select
    item.addEventListener('click', () => {
      if (track.id !== state.activeTrackId) {
        selectTrack(track.id);
      }
    });
    
    trackList.appendChild(item);
  });
  
  try { lucide.createIcons(); } catch(e){}
}

function updateTrackLyricsBadge(track) {
  const row = document.getElementById(`track-item-${track.id}`);
  if (row) {
    const badge = row.querySelector('.track-item-badge');
    const hasSync = (track.lyricsLines || []).some(l => l.time !== null);
    if (hasSync) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Track Selection
function selectTrack(trackId) {
  try {
    // Pause current playback
    audioElement.pause();
    
    state.activeTrackId = trackId;
    state.isSyncModeActive = false;
    
    // Re-render tracklist highlights
    renderTrackList();
    
    // Load track info
    const active = getActiveTrack();
    if (!active) return;
    
    // Audio src setting
    audioElement.src = active.audioUrl;
    
    // Detail headers
    trackDetailNo.textContent = active.trackNumber || '#';
    trackDetailTitle.textContent = active.title || active.fileName;
    trackDetailArtist.textContent = active.artist || state.albumArtist || '不明なアーティスト';
    
    // Form fields
    inputTitle.value = active.title || '';
    inputArtist.value = active.artist || '';
    inputTrackNumber.value = active.trackNumber || '';
    
    inputTitle.disabled = false;
    inputArtist.disabled = false;
    inputTrackNumber.disabled = false;
    
    // Reset player bar
    currentTimeDisplay.textContent = '00:00';
    durationTimeDisplay.textContent = '00:00';
    progressFill.style.width = '0%';
    progressHandle.style.left = '0%';
    
    // Enable audio controls buttons
    playBtn.disabled = false;
    rewindBtn.disabled = false;
    forwardBtn.disabled = false;
    
    // Lyrics Textarea
    rawLyricsTextarea.disabled = false;
    importLrcBtn.disabled = false;
    clearRawLyricsBtn.disabled = false;
    
    const formattedText = generateLrcTextOutput(active.lyricsLines || []);
    rawLyricsTextarea.value = formattedText;
    applyRawLyricsBtn.disabled = formattedText.trim() === '';
    
    // Sync tab status reset
    syncGridContainer.classList.add('hidden');
    syncInstructions.classList.remove('hidden');
    startSyncSetupBtn.disabled = false;
    
    // Render tabs content
    renderSyncGrid();
    renderLiveLyrics();

    // Render original metadata card
    const originalMetaCard = document.getElementById('originalMetaCard');
    const originalMetaGrid = document.getElementById('originalMetaGrid');
    
    if (active.originalTags && (
      active.originalTags.title || 
      active.originalTags.artist || 
      active.originalTags.album || 
      active.originalTags.track ||
      active.originalTags.hasCover ||
      active.originalTags.hasLyrics
    )) {
      originalMetaCard.classList.remove('hidden');
      originalMetaGrid.innerHTML = `
        <div class="meta-row"><span>曲名:</span><strong>${active.originalTags.title || '（なし）'}</strong></div>
        <div class="meta-row"><span>アーティスト:</span><strong>${active.originalTags.artist || '（なし）'}</strong></div>
        <div class="meta-row"><span>アルバム:</span><strong>${active.originalTags.album || '（なし）'}</strong></div>
        <div class="meta-row"><span>トラック番号:</span><strong>${active.originalTags.track || '（なし）'}</strong></div>
        <div class="meta-row"><span>カバーアート:</span><strong>${active.originalTags.hasCover ? 'あり' : 'なし'}</strong></div>
        <div class="meta-row"><span>元の歌詞:</span><strong>${active.originalTags.hasLyrics ? 'あり' : 'なし'}</strong></div>
      `;
    } else {
      originalMetaCard.classList.add('hidden');
    }
  } catch (err) {
    console.error("Error in selectTrack:", err);
  }
}

function removeTrack(trackId) {
  const idx = state.tracks.findIndex(t => t.id === trackId);
  if (idx === -1) return;
  
  const track = state.tracks[idx];
  
  // Revoke object URL
  if (track.audioUrl) {
    URL.revokeObjectURL(track.audioUrl);
  }
  
  state.tracks.splice(idx, 1);
  
  // If track being removed is active, find another track to select
  if (state.activeTrackId === trackId) {
    if (state.tracks.length > 0) {
      const nextActiveIdx = Math.min(idx, state.tracks.length - 1);
      selectTrack(state.tracks[nextActiveIdx].id);
    } else {
      resetApplication();
      return;
    }
  }
  
  sortTracks();
  renderTrackList();
  updateLoadedSummaryText();
  updateExportButtonsState();
}

function resetArtworkToPlaceholder() {
  coverPreview.removeAttribute('src');
  coverPreview.classList.add('placeholder-art');
  artworkContainer.classList.remove('active');
  dynamicBg.style.backgroundImage = '';
  state.albumCoverBuffer = null;
  state.albumCoverMime = '';
}

function resetApplication() {
  audioElement.pause();
  audioElement.src = '';
  
  // Cleanup object URLs
  state.tracks.forEach(track => {
    if (track.audioUrl) {
      URL.revokeObjectURL(track.audioUrl);
    }
  });
  
  // Revert global states
  state.albumTitle = '';
  state.albumArtist = '';
  state.albumCoverBuffer = null;
  state.albumCoverMime = '';
  state.tracks = [];
  state.activeTrackId = null;
  state.currentSyncIndex = 0;
  state.isSyncModeActive = false;
  
  // Reset Form UI
  albumTitleInput.value = '';
  albumArtistInput.value = '';
  resetArtworkToPlaceholder();
  
  inputTitle.value = '';
  inputArtist.value = '';
  inputTrackNumber.value = '';
  inputTitle.disabled = true;
  inputArtist.disabled = true;
  inputTrackNumber.disabled = true;
  
  trackDetailNo.textContent = '#';
  trackDetailTitle.textContent = '曲が選択されていません';
  trackDetailArtist.textContent = 'MP3ファイルをアップロードしてください';
  
  rawLyricsTextarea.value = '';
  rawLyricsTextarea.disabled = true;
  applyRawLyricsBtn.disabled = true;
  importLrcBtn.disabled = true;
  clearRawLyricsBtn.disabled = true;
  
  syncGridContainer.classList.add('hidden');
  syncInstructions.classList.remove('hidden');
  startSyncSetupBtn.disabled = true;
  
  // Playback reset
  playBtn.disabled = true;
  rewindBtn.disabled = true;
  forwardBtn.disabled = true;
  currentTimeDisplay.textContent = '00:00';
  durationTimeDisplay.textContent = '00:00';
  progressFill.style.width = '0%';
  progressHandle.style.left = '0%';
  
  // View panels toggles
  dropzone.classList.remove('hidden');
  fileStatus.classList.add('hidden');
  albumSettingsCard.classList.add('hidden');
  tracklistContainer.classList.add('hidden');
  batchExportContainer.classList.add('hidden');
  document.getElementById('originalMetaCard').classList.add('hidden');
  
  renderTrackList();
  renderSyncGrid();
  renderLiveLyrics();
  updateExportButtonsState();
}

// Artwork handle
function handleAlbumArtworkSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    state.albumCoverBuffer = evt.target.result;
    state.albumCoverMime = file.type;
    updateAlbumCoverUI();
    updateExportButtonsState();
  };
  reader.readAsArrayBuffer(file);
}

// Lyrics Parser
function parseLyricsText(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const result = [];
  const lrcRegex = /^\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\](.*)/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const match = trimmed.match(lrcRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const fracStr = match[3] || '00';
      const frac = parseInt(fracStr, 10);
      const divisor = fracStr.length === 3 ? 1000 : 100;
      
      const seconds = min * 60 + sec + (frac / divisor);
      const textVal = match[4].trim();
      
      result.push({ time: seconds, text: textVal });
    } else {
      result.push({ time: null, text: trimmed });
    }
  });
  
  return result;
}

// Audio Player Actions
function togglePlay() {
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
}

function skipAudio(amount) {
  audioElement.currentTime = Math.max(0, Math.min(audioElement.duration || 0, audioElement.currentTime + amount));
}

function handleMetadataLoaded() {
  durationTimeDisplay.textContent = formatPlayerTime(audioElement.duration);
}

function handleTimeUpdate() {
  const current = audioElement.currentTime;
  const duration = audioElement.duration || 0;
  
  currentTimeDisplay.textContent = formatPlayerTime(current);
  
  if (duration > 0) {
    const percent = (current / duration) * 100;
    progressFill.style.width = percent + '%';
    progressHandle.style.left = percent + '%';
  }
  
  updateLyricsScroller(current);
}

function startProgressBarSeek(e) {
  const rect = progressContainer.getBoundingClientRect();
  const updateProgress = (clientX) => {
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    progressFill.style.width = (percentage * 100) + '%';
    progressHandle.style.left = (percentage * 100) + '%';
    
    if (audioElement.duration) {
      audioElement.currentTime = percentage * audioElement.duration;
    }
  };

  updateProgress(e.clientX);

  const onMouseMove = (moveEvent) => {
    updateProgress(moveEvent.clientX);
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function updateVolumeIcon(volume) {
  if (volume === 0) {
    volumeIcon.setAttribute('data-lucide', 'volume-x');
  } else if (volume < 0.4) {
    volumeIcon.setAttribute('data-lucide', 'volume');
  } else if (volume < 0.7) {
    volumeIcon.setAttribute('data-lucide', 'volume-1');
  } else {
    volumeIcon.setAttribute('data-lucide', 'volume-2');
  }
  try { lucide.createIcons(); } catch(e){}
}

function toggleMute() {
  if (audioElement.volume > 0) {
    audioElement.dataset.prevVolume = audioElement.volume;
    audioElement.volume = 0;
    volumeSlider.value = 0;
    updateVolumeIcon(0);
  } else {
    const prev = parseFloat(audioElement.dataset.prevVolume || '0.8');
    audioElement.volume = prev;
    volumeSlider.value = prev;
    updateVolumeIcon(prev);
  }
}

// Live View Scrolling Lyrics
function renderLiveLyrics() {
  lyricsScroller.innerHTML = '';
  const active = getActiveTrack();
  if (!active) return;
  
  const contentLines = (active.lyricsLines || []).filter(line => line.text.trim() !== '');
  
  if (contentLines.length === 0) {
    viewerEmptyState.classList.remove('hidden');
    return;
  }
  
  viewerEmptyState.classList.add('hidden');
  
  contentLines.forEach((line, index) => {
    const el = document.createElement('div');
    el.className = 'lyric-line';
    el.textContent = line.text;
    el.dataset.index = index;
    
    if (line.time !== null) {
      el.addEventListener('click', () => {
        audioElement.currentTime = line.time;
        const activeLines = lyricsScroller.querySelectorAll('.lyric-line');
        activeLines.forEach(l => l.classList.remove('active', 'passed'));
        el.classList.add('active');
      });
    }
    
    lyricsScroller.appendChild(el);
  });
}

function updateLyricsScroller(currentTime) {
  const active = getActiveTrack();
  if (!active || !active.lyricsLines) return;
  
  const lines = lyricsScroller.querySelectorAll('.lyric-line');
  if (lines.length === 0) return;
  
  const timedLines = active.lyricsLines
    .map((line, index) => ({ ...line, originalIndex: index }))
    .filter(line => line.time !== null);
    
  if (timedLines.length === 0) return;
  
  let activeIndex = -1;
  for (let i = 0; i < timedLines.length; i++) {
    if (currentTime >= timedLines[i].time) {
      if (i === timedLines.length - 1 || currentTime < timedLines[i+1].time) {
        activeIndex = timedLines[i].originalIndex;
        break;
      }
    }
  }
  
  lines.forEach(line => {
    const idx = parseInt(line.dataset.index, 10);
    const contentLines = active.lyricsLines.filter(l => l.text.trim() !== '');
    const actualLineIndex = active.lyricsLines.indexOf(contentLines[idx]);
    
    if (actualLineIndex === activeIndex) {
      if (!line.classList.contains('active')) {
        line.classList.add('active');
        line.classList.remove('passed');
        
        const scrollerHeight = lyricsScroller.clientHeight;
        const elemTop = line.offsetTop;
        const elemHeight = line.clientHeight;
        
        lyricsScroller.scrollTo({
          top: elemTop - (scrollerHeight / 2) + (elemHeight / 2),
          behavior: 'smooth'
        });
      }
    } else {
      line.classList.remove('active');
      if (actualLineIndex < activeIndex) {
        line.classList.add('passed');
      } else {
        line.classList.remove('passed');
      }
    }
  });
}

// Sync Editor List
function setupSyncMode() {
  state.currentSyncIndex = 0;
  state.isSyncModeActive = true;
  
  syncInstructions.classList.add('hidden');
  syncGridContainer.classList.remove('hidden');
  
  renderSyncGrid();
}

function renderSyncGrid() {
  syncLinesList.innerHTML = '';
  
  const active = getActiveTrack();
  if (!active || !active.lyricsLines || active.lyricsLines.length === 0) {
    syncLinesList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 24px 0; font-size: 13px;">歌詞テキストがありません</div>';
    syncProgressText.textContent = '0 / 0 行';
    return;
  }
  
  syncProgressText.textContent = `${active.lyricsLines.filter(l => l.time !== null).length} / ${active.lyricsLines.length} 行`;
  
  active.lyricsLines.forEach((line, index) => {
    const row = document.createElement('div');
    row.className = `sync-row ${state.currentSyncIndex === index && state.isSyncModeActive ? 'selected' : ''} ${line.time !== null ? 'synced' : ''}`;
    
    const timeCol = document.createElement('div');
    timeCol.className = 'sync-row-time';
    timeCol.textContent = line.time !== null ? formatMinutesAndSeconds(line.time) : '--:--';
    
    const textCol = document.createElement('div');
    textCol.className = 'sync-row-text';
    textCol.textContent = line.text;
    
    const actionsCol = document.createElement('div');
    actionsCol.className = 'sync-row-actions';
    
    const minusBtn = document.createElement('button');
    minusBtn.className = 'btn btn-secondary sync-row-btn';
    minusBtn.innerHTML = '<i data-lucide="minus"></i>';
    minusBtn.disabled = line.time === null;
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adjustLineTime(index, -0.1);
    });

    const plusBtn = document.createElement('button');
    plusBtn.className = 'btn btn-secondary sync-row-btn';
    plusBtn.innerHTML = '<i data-lucide="plus"></i>';
    plusBtn.disabled = line.time === null;
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adjustLineTime(index, 0.1);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-secondary sync-row-btn reset-btn';
    delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    delBtn.disabled = line.time === null;
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearLineTime(index);
    });
    
    actionsCol.appendChild(minusBtn);
    actionsCol.appendChild(plusBtn);
    actionsCol.appendChild(delBtn);
    
    row.appendChild(timeCol);
    row.appendChild(textCol);
    row.appendChild(actionsCol);
    
    row.addEventListener('click', () => {
      state.isSyncModeActive = true;
      syncInstructions.classList.add('hidden');
      syncGridContainer.classList.remove('hidden');
      state.currentSyncIndex = index;
      renderSyncGrid();
    });
    
    syncLinesList.appendChild(row);
  });
  
  const activeRow = syncLinesList.querySelector('.sync-row.selected');
  if (activeRow) {
    activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  
  try { lucide.createIcons(); } catch(e){}
}

function recordTimestamp() {
  const active = getActiveTrack();
  if (!active || !state.isSyncModeActive || !active.lyricsLines || active.lyricsLines.length === 0) return;
  if (state.currentSyncIndex >= active.lyricsLines.length) return;
  
  const now = audioElement.currentTime;
  active.lyricsLines[state.currentSyncIndex].time = now;
  
  if (state.currentSyncIndex < active.lyricsLines.length - 1) {
    state.currentSyncIndex++;
  } else {
    state.isSyncModeActive = false;
    alert('すべての行の同期が完了しました！');
  }
  
  renderSyncGrid();
  renderLiveLyrics();
  updateRawLyricsTextarea();
  updateTrackLyricsBadge(active);
  updateExportButtonsState();
}

function adjustLineTime(index, offset) {
  const active = getActiveTrack();
  if (active && active.lyricsLines && active.lyricsLines[index].time !== null) {
    active.lyricsLines[index].time = Math.max(0, active.lyricsLines[index].time + offset);
    renderSyncGrid();
    renderLiveLyrics();
    updateRawLyricsTextarea();
    updateExportButtonsState();
  }
}

function clearLineTime(index) {
  const active = getActiveTrack();
  if (active && active.lyricsLines) {
    active.lyricsLines[index].time = null;
    renderSyncGrid();
    renderLiveLyrics();
    updateRawLyricsTextarea();
    updateTrackLyricsBadge(active);
    updateExportButtonsState();
  }
}

function updateRawLyricsTextarea() {
  const active = getActiveTrack();
  if (!active || !active.lyricsLines) return;
  
  const formattedText = generateLrcTextOutput(active.lyricsLines);
  rawLyricsTextarea.value = formattedText;
  applyRawLyricsBtn.disabled = formattedText.trim() === '';
}

function handleLrcFileImport(e) {
  const active = getActiveTrack();
  if (!active) return;
  
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    rawLyricsTextarea.value = text;
    applyRawLyricsBtn.disabled = false;
    
    active.lyricsLines = parseLyricsText(text);
    renderSyncGrid();
    renderLiveLyrics();
    updateTrackLyricsBadge(active);
    
    document.getElementById('tabLyricsView').click();
  };
  reader.readAsText(file);
}

function handleGlobalKeydown(e) {
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
    return;
  }
  
  if (e.code === 'Space') {
    e.preventDefault();
    if (state.isSyncModeActive && document.getElementById('tabLyricsSync').classList.contains('active')) {
      recordTimestamp();
    } else if (state.activeTrackId) {
      togglePlay();
    }
  }
}

// Output generator
function generateLrcTextOutput(lyricsLines) {
  if (!lyricsLines) return '';
  return lyricsLines.map(line => {
    if (line.time !== null) {
      return `${formatLrcTimestamp(line.time)}${line.text}`;
    }
    return line.text;
  }).join('\n');
}

// Tag compiler for single track arraybuffer
function compileMp3BufferWithMetadata(track) {
  if (typeof ID3Writer === 'undefined') {
    throw new Error("browser-id3-writer library is not loaded on window.");
  }
  
  const writer = new ID3Writer(track.originalBuffer);
  
  // Track Specifics
  if (track.title && track.title.trim()) writer.setFrame('TIT2', track.title.trim());
  
  const currentArtist = track.artist ? track.artist.trim() : (state.albumArtist ? state.albumArtist.trim() : '');
  if (currentArtist) {
    writer.setFrame('TPE1', [currentArtist]);
  }
  
  if (track.trackNumber && track.trackNumber.trim()) {
    writer.setFrame('TRCK', track.trackNumber.trim());
  }
  
  // Track specific or parsed lyrics
  const lyricsToSave = generateLrcTextOutput(track.lyricsLines || []);
  if (lyricsToSave.trim()) {
    writer.setFrame('USLT', {
      description: 'Lyrics',
      lyrics: lyricsToSave,
      language: 'jpn'
    });
  }
  
  // Album-wide settings
  if (state.albumTitle && state.albumTitle.trim()) writer.setFrame('TALB', state.albumTitle.trim());
  if (state.albumArtist && state.albumArtist.trim()) writer.setFrame('TPE2', state.albumArtist.trim());
  
  // Cover Art APIC
  if (state.albumCoverBuffer) {
    writer.setFrame('APIC', {
      type: 3,
      data: state.albumCoverBuffer,
      description: 'Cover',
      useUnicodeEncoding: false
    });
  }
  
  writer.addTag();
  return writer.arrayBuffer;
}

// Download Handlers
function handleSaveIndividual() {
  const active = getActiveTrack();
  if (!active) return;
  
  try {
    saveIndividualBtn.disabled = true;
    saveIndividualBtn.innerHTML = '<i data-lucide="loader" class="animate-pulse"></i> <span>書き込み中...</span>';
    try { lucide.createIcons(); } catch(e){}
    
    // Compile and package
    const outputBuffer = compileMp3BufferWithMetadata(active);
    const blob = new Blob([outputBuffer], { type: 'audio/mp3' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    
    // File name formulation
    let downloadName = active.fileName;
    const currentArtist = active.artist || state.albumArtist;
    const currentTrackNo = active.trackNumber ? String(active.trackNumber).padStart(2, '0') + ' ' : '';
    
    if (active.title && currentArtist) {
      downloadName = `${currentTrackNo}${currentArtist} - ${active.title}.mp3`;
    } else if (active.title) {
      downloadName = `${currentTrackNo}${active.title}.mp3`;
    }
    
    downloadLink.download = downloadName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);
    
    saveIndividualBtn.innerHTML = '<i data-lucide="check"></i> <span>保存完了！</span>';
    try { lucide.createIcons(); } catch(e){}
    
    setTimeout(() => {
      saveIndividualBtn.innerHTML = '<i data-lucide="download"></i> <span>選択中の曲をダウンロード</span>';
      try { lucide.createIcons(); } catch(e){}
      updateExportButtonsState();
    }, 3000);
    
  } catch (error) {
    console.error('Failed writing MP3 metadata:', error);
    alert('メタデータの書き込み中にエラーが発生しました: ' + error.message);
    saveIndividualBtn.innerHTML = '<i data-lucide="download"></i> <span>選択中の曲をダウンロード</span>';
    try { lucide.createIcons(); } catch(e){}
    updateExportButtonsState();
  }
}

async function handleSaveZip() {
  if (state.tracks.length === 0) return;
  
  try {
    saveZipBtn.disabled = true;
    saveZipBtn.innerHTML = '<i data-lucide="loader" class="animate-pulse"></i> <span>アルバムZIPを作成中...</span>';
    saveIndividualBtn.disabled = true;
    try { lucide.createIcons(); } catch(e){}
    
    const zip = new JSZip();
    
    // Compile and add each file to ZIP
    state.tracks.forEach(track => {
      const outputBuffer = compileMp3BufferWithMetadata(track);
      
      // Filename in ZIP
      let zipFileName = track.fileName;
      const currentArtist = track.artist || state.albumArtist;
      const currentTrackNo = track.trackNumber ? String(track.trackNumber).padStart(2, '0') + ' - ' : '';
      
      if (track.title && currentArtist) {
        zipFileName = `${currentTrackNo}${currentArtist} - ${track.title}.mp3`;
      } else if (track.title) {
        zipFileName = `${currentTrackNo}${track.title}.mp3`;
      }
      
      zip.file(zipFileName, outputBuffer);
    });
    
    // Generate ZIP blob
    const content = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(content);
    
    // Download zip link
    const downloadLink = document.createElement('a');
    downloadLink.href = zipUrl;
    
    // ZIP name
    const zipName = state.albumTitle ? `${state.albumTitle}.zip` : 'album_collection.zip';
    
    downloadLink.download = zipName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => {
      URL.revokeObjectURL(zipUrl);
    }, 2000);
    
    saveZipBtn.innerHTML = '<i data-lucide="check"></i> <span>一括保存完了！</span>';
    try { lucide.createIcons(); } catch(e){}
    
    setTimeout(() => {
      saveZipBtn.innerHTML = '<i data-lucide="file-archive"></i> <span>アルバムを ZIP で一括ダウンロード</span>';
      try { lucide.createIcons(); } catch(e){}
      updateExportButtonsState();
    }, 3000);
    
  } catch (error) {
    console.error('ZIP compilation failed:', error);
    alert('ZIPファイルの作成中にエラーが発生しました: ' + error.message);
    saveZipBtn.innerHTML = '<i data-lucide="file-archive"></i> <span>アルバムを ZIP で一括ダウンロード</span>';
    try { lucide.createIcons(); } catch(e){}
    updateExportButtonsState();
  }
}

// Time Format Helpers
function formatPlayerTime(seconds) {
  if (isNaN(seconds)) return '00:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatMinutesAndSeconds(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`;
}

function formatLrcTimestamp(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
}

function updateExportButtonsState() {
  const hasTracks = state.tracks.length > 0;
  saveZipBtn.disabled = !hasTracks;
  saveIndividualBtn.disabled = !state.activeTrackId;
}
