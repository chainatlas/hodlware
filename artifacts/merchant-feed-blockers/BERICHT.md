# Google Merchant Feed – Bestandsintegration und Veröffentlichungsvorbereitung

Stand: 01.11.2026. Branch: `feature/google-merchant-feed`. Ausgangscommit: `476712bfac8ee18bf3f770dfd21ce313ded56240`.

**Status: lokal umgesetzt und geprüft. Keine Veröffentlichung, produktive Migration, Bestandsänderung, Stripe-Anfrage oder Cloudflare-Konfigurationsänderung durchgeführt. Die Freigabe zum Livegang steht aus.** Dieser Bericht ersetzt die offenen Punkte des vorherigen `artifacts/merchant-feed/BERICHT.md`.

## Gelöste technische Blocker

### 8-Digit-Bestand

Ursache: `seedplate` hatte bisher weder einen Eintrag in `product_inventory` noch Reservierungen. Die alte `quantity`-Checkoutstrecke und die spätere Katalogstrecke verkauften dieses Produkt ohne Mengenlimit. Nur 4-Digit und VOID wurden fortgeschrieben. Eine fest eingetragene Verfügbarkeit von vier Stück wäre deshalb falsch gewesen.

`server/seedplate-inventory.js` integriert die 8-Digit-Plate in die vorhandene Tabelle `accessory_reservations` als physischen Lagerartikel `seedplate`. Alle sechs Angebote werden damit aus D1 abgeleitet; die vorher vorgesehene externe Verfügbarkeitsquelle entfällt. Die Bezeichnung der bestehenden Tabelle wird aus Kompatibilitätsgründen beibehalten.

- `legacy`: bisheriger 8-Digit-Verkauf; Standard für eine kompatible Erstinstallation. **Der Feed bleibt in diesem Modus gesperrt.**
- `paused`: neue 8-Digit-Checkouts gesperrt; übrige Produkte und bestehende Webhooks laufen weiter.
- `managed`: alle neuen 8-Digit-Sessions erhalten eine atomare Lagerreservierung und `metadata.stockVersion=seedplate-v1`. Warenkörbe mit 4-Digit und/oder VOID reservieren sämtliche Positionen in einem D1-Batch. Der Idempotenzschlüssel enthält die neue Bestandsversion, um Kollisionen mit alten Sessions zu vermeiden.

Verfügbarkeit = Basisbestand minus `held` minus `paid`. Bestätigte Zahlung macht die Reservierung dauerhaft `paid`; doppelte und verspätete Events ziehen nichts zusätzlich ab. Bestätigter Ablauf bzw. fehlgeschlagene asynchrone Zahlung gibt eine unbezahlte Reservierung frei. Ein Browserabbruch allein ist kein Beleg für eine Stornierung. Es gibt keine zeitgesteuerte Freigabe allein aufgrund des Reservierungsalters: eine noch zahlbare Stripe-Session darf nicht gleichzeitig ihren Bestand verlieren. Unklare Stripe-Antworten behalten deshalb den sicheren Hold und werden mit demselben Schlüssel wiederholt bzw. operativ abgeglichen.

Ein Zahlungsevent nach einer bereits bestätigten Freigabe wird nicht erneut abgebucht: der Webhook antwortet wiederholbar mit 503 und verlangt eine manuelle Klärung, statt eine negative Menge oder doppelte Belegung zuzulassen.

Eine bereits bezahlte Bestellung wird bei späterer Stornierung/Erstattung **nicht automatisch wieder eingelagert**. Dafür sind bestätigte Rückgabe und gesonderte Bestandskorrektur nötig. Die bestehenden Bestell- und Mailprozesse bleiben erhalten.

Eine unbekannte alte 8-Digit-Zahlung nach dem Stichtag wird weiterhin als Bestellung verarbeitet. In demselben Batch wechselt die Lagerkontrolle auf `review`: neue 8-Digit-Verkäufe stoppen, der Feed meldet diesen Artikel ausverkauft. Bereits erfasste bezahlte Events lösen bei Wiederholung keine weitere Bestandsprüfung aus. Alte Verkäufe werden nicht blind von einer neuen physischen Zählung abgezogen.

### Sichere Migration und Initialisierung

