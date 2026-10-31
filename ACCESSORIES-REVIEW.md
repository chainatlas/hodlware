# Zubehörshop – lokale Abnahme

Stand: 31.10.2026. Branch: `feature/accessories-void-stickers`.
Arbeitskopie des bestehenden Repositorys `chainatlas/hodlware`:
`C:\Users\Home One\Desktop\TinyMotchi\hodlware-accessories`.
Ausgangspunkt: `160fc83360b601f9afd224ae9c12557b9382f045`.
Der abschließende lokale Commit-Hash wird im Abschlussbericht im Chat genannt und ist über `git log -1` abrufbar.

## Ergebnis

- Eigenständiger Zubehörbereich `/zubehoer`, verlinkt in der Shopnavigation einschließlich Mobil-/Tabletansicht.
- Erweiterbares Kartenraster; Varianten und öffentliche Katalogdaten werden aus dem serverseitigen Katalog erzeugt.
- VOID-Pakete mit 1, 5, 10 und 25 physischen Stickern; Verbindlich freigegebene Paketpreise: 0,99 / 3,49 / 5,99 / 11,99 EUR.
- Gemeinsamer Warenkorb bleibt über Seitenwechsel erhalten. Mengen ändern und Positionen entfernen funktionieren.
- Serverseitige Preise, Versandklassen und Prüfung tatsächlicher Stripe-Preise. Stickerbestellung: 110 Cent; mindestens eine Plate: einmalig 619 Cent.
- Paketmengen werden auf einen gemeinsamen physischen Stickerbestand abgebildet. Zwei 25er-Pakete reservieren 50 Sticker.
- Atomare gemeinsame Reservierung bei Zubehör plus 4-Digit-Plate. Bestehende Plate-Reservierungen und Bestellungen bleiben erhalten.
- Signierte Webhooks, idempotente Bestands- und Bestellbuchung sowie bestehender Mail-Outbox-Versand werden weiterverwendet.
- Alte Vertragsversion `2026-10-11` unverändert; Zubehörbestellungen erhalten `2026-10-31-accessories` mit passenden Versandregeln. Bereits gespeicherte Bestelltexte werden nicht verändert.
- Keine eigenständigen Stickerkarten auf der Startseite und keine Sticker-Upsells auf den beiden Plate-Seiten. Bereits enthaltene Sticker dürfen weiterhin als Lieferumfang beschrieben werden.

## Verifikation

- Vollständige Node-Testsuite: 129 bestanden, 0 fehlgeschlagen.
- Produktions-Build: statische Seiten einschließlich IndexNow-Manifest und Cloudflare-Pages-Worker erfolgreich kompiliert.
- Playwright / Chrome: 208 Prüfungen über 1440×1000, 1024×900, 768×1024, 600×900, 390×844 und 320×740.
- Geprüft: vier Paketpreise und Auswahl, Warenkorb mit allen Varianten, Mengenänderung auf zwei 25er-Pakete, Entfernen von Positionen, Sticker- und gemischter Versand, ein/zwei Plates, Gesamtsummen, persistierter Warenkorb, Navigation zwischen Zubehör/Startseite/Plate-Seiten, keine Upsells, gesperrte vergriffene Variante, alternative verfügbare Variante, keine horizontalen Überläufe.
- Browseranfragen auf andere Ursprünge werden im Test blockiert; es gab keine externen Requests, Laufzeitfehler oder fehlenden Assets.
- Playwright bedient einen eigenen Headless-Chrome-Prozess direkt. Keine Windows-Computersteuerung oder Browseradressenerkennung.
- Screenshots in `artifacts/accessories-review/`; `results.json` enthält die einzelnen Browserprüfungen, `unit-tests.txt` die vollständigen Testergebnisse.
- Behobene Layoutfehler: ausgeblendete Tablet-Navigation, übergroße Desktop-/Tabletkarte, zu wenig erkennbare Variantenauswahl. Der lokale Demohinweis verdeckt den Warenkorb-Schließen-Button nicht mehr.

