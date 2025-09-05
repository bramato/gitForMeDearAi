# 🎯 GitForMeDearAi

> Un server MCP (Model Context Protocol) completo per l'automazione di tutti i comandi Git e GitHub, installabile globalmente con npm.

## 🌟 Panoramica

**GitForMeDearAi** è un server MCP che fornisce accesso completo a tutti i comandi Git e GitHub attraverso un'interfaccia unificata. Progettato per sviluppatori che vogliono automatizzare i workflow di versioning e collaborazione senza dover ricordare sintassi complesse.

## 🚀 Caratteristiche Principali

- 🔧 **150+ Comandi Git/GitHub** - Dalla inizializzazione al deployment
- ⚡ **Installazione Globale** - Un solo comando npm per essere operativi
- 🎨 **Zero Configuration** - Funziona immediatamente dopo l'installazione
- 🔒 **Gestione Sicura** - Autenticazione GitHub integrata
- 📋 **Categorizzazione Logica** - Comandi organizzati per workflow
- 🌐 **Cross-Platform** - Compatibile con Windows, macOS, Linux

## 📦 Installazione

```bash
# Installazione globale
npm install -g git-for-me-dear-ai

# Verifica installazione
git-for-me-dear-ai --version
```

## 🔧 Configurazione MCP Client

### 🎯 **Cursor IDE**

1. **Apri le impostazioni MCP** in Cursor:
   ```
   Cursor → Preferences → Features → Model Context Protocol
   ```

2. **Aggiungi il server GitForMeDearAi** nel file di configurazione MCP:
   ```json
   {
     "mcpServers": {
       "git-for-me-dear-ai": {
         "command": "node",
         "args": [
           "/path/to/your/global/node_modules/git-for-me-dear-ai/dist/index.js"
         ],
         "env": {
           "GITHUB_TOKEN": "your-github-token-here"
         }
       }
     }
   }
   ```

3. **Trova il percorso dell'installazione globale**:
   ```bash
   npm list -g git-for-me-dear-ai
   # O usa: npm root -g
   ```

4. **Riavvia Cursor** per caricare il server MCP

### 🎯 **Claude Code**

1. **Installa il server** globalmente:
   ```bash
   npm install -g git-for-me-dear-ai
   ```

2. **Aggiungi al file di configurazione MCP** (`~/.config/claude-code/mcp.json`):
   ```json
   {
     "servers": {
       "git-for-me-dear-ai": {
         "command": "git-for-me-dear-ai",
         "args": ["start"],
         "env": {
           "GITHUB_TOKEN": "ghp_your_github_token_here",
           "LOG_LEVEL": "INFO"
         }
       }
     }
   }
   ```

3. **Configura il token GitHub** (opzionale per funzioni GitHub):
   ```bash
   # Metodo 1: Environment variable
   export GITHUB_TOKEN="ghp_your_github_token_here"
   
   # Metodo 2: Config file
   echo '{"githubToken": "ghp_your_token_here"}' > ~/.gitformeDearai.json
   ```

4. **Verifica la configurazione**:
   ```bash
   git-for-me-dear-ai config --show
   git-for-me-dear-ai tools --category repository
   ```

### 🎯 **Altri Client MCP**

Per altri client che supportano MCP, usa questa configurazione base:

```json
{
  "name": "git-for-me-dear-ai",
  "command": "git-for-me-dear-ai",
  "args": ["start"],
  "env": {
    "GITHUB_TOKEN": "optional_github_token"
  }
}
```

### 🔐 **Setup Token GitHub** (Opzionale)

Per utilizzare le funzionalità GitHub:

1. **Crea un Personal Access Token** su GitHub:
   - Vai su GitHub → Settings → Developer settings → Personal access tokens
   - Genera un nuovo token con scope: `repo`, `issues`, `pull_requests`

2. **Configura il token**:
   ```bash
   # Opzione 1: Environment variable (raccomandato)
   export GITHUB_TOKEN="ghp_your_token_here"
   
   # Opzione 2: Config file locale
   echo '{"githubToken": "ghp_your_token_here"}' > .gitformeDearai.json
   
   # Opzione 3: Config file globale
   echo '{"githubToken": "ghp_your_token_here"}' > ~/.gitformeDearai.json
   ```

## 🎯 Categorie di Comandi

### 🔥 **Priorità Alta** (Workflow Quotidiani)

#### 📁 **Repository Management**
- Inizializzazione e clonazione repository
- Gestione remote e configurazione
- Import/export repository

#### 🌿 **Branch & Merge Operations**
- Creazione, switch e eliminazione branch
- Merge, rebase e cherry-pick
- Gestione conflitti

