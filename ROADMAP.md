# HorseSharing2 Roadmap / To‑Do

Gebruik dit bestand als centrale to‑do lijst. Vink items af en voeg taken toe per release.

## Vandaag / Huidige sprint
- [ ] HorseAdWizard: per tab opslaan/prefill nalopen
  - [ ] Basis: titel, verhaal, naam, geslacht, leeftijd, stokmaat, ras, media (foto/video)
  - [ ] Beschikbaarheid: dagdelen per week, min dagen p/w, sessieduur min/max, taakfrequentie
  - [ ] Kosten: model (per maand/dag) + bedrag, validatie
  - [ ] Filters: disciplines, temperament, vachtkleur, niveau, max sprong, comfort, activity_mode
  - [ ] Verwachtingen: taken (verplicht/optioneel), required skills, ruiter‑stijl, regels
- [ ] Validaties in wizard
  - [ ] Titel verplicht
  - [ ] Bij kostenmodel: bedrag > 0
  - [ ] Minimaal 1 foto aanbevolen (non‑blocking)
- [ ] Concept prefill verbeteren
  - [ ] Prefill via `GET /owner/horses/:id` i.p.v. “laatste”
  - [ ] Draft statusveld overwegen (`status: draft/published`)

## Backend
- [ ] Endpoint: `GET /owner/horses/:id` (volledige serialisatie voor prefill)
- [ ] `POST /owner/horses`: payload‑gedreven mapping sanity check (alle velden)
- [ ] `GET /owner/horses`: response bevat alle velden voor lijsten/overzichten
- [ ] Alembic: eventuele ontbrekende kolommen (status, etc.)
- [ ] Logging/validatiefouten duidelijker maken

## Frontend
- [ ] Route: `/_owner/horses/:id/edit` + wizard leest via id
- [ ] Pagina: "Mijn paarden" (lijst met bewerken/publiceren)
- [ ] Centrale ImageUploader ook in `RiderOnboarding.jsx`
- [ ] Toaster (centrale) i.p.v. per pagina component

## Media & Opslag
- [ ] Upload: drag & drop + compressie (gereed in wizard) – hergebruik overal
- [ ] Azure Blob Storage integratie achter env‑flag
  - [ ] Env: `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_CONTAINER`, `AZURE_PUBLIC_BASE_URL`
  - [ ] Documentatie in README
- [ ] Opschonen verweesde uploads (cron of admin tool)

## Match & Zoek (na wizard stabilisatie)
- [ ] Zoekfilters op dashboard (advertenties)
- [ ] (Later) AI‑matching op uitgebreide velden

## Kwaliteit & DX
- [ ] Unit tests mapping backend (payload → model)
- [ ] E2E smoke (wizard flow happy path)
- [ ] ESLint/Prettier config + CI hooks
- [ ] Periodieke check: rolcontext consistentie (RoleContext/RouteGuards/RoleAwareLink)
  - [ ] Handmatige URL → juiste redirect (rider ↔ owner)
  - [ ] Themavariabelen wisselen direct mee (body[data-role])
  - [ ] Alle primaire knoppen naar juiste omgeving (`/my-profile` of RoleAwareLink)

## Moderatie & Veiligheid
- [ ] Rapportageknop bij advertenties (foto/tekst) → UI: 'Rapporteer' + modal met reden
- [ ] Backend endpoint: `POST /abuse/report` + rate limiting + audit logging
- [ ] (Optioneel, via env-flag) Azure Content Safety voor afbeeldingen/tekst; alleen activeren in prod

## Notities
- Kinde auth blijft leidend; API calls via `createAPI` met bearer token.
- Payload‑gedreven updates altijd prefereren om per veld te kunnen saven.


## todo
- Review van vorige paardeigenaren waar bijridjer is geweets vragen om review 
- aanvullen op riderprofiel : al eerder bijridejr geweest, zo ja, wat voor een paard, voor hoe lang, heb je wedstridejn gerden, welk niveau etc. 
- Evt een kart waarop men kan zien in de omeving. 
- melding maken bij vreemd profielen
- ai moet matchen op vijr text vedken en alles dat ineveuld is dus naar vector databse brengen of mono