## Lokale Vorschau und Wiederholung

Nach dem Build: `node scripts/preview-accessories.mjs`.
Vorschau: `http://127.0.0.1:8788/zubehoer`.
Optional einen freien Port über `PREVIEW_PORT` vorgeben.

Die Vorschau verwendet ausschließlich simulierte Verfügbarkeit. Checkout-Anfragen enden absichtlich mit einer erklärenden 503-Antwort. Sie startet weder Stripe-Zahlungen noch E-Mails und liest keine Zugangsdaten. Serverseitiger Checkout, Webhooks und D1-Verhalten werden mit isolierter SQLite-Datenbank und simulierten Stripe-Antworten geprüft.

Tests: `node --test`.
Build: `node scripts/build.mjs`, danach `node node_modules/wrangler/bin/wrangler.js pages functions build --outdir dist/_worker.js` (entspricht den beiden Schritten des bestehenden Build-Skripts).
UI-Prüfung: `node scripts/qa-accessories.mjs` nach dem Build; benötigt lokal auflösbares Playwright und installiertes Chrome. Verwendet wurde Playwright 1.62.1 aus der vorhandenen Codex-Laufzeit; diese kann über `NODE_PATH` aufgelöst werden. `PLAYWRIGHT_CHANNEL` und `QA_PORT` sind optional konfigurierbar. Die UI-Prüfung startet und beendet ihren eigenen rein lokalen Server.
In dieser Arbeitskopie benötigte Wrangler `NODE_PATH` auf `node_modules/.pnpm/node_modules` wegen der kopierten lokalen Abhängigkeiten; `WRANGLER_LOG_PATH` wurde in `.cache/wrangler.log` gesetzt. Keine Änderungen an Produktionskonfiguration oder Laufzeitversionen.

## Stripe – vor Aktivierung erforderlich, noch nicht ausgeführt

Es wurden keine Stripe-Produkte oder Preise angelegt oder geändert. Es existieren in dieser Umsetzung noch keine zugewiesenen echten Preis-IDs.

| Variante | Freigegebener Paketpreis | Erforderliche Umgebungsvariable |
|---|---:|---|
| 1 Sticker | 0,99 EUR | `STRIPE_PRICE_ID_VOID_1` |
| 5 Sticker | 3,49 EUR | `STRIPE_PRICE_ID_VOID_5` |
| 10 Sticker | 5,99 EUR | `STRIPE_PRICE_ID_VOID_10` |
| 25 Sticker | 11,99 EUR | `STRIPE_PRICE_ID_VOID_25` |

Die Paketpreise sind verbindlich freigegeben. Passende aktive einmalige EUR-Preise dürfen erst nach gesonderter Freigabe für produktive Stripe-Änderungen konfiguriert werden; keine wiederkehrenden Preise. Die Beträge und der Test-/Live-Modus werden serverseitig gegen den Katalog geprüft. Bestehende Variablen `STRIPE_PRICE_ID` und `STRIPE_PRICE_ID_PLATE4` bleiben unverändert. Die Versandkosten werden bereits serverseitig pro Checkout-Session berechnet; dafür ist kein neuer dauerhafter Stripe-Versandpreis erforderlich.

Die bestehende Webhook-Anbindung muss weiterhin `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` und `checkout.session.expired` verarbeiten. Keine zusätzliche Live-Testzahlung wurde durchgeführt. Ein vollständiger Integrationstest in einer separat genehmigten Stripe-Testumgebung mit Cloudflare D1 und Mailversand steht vor Livegang noch aus; die lokale Prüfung simuliert diese Dienste.

## D1 – nur vorbereitet, nicht produktiv ausgeführt

`migrations/0004_accessory_inventory.sql` setzt die vorhandenen Migrationen 0001–0003 voraus und ergänzt:

- `void-stickers` in `product_inventory`, initial mit **0** verkaufbaren Einheiten.
- `accessory_reservations` mit physischen Mengen und Reservierungszustand.
- Index und Trigger gegen Überverkauf, inkonsistente Plate-Reservierungen und widersprüchliche Statuswechsel.

