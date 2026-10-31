# HODLWARE Zubehör – vollständige Live-Checkliste

Status: **NUR VORBEREITET. Keine Ausführungsfreigabe.**
Branch: `feature/accessories-void-stickers`.
Ausgangspunkt dieser Integration: `298a9c5045ec21f1c7670ac41693f05e15389576`.

Diese Checkliste ist ein zukünftiger Ablauf. Keiner der produktiven Schritte wurde ausgeführt. Vier neue Preis-IDs sind noch nicht angelegt. Die bestehenden Live-Schlüssel, Plate-Preise, Bestellungen und Bestände wurden nicht verändert. Eine Preis-/Bestands-/Tarifbestätigung ersetzt keine Freigabe für Stripe, produktive D1-Schreibzugriffe, Veröffentlichung oder echte Zahlungen.

## 0. Freigaben und Versandfähigkeit vor dem Start

- [x] Paketpreise bestätigt: 0,99 / 3,49 / 5,99 / 11,99 EUR für 1 / 5 / 10 / 25 Sticker; Preis gilt jeweils **pro Paket**.
- [x] Physischer Verkaufsbestand bestätigt: 1.800 Einzelsticker; 200 weitere bleiben Reserve außerhalb des Verkaufsinventars.
- [x] Produktangaben bestätigt: 5 × 1 cm pro Sticker, besonders dünn; keine konkrete Materialstärke behauptet. VOID ist ein Indikator und keine garantierte Manipulationssicherheit.
- [x] Drei vom Auftraggeber bereitgestellte Originalfotos integriert. Nur proportionale Skalierung und WebP-Kompression, kein Beschnitt oder Retuschieren; Herkunft und SHA-256 der PNG-Originale in `artifacts/accessories-review/photo-manifest.json`.
- [x] Versandkosten bestätigt und serverseitig umgesetzt: nur Sticker einmalig 1,10 EUR; mindestens eine Plate einmalig 6,19 EUR. Bei Sticker-Briefversand lautet die Leistung **Basis-Sendungsverfolgung**.
- [ ] **Vor Aktivierung die fertig verpackte Bestellung messen und wiegen.** Einzelstickermaße allein reichen nicht. Dokumentieren: Sticker einschließlich Trägerpapier, Innenbeutel, Schutzkarton/Einleger, Umschlag, Etiketten, Gesamtdicke und frankierfertiges Gewicht.
- [ ] Kompaktbrief-Anforderungen einhalten: rechteckig, Länge 10–23,5 cm, Breite 7–12,5 cm, Höhe maximal 1 cm, Gewicht maximal 50 g. Die Basis-Sendungsverfolgung dokumentiert die Bearbeitung im Start- und Zielbriefzentrum; Frankierung mit passendem Matrixcode/Internetmarke verwenden. Keine versicherte oder lückenlose Verfolgung versprechen. Quellen: [Brief und Postkarte](https://www.deutschepost.de/de/b/brief_postkarte.html), [Briefporto 2026](https://www.deutschepost.de/de/b/briefe-in-deutschland.html), [Basis-Sendungsverfolgung](https://www.deutschepost.de/de/s/sendungsverfolgung.html).
- [ ] Nicht nur das größte Paket testen: Warenkorb unterstützt mehrere Pakete. Mit dem bestätigten Lagerbestand sind z. B. **72 × 25 = 1.800 Sticker in einer Bestellung** möglich. Gewicht/Abmessungen sind nicht angegeben oder softwareseitig bekannt. Falls die erlaubten Warenkörbe den Kompaktbrief überschreiten, vor Aktivierung entweder eine fachlich begründete, serverseitig getestete Mengenbegrenzung freigeben oder einen passenden Versandprozess auf Kosten des Händlers für den unverändert zugesagten Kundenpreis festlegen. **Bis dahin keine Aktivierung.** Keine ungeprüften Gewichte oder Mengenlimits erfinden.
- [ ] Finale Darstellung und Versandprozess abnehmen; den derzeit sichtbaren Hinweis „Verkauf weiterhin gesperrt“ erst mit ausdrücklicher Aktivierungsfreigabe anpassen. Bestehende Plate-Seiten bleiben ohne Zubehör-Upsell, die Startseite zeigt weiterhin nur die beiden Plates.

## 1. Vier Stripe-LIVE-Preiskennungen – erst nach gesonderter Freigabe

Im bestehenden richtigen Stripe-Konto vier aktive **einmalige EUR-Paketpreise** vorbereiten/anlegen lassen. Keine bestehenden Plate-Preise ändern. Die Rechnung für einen 25er-Pack lautet 1 × 11,99 EUR, nicht 25 × 11,99 EUR. Die physische Menge wird ausschließlich für die Lagerreservierung multipliziert.

| Variable | Paket | Betrag in Cent | Tatsächliche Live-ID |
|---|---:|---:|---|
| `STRIPE_PRICE_ID_VOID_1` | 1 Sticker | 99 | **noch nicht angelegt** |
| `STRIPE_PRICE_ID_VOID_5` | 5 Sticker | 349 | **noch nicht angelegt** |
| `STRIPE_PRICE_ID_VOID_10` | 10 Sticker | 599 | **noch nicht angelegt** |
| `STRIPE_PRICE_ID_VOID_25` | 25 Sticker | 1199 | **noch nicht angelegt** |

- [ ] Konto und Live-Modus bestätigen; kein Testpreis in Produktion. Jede Kennung eindeutig der Variante zuordnen.
- [ ] Preise müssen `active=true`, `currency=eur`, `type=one_time`, ohne `recurring` und mit exakt obigem `unit_amount` sein. Der Checkout prüft diese Werte serverseitig für jede Position.
- [ ] Kleinunternehmerregelung beibehalten: kein automatischer Steuerwechsel, keine zusätzlichen Steuersätze. Bestehende dynamische Zahlungsarten, Rechnungs- und Webhook-Konfiguration erhalten.
- [ ] Die Preis-IDs nach Freigabe in den **Produktionsvariablen** von Cloudflare Pages hinterlegen; Vorschauumgebungen behalten getrennte Testkonfiguration und gesperrte Schalter. In `wrangler.toml` sind diese vier IDs derzeit bewusst nicht vorhanden. Bei dateiverwalteten Produktionsvariablen den freigegebenen Eintrag im selben Release ergänzen, damit eine spätere Bereitstellung die Werte nicht verwirft. Keine Schlüssel in Git oder Dokumentation eintragen.
- [ ] Erforderliche Webhook-Events weiter an `/api/stripe-webhook` verarbeiten lassen: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Signaturprüfung und wiederholbare Verarbeitung müssen aktiv bleiben.

## 2. Cloudflare-D1-Schema – erst nach separater Migrationsfreigabe

- [ ] Produktionskonto, Pages-Projekt `hodlware` und Binding `ORDERS` anhand der tatsächlichen Produktionskonfiguration kontrollieren. Im Repository ist `hodlware-orders` vorgesehen. Keine lokale Vorschau-Datenbank oder fremde Datenbank verwenden.
- [ ] Aktuellen Schema-/Migrationsstand und einen wiederherstellbaren Backup-/Time-Travel-Punkt dokumentieren. Vorhandene Migrationen 0001–0003 müssen vorhanden sein. Sie nicht erneut zum Setzen historischer Bestände verwenden.
- [ ] Explizit nur die neue Datei `migrations/0004_accessory_inventory.sql` anwenden. Sie ergänzt den Inventareintrag `void-stickers` zunächst mit **0**, die Tabelle `accessory_reservations`, Index und Schutztrigger. Bestehende Tabellen/Bestellungen werden nicht umgebaut.
- [ ] Beispiel für den später separat genehmigten Einzeldatei-Aufruf, zuvor gegen tatsächlich gewählte Konfiguration prüfen:

```powershell
npx wrangler d1 execute hodlware-orders --remote --config wrangler.toml --env production --file migrations/0004_accessory_inventory.sql
```

- [ ] Nachprüfung: ein Inventareintrag `void-stickers`; **keine Bestände für `void-1`, `void-5`, `void-10`, `void-25`**. Tabellen/Trigger vorhanden, bestehende Plate-Bestände und Reservierungen unverändert. Nicht blind alle ausstehenden Migrationen ausführen.

## 3. Startbestand 1.800 – eigenständiger freigabepflichtiger Schritt

- [ ] Gesonderte Freigabe für `operations/initialize-void-stock.sql` einholen. Schema-Migration und Startinitialisierung sind bewusst getrennt.
- [ ] Vorbedingung: `void-stickers` steht auf 0 und hat **keine Reservierungshistorie**. Bei abweichendem Bestand/Historie stoppen und abgleichen; nicht den Schutz entfernen.
- [ ] Zukünftig genehmigter Aufruf:

```powershell
npx wrangler d1 execute hodlware-orders --remote --config wrangler.toml --env production --file operations/initialize-void-stock.sql
```

- [ ] Ergebnis des Skripts prüfen: genau `void-stickers`, `stock=1800`. Die 200 Reserve nicht eintragen und nicht auf Varianten verteilen.
- [ ] Noch keine offenen Stickerreservierungen erwartet. Nach Verkaufsstart gilt: verfügbar = `stock` minus Summe physischer Mengen aller `held`/`paid`-Reservierungen. Der Wert 1.800 ist die Startbasis, kein nach jeder Bestellung manuell zurückzusetzender Restbestand.
- [ ] Beispielprüfung: zwei 25er-Pakete reservieren 50 Sticker unter **einem** gemeinsamen Schlüssel. Ein erneutes Initialisieren darf bereits gehaltene/verkaufte Mengen niemals auffüllen.

## 4. Umgebungsvariablen und Bindings

| Name | Erforderlicher Zustand bei späterem Livegang |
|---|---|
| `ORDERS` | Vorhandenes korrektes Produktions-D1-Binding mit Migration 0004 |
| `SITE_URL` | `https://hodlware.de` |
| `STRIPE_SECRET_KEY` | Bestehender berechtigter Live-Schlüssel als Secret, unverändert lassen; nicht in Git/Chat |
| `STRIPE_WEBHOOK_SECRET` | Bestehendes gültiges Signatursecret des Produktionsendpunkts als Secret |
| `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_PLATE4` | Bestehende Plate-IDs unverändert |
| `STRIPE_PRICE_ID_VOID_1`, `_5`, `_10`, `_25` | Vier jeweils zugeordnete, geprüfte Live-Preis-IDs aus Schritt 1 |
| `PLATE4_ENABLED` | Bestehenden Produktionszustand beibehalten |
| `COMMUNICATIONS_ENABLED`, `ORDER_EMAILS_ENABLED`, `MAIL_WORKER_READY` | Bestehende funktionsfähige Produktionseinstellungen erhalten |
| `MAIL_FROM`, `RESEND_API_KEY` | Vorhandene verifizierte Absenderadresse und Secret erhalten; zuständigen Mail-Worker mit demselben D1 und bestehendem Cron kontrollieren |
| `ACCESSORIES_PRICES_APPROVED` | Noch `false`/nicht gesetzt; erst im freigegebenen Produktionsrelease `true` |
| `ACCESSORIES_STOCK_CONFIRMED` | Noch `false`/nicht gesetzt; erst nach geprüftem Startbestand im freigegebenen Release `true` |
| `ACCESSORIES_ENABLED` | Bis zum letzten Aktivierungsschritt `false`/nicht gesetzt |

`.dev.vars.example` enthält weiterhin ausschließlich deaktivierte Zubehörschalter und leere Preiskennungen. Kein automatisches Kopieren lokaler Beispiele über bestehende Produktionsvariablen. Die laufende Produktion wurde nicht ausgelesen oder geändert; tatsächliche Werte sind beim später freigegebenen Release zu prüfen.

## 5. Veröffentlichung und Aktivierungsschalter

- [ ] Vorher einen vollständigen Integrationstest in einer separat freigegebenen Stripe-Testumgebung mit eigenem D1 und einem kontrollierten Mail-Testempfänger durchführen. Lokale SQLite-/Stripe-Mocks ersetzen diesen Test nicht. Niemals echte Kunden anschreiben.
- [ ] Deployment gesondert genehmigen lassen. Den freigegebenen Commit zuerst mit `ACCESSORIES_ENABLED=false` veröffentlichen. Alle drei Schalter müssen für einen Zubehörcheckout `true` sein; ein fehlender Schalter sperrt den Verkauf.
- [ ] Produktbilder, neue Seite, Canonical, Sitemap, Shared Cart und bestehende Plate-Checkouts prüfen. Keine Starterwähnung als Stickerprodukt und keine Upsells einführen.
- [ ] Nach Versandfreigabe, passenden Stripe-IDs, bestätigtem Datenbankzustand und funktionierenden Webhooks/Mails `ACCESSORIES_PRICES_APPROVED=true` und `ACCESSORIES_STOCK_CONFIRMED=true` setzen. Bestand-/Preisentscheidung allein aktiviert nichts.
- [ ] Als letzten separat genehmigten Schritt `ACCESSORIES_ENABLED=true` setzen. Dateiverwaltete Produktionskonfiguration und tatsächlich aktive Runtime konsistent halten; für Änderungen an Pages-Variablen einen erforderlichen neuen Deployment-Stand berücksichtigen.

## 6. Abschließender Checkout-Test – erst mit ausdrücklicher Zahlungsfreigabe

- [ ] Vor jeder echten Testzahlung Budget, Empfängeradresse und Umfang ausdrücklich freigeben lassen. Es wurde bisher keine ausgelöst.
- [ ] In Testumgebung alle vier Pakete, Sticker-only sowie 1/2 Plates mit Stickern testen. Preismanipulation, fehlender Bestand, Webhook-Wiederholung, asynchroner Fehler und bestätigter Ablauf müssen geprüft sein.
- [ ] Erwartete Testbeispiele ohne Rabatt: 1er-Paket = 0,99 + 1,10 = **2,09 EUR**; zwei 25er-Pakete = 23,98 + 1,10 = **25,08 EUR**; eine Plate plus 25er-Paket = 79,00 + 11,99 + 6,19 = **97,18 EUR**; zwei Plates plus zwei 25er-Pakete = 158,00 + 23,98 + 6,19 = **188,17 EUR**.
- [ ] Reservierung vor Zahlung, genaue physische Menge, `paid` nach erfolgreicher Zahlung, eine Bestellanlage, eine Rechnung und jeweils eine Bestätigung an Kunde/Betreiber prüfen. Bei identischer Empfängeradresse bleibt es bei einer Mail. §19-Hinweis und richtige Versandart/Summe prüfen.
- [ ] Browserabbruch alleine darf nichts freigeben. Erst bestätigter Stripe-Ablauf/asynchroner Fehlschlag gibt Reservierungen frei; wiederholte Events buchen nicht doppelt. Keine ungesicherte zeitgesteuerte Freigabe.
- [ ] In genehmigtem kleinem Live-Smoke-Test die gesamte Kette Stripe → signierter Webhook → D1 → Resend/Outbox → Ergebnisansicht prüfen. Testsessions/Bestellungen nicht löschen; Testausgaben, ggf. später genehmigte Erstattung und Bestandskorrektur nachvollziehbar dokumentieren.
- [ ] Monitoring nach Aktivierung: Webhook-Fehler/503, ungeklärte Reservierungen, Mail-Outbox-Status `pending`/`review`, doppelte Rechnungen/Bestellungen, unerwartete Versandbeträge und Bestandsabweichungen beobachten. Bei Auffälligkeiten Schritt 7.

## 7. Rollback ohne Verlust laufender Bestellungen

1. **Neue Zubehörkäufe sperren:** `ACCESSORIES_ENABLED=false` als erste Maßnahme in der Produktionsruntime wirksam machen; nötigen Pages-Deployment-Schritt beachten. Plate-Verkauf beibehalten. Galerie/Navigation kann sichtbar bleiben, Verfügbarkeit wird gesperrt. Eine Flagänderung schließt bereits geöffnete Stripe-Sessions nicht automatisch.
2. **Zahlungsnachverarbeitung weiterlaufen lassen:** Aktuelle katalogkompatible Webhook-/Status-/Mail-Implementierung, Secrets, Cron und D1 erhalten. Bereits geöffnete, bezahlte oder asynchrone Sessions müssen weiterhin korrekt abgewickelt werden. Nicht auf den alten produktiven Code ohne Zubehörkatalog zurückrollen: Dieser könnte gültige Stickerbestellungen und Webhook-Wiederholungen nicht mehr verstehen.
3. **Daten erhalten:** Keine Tabellen/Trigger löschen, keinen Gesamtbestand auf 1.800 zurücksetzen, keine Reservierungen/Bestellungen/Mails entfernen. Additive Migration 0004 bleibt bestehen. Kein pauschales Wiederherstellen eines alten DB-Snapshots über seitdem eingegangene Bestellungen; Backups dienen einem kontrollierten Wiederherstellungsverfahren nach Abgleich.
4. **Laufende Sessions abgleichen:** Offene Stripe-Sessions und zugehörige gehaltene physische Mengen dokumentieren. Gezieltes Beenden offener Sessions erst nach separater Freigabe; Bestände anschließend nur über bestätigte Ablauf-/Fehlerverarbeitung freigeben. Bei unklarer Stripe-Antwort oder Zahlung nach bereits freigegebenem Hold manuelle Prüfung statt blindem Freigeben.
5. **Darstellungsproblem:** Auf einen zuvor freigegebenen Zubehör-kompatiblen Stand zurückgehen oder einen gezielten Fix veröffentlichen, weiterhin mit gesperrtem Zubehörcheckout. Datenmodell und Verarbeitung aller bereits ausgegebenen SKU-/Vertragsversionen müssen erhalten bleiben. Bestehende Plate-Preise niemals ersetzen.
6. **Preis-/Mailproblem:** Neue Käufe sperren, betroffene Sessions/Outbox prüfen und korrigieren. Stripe-Preise nicht löschen/tauschen, keine neuen Rechnungen oder pauschalen Mails erzeugen. Archivierung/Erstattung/Kundenkommunikation und manuelle Bestandskorrekturen benötigen gesonderte Freigabe. Resend-/Webhook-Idempotenz nicht durch neue IDs umgehen.
7. **Wiederanlauf:** Ursache beheben, Tests und gezielten Integrationstest erneut bestehen, Bestände/Outbox abgleichen und erneute Aktivierung ausdrücklich freigeben lassen. `ACCESSORIES_ENABLED` erst danach wieder setzen.

## Lokale Abnahme und Nachweise

- `npm test`: vollständige Testsuite; Ergebnis in `artifacts/accessories-review/unit-tests.txt`.
- `npm run build`: vollständiger Produktions-Build einschließlich statischer Fotos, SEO und Pages-Worker; Ergebnis in `artifacts/accessories-review/build.txt`.
- `node scripts/qa-accessories.mjs`: direkter Headless-Playwright-Test auf sechs Bildschirmgrößen; keine Windows-Computersteuerung. Lokaler Server verwendet simulierten Bestand und blockiert Zahlungen, Browser blockiert alle externen Ursprünge.
- Screenshots und Einzelprüfungen: `artifacts/accessories-review/`. Produktbilder werden nur auf Zubehör-/Bestellergebnisdarstellung verwendet, nicht als Startseitenkarte oder Plate-Upsell.
- Bildneuerzeugung: `node scripts/optimize-void-photos.mjs <Ordner-mit-den-drei-PNG-Originalen>` mit vorhandenem `sharp` (ggf. über `NODE_PATH`). Die drei Originaldateien außerhalb des Repositorys bleiben unverändert.

Ergebnis dieser lokalen Abschlussprüfung: **129 automatisierte Tests bestanden**, **208 Playwright-Prüfungen in sechs Bildschirmgrößen bestanden**, **Produktions-Build erfolgreich**. Keine externen Browseranfragen oder Laufzeit-/Assetfehler. Bei der Sichtprüfung wurde die Widerruf-Verknüpfung ausschließlich auf der Zubehörseite in die ständig sichtbare Navigation verschoben, damit sie die Originalbilder nicht überlagert; der Footer-Zugang bleibt erhalten.
