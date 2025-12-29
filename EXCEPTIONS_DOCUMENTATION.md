# URL Exceptions Documentation

## Overview
This document catalogs all 107 hardcoded URL exceptions used by the Dofus Wiki to DofusPourLesNoobs extension. These exceptions handle edge cases where the automatic URL generation doesn't match the actual website structure.

## Exception Categories

### 1. Apostrophe Patterns (11 exceptions)
Quests where apostrophes are kept as hyphens instead of being removed:
- `wogew l'hewmite` → `wogew-l-hewmite`
- `si j'avais un marteau` → `si-j-avais-un-marteau`
- `la tactique des gens d'armes` → `la-tactique-des-gens-d-armes`
- `à la poursuite d'octolliard rouge` → `a-la-poursuite-d-octolliard-rouge`
- `sram d'égoutant` → `sram-d-egoutant`
- `quand y'en a marre de brâkmar` → `quand-y-en-a-marre-de-brakmar`
- `crocs n'en bourrent` → `crocs-n-en-bourrent`
- `vilain petit n'enfant` → `vilain-petit-nrsquoenfant`
- `barnabé dans l'espace` → `barnabe-dans-l-espace`
- `t'as les boules` → `t-as-les-boules`

### 2. Apprentissage Double-Hyphen (10 exceptions)
Apprentissage quests that use `--` instead of single `-`:
- `apprentissage : surineur` → `apprentissage--surineur`
- `apprentissage : chasseur d'âmes` → `apprentissage--chasseur-dacircmes`
- `apprentissage : maître des sévices` → `apprentissage--maicirctre-des-seacutevices`
- `apprentissage : psychopathe` → `apprentissage--psychopathe`
- `apprentissage : disciple de ménalt` → `apprentissage--disciple-de-meacutenalt`
- `apprentissage : disciple de djaul` → `apprentissage--disciple-de-djaul`
- `apprentissage : disciple d'hécate` → `apprentissage--disciple-dheacutecate`
- `apprentissage : disciple de brumaire` → `apprentissage--disciple-de-brumaire`
- `apprentissage : gardien du savoir` → `apprentissage--gardien-du-savoir`
- `apprentissage : gardien des tortures` → `apprentissage--gardien-des-tortures`

### 3. Name Mismatches (3 exceptions)
Quests where API name differs from website name:
- `la serveuse dame cloude` → `la-tenanciegravere-dame-cloude` (serveuse → tenancière)
- `bienvenue au krazybwork saloon` → `bienvenue-au-krazybwok-saloon` (work → wok)
- `la fatalité` → `la-fataliteacute-prologue` (adds prologue)

### 4. Plural/Singular Mismatches (3 exceptions)
- `gros œuvre au château d'allister` → `gros-oeliguvres-au-chacircteau-dallister` (œuvre → œuvres)
- `crocs en jambe` → `crocs-en-jambes` (jambe → jambes)
- `faire le tas de pins` → `faire-le-tas-de-pin` (pins → pin)

### 5. Entity Encoding Required (8 exceptions)
Quests requiring HTML entity encoding:
- `la mort vous va si bien` → `-la-mort-vous-va-si-bien`
- `l'essentiel est dans lac gelé` → `lessentiel-est-dans-le-lac-geleacute`
- `cœur brisé` → `coeur-briseacute`
- `où est passée la 7e compagnie ?` → `ougrave-est-passeacutee-la-7-e-compagnie`
- `une enquête alambiquée - investigation` → `une-enquecircte-alambiqueacutee---investigation`
- `une enquête alambiquée - identification` → `une-enquecircte-alambiqueacutee---identification`
- `une enquête alambiquée - confrontation` → `une-enquecircte-alambiqueacutee---confrontation`
- `une enquête alambiquée - résolution` → `une-enquecircte-alambiqueacutee---reacutesolution`

### 6. Special Encoding Patterns (2 exceptions)
- `l'œuf ou la cawotte ?` → `lrsquooeliguf-ou-la-cawotte` (rsquo + oelig)
- `fraîcheur de l'ivre` → `fraicirccheur-de-lrsquoivre` (circ + rsquo)

### 7. L'Étoile Quests (6 exceptions)
All use `lrsquoeacutetoile` pattern:
- `l'étoile des was mages` → `lrsquoeacutetoile-des-was-mages`
- `l'étoile du sapik` → `lrsquoeacutetoile-du-sapik`
- `l'étoile des glutins farceurs` → `lrsquoeacutetoile-des-glutins-farceurs`
- `l'étoile de l'atelier` → `lrsquoeacutetoile-de-lrsquoatelier`
- `l'étoile des donjons` → `lrsquoeacutetoile-des-donjons`
- `l'étoile des grincheux` → `lrsquoeacutetoile-des-grincheux`

### 8. Gare aux Krokilles (4 exceptions)
All levels combined on one page:
- `gare aux krokilles juvéniles` → `gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables`
- `gare aux krokilles novices` → `gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables`
- `gare aux krokilles matures` → `gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables`
- `gare aux krokilles vénérables` → `gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables`

### 9. C'est Votre Métier Quests (5 exceptions)
Use `c-est` with hyphens:
- `bûcher, c'est votre métier` → `bucher-c-est-votre-metier`
- `piocher, c'est votre métier` → `piocher-c-est-votre-metier`
- `cueillir, c'est votre métier` → `cueillir-c-est-votre-metier`
- `pêcher, c'est votre métier` → `pecher-c-est-votre-metier`
- `chasser, c'est votre métier` → `chasser-c-est-votre-metier`