Kein Umbau bestehender Tabellen oder vorhandener Bestellungen. Die Migration ist wiederholbar und überschreibt vorhandene Bestandswerte nicht. Historische Migrationen nicht erneut als Bestandsabgleich verwenden. Insbesondere wird der im Auftrag genannte Plate-Bestand 23 nicht durch einen älteren Initialwert ersetzt.

Verbindlich bestätigt: 1.800 physische Einzelsticker Verkaufsbestand und 200 Sticker Reserve. Alle vier Pakete nutzen ausschließlich denselben Inventareintrag `void-stickers`; die 200 Reserve sind nicht Teil des verkaufbaren Bestands. Die Startinitialisierung ist getrennt in `operations/initialize-void-stock.sql` vorbereitet und wurde nicht gegen eine produktive Datenbank ausgeführt. Erst nach gesonderter Ausführungsfreigabe anwenden, nach Migration 0004 und vor Aktivierung. Das Skript setzt ausschließlich einen unberührten Nullbestand ohne Reservierungshistorie auf 1.800. Wiederholungen überschreiben weder Bestände noch Reservierungen; bei vorhandener Historie oder abweichendem Bestand muss der Betreiber den Zustand prüfen. Neue Reservierungen ziehen gehaltene und bezahlte Einheiten von diesem Bestand ab; dies ist kein frei zu überschreibender Live-Zähler.

Eine Reservierung wird nur nach bestätigtem Stripe-Ablauf oder asynchronem Fehlschlag freigegeben. Browserabbruch allein gibt sie nicht frei. Unklare API-Antworten behalten den Bestand sicherheitshalber reserviert. Verwaiste Reservierungen ohne zuordenbare Stripe-Session benötigen einen kontrollierten Abgleich; kein zeitgesteuertes blindes Freigeben implementiert. Bei Zahlung nach bereits erfolgter Freigabe wird die Buchung abgelehnt und muss geprüft werden.

## Produktbilder und offene Freigaben

Die früher fehlenden Originalfotos wurden mit diesem Auftrag bereitgestellt. Es werden **keine fremden oder generierten Produktbilder** verwendet. Die Zubehörkarte zeigt jetzt eine Galerie der drei Originalfotos; Bildplatzhalter sind vollständig entfernt. Die drei Originalfotos sind inzwischen integriert und im Build enthalten; Details zur finalen Integration stehen unten.

Vor Livegang erforderlich:

1. Erledigt: Paketpreise 0,99 / 3,49 / 5,99 / 11,99 EUR verbindlich bestätigt. Dies erteilt keine Aktivierungs- oder Stripe-LIVE-Freigabe.
2. Erledigt: 1.800 verkaufbare Einzelsticker und 200 ausgeschlossene Reservesticker verbindlich bestätigt. Produktive Initialisierung bleibt separat freigabepflichtig.
3. Erledigt: Brieftarif 1,10 EUR und Basis-Sendungsverfolgung bestätigt. Offen bleibt die tatsächliche Versandfähigkeit einschließlich Gewicht, Außenmaßen, Verpackung und erlaubter Bestellmenge; vor Aktivierung nachweisen.
4. Originalproduktfotos sind integriert. Finale Darstellung und Versandprozess abnehmen. Die derzeit sichtbaren Vorbereitungshinweise vor Veröffentlichung an den genehmigten Verkaufsstatus anpassen.
5. Stripe-Preis-IDs konfigurieren, D1-Migration/Bestandsinitialisierung und produktive Veröffentlichung jeweils gesondert genehmigen.
6. Die Preisentscheidung ist dokumentiert; `ACCESSORIES_PRICES_APPROVED` bleibt in der vorbereiteten Laufzeitkonfiguration absichtlich `false`. Erst nach gesonderter Aktivierungsfreigabe `ACCESSORIES_ENABLED`, `ACCESSORIES_PRICES_APPROVED` und `ACCESSORIES_STOCK_CONFIRMED` serverseitig auf `true` setzen. Ohne diese Freigabeschalter bleibt der Zubehörcheckout gesperrt. `.dev.vars.example` dokumentiert die abgeschalteten Standardwerte.

