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

## 💻 Esempio di Utilizzo

```javascript
// Tramite MCP client
const gitMcp = new GitForMeDearAi();

// Inizializza nuovo repository
await gitMcp.repository.init({
  name: "my-project",
  description: "Il mio nuovo progetto",
  private: true
});

// Commit con convenzioni
await gitMcp.commit.create({
  message: "✨ feat: aggiunge nuova feature",
  files: ["src/feature.js"]
});

// Crea pull request
await gitMcp.pullRequest.create({
  title: "Nuova feature incredibile",
  base: "main",
  head: "feature/awesome"
});
```

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

- 📚 [Guida Completa](./docs/guide.md)
- 🔧 [Riferimento API](./docs/api.md)
- 💡 [Esempi](./docs/examples.md)
- 🐛 [Troubleshooting](./docs/troubleshooting.md)

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