### 10. Additional Apostrophe Patterns (13 exceptions)
- `le dragon des forêts` → `le-dragon-des-foret`
- `retrouver un fémur dans une botte d'ossements` → `retrouver-un-femur-dans-une-botte-d-ossements`
- `l'eau douce ou l'eau dure` → `l-eau-douce-ou-l-eau-dure`
- `des étoiles dans l'estomac` → `des-etoiles-dans-l-estomac`
- `l'archéologie, c'est facile` → `l-archeologie-c-est-facile`
- `le mort dans l'âme` → `le-mort-dans-l-ame`
- `la croisière, ça m'use` → `la-croisiere-ca-m-use`
- `battre le fer tant qu'il est chaud` → `battre-le-fer-tant-qu-il-est-chaud`
- `la quête sous l'eau` → `la-quete-sous-l-eau`
- `les principes d'archie m'aident` → `les-principes-d-archie-m-aident`
- `tournée d'inspection` → `tournee-d-inspection`
- `tarot, t'es très fort` → `tarot-t-es-tres-fort`
- `bière qui roule n'amasse pas mousse` → `biere-qui-roule-n-amasse-pas-mousse`

### 11. More Apostrophe Patterns (7 exceptions)
- `légende d'automne` → `legende-d-automne`
- `les deux font l'impair` → `les-deux-font-l-impair`
- `qui sème le vent récolte l'artempeth` → `qui-seme-le-vent-recolte-l-artempeth`
- `l'invasion des profanateurs de sépultures` → `l-invasion-des-profanateurs-de-sepulture`
- `œufs dans l'eau` → `oeufs-dans-l-eau`
- `qui vole un œuf cherche l'embrouille` → `qui-vole-un-oeuf-cherche-l-embrouille`
- `le fabuleux festin d'amélie poêlon` → `le-fabuleux-festin-d-amelie-poelon`

### 12. Additional Apostrophe Patterns (5 exceptions)
- `fée d'hiver` → `fee-d-hiver`
- `jusqu'au bout du rêve` → `jusqu-au-bout-du-reve`
- `s'armer contre le destin` → `s-armer-contre-le-destin`
- `le silence est d'aure` → `le-silence-est-d-aure`
- `les problèmes d'une pictopublicéphile` → `les-problemes-d-une-pictopublicephile`

### 13. Combined Pages - Cueillette de Coquillages (4 exceptions)
All levels on one page:
- `cueillette de coquillages pour touriste` → `cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert`
- `cueillette de coquillages pour amateur` → `cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert`
- `cueillette de coquillages pour spécialiste` → `cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert`
- `cueillette de coquillages pour expert` → `cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert`

### 14. Combined Pages - Chasse aux Krokilles (4 exceptions)
All levels on one page:
- `chasse aux krokilles pour touriste` → `chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert`
- `chasse aux krokilles pour amateur` → `chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert`
- `chasse aux krokilles pour spécialiste` → `chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert`
- `chasse aux krokilles pour expert` → `chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert`

### 15. Combined Pages - Kilukru (4 exceptions)
All levels on one page:
- `kilukru pour touriste` → `kilukru-pour-touristeamateurspeacutecialisteexpert`
- `kilukru pour amateur` → `kilukru-pour-touristeamateurspeacutecialisteexpert`
- `kilukru pour spécialiste` → `kilukru-pour-touristeamateurspeacutecialisteexpert`
- `kilukru pour expert` → `kilukru-pour-touristeamateurspeacutecialisteexpert`

### 16. Combined Pages - Éklate Vulkaine (4 exceptions)
All levels on one page:
- `éklate vulkaine pour touriste` → `eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert`
- `éklate vulkaine pour amateur` → `eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert`
- `éklate vulkaine pour spécialiste` → `eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert`
- `éklate vulkaine pour expert` → `eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert`

### 17. Formation Quests - Plural Forms (10 exceptions)
All use plural "années" instead of singular "année":
- `formation des première année` → `formation-des-premiegraveres-anneacutees`
- `formation des deuxième année` → `formation-des-deuxiegravemes-anneacutees`
- `formation des troisième année` → `formation-des-troisiegravemes-anneacutees`
- `formation des quatrième année` → `formation-des-quatriegravemes-anneacutees`
- `formation des cinquième année` → `formation-des-cinquiegravemes-anneacutees`
- `formation des sixième année` → `formation-des-sixiegravemes-anneacutees`
- `formation des septième année` → `formation-des-septiegravemes-anneacutees`
- `formation des huitième année` → `formation-des-huitiegravemes-anneacutees`
- `formation des neuvième année` → `formation-des-neuviegravemes-anneacutees`
- `formation des dixième année` → `formation-des-dixiegravemes-anneacutees`

### 18. Special Encoding - Ç (1 exception)
- `ça saute aux œufs` → `ccedila-saute-aux-oeufs`

## Total: 107 Exceptions

## Maintenance Notes

### Adding New Exceptions
When adding new exceptions, follow this format:
```javascript
"french quest name": "url-slug",
```

### Testing
Run the bulk test to verify exceptions:
```bash
node bulk-quest-test.js --verify-all
```

### Synchronization
Both `content.js` and `bulk-quest-test.js` must have identical `URL_EXCEPTIONS` objects.

## Coverage Statistics
- **Total quests tested**: 1,579 (after filtering Almanax/Dopple/Safari)
- **Expected coverage**: ~95-96%
- **Exceptions coverage**: 107 verified URLs
- **Automatic pattern detection**: Handles remaining cases

## Pattern Detection System
The extension also uses automatic pattern detection for:
- Standard apostrophe handling
- Accent normalization
- Entity encoding fallback
- Apprentissage quest detection
- "On recherche" quest patterns