Keine produktiven Stripe-Aktionen, D1-Migrationen, Deployments, echten Zahlungen oder Kundenmails wurden durchgeführt. Kein Push oder Merge.

## Bestätigte Produktangaben und Preisabnahme

Maße je Sticker: 5 × 1 cm. Besonders dünn, trägt kaum auf; keine Materialstärke in Millimetern angegeben. Beschreibung, Eigenschaften, SEO-Produktdaten und generierter Frontendkatalog übernehmen diese Angaben. Der Hinweis auf Oberflächen- und Umgebungsabhängigkeit bleibt sichtbar. Variantenwahl und Warenkorb nennen den Preis ausdrücklich pro Paket; die physischen Stückzahlen dienen ausschließlich der Lagerberechnung. Zwei 25er-Pakete kosten 23,98 EUR und reservieren 50 Sticker. Alle drei Aktivierungsschalter bleiben unverändert gesperrt; Stripe-IDs bleiben leer. Die Screenshots und Browserergebnisse wurden mit den bestätigten Produktangaben und expliziten Paketpreisen neu erstellt.

## Bestandsbeschluss: gemeinsamer Vorrat

Startbestand vorbereitet: 1.800 physische Einzelsticker. Reserve: 200 außerhalb des Verkaufsinventars. Die Schema-Migration 0004 bleibt unverändert bei Nullbestand; das getrennte, ausdrücklich freizugebende Initialisierungsskript setzt den bestätigten Startwert. Keine Bestandszeilen für `void-1`, `void-5`, `void-10` oder `void-25`. Die unveränderte Funktion `physicalItems` aggregiert alle Paketmengen auf `void-stickers`; Reservierungen, Verfügbarkeit und bezahlte Buchungen verwenden genau diesen Schlüssel. Tests prüfen vollständige Ausschöpfung über alle vier Varianten, Überverkauf, Konkurrenz, Wiederholung und Schutz bestehender Bestände/Historie. Tests verwenden ausschließlich isolierte In-Memory-SQLite-Datenbanken. Alle Aktivierungsschalter bleiben `false`; keine produktive Datenbank wurde angesprochen.

## Finale Foto-Integration und verbindliche Versandregel

Die Originale `void only white.png`, `void white with hand.png` und `void2.png` sind als 1440-/720-/160-Pixel-WebP-Dateien integriert. Drei große Ansichten zusammen: 700.494 Bytes statt 7.788.782 Bytes PNG-Originale (rund 91 % weniger). Keine inhaltliche Veränderung von Produktform, Muster oder Motiv und keine gezielte Farbkorrektur; nur proportionale Skalierung und Kompression. Die Originaldateien bleiben unverändert. Das Bildmanifest enthält SHA-256, Abmessungen und Ausgabedateien. Alle drei Ansichten haben sachliche Alt-Texte; Galerie per Klick und Tastatur bedienbar, ohne Beschnitt. Die Vorschaubilder sind auch in der Bestellergebnisdarstellung verfügbar.

1,10 EUR Sticker-only / 6,19 EUR mit mindestens einer Plate bleiben serverseitig bestätigt. Checkout und neu erstellte Sticker-only-Bestellmails nennen Basis-Sendungsverfolgung. Bestehende unveränderliche Vertragsversionen und gespeicherte Mail-Snapshots bleiben erhalten. Die tatsächlichen frankierfertigen Versandmaße/Gewichte sind nicht bekannt und noch zu prüfen; keine Aktivierung ohne diesen Nachweis. **Vollständige, verbindliche Live- und Rollback-Checkliste: [ACCESSORIES-LIVE-CHECKLIST.md](ACCESSORIES-LIVE-CHECKLIST.md).** Keine produktiven Aktionen wurden ausgeführt; alle Zubehörschalter bleiben gesperrt.