`migrations/0005_seedplate_inventory.sql` ist ausschließlich vorbereitet:

- Fügt `seedplate` mit **0**, nicht mit einem ungeprüften Startbestand, ein (`INSERT OR IGNORE`).
- Fügt `inventory_controls` mit `uninitialized`, Bestätigung des Alt-Session-Abgleichs und Zeitstempel hinzu.
- Verhindert Reservierungen ohne freigegebene Lagerkontrolle sowie eine Bestandsabsenkung unter bereits gebundene Mengen.
- Überschreibt weder 4-Digit-, VOID- noch vorhandene 8-Digit-Werte.

`operations/initialize-seedplate-stock.sql` bereitet die vom Geschäftsführer genannten **vier physischen 8-Digit-Plates** vor. Die Datei funktioniert erst nach expliziter Bestätigung des Alt-Session-Abgleichs und nur bei unverändertem Nullbestand ohne jegliche 8-Digit-Reservierungshistorie. Wiederholung setzt vorhandene Werte nicht zurück. Die bestätigten **24 4-Digit-Plates** werden nicht neu initialisiert: deren bestehende D1-Historie muss erhalten bleiben. Ebenso erfolgt keinerlei Neuinitialisierung der Sticker.

Die vier Stück sind eine Momentaufnahme. Vor Ausführung frisch zählen und bezahlte, offene, asynchrone und noch nicht versandte Altbestellungen vollständig zuordnen. Bei Abweichung nicht einfach das vorbereitete Skript ausführen.

## Versandstrategie und Google-Anforderungen

Prüfdatum: 01.11.2026. Maßgebliche Google-Dokumentation:

