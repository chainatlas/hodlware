# HODLWARE – SEO-Optimierung Phase 1: Abnahmebericht

Branch: **feature/seo-phase-1**. Ausgangspunkt: **926b9b6d346177e1f3d227be27207087ae6868dd**.
Status: lokal vorbereitet und geprüft. **Kein Push, kein Deployment, keine produktiven Änderungen.**

Repository: `C:/Users/Home One/Desktop/TinyMotchi/hodlware-accessories/`. Alle Dateipfade unten relativ zu dieser Wurzel.

## Ergebnis

Unbekannte Seiten liefern in der tatsächlichen lokalen Cloudflare-Pages-Laufzeit nun HTTP 404 statt Startseiteninhalt mit 200. Die 8-Digit-Bilder werden proportional in WebP mit passenden Anzeigegrößen ausgeliefert. Originaldateien und ihre bisherigen öffentlichen Assetpfade bleiben verfügbar. Preis-/Produktdaten außerhalb der Bildfelder sind unverändert.

## 1. Cloudflare Pages / 404

Neu: `404.html`, im Build nach `dist/404.html` kopiert. Die Seite hat eine verständliche Fehlermeldung, Rückwege und die bestehende Hauptnavigation. Absolute interne Pfade funktionieren auch unter unbekannten Unterverzeichnissen. Meta-noindex; kein irreführender Startseiten-Canonical.

