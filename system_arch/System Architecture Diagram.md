# System Architecture Diagram

```mermaid
graph TB
    User[End User]
    
    subgraph Frontend[Frontend Service]
        NginxServer[Nginx Server]
        ReactSPA[React SPA]
    end

    subgraph Backend[Backend Service]
        subgraph API[API Service]
            EntryPoint[Application Entry Point<br/>backend/index.js]
            Router[API Router<br/>backend/routes]
            Controllers[Controllers<br/>backend/controllers]
            Services[Services<br/>backend/services]
            Models[Data Access Layer<br/>backend/models]
        end
    end

    subgraph Database[MongoDB Database]
        MongoServer[MongoDB Server]
        DataStore[Data Storage]
    end

    User -->|Uses| NginxServer
    NginxServer -->|Serves| ReactSPA
    NginxServer -->|Makes API requests to| Router
    EntryPoint -->|Sets up| Router
    Router -->|Routes requests to| Controllers
    Controllers -->|Calls| Services
    Services -->|Uses| Models
    Models -->|Performs CRUD operations on| MongoServer
    MongoServer -->|Reads from and writes to| DataStore

    style Frontend fill:#dae8fc,stroke:#6c8ebf
    style Backend fill:#dae8fc,stroke:#6c8ebf
    style API fill:#dae8fc,stroke:#6c8ebf
    style Database fill:#dae8fc,stroke:#6c8ebf
```

## Architecture Overview

This diagram represents the three-tier architecture of the Express-React template:

1. **Frontend Service**: Nginx serving React SPA
2. **Backend Service**: Express API with layered architecture
3. **MongoDB Database**: Data persistence layer

---
*Updated: 1/11/2026*