#### 💾 **Commit & Push Operations**
- Add, commit con messaggi strutturati
- Push/pull con gestione upstream
- Gestione staging area

#### 🔍 **Status & Inspection**
- Status repository e working tree
- Log, diff e blame
- File tracking e ignoring

### ⚡ **Priorità Media** (Funzioni Avanzate)

#### 🐛 **GitHub Issues**
- Creazione e gestione issues
- Assegnazione e labeling
- Milestone e progetti

#### 🔀 **Pull Requests**
- Creazione e review PR
- Merge strategies
- Draft e conversioni

#### 🏷️ **Tags & Releases**
- Gestione tags e versioning
- Creazione release
- Asset management

#### ⏪ **History & Recovery**
- Reset e revert operations
- Stash management
- Reflog e recovery

### 📋 **Priorità Bassa** (Casi Specialistici)

#### 🔧 **Advanced Git**
- Submodules e subtrees
- Hooks personalizzati
- Worktrees multipli

#### 🏢 **Enterprise Features**
- Team management
- Organization settings
- Security e compliance

#### 🛠️ **Maintenance**
- Garbage collection
- Repository optimization
- Backup e sync

## 💻 Esempi di Utilizzo

### 🎯 Tramite Client MCP (Cursor, Claude Code)

Una volta configurato, puoi usare comandi naturali:

```
"Inizializza un nuovo repository Git in questa directory"
→ Usa: git_init

"Mostra lo stato del repository con dettagli sui file modificati"
→ Usa: git_status

"Crea un commit con il messaggio 'feat: add new authentication system'"
→ Usa: git_commit con convenzioni

"Crea un nuovo branch chiamato 'feature/user-dashboard'"
→ Usa: git_branch_create

"Pusha i miei cambiamenti su origin main"
→ Usa: git_push

"Mostra la cronologia degli ultimi 5 commit con dettagli"
→ Usa: git_log

"Merge del branch feature/awesome nel branch corrente"
→ Usa: git_merge
```

### 🔧 Tramite CLI Standalone

```bash
# Avvia il server MCP
git-for-me-dear-ai start

# Mostra tutti i tool disponibili
git-for-me-dear-ai tools

# Mostra solo i tool per i commit
git-for-me-dear-ai tools --category commits

# Verifica la configurazione
git-for-me-dear-ai config --show
```

### 📋 Tool Disponibili per Categoria

- **Repository**: `git_init`, `git_clone`, `git_remote`, `git_config`
- **Status**: `git_status`, `git_log`, `git_diff`, `git_blame`, `git_show`
- **Commits**: `git_add`, `git_commit`, `git_push`, `git_pull`, `git_stash`
- **Branches**: `git_branch_list`, `git_branch_create`, `git_branch_switch`, `git_branch_delete`, `git_merge`

## 🏗️ Architettura

```
GitForMeDearAi/
├── src/
│   ├── commands/           # Implementazioni comandi Git/GitHub
│   │   ├── repository/     # Repository operations
│   │   ├── branches/       # Branch management
│   │   ├── commits/        # Commit operations
│   │   ├── issues/         # GitHub issues
│   │   ├── pull-requests/  # Pull request management
│   │   └── releases/       # Release management
│   ├── core/              # Core MCP implementation
│   ├── auth/              # GitHub authentication
│   ├── utils/             # Utility functions
│   └── index.ts           # Entry point
├── tests/                 # Test suite completa
├── docs/                  # Documentazione dettagliata
└── examples/              # Esempi di utilizzo
```

## 🧪 Testing

```bash
# Run test suite
npm test

# Test con coverage
npm run test:coverage

# Test integration
npm run test:integration
```

## 📖 Documentazione

- 🔧 [Setup MCP Client](./docs/mcp-setup.md) - Configurazione completa per Cursor, Claude Code e altri client
- 📚 [Guida Completa](./docs/guide.md) - Guida dettagliata all'uso
- 🔧 [Riferimento API](./docs/api.md) - Documentazione API completa
- 💡 [Esempi Pratici](./docs/examples.md) - Esempi di workflow
- 🐛 [Troubleshooting](./docs/troubleshooting.md) - Risoluzione problemi comuni

## 🤝 Contribuire

Questo progetto è open source! Contribuzioni benvenute.

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m '✨ feat: add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Crea Pull Request

## 📄 Licenza

MIT © 2025 GitForMeDearAi

## 🙏 Crediti

Sviluppato con ❤️ per semplificare il workflow Git/GitHub di ogni sviluppatore.

---

**Pronto per rivoluzionare il tuo workflow Git/GitHub?**

```bash
npm install -g git-for-me-dear-ai
```