Pages schaltet bei vorhandener Root-404.html vom bisherigen SPA-Fallback auf seine Fehlerseitenbehandlung um. Kein zusätzlicher Catch-all-Redirect und kein Eingriff in den API-Worker. `dist/_routes.json` bleibt auf /api/* begrenzt; `_redirects` bleibt unverändert.

Geprüft mit Wrangler Pages dev auf http://127.0.0.1:8793, nicht nur mit einem selbst geschriebenen Test-Webserver:

- 13 kanonische Sitemap-URLs: HTTP 200.
- 12 zugehörige .html-Varianten und /index.html: permanente Weiterleitungen zum jeweiligen Ziel.
- /zubehoer/: permanente Weiterleitung auf /zubehoer.
- Beide historischen „seed-phrase-auf-metall-stanzen“-Pfade: weiterhin 301 zum bestehenden Ratgeber.
- /does-not-exist, /ratgeber/does-not-exist und /assets/missing.png: HTTP 404 mit Fehlerseiteninhalt, kein Homepage-Fallback.
- Ursprüngliche Bild-URL /assets/images/steel-recovery-8-digits-01.png: weiterhin 200.
- /api/checkout-context: weiterhin eigene JSON-Antwort, keine statische HTML-Fehlerseitenübernahme.

HTTP-zu-HTTPS und www-Hostweiterleitungen sind Zone-/Produktionsverhalten und werden nicht geändert. Die neue 404-Behandlung wurde noch nicht in Produktion geprüft, da kein Deployment freigegeben ist. Nach späterer Freigabe dieselbe Statusmatrix öffentlich wiederholen.

## 2. Bildoptimierung

Original-PNGs der 8-Digit-Detailseite und bestehende silberne Studiofotos der Startseitenkarte unverändert erhalten. Keine KI-Bearbeitung, kein Retuschieren, keine Änderung der Produktgeometrie.

Je acht Motive aus beiden Serien erhalten drei WebP-Derivate, insgesamt 48 Dateien:

- `assets/images/steel-recovery-8-digits-01…08-optimized.webp` und `…-silver-01…08-optimized.webp`: bis 1280 Pixel breit.
- Entsprechende `-640.webp`: Mobil-/kleinere Anzeigen.
- Entsprechende `-thumb.webp`: bis 160 Pixel breite Miniaturen.

Sharp-Resize proportional mit fit:inside, withoutEnlargement:true; WebP-Qualität 88. Kleinere Originale werden nicht hochskaliert. Verschiedene Originalformate bleiben verschieden, einschließlich Hochformat der geöffneten Tasche. Alle 48 Derivate weichen durch Rundung höchstens einen Pixel vom Quellseitenverhältnis ab. `object-fit:contain` bleibt erhalten; keine Produktbilder werden abgeschnitten.

`steel-seed-phrase-recovery.html`: Hauptfoto und Lieferumfang mit srcset/sizes und tatsächlichen width/height. Galerieauswahl kennt kleine/große Varianten und Bildabmessungen. Miniaturen laden kleine Dateien statt Original-PNGs. JSON-LD-Bildadresse zeigt auf das tatsächlich verwendete optimierte Motiv; sonstiges SEO-Markup unverändert.

`assets/products.js`: ausschließlich Bildfelder der 8-Digit-Plate einschließlich Startseitenserie geändert. 4-Digit und VOID unverändert. Shared-Galeriecode selbst unverändert. Lightbox verwendet weiterhin das große Bild; mobile Galerie wählt passende responsive Datei.

Reproduzierbarkeit: `scripts/optimize-plate8-photos.mjs`, Details in `image-manifest.json`. Das Werkzeug nutzt die lokal vorhandene sharp-Installation. Der normale Produktions-Build kopiert die eingecheckten fertigen Derivate und benötigt keine neue Bildbibliothek oder Änderung an package.json/Lockfile.

## 3. Vergleich der Ladegrößen

Direkter lokaler Vorher-/Nachher-Vergleich mit frischen Chromium-Kontexten, DPR 1, Viewports 1440 und 390 Pixel. Vorher wird das unveränderte Produkt-HTML aus Ausgangscommit 926b9b6 samt Original-PNGs ausgeliefert; gemeinsame Scripts bleiben für beide Messungen gleich. Nachher verwendet denselben lokalen Pages-Server mit optimiertem HTML. API-Aufrufe im Browser sind blockiert. Messung vor Scrollen/Galeriewechsel, nach networkidle.

Gemessen sind geladene Ressourcen-Nutzdaten über Resource Timing decodedBodySize, ohne HTML-Hauptdokument und HTTP-Header. Bei PNG/WebP entspricht das den komprimierten Bilddateien. Die Werte sind keine Mobilfunk-Durchsatzmessung, keine Lighthouse-Punktzahl und keine Feld-Core-Web-Vitals. MB dezimal.

| Viewport | Ressourcendaten vorher | nachher | Reduktion | davon Bilddaten vorher → nachher |
|---|---:|---:|---:|---:|
| Desktop 1440 px | 14.312.830 Byte (14,31 MB) | 610.075 Byte (0,61 MB) | 95,7 % | 14.240.793 → 532.130 Byte |
| Mobil 390 px | 14.312.830 Byte (14,31 MB) | 610.075 Byte (0,61 MB) | 95,7 % | 14.240.793 → 532.130 Byte |

Die Bilddaten sinken um **96,3 %**. Das unveränderte globale Logo ist in den Bilddaten weiterhin enthalten. Beide Viewports wählen hier bei DPR 1 die 640er-Variante; höhere Pixeldichten können die größere Datei anfordern. Das weiter unten liegende Lieferumfangfoto wird nun erst beim Annähern geladen. Für die vollständigen Screenshots wurde es nach der Größenmessung ausdrücklich geladen.

Zum Vergleich: Das vorherige öffentliche Audit maß mobil etwa 14,32 MB Transfer-Ressourcen; dort andere Messmethode/Headers. Für die Prozentberechnung oben wird ausschließlich der kontrollierte lokale A/B-Vergleich verwendet.

Rohdaten: `browser-results.json`, `browser-tests.txt`, `image-manifest.json`. Screenshots `1440-before.png`, `1440-after.png`, `390-before.png`, `390-after.png`; gut lesbare erste Ansichten `1440-hero.png`, `390-hero.png`.

## 4. Qualitätssicherung

- **npm test: 130/130 bestanden.** Bestehende Tests enthalten Preisvalidierung, simulierte Stripe-Checkout-Integration, Versand, Bestandsreservierung, signierte Webhooks und Bestellmail-Idempotenz.
- **npm run build: erfolgreich**, einschließlich Pages-Worker.
- **Bestehende Browser-QA: 323/323 bestanden**, sechs Viewports: 320, 390, 600, 768, 1024, 1440 Pixel. Navigation, VOID-Varianten, Warenkorbmengen, gemischte Warenkörbe, Versand und sicher blockierter Checkout enthalten.
- **Neue Phase-1-Browser-QA: 140/140 bestanden.** Lokale Pages-Routingmatrix; jede Galerieansicht auf Startseite (8 + 4), 8-Digit-Detail (8), 4-Digit-Detail (4) und Zubehör (3), jeweils Desktop/Mobil; Lightbox, vorhandene Vor-/Zurück-Pfeile, sichtbare Miniaturen; geladene Bilder mit object-fit:contain; Navigation und kein horizontaler Überlauf; Plate-Warenkorb und gemessene Größenreduktion.
- Keine Browser-Laufzeitfehler im neuen Test. Die bestehenden Tests blockieren externe Browseranfragen; keine echte Zahlung, keine produktive Stripe-Session und keine Mail ausgelöst.
- Zusätzlicher Datenvergleich: alle Produktdaten außerhalb der 8-Digit-Bildfelder inklusive aller Preise identisch zum Ausgangscommit. Keine Änderungen unter server/, functions/, migrations/, operations/, wrangler.toml oder Checkout-Scripts.
- Originalbildquellen unverändert. Proportionen aller 48 Derivate anhand Manifest geprüft; kein Hochskalieren.

Erste Testläufe identifizierten eine fehlende Navigation der neuen 404-Seite und Testannahmen zu Galeriebedienelementen (Startseiten-Dots ausgeblendet, Detailseiten ohne Pfeile). Beides im finalen Stand korrigiert; vorhandenes Galeriebedienkonzept unverändert.

Lokaler Checkout im Browser ist bewusst simuliert bzw. gesperrt. Die vollständige echte Stripe-Zahlungskette wurde nicht erneut live geprüft; das ist für diese lokale Phase nicht freigegeben.

## 5. Dateiveränderungen

| Datei / Gruppe | Änderung |
|---|---|
| `404.html` | neue eigenständige Fehlerseite |
| `scripts/build.mjs` | 404 und neue Bildderivate ins Ausgabeverzeichnis kopieren; Original-Assetpfade erhalten |
| `steel-seed-phrase-recovery.html` | responsive Haupt-/Lieferumfangsbilder, kleine Miniaturen, Galeriedaten und passende JSON-LD-Bildadresse |
| `assets/products.js` | ausschließlich 8-Digit-Bildpfade und Größenangaben |
| `assets/images/steel-recovery-8-digits-*-optimized.webp`, `*-640.webp`, `*-thumb.webp` | 48 neue Derivate aus zwei bestehenden Bildserien; genaue Auflistung im Manifest |
| `scripts/optimize-plate8-photos.mjs` | reproduzierbare proportionale Bildoptimierung |
| `scripts/qa-seo-phase1.mjs` | lokale Routing-, Galerie- und A/B-Größenprüfung; benötigt Pages dev auf Port 8793 und Playwright |
| `artifacts/seo-phase-1/` | Bericht, Manifeste, Logs, Testergebnisse und Screenshots |

Der vorherige Auditordner artifacts/seo-audit bleibt separat vorhanden. Keine Titel-/Keyword-/Canonical-Strategieänderungen und keine Umsetzung weiterer Auditphasen in diesem Branch.

## 6. Freigabegrenze und spätere Veröffentlichung

**Nicht veröffentlicht.** Keine Remote-Branchänderung. Preise, Stripe-Konfiguration, Lagerdaten, Produktionsvariablen, Bestellabläufe und bestehende Redirectregeln bleiben unverändert.

Nach ausdrücklicher Umsetzungs-/Veröffentlichungsfreigabe: Branch prüfen/integrieren, normalen Pages-Build veröffentlichen, öffentliche Statusmatrix und Originalbildpfade kontrollieren, alle Galerien Desktop/Mobil stichprobenartig prüfen. Keine D1-Migration oder Stripe-Konfiguration erforderlich.

Rollback bei Darstellungs-/Routingfehlern: auf den vorherigen kompatiblen Shop-Commit 926b9b6 zurück bzw. gezielten Fix veröffentlichen. Keine Datenbank-Wiederherstellung, keine Bestandskorrektur oder Preisänderung. Ein Zurückrollen würde den alten Soft-404-Befund wiederherstellen und ist deshalb nur Fehlerbehebung, keine SEO-Lösung.