- [Shipping-Attribut](https://support.google.com/merchants/answer/6324484?hl=en): produktbezogene Preisangaben überschreiben Versandregeln des Kontos.
- [Versandeinstellungen](https://support.google.com/merchants/answer/12577710?hl=en): bei mehreren passenden Optionen zeigt Google die günstigste; Kontoregeln können nach Produktgruppen eingerichtet werden.
- [Shipping label](https://support.google.com/merchants/answer/6324504?hl=en): Labels gruppieren Produkte; sie schließen andere passende Versanddienste nicht automatisch aus.
- [Inkompatible Versandregeln](https://support.google.com/merchants/answer/15077148?hl=en): Regeln müssen alle möglichen Bestellungen abdecken.

Die bisherigen `<g:shipping><g:price>…`-Überschreibungen wurden entfernt. Der Feed liefert ausschließlich:

| Gruppe | Angebote | Konto-Regel für DE / EUR |
|---|---|---|
| `sticker_letter` | VOID 1/5/10/25 | einmalig 1,10 € für reine Stickerbestellungen; Standardbrief mit Basis-Sendungsverfolgung |
| `plate_parcel` | 8-Digit und 4-Digit | einmalig 6,19 € für Bestellungen mit mindestens einer Plate |

Die Beträge kommen in `merchantShippingPolicy()` aus denselben `SHIPPING_CLASSES` wie der Checkout; `artifacts/merchant-feed/shipping-policy.json` ist die daraus erzeugte Einstellvorlage. Labels allein übertragen **keine** Versandbeträge an Google. Ohne zugehörige Kontoeinstellungen ist der Feed nicht vollständig eingerichtet.

**Mischwarenkörbe ausdrücklich geprüft:** Im Shop ergibt die höchste vorkommende Versandklasse einmalig 6,19 €, unabhängig von Stickerpaket, Zahl der Positionen oder weiteren Plates. Weder Addition zu 7,29 € noch mehrfache Paketgebühren sind vorgesehen. Die Google-Dokumentation belegt keinen allgemeinen Mechanismus, der beliebige Mischwarenkörbe automatisch genauso behandelt. Zwei Labels allein beweisen diese Übereinstimmung nicht. Produktanzeigen beziehen sich außerdem zunächst auf das einzelne Angebot; ein später erweiterter Shop-Warenkorb wird im Checkout neu berechnet.

Manuell erforderlich: In Merchant Center unter Versand und Rückgaben DE/EUR konfigurieren, die 1,10-€-Regel auf Sticker begrenzen und für Plates 6,19 € sicherstellen. Alle überlappenden Standard-, Gratisversand- oder sonstigen günstigeren Regeln prüfen. Keine Versandzeit oder Paketgewichte erfinden. Die bestehende Shop-Lieferzusage mit den tatsächlichen Bearbeitungs-/Transportzeiten abgleichen.

Im tatsächlichen Konto prüfen und dokumentieren: jedes der sechs Angebote allein, mehrere Stickerpakete gemeinsam, jede Plate mit jedem Stickerpaket sowie beide Plates gemeinsam. Erwartet: Sticker-only 1,10 €, mit Plate 6,19 €. Falls das Konto die Mischregel nicht exakt abbilden kann, **nicht** behaupten, sie sei umgesetzt; Feed-Aktivierung gesperrt lassen und eine passende Kontokonfiguration mit Google klären. Kein pauschales 1,10 € auf Plates anwenden und keine Preise im Shop zur Kompensation ändern.

`MERCHANT_SHIPPING_REVIEWED=false` und `MERCHANT_FEED_ENABLED=false` bleiben bis zur abgeschlossenen Kontoprüfung bzw. Veröffentlichungsfreigabe gesetzt. Die Konto-Konfiguration wurde in diesem Auftrag nicht geändert oder als erfolgreich getestet ausgegeben. Falls die Kontooberfläche Labels erst nach einem Datenimport anbietet, ist ein separat freigegebener, kontrollierter Import-/Einrichtungsschritt erforderlich; dafür nicht ungeprüft den Review-Schalter setzen und keine Beispieldaten als echten Lagerbestand hochladen.

## Sechs Angebote und Datenquellen

| ID | Angebot | Paket-/Artikelpreis | Lagerquelle |
|---|---|---|---|
| `seedplate` | Steel Seed Phrase Plate, 8-Digit | 79,00 € | D1 `product_inventory` minus eigene gehaltene/bezahlte Reservierungen; Lagerkontrolle bereit |
| `recoveryplate4` | Steel Seed Phrase Recovery Plate, 4-Digit BIP39 | 79,00 € | bestehende D1-Quelle minus `stock_reservations` |
| `void-1` | VOID, 1 Sticker | 0,99 € | gemeinsamer VOID-Bestand; Verbrauch 1 |
| `void-5` | VOID, 5 Sticker | 3,49 € | gemeinsamer VOID-Bestand; Verbrauch 5 |
| `void-10` | VOID, 10 Sticker | 5,99 € | gemeinsamer VOID-Bestand; Verbrauch 10 |
| `void-25` | VOID, 25 Sticker | 11,99 € | gemeinsamer VOID-Bestand; Verbrauch 25 |

Preise unverändert aus `server/catalog.js`, Darstellung/Bilder/URLs aus `server/merchant-products.js`. Die Bestandsabfrage ist lesend. Fehlende Migration, unbestätigter Bestand, fehlende Bestandszeile, ungültige Mengen oder deaktivierte Feedfreigabe ergeben HTTP 503 anstelle erfundener Verfügbarkeit. Bekannter Nullbestand ergibt `out_of_stock`; Paketgrenzen berücksichtigen physische Einzelsticker. Bestehende Verkaufsschalter werden berücksichtigt. Keine internen Mengen, Kunden-, Bestell- oder Reservierungsdaten erscheinen im XML.

RSS 2.0 / Google-Namensraum / UTF-8; sechs eindeutige IDs, absolute HTTPS-Produkt- und Bildadressen, EUR, Zustand `new`, Marke HODLWARE, Produkttypen, Shipping-Labels. Nach ausdrücklicher Herstellerkennungs-Auskunft des Geschäftsführers keine GTIN/MPN erfunden: `identifier_exists=no`. Die selbst angebotenen größeren Sticker-Multipacks haben `multipack=5/10/25`; keine erfundenen Größenvarianten. Google kann die Kategorie automatisch bestimmen; keine ungeprüfte numerische Google-Kategorie ergänzt.

## Qualitätssicherung

- **153/153 automatisierte Tests erfolgreich**, keine übersprungenen Tests (`npm test`). Einschließlich Migration, Initialisierungsschutz, atomarer Mischreservierung, konkurrierender Zugriffe, Idempotenz, letzter verfügbarer Einheit, bezahlter/abgelaufener/fehlgeschlagener Vorgänge, Alt-Session-Schutz sowie bestehender Bestellmails und Regressionen.
- **113 unabhängige Browser-XML-Kontrollen erfolgreich**: DOMParser, Pflichtfelder, alle sechs Angebote, zentrale Preise, Bilder, Sonderzeichen, Ausverkauft-Zustände, Labels ohne Preisüberschreibungen.
- **323 Shop-Browserprüfungen erfolgreich** bei 1440, 1024, 768, 600, 390 und 320 Pixeln: Galerien, Navigation, alle Pakete, Warenkorb, Einzel-/Mischversand; keine externen Aufrufe oder Laufzeitfehler. Desktop-/Mobil-Screenshots zusätzlich visuell kontrolliert.
- **9 lokale Cloudflare-Pages-Routing-Prüfungen erfolgreich**: dynamischer Feed statt statischem Fallback, deaktiviert 503/XML, POST 405, bestehende Seiten/API und echte 404.
- **13 öffentliche Produkt-/Bild-URLs erfolgreich lesend geprüft**; keine produktiven Checkout-Sessions angelegt.
- Produktions-Build erfolgreich; Worker kompiliert. Kein Deployment.

Belege: `full-tests.txt`, `build-blockers.txt`, `results.json`, `desktop.png`, `mobile.png` in diesem Verzeichnis; XML und Routing in `artifacts/merchant-feed/`. Das Beispiel-XML und die Screenshots verwenden ausdrücklich lokale Testbestände. Keine offizielle Merchant-Center-Validierung oder Google-Zulassung erfolgt; die lokale Prüfung ist kein Ersatz dafür.

## Genaue Reihenfolge für einen später genehmigten Livegang

1. Ausdrückliche Veröffentlichungsfreigabe einholen. Aktuellen produktiven Git-Stand mit diesem Branch vergleichen; nur zugehörige Änderungen integrieren. Bestehende Deployment-ID, Konfiguration und privaten D1-Export als Wiederherstellungspunkt sichern; keine Kundendaten ins Repository kopieren.
2. Neue Anwendung zunächst mit `SEEDPLATE_STOCK_MODE=paused`, `MERCHANT_FEED_ENABLED=false`, `MERCHANT_SHIPPING_REVIEWED=false` ausrollen. Die Werte im tatsächlich wirksamen Produktionskonfigurationspfad und Deployment kontrollieren. Bestehende Secrets, Preise und Zubehörschalter erhalten. Prüfen, dass nur neue 8-Digit-Käufe pausieren und alte Webhooks weiterhin verarbeitet werden.
3. Bestehendes D1-Schema und sämtliche offenen Reservierungen prüfen. Nach Freigabe ausschließlich die geprüfte additive Datei ausführen, z. B. `npx wrangler d1 execute hodlware-orders --env production --remote --file migrations/0005_seedplate_inventory.sql`. Vorhandene Migrationen nicht unkontrolliert erneut anwenden. Danach neue Zeile 0 / `uninitialized` sowie unveränderte Altbestände und Reservierungen prüfen.
4. Alle vor der Umstellung ausgestellten 8-Digit-Sessions anhand von Stripe UND Bestellledger abgleichen: offene Sessions kontrolliert beenden oder abschließen, asynchrone Zahlungen bis zum bestätigten Endzustand verfolgen, nicht zugeordnete Zahlungen und unversandte Bestellungen klären. Bloßes Warten von einer Stunde reicht nicht. Auch Sessions ohne gespeicherte lokale Reservierung sowie unsichere API-Ergebnisse berücksichtigen. Keine echte Testzahlung auslösen.
5. Frisch zählen und freie vier Stück bestätigen. Auditbeleg mit Session-/Bestellabgleich privat aufbewahren. Erst dann `inventory_controls.legacy_sessions_cleared=1` ausschließlich für `seedplate` im Zustand `uninitialized` bestätigen. Danach genehmigt `operations/initialize-seedplate-stock.sql` ausführen. Ergebnis muss Basisbestand 4, `ready`, Bestätigung 1, Zeitstempel und keine alten/neuen 8-Digit-Holds sein. Andernfalls stoppen. **4-Digit nicht auf 24 zurücksetzen; VOID nicht neu initialisieren.**
6. `SEEDPLATE_STOCK_MODE=managed` in der wirksamen Produktionskonfiguration hinterlegen und kontrolliert veröffentlichen. Checkout-Kontext und D1-Verfügbarkeit abgleichen. Keine anderen Secrets oder Preiskennungen ändern. Bestandsänderungen erfolgen ab jetzt über die Reservierungs-/Webhooklogik.
7. Merchant Center: Website/Inhaberschaft, Deutschland, Deutsch, Feedlabel DE, Rückgabe-/Unternehmensangaben und kostenlose Produkteinträge prüfen; Versandstrategie und Mischfälle wie oben mit tatsächlichem Konto nachvollziehen. Alle Schritte bei fehlendem Kontozugang als offen markieren. Erst nach nachgewiesener korrekter Kontokonfiguration `MERCHANT_SHIPPING_REVIEWED=true` setzen.
8. Erst jetzt `MERCHANT_FEED_ENABLED=true` setzen und den geprüften Cloudflare-Pages-Workflow abschließen. Öffentlich `https://hodlware.de/google-merchant-feed.xml` auf HTTPS 200, XML-Inhalt, sechs Angebote und frische D1-Zustände prüfen. Kein Cookie/Anmeldezwang, kein statischer Cache. Datenquelle mit dieser URL und täglichem Abruf (24 Stunden) einrichten; keine kostenpflichtige Kampagne erforderlich. Importdiagnose und Versanddarstellung für alle sechs Angebote prüfen.
9. Checkout-Bereitschaft und Versand aller Angebote/Mischfälle ohne Zahlung kontrollieren. Falls hierfür genehmigt echte Checkout-Sessions angelegt werden, jede einzeln kontrolliert auslaufen lassen/beenden und per bestätigtem Webhook die Freigabe der Reservierung nachweisen, bevor weitere Sessions unnötig Bestand binden. Keine Mehrfachreservierungen als Dauerprüfung anlegen. Mail-Pipeline/Outbox prüfen; echte Bestellmail erst bei einer echten bezahlten Bestellung verifizierbar.
10. Feed-Abrufe, Google-Diagnose, Webhookfehler, Reservierungen und `inventory_controls` überwachen. Täglicher Google-Abruf ist kein Echtzeit-Lagerabgleich: zwischen Abrufen kann sich Bestand ändern. Checkout verhindert weiterhin Überverkauf; gegebenenfalls vor Aktivierung zusätzlich kostenlose automatische Artikelupdates im Konto prüfen, ohne deren Aktivierung hier zu behaupten.

## Rollback und verbleibende Voraussetzungen

Bei Feedfehlern `MERCHANT_FEED_ENABLED=false` setzen und Datenquelle/kostenlose Auslieferung im Konto pausieren; vorhandene Google-Daten verschwinden nicht zwingend sofort. Bei Lagerproblemen zusätzlich `SEEDPLATE_STOCK_MODE=paused` verwenden. **Nicht auf `legacy` zurückschalten**, da dies den Bestandsschutz ausschaltet. Bestehende Checkouts, Webhooks und Bestellmails weiterverarbeiten.

Die additive Migration und alle Reservierungen/Bestellungen behalten. Kein Tabellenlöschen, kein Zurücksetzen auf vier und kein Einspielen eines alten Gesamtdatenbankstands über neue Bestellungen. Nach bereits erzeugten verwalteten Sessions nicht unkontrolliert auf einen alten Worker ohne `stockVersion`-Verarbeitung zurückrollen. Stattdessen neue Verkäufe sperren und den kompatiblen Worker erhalten bzw. einen gezielten kompatiblen Fix ausrollen.

**Verbleibend:** erneute physische Zählung/Alt-Session-Abgleich, genehmigte produktive Migration und Initialisierung, tatsächliche Merchant-Center-Konfiguration einschließlich Mischversandnachweis, Veröffentlichungsgenehmigung und spätere Live-Abnahme. Die beiden technischen Ursachen sind im Code bearbeitet; die operative Kontoprüfung ist ohne Kontozugriff nicht verifiziert und bleibt eine echte Aktivierungsvoraussetzung. Keine unbelegte Erfolgsmeldung über Google oder Produktion.
