# Zubehörshop – lokale Abnahme

Stand: 31.10.2026. Branch: `feature/accessories-void-stickers`.
Arbeitskopie des bestehenden Repositorys `chainatlas/hodlware`:
`C:\Users\Home One\Desktop\TinyMotchi\hodlware-accessories`.
Ausgangspunkt: `160fc83360b601f9afd224ae9c12557b9382f045`.
Der abschließende lokale Commit-Hash wird im Abschlussbericht im Chat genannt und ist über `git log -1` abrufbar.

## Ergebnis

- Eigenständiger Zubehörbereich `/zubehoer`, verlinkt in der Shopnavigation einschließlich Mobil-/Tabletansicht.
- Erweiterbares Kartenraster; Varianten und öffentliche Katalogdaten werden aus dem serverseitigen Katalog erzeugt.
- VOID-Pakete mit 1, 5, 10 und 25 physischen Stickern; Preise vorläufig 0,99 / 3,49 / 5,99 / 11,99 EUR.
- Gemeinsamer Warenkorb bleibt über Seitenwechsel erhalten. Mengen ändern und Positionen entfernen funktionieren.
- Serverseitige Preise, Versandklassen und Prüfung tatsächlicher Stripe-Preise. Stickerbestellung: 110 Cent; mindestens eine Plate: einmalig 619 Cent.
- Paketmengen werden auf einen gemeinsamen physischen Stickerbestand abgebildet. Zwei 25er-Pakete reservieren 50 Sticker.
- Atomare gemeinsame Reservierung bei Zubehör plus 4-Digit-Plate. Bestehende Plate-Reservierungen und Bestellungen bleiben erhalten.
- Signierte Webhooks, idempotente Bestands- und Bestellbuchung sowie bestehender Mail-Outbox-Versand werden weiterverwendet.
- Alte Vertragsversion `2026-10-11` unverändert; Zubehörbestellungen erhalten `2026-10-31-accessories` mit passenden Versandregeln. Bereits gespeicherte Bestelltexte werden nicht verändert.
- Keine eigenständigen Stickerkarten auf der Startseite und keine Sticker-Upsells auf den beiden Plate-Seiten. Bereits enthaltene Sticker dürfen weiterhin als Lieferumfang beschrieben werden.

## Verifikation

- Vollständige Node-Testsuite: 117 bestanden, 0 fehlgeschlagen.
- Produktions-Build: statische Seiten einschließlich IndexNow-Manifest und Cloudflare-Pages-Worker erfolgreich kompiliert.
- Playwright / Chrome: 172 Prüfungen über 1440×1000, 1024×900, 768×1024, 600×900, 390×844 und 320×740.
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

| Variante | Vorgeschlagener Paketpreis | Erforderliche Umgebungsvariable |
|---|---:|---|
| 1 Sticker | 0,99 EUR | `STRIPE_PRICE_ID_VOID_1` |
| 5 Sticker | 3,49 EUR | `STRIPE_PRICE_ID_VOID_5` |
| 10 Sticker | 5,99 EUR | `STRIPE_PRICE_ID_VOID_10` |
| 25 Sticker | 11,99 EUR | `STRIPE_PRICE_ID_VOID_25` |

Erst nach Preisfreigabe sind passende aktive einmalige EUR-Preise zu konfigurieren; keine wiederkehrenden Preise. Die Beträge und der Test-/Live-Modus werden serverseitig gegen den Katalog geprüft. Bestehende Variablen `STRIPE_PRICE_ID` und `STRIPE_PRICE_ID_PLATE4` bleiben unverändert. Die Versandkosten werden bereits serverseitig pro Checkout-Session berechnet; dafür ist kein neuer dauerhafter Stripe-Versandpreis erforderlich.

Die bestehende Webhook-Anbindung muss weiterhin `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` und `checkout.session.expired` verarbeiten. Keine zusätzliche Live-Testzahlung wurde durchgeführt. Ein vollständiger Integrationstest in einer separat genehmigten Stripe-Testumgebung mit Cloudflare D1 und Mailversand steht vor Livegang noch aus; die lokale Prüfung simuliert diese Dienste.

