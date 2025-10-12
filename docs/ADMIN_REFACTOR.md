# Nivo Dashboard – Admin & Auth Refactor

## Ny informationsarkitektur

```
frontend/src/
  app/
    (analysis)/
      page.tsx                # Översikt
      search/page.tsx         # Företagssökning
      analysis/page.tsx       # Analys & regler
      insights/page.tsx       # AI-insikter
      export/page.tsx         # Exportfunktioner
      scrapers/page.tsx       # Dataskraper
    (admin)/
      admin/
        layout.tsx            # Rollskydd för adminvägar
        users/page.tsx        # Användarhantering
        roles/page.tsx        # Roller & behörigheter
        db-status/page.tsx    # Databasstatus
        integrations/page.tsx # Integrationer
  components/
    navigation/Sidebar.tsx    # Ny uppdelad navigering
    admin/
      AdminPageHeader.tsx
      UsersTable.tsx
      DbStatusCards.tsx
      IntegrationCard.tsx
  lib/
    supabaseServer.ts         # Server/client-agnostisk klient
    rbac.ts                   # Roll-hjälpare
    integrations/             # Mockade integrationer
  middleware.ts               # Route-skydd i mockad Next-stil
```

## Rollstyrning med Supabase

- **Källa för roller**: `user.user_metadata.role` används primärt. En fallback läser tabellen `roles` om metadata saknas.
- **Tillgängliga roller**: `admin`, `analyst`, `viewer`.
- **RBAC-hjälpare**: `lib/rbac.ts` innehåller util-funktioner för att hämta sessionens roll, lista användare och uppdatera roller.
- **Middleware**: `src/middleware.ts` kan återanvändas i Next-miljöer för att blockera `/admin`-vägar för icke-admins. I Vite-miljön fungerar den som dokumenterad referens.
- **Frontend-guards**: `AdminLayout` och `ProtectedRoute` stoppar obehöriga och omdirigerar till översikten.

## Lägga till nya administratörer

1. Logga in som administratör.
2. Navigera till **Administration → Användare**.
3. Använd rollen "Administratör" i tabellens dropdown för önskad användare. Uppdateringen använder `auth.admin.updateUserById` om service-nyckel finns, annars visas mock-data.
4. Rollen sparas i `user_metadata.role` och `approved` markeras `true` så att användaren släpps in i instrumentpanelen.

> **Obs!** För att uppdateringar ska fungera krävs `SUPABASE_SERVICE_ROLE_KEY` i miljön. Utan den presenteras mock-data men UI-flödet kan testas.

## Testa integrationerna (mock-läge)

- Navigera till **Administration → Integrationer**.
- Varje kort använder funktioner i `lib/integrations/*.ts`:
  - `testHubspotConnection()` kontrollerar `HUBSPOT_ACCESS_TOKEN` (eller `VITE_`-variant).
  - `testAirtableConnection()` kontrollerar `AIRTABLE_API_KEY` och `AIRTABLE_BASE_ID`.
- Om variabler saknas visas statusen `Saknar miljövariabler`. Annars returneras en mockad "connected"-respons med tidsstämpel.

### Miljövariabler (`frontend/.env.local.example`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
HUBSPOT_ACCESS_TOKEN=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
VITE_HUBSPOT_ACCESS_TOKEN=
VITE_AIRTABLE_API_KEY=
VITE_AIRTABLE_BASE_ID=
```

## Mock-API-design

- **Användare**: Om `SUPABASE_SERVICE_ROLE_KEY` saknas returnerar `UsersTable` mockade användare med roller för att UI:t ska kunna demonstreras.
- **Integrationer**: Mockar anslutningar genom att endast kontrollera miljövariabler och generera tidsstämplar.
- **Databasstatus**: `DbStatusCards` använder fallback-mätvärden och försöker pinga `/api/health` när Supabase är konfigurerat.

## UI-riktlinjer

- Navigering delas upp i Analys och Administration med tydlig divider och sticky admin-länkar.
- `AdminPageHeader` ger breadcrumbs och actions på alla admin-sidor.
- Dark-mode stöds via `next-themes` och `ModeToggle`.
- Färger följer Nivo-brandens mörka palett (`#2E2A2B`, `#596152`, `#E6E6E6`).