## D1 – nur vorbereitet, nicht produktiv ausgeführt

`migrations/0004_accessory_inventory.sql` setzt die vorhandenen Migrationen 0001–0003 voraus und ergänzt:

- `void-stickers` in `product_inventory`, initial mit **0** verkaufbaren Einheiten.
- `accessory_reservations` mit physischen Mengen und Reservierungszustand.
- Index und Trigger gegen Überverkauf, inkonsistente Plate-Reservierungen und widersprüchliche Statuswechsel.

Kein Umbau bestehender Tabellen oder vorhandener Bestellungen. Die Migration ist wiederholbar und überschreibt vorhandene Bestandswerte nicht. Historische Migrationen nicht erneut als Bestandsabgleich verwenden. Insbesondere wird der im Auftrag genannte Plate-Bestand 23 nicht durch einen älteren Initialwert ersetzt.

Vor Aktivierung muss der tatsächlich separat verkaufbare Stickerbestand gezählt und bestätigt werden. Beigaben für Plates, Muster und verbrauchte Teststicker sind vorher abzuziehen; 2.000 eingetroffene Sticker sind kein Verkaufsbestand. Der bestätigte Wert muss nach gesonderter Freigabe im neuen Inventareintrag hinterlegt werden. Neue Reservierungen ziehen gehaltene und bezahlte Einheiten von diesem Bestand ab; dies ist kein frei zu überschreibender Live-Zähler.

Eine Reservierung wird nur nach bestätigtem Stripe-Ablauf oder asynchronem Fehlschlag freigegeben. Browserabbruch allein gibt sie nicht frei. Unklare API-Antworten behalten den Bestand sicherheitshalber reserviert. Verwaiste Reservierungen ohne zuordenbare Stripe-Session benötigen einen kontrollierten Abgleich; kein zeitgesteuertes blindes Freigeben implementiert. Bei Zahlung nach bereits erfolgter Freigabe wird die Buchung abgelehnt und muss geprüft werden.

## Produktbilder und offene Freigaben

Im bestehenden Repository wurden keine eigenständigen Originalproduktfotos der VOID-Sticker gefunden. Es werden **keine fremden oder generierten Produktbilder** verwendet. Die Zubehörkarte zeigt einen deutlich bezeichneten Platzhalter. Originalfotos müssen vor Veröffentlichung geliefert/geprüft, in den Zubehörkatalog eingetragen und in den Build übernommen werden.

Vor Livegang erforderlich:

1. Endgültige Paketpreise 0,99 / 3,49 / 5,99 / 11,99 EUR bestätigen oder korrigieren.
2. Tatsächlich verkaufbaren Stickerbestand bestätigen; Beigaben und Verbrauch berücksichtigen.
3. Brieftarif 1,10 EUR und Eignung der Basis-Sendungsverfolgung bestätigen.
4. Originalproduktfotos sowie Darstellung und Versandtexte freigeben. Die derzeit sichtbaren Vorbereitungshinweise vor Veröffentlichung an den genehmigten Verkaufsstatus anpassen.
5. Stripe-Preis-IDs konfigurieren, D1-Migration/Bestandsinitialisierung und produktive Veröffentlichung jeweils gesondert genehmigen.
6. Erst anschließend `ACCESSORIES_ENABLED`, `ACCESSORIES_PRICES_APPROVED` und `ACCESSORIES_STOCK_CONFIRMED` serverseitig auf `true` setzen. Ohne diese Freigabeschalter bleibt der Zubehörcheckout gesperrt. `.dev.vars.example` dokumentiert die abgeschalteten Standardwerte.

Keine produktiven Stripe-Aktionen, D1-Migrationen, Deployments, echten Zahlungen oder Kundenmails wurden durchgeführt. Kein Push oder Merge.
